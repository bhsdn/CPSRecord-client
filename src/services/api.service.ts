/**
 * API 服务层 - 提供类型安全的API调用接口
 */

import { api, unwrapData, buildUrl } from "@/utils/api";
import type { ApiResponse, PaginatedResponse } from "@/types/api";
import type {
  Project,
  ProjectCategory,
  SubProject,
  CreateProjectDto,
  UpdateProjectDto,
  QueryProjectParams,
  CreateProjectCategoryDto,
  UpdateProjectCategoryDto,
  CreateSubProjectDto,
  UpdateSubProjectDto,
  ReorderSubProjectDto,
  QuerySubProjectParams,
} from "@/types/project";
import type {
  ContentType,
  SubProjectContent,
  TextCommand,
  CreateContentTypeDto,
  UpdateContentTypeDto,
  CreateContentDto,
  UpdateContentDto,
  QueryContentParams,
  CreateTextCommandDto,
  UpdateTextCommandDto,
  QueryTextCommandParams,
  BulkDeleteTextCommandDto,
} from "@/types/content";
import type {
  DocumentationEntry,
  QueryDocumentationParams,
  GenerateDocumentationDto,
} from "@/types/documentation";

/**
 * 项目API服务
 */
export const projectService = {
  /**
   * 获取项目列表
   */
  async getList(params?: QueryProjectParams): Promise<PaginatedResponse<Project>> {
    const response = await api.get<ApiResponse<PaginatedResponse<Project>>>("/projects", { params });
    return unwrapData(response) ?? { data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } };
  },

  /**
   * 获取项目详情
   */
  async getDetail(id: number): Promise<Project> {
    const response = await api.get<ApiResponse<Project>>(`/projects/${id}`);
    const data = unwrapData(response);
    if (!data) throw new Error("项目不存在");
    return data;
  },

  /**
   * 创建项目
   */
  async create(data: CreateProjectDto): Promise<Project> {
    const response = await api.post<ApiResponse<Project>>("/projects", data);
    const result = unwrapData(response);
    if (!result) throw new Error("创建项目失败");
    return result;
  },

  /**
   * 更新项目
   */
  async update(id: number, data: UpdateProjectDto): Promise<Project> {
    const response = await api.put<ApiResponse<Project>>(`/projects/${id}`, data);
    const result = unwrapData(response);
    if (!result) throw new Error("更新项目失败");
    return result;
  },

  /**
   * 删除项目
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/projects/${id}`);
  },

  /**
   * 获取项目的子项目列表
   */
  async getSubProjects(id: number): Promise<SubProject[]> {
    const response = await api.get<ApiResponse<SubProject[]>>(`/projects/${id}/sub-projects`);
    return unwrapData(response) ?? [];
  },
};

/**
 * 项目分类API服务
 */
