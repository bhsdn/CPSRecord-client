import type { BaseEntity, ExpiryStatus, SearchParams } from "./common";

/**
 * 内容字段类型
 */
export type ContentFieldType = "text" | "url" | "image" | "date" | "number";

/**
 * 内容类型
 */
export interface ContentType {
  id: number;
  name: string;
  fieldType: ContentFieldType;
  hasExpiry: boolean;
  isSystem: boolean;
  description?: string;
  createdAt: string;
}

/**
 * 子项目内容
 */
export interface SubProjectContent extends Omit<BaseEntity, "isActive"> {
  subProjectId: number;
  contentTypeId: number;
  contentType?: ContentType;
  contentValue: string;
  expiryDays?: number | null;
  expiryDate?: string | null;
  expiryStatus?: ExpiryStatus | null;
  daysRemaining?: number | null;
  isActive: boolean;
}

/**
 * 文字口令
 */
export interface TextCommand extends Omit<BaseEntity, "isActive"> {
  subProjectId: number;
  commandText: string;
  expiryDays: number;
  expiryDate: string;
  expiryStatus?: ExpiryStatus;
  daysRemaining?: number | null;
  isActive: boolean;
}

/**
 * 创建内容类型DTO
 */
export interface CreateContentTypeDto {
  name: string;
  fieldType: ContentFieldType;
  hasExpiry?: boolean;
  isSystem?: boolean;
  description?: string;
}

/**
 * 更新内容类型DTO
 */
export interface UpdateContentTypeDto {
  name?: string;
  fieldType?: ContentFieldType;
  hasExpiry?: boolean;
  description?: string;
}

/**
 * 创建子项目内容DTO
 */
export interface CreateContentDto {
  subProjectId: number;
  contentTypeId: number;
  contentValue: string;
  expiryDays?: number;
}

/**
 * 更新子项目内容DTO
 */
export interface UpdateContentDto {
  contentValue?: string;
  expiryDays?: number;
}

/**
 * 内容查询参数
 */
export interface QueryContentParams extends SearchParams {
  subProjectId?: number;
  status?: ExpiryStatus;
}

/**
 * 创建文字口令DTO
 */
export interface CreateTextCommandDto {
  subProjectId: number;
  commandText: string;
  expiryDays: number;
}

/**
 * 更新文字口令DTO
 */
export interface UpdateTextCommandDto {
  commandText?: string;
  expiryDays?: number;
}

/**
 * 文字口令查询参数
 */
export interface QueryTextCommandParams extends SearchParams {
  subProjectId?: number;
  status?: ExpiryStatus;
}

/**
 * 批量删除文字口令DTO
 */
export interface BulkDeleteTextCommandDto {
  ids: number[];
}
