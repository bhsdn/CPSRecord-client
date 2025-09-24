import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { ContentType, SubProject, SubProjectContent, TextCommand } from "@/types";
import type { ApiResponse } from "@/types/api";
import { api, unwrap } from "@/utils/api";
import { getExpiryStatus } from "@/utils/date";
import { useProjectsStore } from "./projects";

type RawContentType = ContentType & {
  field_type?: ContentType["fieldType"];
  has_expiry?: boolean;
  is_system?: boolean;
};

type RawSubProjectContent = SubProjectContent & {
  sub_project_id?: number;
  content_type?: RawContentType;
  content_value?: string;
  expiry_days?: number;
  expiry_date?: string;
  created_at?: string;
  updated_at?: string;
};

type RawTextCommand = TextCommand & {
  sub_project_id?: number;
  command_text?: string;
  expiry_days?: number;
  expiry_date?: string;
  created_at?: string;
  updated_at?: string;
};

type RawSubProject = SubProject & {
  project_id?: number;
  sort_order?: number;
  enable_documentation?: boolean;
  documentation_enabled?: boolean;
  documentation_generated_at?: string | null;
  contents?: RawSubProjectContent[];
  text_commands?: RawTextCommand[];
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
};

// 将后端返回的内容类型字段统一成前端使用的驼峰格式
const normalizeContentType = (raw?: Partial<RawContentType>): ContentType => ({
  id: Number(raw?.id ?? 0),
  name: raw?.name ?? "",
  fieldType: (raw?.fieldType ?? raw?.field_type ?? "text") as ContentType["fieldType"],
  hasExpiry: raw?.hasExpiry ?? raw?.has_expiry ?? false,
  isSystem: raw?.isSystem ?? raw?.is_system ?? false,
  description: raw?.description ?? undefined,
});

const normalizeContent = (raw: Partial<RawSubProjectContent>): SubProjectContent => {
  const expiryDate = raw.expiryDate ?? raw.expiry_date;
  return {
    id: Number(raw.id),
    subProjectId: raw.subProjectId ?? raw.sub_project_id ?? 0,
    contentType: normalizeContentType(raw.contentType ?? raw.content_type),
    contentValue: raw.contentValue ?? raw.content_value ?? "",
    expiryDays: raw.expiryDays ?? raw.expiry_days,
    expiryDate,
    expiryStatus: raw.expiryStatus ?? getExpiryStatus(expiryDate ?? undefined),
    createdAt: raw.createdAt ?? raw.created_at ?? new Date().toISOString(),
    updatedAt: raw.updatedAt ?? raw.updated_at ?? new Date().toISOString(),
  };
};

const normalizeCommand = (raw: Partial<RawTextCommand>): TextCommand => {
  const expiryDate = raw.expiryDate ?? raw.expiry_date;
  return {
    id: Number(raw.id),
    subProjectId: raw.subProjectId ?? raw.sub_project_id ?? 0,
    commandText: raw.commandText ?? raw.command_text ?? "",
    expiryDays: raw.expiryDays ?? raw.expiry_days ?? 0,
    expiryDate: expiryDate ?? new Date().toISOString(),
    expiryStatus: raw.expiryStatus ?? getExpiryStatus(expiryDate ?? undefined),
    createdAt: raw.createdAt ?? raw.created_at ?? new Date().toISOString(),
    updatedAt: raw.updatedAt ?? raw.updated_at ?? new Date().toISOString(),
  };
};

// 子项目的归一化函数，兼容后端返回的下划线字段
const normalizeSubProject = (raw: Partial<RawSubProject>): SubProject => ({
  id: Number(raw.id),
  projectId: raw.projectId ?? raw.project_id ?? 0,
  name: raw.name ?? "",
  description: raw.description ?? "",
  sortOrder: raw.sortOrder ?? raw.sort_order ?? 0,
  documentationEnabled:
    raw.documentationEnabled ?? raw.enable_documentation ?? raw.documentation_enabled ?? false,
  documentationGeneratedAt: raw.documentationGeneratedAt ?? raw.documentation_generated_at ?? null,
  contents: (raw.contents ?? []).map((item) => normalizeContent(item)),
  textCommands: (raw.textCommands ?? raw.text_commands ?? []).map((item) => normalizeCommand(item)),
  createdAt: raw.createdAt ?? raw.created_at ?? new Date().toISOString(),
  updatedAt: raw.updatedAt ?? raw.updated_at ?? new Date().toISOString(),
  isActive: raw.isActive ?? raw.is_active ?? true,
});

