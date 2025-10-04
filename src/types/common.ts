/**
 * 通用类型定义
 */

// 时间戳字段
export interface Timestamps {
  createdAt: string;
  updatedAt: string;
}

// 软删除字段
export interface SoftDelete {
  isActive: boolean;
}

// 排序字段
export interface Sortable {
  sortOrder: number;
}

// 分页参数
export interface PaginationParams {
  page?: number;
  limit?: number;
}

// 分页响应
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}

// 搜索参数
export interface SearchParams {
  search?: string;
  keyword?: string;
}

// 过期状态
export type ExpiryStatus = "safe" | "warning" | "danger";

// 加载状态
export interface LoadingState {
  loading: boolean;
  error: string | null;
}

// 基础实体接口
export interface BaseEntity extends Timestamps, SoftDelete {
  id: number;
}

