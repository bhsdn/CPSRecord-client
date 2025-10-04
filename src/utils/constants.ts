/**
 * 应用常量配置
 */

import type { ContentType } from "@/types";

/**
 * 默认内容类型
 */
export const DEFAULT_CONTENT_TYPES: ContentType[] = [
  {
    id: 1,
    name: "短链接",
    fieldType: "url",
    hasExpiry: false,
    isSystem: true,
    description: "跳转使用的短链接",
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: "长链接",
    fieldType: "url",
    hasExpiry: false,
    isSystem: true,
    description: "原始链接地址",
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    name: "团口令",
    fieldType: "text",
    hasExpiry: true,
    isSystem: true,
    description: "用于活动的团口令",
    createdAt: new Date().toISOString(),
  },
  {
    id: 4,
    name: "唤起协议",
    fieldType: "text",
    hasExpiry: false,
    isSystem: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 5,
    name: "H5 图片",
    fieldType: "image",
    hasExpiry: false,
    isSystem: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 6,
    name: "小程序图片",
    fieldType: "image",
    hasExpiry: false,
    isSystem: true,
    createdAt: new Date().toISOString(),
  },
];

/**
 * 分页配置
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

/**
 * 时效性配置
 */
export const EXPIRY = {
  DANGER_DAYS: 3,  // 3天内为危险状态
  WARNING_DAYS: 7, // 7天内为警告状态
} as const;

/**
 * 本地存储键名
 */
export const STORAGE_KEYS = {
  TOKEN: "cps_token",
  USER: "cps_user",
  THEME: "cps_theme",
  LANGUAGE: "cps_language",
} as const;

/**
 * 响应式断点
 */
export const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1200,
} as const;

/**
 * 日期格式
 */
export const DATE_FORMAT = {
  FULL: "YYYY-MM-DD HH:mm:ss",
  DATE: "YYYY-MM-DD",
  TIME: "HH:mm:ss",
  MONTH: "YYYY-MM",
} as const;

/**
 * 文件上传配置
 */
export const UPLOAD = {
  MAX_SIZE: 2 * 1024 * 1024, // 2MB
  ACCEPT_IMAGES: ["image/jpeg", "image/png", "image/gif", "image/webp"],
} as const;

/**
 * 表单验证规则
 */
export const VALIDATION = {
  PROJECT_NAME_MAX_LENGTH: 255,
  DESCRIPTION_MAX_LENGTH: 1000,
  CATEGORY_NAME_MAX_LENGTH: 100,
  COMMAND_TEXT_MAX_LENGTH: 500,
} as const;
