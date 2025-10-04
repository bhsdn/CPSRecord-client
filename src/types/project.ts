import type { SubProjectContent, TextCommand } from "./content";
import type { BaseEntity, Sortable, PaginationParams, SearchParams } from "./common";

/**
 * 项目分类
 */
export interface ProjectCategory extends BaseEntity, Sortable {
  name: string;
  description?: string;
  projectCount?: number;
}

/**
 * 项目
 */
export interface Project extends BaseEntity {
  name: string;
  description?: string;
  categoryId: number | null;
  category?: ProjectCategory;
  subProjectCount?: number;
  documentationCount?: number;
}

/**
 * 子项目
 */
export interface SubProject extends BaseEntity, Sortable {
  projectId: number;
  name: string;
  description?: string;
  documentationEnabled: boolean;
  documentationGeneratedAt?: string | null;
  contents?: SubProjectContent[];
  textCommands?: TextCommand[];
  project?: Pick<Project, "id" | "name" | "category">;
}

/**
 * 创建项目DTO
 */
export interface CreateProjectDto {
  name: string;
  description?: string;
  categoryId: number;
}

/**
 * 更新项目DTO
 */
export interface UpdateProjectDto {
  name?: string;
  description?: string;
  categoryId?: number;
}

/**
 * 项目查询参数
 */
export interface QueryProjectParams extends PaginationParams, SearchParams {
  categoryId?: number;
}

/**
 * 创建项目分类DTO
 */
export interface CreateProjectCategoryDto {
  name: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
}

/**
 * 更新项目分类DTO
 */
export interface UpdateProjectCategoryDto {
  name?: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
}

/**
 * 创建子项目DTO
 */
export interface CreateSubProjectDto {
  projectId: number;
  name: string;
  description?: string;
  sortOrder?: number;
  documentationEnabled?: boolean;
}

/**
 * 更新子项目DTO
 */
export interface UpdateSubProjectDto {
  projectId?: number;
  name?: string;
  description?: string;
  sortOrder?: number;
  documentationEnabled?: boolean;
}

/**
 * 子项目排序项
 */
export interface SubProjectOrderItem {
  id: number;
  sortOrder: number;
}

/**
 * 子项目重新排序DTO
 */
export interface ReorderSubProjectDto {
  items: SubProjectOrderItem[];
}

/**
 * 子项目查询参数
 */
export interface QuerySubProjectParams extends SearchParams {
  projectId?: number;
  documentationEnabled?: boolean;
}