export const projectCategoryService = {
  /**
   * 获取分类列表
   */
  async getList(includeInactive = false): Promise<ProjectCategory[]> {
    const response = await api.get<ApiResponse<ProjectCategory[]>>("/project-categories", {
      params: { includeInactive },
    });
    return unwrapData(response) ?? [];
  },

  /**
   * 获取分类详情
   */
  async getDetail(id: number): Promise<ProjectCategory> {
    const response = await api.get<ApiResponse<ProjectCategory>>(`/project-categories/${id}`);
    const data = unwrapData(response);
    if (!data) throw new Error("分类不存在");
    return data;
  },

  /**
   * 创建分类
   */
  async create(data: CreateProjectCategoryDto): Promise<ProjectCategory> {
    const response = await api.post<ApiResponse<ProjectCategory>>("/project-categories", data);
    const result = unwrapData(response);
    if (!result) throw new Error("创建分类失败");
    return result;
  },

  /**
   * 更新分类
   */
  async update(id: number, data: UpdateProjectCategoryDto): Promise<ProjectCategory> {
    const response = await api.put<ApiResponse<ProjectCategory>>(`/project-categories/${id}`, data);
    const result = unwrapData(response);
    if (!result) throw new Error("更新分类失败");
    return result;
  },

  /**
   * 删除分类
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/project-categories/${id}`);
  },
};

/**
 * 子项目API服务
 */
export const subProjectService = {
  /**
   * 获取子项目列表
   */
  async getList(params?: QuerySubProjectParams): Promise<SubProject[]> {
    const response = await api.get<ApiResponse<SubProject[]>>("/sub-projects", { params });
    return unwrapData(response) ?? [];
  },

  /**
   * 获取子项目详情
   */
  async getDetail(id: number): Promise<SubProject> {
    const response = await api.get<ApiResponse<SubProject>>(`/sub-projects/${id}`);
    const data = unwrapData(response);
    if (!data) throw new Error("子项目不存在");
    return data;
  },

  /**
   * 创建子项目
   */
  async create(data: CreateSubProjectDto): Promise<SubProject> {
    const response = await api.post<ApiResponse<SubProject>>("/sub-projects", data);
    const result = unwrapData(response);
    if (!result) throw new Error("创建子项目失败");
    return result;
  },

  /**
   * 更新子项目
   */
  async update(id: number, data: UpdateSubProjectDto): Promise<SubProject> {
    const response = await api.put<ApiResponse<SubProject>>(`/sub-projects/${id}`, data);
    const result = unwrapData(response);
    if (!result) throw new Error("更新子项目失败");
    return result;
  },

  /**
   * 删除子项目
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/sub-projects/${id}`);
  },

  /**
   * 重新排序子项目
   */
  async reorder(data: ReorderSubProjectDto): Promise<void> {
    await api.post("/sub-projects/reorder", data);
  },
};

/**
 * 内容类型API服务
 */
export const contentTypeService = {
  /**
   * 获取内容类型列表
   */
  async getList(): Promise<ContentType[]> {
    const response = await api.get<ApiResponse<ContentType[]>>("/content-types");
    return unwrapData(response) ?? [];
  },

  /**
   * 创建内容类型
   */
  async create(data: CreateContentTypeDto): Promise<ContentType> {
    const response = await api.post<ApiResponse<ContentType>>("/content-types", data);
    const result = unwrapData(response);
    if (!result) throw new Error("创建内容类型失败");
    return result;
  },

  /**
   * 更新内容类型
   */
  async update(id: number, data: UpdateContentTypeDto): Promise<ContentType> {
    const response = await api.put<ApiResponse<ContentType>>(`/content-types/${id}`, data);
    const result = unwrapData(response);
    if (!result) throw new Error("更新内容类型失败");
    return result;
  },

  /**
   * 删除内容类型
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/content-types/${id}`);
  },
};

/**
 * 内容API服务
 */
export const contentService = {
  /**
   * 获取内容列表
   */
  async getList(params?: QueryContentParams): Promise<SubProjectContent[]> {
    const response = await api.get<ApiResponse<SubProjectContent[]>>("/contents", { params });
    return unwrapData(response) ?? [];
  },

  /**
   * 获取内容详情
   */
  async getDetail(id: number): Promise<SubProjectContent> {
    const response = await api.get<ApiResponse<SubProjectContent>>(`/contents/${id}`);
    const data = unwrapData(response);
    if (!data) throw new Error("内容不存在");
    return data;
  },

  /**
   * 创建内容
   */
  async create(data: CreateContentDto): Promise<SubProjectContent> {
    const response = await api.post<ApiResponse<SubProjectContent>>("/contents", data);
    const result = unwrapData(response);
    if (!result) throw new Error("创建内容失败");
    return result;
  },

  /**
   * 更新内容
   */
  async update(id: number, data: UpdateContentDto): Promise<SubProjectContent> {
    const response = await api.put<ApiResponse<SubProjectContent>>(`/contents/${id}`, data);
    const result = unwrapData(response);
    if (!result) throw new Error("更新内容失败");
    return result;
  },

  /**
   * 删除内容
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/contents/${id}`);
  },
};

/**
 * 文字口令API服务
 */
export const textCommandService = {
  /**
   * 获取文字口令列表
   */
  async getList(params?: QueryTextCommandParams): Promise<TextCommand[]> {
    const response = await api.get<ApiResponse<TextCommand[]>>("/text-commands", { params });
    return unwrapData(response) ?? [];
  },

  /**
   * 获取文字口令详情
   */
  async getDetail(id: number): Promise<TextCommand> {
    const response = await api.get<ApiResponse<TextCommand>>(`/text-commands/${id}`);
    const data = unwrapData(response);
    if (!data) throw new Error("文字口令不存在");
    return data;
  },

  /**
   * 创建文字口令
   */
  async create(data: CreateTextCommandDto): Promise<TextCommand> {
    const response = await api.post<ApiResponse<TextCommand>>("/text-commands", data);
    const result = unwrapData(response);
    if (!result) throw new Error("创建文字口令失败");
    return result;
  },

  /**
   * 更新文字口令
   */
  async update(id: number, data: UpdateTextCommandDto): Promise<TextCommand> {
    const response = await api.put<ApiResponse<TextCommand>>(`/text-commands/${id}`, data);
    const result = unwrapData(response);
    if (!result) throw new Error("更新文字口令失败");
    return result;
  },

  /**
   * 删除文字口令
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/text-commands/${id}`);
  },

  /**
   * 批量删除文字口令
   */
  async bulkDelete(data: BulkDeleteTextCommandDto): Promise<void> {
    await api.post("/text-commands/bulk-delete", data);
  },
};

/**
 * 文档API服务
 */
export const documentationService = {
  /**
   * 获取文档列表
   */
  async getList(params?: QueryDocumentationParams): Promise<DocumentationEntry[]> {
    const response = await api.get<ApiResponse<DocumentationEntry[]>>("/documentation", { params });
    const data = unwrapData(response);
    // 后端可能直接返回数组
    if (Array.isArray(data)) return data;
    return [];
  },

  /**
   * 生成文档
   */
  async generate(data?: GenerateDocumentationDto): Promise<void> {
    await api.post("/documentation/generate", data);
  },
};