export const useSubProjectsStore = defineStore("subProjects", () => {
  const subProjects = ref<SubProject[]>([]);
  const loading = ref(false);

  // 工具方法：写入或更新子项目，保持响应式引用不变
  const upsertSubProject = (subProject: SubProject) => {
    const index = subProjects.value.findIndex((item) => item.id === subProject.id);
    if (index >= 0) {
      subProjects.value.splice(index, 1, subProject);
    } else {
      subProjects.value.push(subProject);
    }
  };

  // 将同一项目下的子项目集合整体替换，便于批量刷新
  const replaceProjectSubProjects = (projectId: number, items: SubProject[]) => {
    const others = subProjects.value.filter((item) => item.projectId !== projectId);
    subProjects.value = [...others, ...items];
  };

  // 处理列表接口可能返回的多种数据结构
  const parseSubProjectArray = (data?: unknown): RawSubProject[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data as RawSubProject[];
    if (typeof data === "object" && data) {
      const maybeItems = (data as { items?: RawSubProject[] }).items;
      if (Array.isArray(maybeItems)) return maybeItems;
    }
    return [];
  };

  const getSubProjectsByProjectId = (projectId: number) =>
    subProjects.value
      .filter((sub) => sub.projectId === projectId && sub.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);

  const getSubProjectById = (id: number) =>
    subProjects.value.find((subProject) => subProject.id === id && subProject.isActive);

  // 根据项目 ID 拉取子项目列表，包含嵌套的内容与口令信息
  const fetchSubProjectsByProject = async (projectId: number) => {
    loading.value = true;
    try {
      const response = await api.get<ApiResponse<RawSubProject[]>>("/sub-projects", {
        params: { projectId },
      });
      const payload = unwrap(response);
      const items = parseSubProjectArray(payload.data).map((item) => normalizeSubProject(item));
      replaceProjectSubProjects(projectId, items);
      return items;
    } catch (error) {
      const message = error instanceof Error ? error.message : "获取子项目列表失败";
      throw new Error(message || "获取子项目列表失败");
    } finally {
      loading.value = false;
    }
  };

  // 创建子项目并同步更新项目统计
  const createSubProject = async (
    payload: Pick<SubProject, "name" | "description" | "sortOrder" | "documentationEnabled"> & {
      projectId: number;
    }
  ) => {
    const response = await api.post<ApiResponse<RawSubProject>>("/sub-projects", {
      projectId: payload.projectId,
      name: payload.name,
      description: payload.description,
      sortOrder: payload.sortOrder,
      enableDocumentation: payload.documentationEnabled,
    });
    const body = unwrap(response);
    if (!body.data) throw new Error("创建子项目失败");
    const subProject = normalizeSubProject(body.data);
    upsertSubProject(subProject);
    await useProjectsStore().fetchProjectById(payload.projectId);
    return subProject;
  };

  // 编辑子项目信息并回写最新数据
  const updateSubProject = async (
    id: number,
    payload: Partial<SubProject> & { documentationEnabled?: boolean }
  ) => {
    const response = await api.put<ApiResponse<RawSubProject>>(`/sub-projects/${id}`, {
      ...payload,
      enableDocumentation: payload.documentationEnabled,
    });
    const body = unwrap(response);
    if (!body.data) throw new Error("更新子项目失败");
    const subProject = normalizeSubProject(body.data);
    upsertSubProject(subProject);
    await useProjectsStore().fetchProjectById(subProject.projectId);
    return subProject;
  };

  // 软删除子项目，保持本地数据与后端一致
  const deleteSubProject = async (id: number) => {
    const subProject = subProjects.value.find((item) => item.id === id);
    await api.delete<ApiResponse<null>>(`/sub-projects/${id}`);
    if (!subProject) return null;
    subProject.isActive = false;
    await useProjectsStore().fetchProjectById(subProject.projectId);
    return subProject;
  };

  // 将拖拽后的排序结果提交到后端，返回最新顺序
  const reorderSubProjects = async (projectId: number, orderedIds: number[]) => {
    const items = orderedIds.map((id, index) => ({ id, sortOrder: index + 1 }));
    const response = await api.post<ApiResponse<RawSubProject[] | { items: RawSubProject[] }>>(
      `/sub-projects/reorder`,
      { items }
    );
    const body = unwrap(response);
    const orderedList = parseSubProjectArray(body.data);
    if (orderedList.length) {
      const ordered = orderedList.map((item) => normalizeSubProject(item));
      replaceProjectSubProjects(projectId, ordered);
      return ordered;
    }
    orderedIds.forEach((subProjectId, index) => {
      const subProject = subProjects.value.find((item) => item.id === subProjectId);
      if (subProject && subProject.projectId === projectId) {
        subProject.sortOrder = index + 1;
      }
    });
    return getSubProjectsByProjectId(projectId);
  };

  // 新增内容条目，依赖服务端计算到期状态
  const addContentToSubProject = async (
    subProjectId: number,
    payload: { contentTypeId: number; contentValue: string; expiryDays?: number }
  ) => {
    const response = await api.post<ApiResponse<RawSubProjectContent>>("/contents", {
      subProjectId,
      ...payload,
    });
    const body = unwrap(response);
    if (!body.data) throw new Error("新增内容失败");
    const content = normalizeContent(body.data);
    const subProject = subProjects.value.find((item) => item.id === subProjectId);
    if (subProject) {
      const index = subProject.contents.findIndex((item) => item.id === content.id);
      if (index >= 0) {
        subProject.contents.splice(index, 1, content);
      } else {
        subProject.contents.push(content);
      }
      subProject.updatedAt = content.updatedAt;
    }
    return content;
  };

  // 更新内容条目，同样以接口返回的结果更新本地缓存
  const updateContentInSubProject = async (
    subProjectId: number,
    contentId: number,
    payload: { contentTypeId: number; contentValue: string; expiryDays?: number }
  ) => {
    const response = await api.put<ApiResponse<RawSubProjectContent>>(`/contents/${contentId}`, {
      subProjectId,
      ...payload,
    });
    const body = unwrap(response);
    if (!body.data) throw new Error("更新内容失败");
    const content = normalizeContent(body.data);
    const subProject = subProjects.value.find((item) => item.id === subProjectId);
    if (subProject) {
      const index = subProject.contents.findIndex((item) => item.id === content.id);
      if (index >= 0) {
        subProject.contents.splice(index, 1, content);
      } else {
        subProject.contents.push(content);
      }
      subProject.updatedAt = content.updatedAt;
    }
    return content;
  };

  // 删除内容后手动移除本地缓存，方便界面即时刷新
  const removeContentFromSubProject = async (subProjectId: number, contentId: number) => {
    await api.delete<ApiResponse<null>>(`/contents/${contentId}`);
    const subProject = subProjects.value.find((item) => item.id === subProjectId);
    if (!subProject) return;
    subProject.contents = subProject.contents.filter((item) => item.id !== contentId);
    subProject.updatedAt = new Date().toISOString();
  };

  // 新增或更新文字口令，共用一个方法，减少重复代码
  const upsertTextCommand = async (
    subProjectId: number,
    payload: { id?: number; commandText: string; expiryDays: number }
  ) => {
    let response;
    if (payload.id) {
      response = await api.put<ApiResponse<RawTextCommand>>(`/text-commands/${payload.id}`, {
        subProjectId,
        commandText: payload.commandText,
        expiryDays: payload.expiryDays,
      });
    } else {
      response = await api.post<ApiResponse<RawTextCommand>>("/text-commands", {
        subProjectId,
        commandText: payload.commandText,
        expiryDays: payload.expiryDays,
      });
    }
    const body = unwrap(response);
    if (!body.data) throw new Error("保存口令失败");
    const command = normalizeCommand(body.data);
    const subProject = subProjects.value.find((item) => item.id === subProjectId);
    if (subProject) {
      const index = subProject.textCommands.findIndex((item) => item.id === command.id);
      if (index >= 0) {
        subProject.textCommands.splice(index, 1, command);
      } else {
        subProject.textCommands.push(command);
      }
      subProject.updatedAt = command.updatedAt;
    }
    return command;
  };

  // 删除口令后更新本地缓存
  const removeTextCommand = async (subProjectId: number, commandId: number) => {
    await api.delete<ApiResponse<null>>(`/text-commands/${commandId}`);
    const subProject = subProjects.value.find((item) => item.id === subProjectId);
    if (!subProject) return;
    subProject.textCommands = subProject.textCommands.filter((item) => item.id !== commandId);
    subProject.updatedAt = new Date().toISOString();
  };

  // 统计所有子项目的总量及内容、口令数量，支持仪表盘展示
  const subProjectStats = computed(() => {
    return subProjects.value.reduce(
      (acc, subProject) => {
        if (!subProject.isActive) return acc;
        acc.total += 1;
        acc.contentTotal += subProject.contents.length;
        acc.commandTotal += subProject.textCommands.length;
        return acc;
      },
      { total: 0, contentTotal: 0, commandTotal: 0 }
    );
  });

  return {
    subProjects,
    loading,
    getSubProjectsByProjectId,
    getSubProjectById,
    fetchSubProjectsByProject,
    createSubProject,
    updateSubProject,
    deleteSubProject,
    reorderSubProjects,
    addContentToSubProject,
    updateContentInSubProject,
    removeContentFromSubProject,
    upsertTextCommand,
    removeTextCommand,
    subProjectStats,
  };
});
