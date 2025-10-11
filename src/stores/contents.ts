import { defineStore } from "pinia";
import { ref } from "vue";
import type { ContentType } from "@/types";
import type { ApiResponse } from "@/types/api";
import { api, unwrap } from "@/utils/api";
import { getExpiryStatus } from "@/utils/date";
import { useSubProjectsStore } from "./subProjects";

type RawContentType = ContentType & {
  field_type?: ContentType["fieldType"];
  has_expiry?: boolean;
  is_system?: boolean;
};

// 将接口返回的内容类型格式化成前端可直接使用的结构
const normalizeContentType = (raw: Partial<RawContentType>): ContentType => ({
  id: Number(raw.id),
  name: raw.name ?? "",
  fieldType: (raw.fieldType ??
    raw.field_type ??
    "text") as ContentType["fieldType"],
  hasExpiry: raw.hasExpiry ?? raw.has_expiry ?? false,
  isSystem: raw.isSystem ?? raw.is_system ?? false,
  description: raw.description ?? undefined,
});

export const useContentsStore = defineStore("contents", () => {
  const contentTypes = ref<ContentType[]>([]);
  const loading = ref(false);

  // 拉取内容类型配置，用于表单选择与校验
  const fetchContentTypes = async () => {
    loading.value = true;
    try {
      const response = await api.get<
        ApiResponse<ContentType[] | { items: ContentType[] }>
      >("/content-types");
      const payload = unwrap(response);
      const dataSource = Array.isArray(payload.data)
        ? payload.data
        : payload.data &&
          typeof payload.data === "object" &&
          Array.isArray((payload.data as { items?: ContentType[] }).items)
        ? (payload.data as { items?: ContentType[] }).items
        : [];
      contentTypes.value = dataSource.map((item) => normalizeContentType(item));
      return contentTypes.value;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "获取内容类型失败";
      throw new Error(message || "获取内容类型失败");
    } finally {
      loading.value = false;
    }
  };

  // 新增内容类型后追加到列表中，方便即时管理
  const createContentType = async (
    payload: Pick<
      ContentType,
      "name" | "fieldType" | "hasExpiry" | "description"
    >
  ) => {
    const response = await api.post<ApiResponse<ContentType>>(
      "/content-types",
      payload
    );
    const body = unwrap(response);
    if (!body.data) throw new Error("创建内容类型失败");
    const contentType = normalizeContentType(body.data);
    contentTypes.value.push(contentType);
    return contentType;
  };

  // 更新内容类型时以服务端结果为准，避免字段差异
  const updateContentType = async (
    id: number,
    payload: Partial<ContentType>
  ) => {
    const response = await api.put<ApiResponse<ContentType>>(
      `/content-types/${id}`,
      payload
    );
    const body = unwrap(response);
    if (!body.data) throw new Error("更新内容类型失败");
    const updated = normalizeContentType(body.data);
    const index = contentTypes.value.findIndex((item) => item.id === id);
    if (index >= 0) {
      contentTypes.value.splice(index, 1, updated);
    } else {
      contentTypes.value.push(updated);
    }
    return updated;
  };

  // 删除内容类型后同步移除本地缓存
  const deleteContentType = async (id: number) => {
    await api.delete<ApiResponse<null>>(`/content-types/${id}`);
    contentTypes.value = contentTypes.value.filter((item) => item.id !== id);
  };

  // 内容相关操作直接委托给子项目仓库，保持数据一致性
  const addContent = async (
    subProjectId: number,
    payload: {
      contentTypeId: number;
      contentValue: string;
      expiryDays?: number;
      uploadedImageId?: number;
      showInDocumentation?: boolean;
    }
  ) => {
    const subProjectsStore = useSubProjectsStore();
    return subProjectsStore.addContentToSubProject(subProjectId, payload);
  };

  const updateContent = async (
    subProjectId: number,
    contentId: number,
    payload: {
      contentTypeId: number;
      contentValue: string;
      expiryDays?: number;
      uploadedImageId?: number;
      showInDocumentation?: boolean;
    }
  ) => {
    const subProjectsStore = useSubProjectsStore();
    return subProjectsStore.updateContentInSubProject(
      subProjectId,
      contentId,
      payload
    );
  };

  const removeContent = async (subProjectId: number, contentId: number) => {
    const subProjectsStore = useSubProjectsStore();
    return subProjectsStore.removeContentFromSubProject(
      subProjectId,
      contentId
    );
  };

  const addTextCommand = async (
    subProjectId: number,
    payload: { commandText: string; expiryDays: number }
  ) => {
    const subProjectsStore = useSubProjectsStore();
    return subProjectsStore.upsertTextCommand(subProjectId, payload);
  };

  const updateTextCommand = async (
    subProjectId: number,
    commandId: number,
    payload: { commandText: string; expiryDays: number }
  ) => {
    const subProjectsStore = useSubProjectsStore();
    return subProjectsStore.upsertTextCommand(subProjectId, {
      id: commandId,
      ...payload,
    });
  };

  const removeTextCommand = async (subProjectId: number, commandId: number) => {
    const subProjectsStore = useSubProjectsStore();
    return subProjectsStore.removeTextCommand(subProjectId, commandId);
  };

  const getContentSummary = (subProjectId: number) => {
    const subProjectsStore = useSubProjectsStore();
    const subProject = subProjectsStore.getSubProjectById(subProjectId);
    if (!subProject) return { total: 0, expiringSoon: 0 };
    const expiringSoon = subProject.contents.filter((content) =>
      content.expiryDate
        ? getExpiryStatus(content.expiryDate) !== "safe"
        : false
    ).length;
    return {
      total: subProject.contents.length,
      expiringSoon,
    };
  };

  return {
    contentTypes,
    loading,
    fetchContentTypes,
    createContentType,
    updateContentType,
    deleteContentType,
    addContent,
    updateContent,
    removeContent,
    addTextCommand,
    updateTextCommand,
    removeTextCommand,
    getContentSummary,
  };
});
