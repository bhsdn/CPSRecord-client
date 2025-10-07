import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { Project, ProjectCategory } from "@/types";
import type { ApiResponse } from "@/types/api";
import { api, unwrap } from "@/utils/api";
import { formatDate } from "@/utils/date";

// 定义接口返回的原始字段，兼容后端的下划线命名
type RawProjectCategory = ProjectCategory & {
  sort_order?: number;
  is_active?: boolean;
  active_project_count?: number;
};

type RawProject = Project & {
  sub_project_count?: number;
  documentation_count?: number;
  category_id?: number | null;
  category_name?: string;
  category?: RawProjectCategory;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
};

// 项目列表接口返回的分页结构
interface ProjectListApiData {
  items?: RawProject[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

const normalizeCategory = (raw?: Partial<RawProjectCategory>): ProjectCategory | undefined => {
  if (!raw) return undefined;
  return {
    id: Number(raw.id ?? 0),
    name: raw.name ?? "",
    description: raw.description ?? "",
    sortOrder: raw.sortOrder ?? raw.sort_order ?? 0,
    isActive: raw.isActive ?? raw.is_active ?? true,
    activeProjectCount: raw.activeProjectCount ?? raw.active_project_count,
  };
};

const normalizeProject = (raw: Partial<RawProject>): Project => ({
  id: Number(raw.id),
  name: raw.name ?? "",
  description: raw.description ?? "",
  categoryId: raw.categoryId ?? raw.category_id ?? raw.category?.id ?? null,
  category: normalizeCategory(raw.category) ??
    (raw.category_name
      ? {
          id: raw.category_id ?? 0,
          name: raw.category_name,
          description: "",
          sortOrder: 0,
          isActive: true,
        }
      : undefined),
  subProjectCount: raw.subProjectCount ?? raw.sub_project_count ?? 0,
  documentationCount: raw.documentationCount ?? raw.documentation_count ?? 0,
  createdAt: raw.createdAt ?? raw.created_at ?? new Date().toISOString(),
  updatedAt: raw.updatedAt ?? raw.updated_at ?? new Date().toISOString(),
  isActive: raw.isActive ?? raw.is_active ?? true,
});

export const useProjectsStore = defineStore("projects", () => {
  const projects = ref<Project[]>([]);
  const loading = ref(false);
  const searchQuery = ref("");
  const activeCategoryId = ref<number | null>(null);
  // 用于记录分页及总数信息，支撑仪表盘展示
  const pagination = ref({ total: 0, page: 1, limit: 20, totalPages: 0 });

  // 辅助方法：从接口返回的 data 中解析项目数组
  const extractProjectList = (data?: unknown): RawProject[] => {
    if (!data) {
      pagination.value = { total: 0, page: 1, limit: 20, totalPages: 0 };
      return [];
    }
    if (Array.isArray(data)) {
      pagination.value = {
        total: data.length,
        page: 1,
        limit: data.length || 20,
        totalPages: data.length ? 1 : 0,
      };
      return data as RawProject[];
    }
    if (typeof data === "object") {
      const record = data as ProjectListApiData;
      if (Array.isArray(record.items)) {
        pagination.value = {
          total: record.total ?? record.items.length,
          page: record.page ?? 1,
          limit: record.limit ?? record.items.length,
          totalPages: record.totalPages ?? 1,
        };
        return record.items;
      }
    }
    pagination.value = { total: 0, page: 1, limit: 20, totalPages: 0 };
    return [];
  };

  // 工具方法：将后端返回的项目数据写入响应式数组，避免重复项
  const setProject = (project: Project) => {
    const index = projects.value.findIndex((item) => item.id === project.id);
    if (index >= 0) {
      projects.value.splice(index, 1, project);
    } else {
      projects.value.push(project);
    }
  };

  // 根据搜索关键字筛选项目，仅展示仍处于激活状态的数据
  const filteredProjects = computed(() => {
    const query = searchQuery.value.trim().toLowerCase();
    const categoryId = activeCategoryId.value;
    return projects.value.filter((project) => {
      if (!project.isActive) return false;
      if (categoryId !== null && project.categoryId !== categoryId) return false;
      if (!query) return true;
      return (
        project.name.toLowerCase().includes(query) ||
        project.description?.toLowerCase().includes(query)
      );
    });
  });

  const getProjectById = (id: number) =>
    projects.value.find((project) => project.id === id && project.isActive);

  // 从后端获取全部项目列表，并刷新本地缓存
  const fetchProjects = async (params?: { page?: number; limit?: number }) => {
    loading.value = true;
    try {
      const response = await api.get<ApiResponse<ProjectListApiData>>("/projects", {
        params,
      });
      const payload = unwrap(response);
      const items = extractProjectList(payload.data).map((item) => normalizeProject(item));
      projects.value = items;
      return items;
    } catch (error) {
      const message = error instanceof Error ? error.message : "获取项目列表失败";
      throw new Error(message || "获取项目列表失败");
    } finally {
      loading.value = false;
    }
  };

  // 按 ID 单独拉取项目详情，用于页面刷新或统计同步
  const fetchProjectById = async (id: number) => {
    const response = await api.get<ApiResponse<RawProject>>(`/projects/${id}`);
    const payload = unwrap(response);
    if (!payload.data) return null;
    const project = normalizeProject(payload.data);
    setProject(project);
    return project;
  };

  // 创建项目后直接插入到列表顶部，便于用户立即看到结果
  const createProject = async (
    projectData: { name: string; description?: string | null; categoryId: number }
  ) => {
    const response = await api.post<ApiResponse<RawProject>>("/projects", projectData);
    const payload = unwrap(response);
    if (!payload.data) throw new Error("创建项目失败");
    const project = normalizeProject(payload.data);
    projects.value.unshift(project);
    pagination.value.total += 1;
    return project;
  };

  // 更新项目时以服务端返回的数据为准，同时保留本地回退逻辑
  const updateProject = async (
    id: number,
    payload: Partial<Project> & { categoryId?: number | null }
  ) => {
    const response = await api.put<ApiResponse<RawProject>>(`/projects/${id}`, payload);
    const body = unwrap(response);
    if (body.data) {
      const project = normalizeProject(body.data);
      setProject(project);
      return project;
    }
    const target = projects.value.find((item) => item.id === id);
    if (!target) throw new Error("项目不存在");
    Object.assign(target, payload);
    return target;
  };

  // 软删除项目，后端成功后仅更新 isActive 状态
  const deleteProject = async (id: number) => {
    await api.delete<ApiResponse<null>>(`/projects/${id}`);
    const target = projects.value.find((project) => project.id === id);
    if (!target) return null;
    target.isActive = false;
    pagination.value.total = Math.max(pagination.value.total - 1, 0);
    return target;
  };

  // 汇总项目数量及最近更新时间，供仪表盘展示
  const getProjectSummary = computed(() => {
    const activeProjects = projects.value.filter((item) => item.isActive);
    const documentationTotal = activeProjects.reduce(
      (total, item) => total + (item.documentationCount ?? 0),
      0
    );
    const latestUpdatedAt = activeProjects
      .map((item) => item.updatedAt)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
    return {
      total: activeProjects.length,
      updatedAt: latestUpdatedAt ? formatDate(latestUpdatedAt) : "",
      documentationTotal,
    };
  });

  const setActiveCategoryId = (categoryId: number | null) => {
    activeCategoryId.value = categoryId;
  };

  return {
    projects,
    loading,
    searchQuery,
    filteredProjects,
    pagination,
    activeCategoryId,
    fetchProjects,
    fetchProjectById,
    createProject,
    updateProject,
    deleteProject,
    getProjectById,
    getProjectSummary,
    setActiveCategoryId,
  };
});
