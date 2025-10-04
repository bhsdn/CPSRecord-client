import type { PaginationMeta } from "./common";

/**
 * API 响应基础接口
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: number;
  timestamp: string;
  details?: string[];
}

/**
 * 分页响应接口
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

/**
 * 列表响应接口（不带分页）
 */
export interface ListResponse<T> {
  data: T[];
  total?: number;
}

/**
 * API 错误接口
 */
export interface ApiError {
  success: false;
  error: string;
  message: string;
  code: number;
  timestamp: string;
  details?: string[];
  path?: string;
}

/**
 * HTTP 方法类型
 */
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

/**
 * 请求配置
 */
export interface RequestConfig {
  params?: Record<string, any>;
  headers?: Record<string, string>;
  timeout?: number;
}

/**
 * API 端点枚举
 */
export enum ApiEndpoint {
  // 项目相关
  PROJECTS = "/projects",
  PROJECT_DETAIL = "/projects/:id",
  PROJECT_SUB_PROJECTS = "/projects/:id/sub-projects",
  
  // 项目分类
  PROJECT_CATEGORIES = "/project-categories",
  PROJECT_CATEGORY_DETAIL = "/project-categories/:id",
  
  // 子项目
  SUB_PROJECTS = "/sub-projects",
  SUB_PROJECT_DETAIL = "/sub-projects/:id",
  SUB_PROJECTS_REORDER = "/sub-projects/reorder",
  
  // 内容类型
  CONTENT_TYPES = "/content-types",
  CONTENT_TYPE_DETAIL = "/content-types/:id",
  
  // 内容
  CONTENTS = "/contents",
  CONTENT_DETAIL = "/contents/:id",
  
  // 文字口令
  TEXT_COMMANDS = "/text-commands",
  TEXT_COMMAND_DETAIL = "/text-commands/:id",
  TEXT_COMMANDS_BULK_DELETE = "/text-commands/bulk-delete",
  
  // 文档
  DOCUMENTATION = "/documentation",
  DOCUMENTATION_GENERATE = "/documentation/generate",
  
  // 健康检查
  HEALTH = "/health",
}
