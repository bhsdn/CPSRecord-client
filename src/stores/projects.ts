import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { ElMessage } from "element-plus";
import type { Project, CreateProjectDto, UpdateProjectDto, QueryProjectParams } from "@/types";
import { projectService } from "@/services/api.service";
import { formatDate } from "@/utils/date";
import { isApiError, isCancelError } from "@/utils/api";

/**
 * 项目Store
 * 管理项目列表、CRUD操作和本地缓存
 */
export const useProjectsStore = defineStore("projects", () => {
  const projects = ref<Project[]>([]);
  const loading = ref(false);
  const searchQuery = ref("");
  const activeCategoryId = ref<number | null>(null);
  // 分页信息
  const pagination = ref({ total: 0, page: 1, limit: 20, totalPages: 0 });

  /**
   * 工具方法：更新或添加项目
   */
  const setProject = (project: Project) => {
    const index = projects.value.findIndex((item) => item.id === project.id);
    if (index >= 0) {
      projects.value.splice(index, 1, project);
    } else {
      projects.value.push(project);
    }
  };

  /**
   * 过滤后的项目列表（根据搜索和分类）
   */
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

  /**
   * 根据ID获取项目
   */
  const getProjectById = (id: number) =>
    projects.value.find((project) => project.id === id && project.isActive);

  /**
   * 获取项目列表
   */
  const fetchProjects = async (params?: QueryProjectParams) => {
    loading.value = true;
    try {
      const result = await projectService.getList(params);
      projects.value = result.data || [];
      pagination.value = result.pagination;
      return result.data;
    } catch (error) {
      if (isCancelError(error)) {
        console.log("项目列表请求被取消");
        return [];
      }
      
      const message = isApiError(error) 
        ? error.response?.data?.message || "获取项目列表失败"
        : "获取项目列表失败";
      
      ElMessage.error(message);
      projects.value = [];
      throw error;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 按ID获取项目详情
   */
  const fetchProjectById = async (id: number) => {
    try {
      const project = await projectService.getDetail(id);
      setProject(project);
      return project;
    } catch (error) {
      const message = isApiError(error)
        ? error.response?.data?.message || "获取项目详情失败"
        : "获取项目详情失败";
      
      ElMessage.error(message);
      throw error;
    }
  };

  /**
   * 创建项目
   */
  const createProject = async (data: CreateProjectDto) => {
    try {
      const project = await projectService.create(data);
      projects.value.unshift(project);
      pagination.value.total += 1;
      ElMessage.success("项目创建成功");
      return project;
    } catch (error) {
      const message = isApiError(error)
        ? error.response?.data?.message || "创建项目失败"
        : "创建项目失败";
      
      ElMessage.error(message);
      throw error;
    }
  };

  /**
   * 更新项目
   */
  const updateProject = async (id: number, data: UpdateProjectDto) => {
    try {
      const project = await projectService.update(id, data);
      setProject(project);
      ElMessage.success("项目更新成功");
      return project;
    } catch (error) {
      const message = isApiError(error)
        ? error.response?.data?.message || "更新项目失败"
        : "更新项目失败";
      
      ElMessage.error(message);
      throw error;
    }
  };

  /**
   * 删除项目
   */
  const deleteProject = async (id: number) => {
    try {
      await projectService.delete(id);
      const target = projects.value.find((project) => project.id === id);
      if (target) {
        target.isActive = false;
        pagination.value.total = Math.max(pagination.value.total - 1, 0);
      }
      ElMessage.success("项目删除成功");
      return target;
    } catch (error) {
      const message = isApiError(error)
        ? error.response?.data?.message || "删除项目失败"
        : "删除项目失败";
      
      ElMessage.error(message);
      throw error;
    }
  };

  /**
   * 项目汇总信息
   */
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

  /**
   * 设置当前选择的分类ID
   */
  const setActiveCategoryId = (categoryId: number | null) => {
    activeCategoryId.value = categoryId;
  };

  /**
   * 设置搜索关键字
   */
  const setSearchQuery = (query: string) => {
    searchQuery.value = query;
  };

  return {
    // State
    projects,
    loading,
    searchQuery,
    activeCategoryId,
    pagination,
    
    // Getters
    filteredProjects,
    getProjectSummary,
    
    // Actions
    fetchProjects,
    fetchProjectById,
    createProject,
    updateProject,
    deleteProject,
    getProjectById,
    setActiveCategoryId,
    setSearchQuery,
  };
});
