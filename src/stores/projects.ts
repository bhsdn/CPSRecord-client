import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { Project } from "@/types";
import type { ApiResponse } from "@/types/api";
import { api, unwrap } from "@/utils/api";
import { formatDate } from "@/utils/date";

type RawProject = Project & {
  sub_project_count?: number;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
};

const normalizeProject = (raw: Partial<RawProject>): Project => ({
  id: Number(raw.id),
  name: raw.name ?? "",
  description: raw.description ?? "",
  subProjectCount: raw.subProjectCount ?? raw.sub_project_count ?? 0,
  createdAt: raw.createdAt ?? raw.created_at ?? new Date().toISOString(),
  updatedAt: raw.updatedAt ?? raw.updated_at ?? new Date().toISOString(),
  isActive: raw.isActive ?? raw.is_active ?? true,
});

export const useProjectsStore = defineStore("projects", () => {
  const projects = ref<Project[]>([]);
  const loading = ref(false);
  const searchQuery = ref("");

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
    return projects.value.filter((project) => {
      if (!project.isActive) return false;
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
  const fetchProjects = async () => {
    loading.value = true;
    try {
      const response = await api.get<ApiResponse<Project[]>>("/projects");
      const payload = unwrap(response);
      const items = (payload.data ?? []).map((item) => normalizeProject(item));
      projects.value = items;
      return items;
    } finally {
      loading.value = false;
    }
  };

  // 按 ID 单独拉取项目详情，用于页面刷新或统计同步
  const fetchProjectById = async (id: number) => {
    const response = await api.get<ApiResponse<Project>>(`/projects/${id}`);
    const payload = unwrap(response);
    if (!payload.data) return null;
    const project = normalizeProject(payload.data);
    setProject(project);
    return project;
  };

  // 创建项目后直接插入到列表顶部，便于用户立即看到结果
  const createProject = async (projectData: { name: string; description?: string | null }) => {
    const response = await api.post<ApiResponse<Project>>("/projects", projectData);
    const payload = unwrap(response);
    if (!payload.data) throw new Error("创建项目失败");
    const project = normalizeProject(payload.data);
    projects.value.unshift(project);
    return project;
  };

  // 更新项目时以服务端返回的数据为准，同时保留本地回退逻辑
  const updateProject = async (id: number, payload: Partial<Project>) => {
    const response = await api.put<ApiResponse<Project>>(`/projects/${id}`, payload);
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
    return target;
  };

  // 汇总项目数量及最近更新时间，供仪表盘展示
  const getProjectSummary = computed(() => {
    const activeProjects = projects.value.filter((item) => item.isActive);
    const latestUpdatedAt = activeProjects
      .map((item) => item.updatedAt)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
    return {
      total: activeProjects.length,
      updatedAt: latestUpdatedAt ? formatDate(latestUpdatedAt) : "",
    };
  });

  return {
    projects,
    loading,
    searchQuery,
    filteredProjects,
    fetchProjects,
    fetchProjectById,
    createProject,
    updateProject,
    deleteProject,
    getProjectById,
    getProjectSummary,
  };
});
