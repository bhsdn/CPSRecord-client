import type { ContentType } from "@/types";

export const DEFAULT_CONTENT_TYPES: ContentType[] = [
  {
    id: 1,
    name: "短链接",
    fieldType: "url",
    hasExpiry: false,
    isSystem: true,
    description: "跳转使用的短链接",
  },
  {
    id: 2,
    name: "长链接",
    fieldType: "url",
    hasExpiry: false,
    isSystem: true,
    description: "原始链接地址",
  },
  {
    id: 3,
    name: "团口令",
    fieldType: "text",
    hasExpiry: true,
    isSystem: true,
    description: "用于活动的团口令",
  },
  {
    id: 4,
    name: "唤起协议",
    fieldType: "text",
    hasExpiry: false,
    isSystem: true,
  },
  {
    id: 5,
    name: "H5 图片",
    fieldType: "image",
    hasExpiry: false,
    isSystem: true,
  },
  {
    id: 6,
    name: "小程序图片",
    fieldType: "image",
    hasExpiry: false,
    isSystem: true,
  },
];
