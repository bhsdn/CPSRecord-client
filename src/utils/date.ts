/**
 * 日期工具函数
 */

import { EXPIRY } from "./constants";
import type { ExpiryStatus } from "@/types";

/**
 * 格式化日期
 */
export function formatDate(date: string | Date | undefined | null, withTime = true): string {
  if (!date) return "--";
  
  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (!dateObj || Number.isNaN(dateObj.getTime())) return "--";
  
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: withTime ? "2-digit" : undefined,
    minute: withTime ? "2-digit" : undefined,
    second: withTime ? "2-digit" : undefined,
  }).format(dateObj);
}

/**
 * 格式化为日期字符串（yyyy-MM-dd）
 */
export function formatDateOnly(date: string | Date | undefined | null): string {
  return formatDate(date, false);
}

/**
 * 格式化相对时间（如：2小时前）
 */
export function formatRelativeTime(date: string | Date | undefined | null): string {
  if (!date) return "--";
  
  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (!dateObj || Number.isNaN(dateObj.getTime())) return "--";

  const now = new Date();
  const diff = now.getTime() - dateObj.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) return formatDate(dateObj, false);
  if (days > 0) return `${days}天前`;
  if (hours > 0) return `${hours}小时前`;
  if (minutes > 0) return `${minutes}分钟前`;
  return "刚刚";
}

/**
 * 计算到期日期
 */
export function calculateExpiryDate(days: number): string {
  const now = new Date();
  now.setDate(now.getDate() + days);
  return now.toISOString().split("T")[0]; // yyyy-MM-dd
}

/**
 * 计算剩余天数
 */
export function calculateDaysRemaining(expiryDate?: string | null): number | null {
  if (!expiryDate) return null;
  
  const target = new Date(expiryDate);
  const now = new Date();
  
  // 设置为当天零点，避免时间影响
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  
  const diff = target.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  
  return days;
}

/**
 * 获取过期状态
 */
export function getExpiryStatus(expiryDate?: string | null): ExpiryStatus {
  const days = calculateDaysRemaining(expiryDate);
  
  if (days === null) return "safe";
  if (days < 0 || days <= EXPIRY.DANGER_DAYS) return "danger";
  if (days <= EXPIRY.WARNING_DAYS) return "warning";
  return "safe";
}

/**
 * 获取过期状态文本
 */
export function getExpiryText(expiryDate?: string | null): string {
  if (!expiryDate) return "长期有效";
  
  const days = calculateDaysRemaining(expiryDate);
  
  if (days === null) return "--";
  if (days < 0) return `已过期 ${Math.abs(days)} 天`;
  if (days === 0) return "今日到期";
  if (days === 1) return "明日到期";
  return `剩余 ${days} 天`;
}

/**
 * 判断是否即将过期
 */
export function isExpiringSoon(expiryDate?: string | null): boolean {
  const status = getExpiryStatus(expiryDate);
  return status === "warning" || status === "danger";
}

/**
 * 判断是否已过期
 */
export function isExpired(expiryDate?: string | null): boolean {
  const days = calculateDaysRemaining(expiryDate);
  return days !== null && days < 0;
}

/**
 * 获取日期范围文本
 */
export function getDateRangeText(startDate: string | Date, endDate: string | Date): string {
  return `${formatDateOnly(startDate)} ~ ${formatDateOnly(endDate)}`;
}
