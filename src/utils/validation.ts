/**
 * 表单验证工具函数
 */

import { VALIDATION } from "./constants";

/**
 * 验证URL格式
 */
export function isValidUrl(value: string): boolean {
  if (!value || typeof value !== "string") return false;
  
  try {
    const url = new URL(value);
    return Boolean(url.protocol && url.host);
  } catch (error) {
    return false;
  }
}

/**
 * 验证是否为正整数
 */
export function isPositiveInteger(value: unknown): boolean {
  if (typeof value === "number") {
    return Number.isInteger(value) && value > 0;
  }
  const num = Number(value);
  return Number.isInteger(num) && num > 0;
}

/**
 * 验证字符串长度
 */
export function isValidLength(value: string, min: number, max: number): boolean {
  if (typeof value !== "string") return false;
  const length = value.trim().length;
  return length >= min && length <= max;
}

/**
 * 验证项目名称
 */
export function isValidProjectName(name: string): boolean {
  return isValidLength(name, 1, VALIDATION.PROJECT_NAME_MAX_LENGTH);
}

/**
 * 验证描述
 */
export function isValidDescription(description: string): boolean {
  return isValidLength(description, 0, VALIDATION.DESCRIPTION_MAX_LENGTH);
}

/**
 * 验证分类名称
 */
export function isValidCategoryName(name: string): boolean {
  return isValidLength(name, 1, VALIDATION.CATEGORY_NAME_MAX_LENGTH);
}

/**
 * 验证口令文本
 */
export function isValidCommandText(text: string): boolean {
  return isValidLength(text, 1, VALIDATION.COMMAND_TEXT_MAX_LENGTH);
}

/**
 * 验证天数范围
 */
export function isValidDays(days: number): boolean {
  return isPositiveInteger(days) && days >= 1 && days <= 365;
}

/**
 * 验证邮箱格式
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 验证手机号格式（中国大陆）
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
}

/**
 * 创建自定义验证器（用于Element Plus表单）
 */
export function createValidator<T>(
  validateFn: (value: T) => boolean,
  message: string
) {
  return (_rule: any, value: T, callback: (error?: Error) => void) => {
    if (!validateFn(value)) {
      callback(new Error(message));
    } else {
      callback();
    }
  };
}

/**
 * 常用的Element Plus表单验证规则
 */
export const formRules = {
  required: { required: true, message: "此项为必填项", trigger: "blur" },
  projectName: [
    { required: true, message: "请输入项目名称", trigger: "blur" },
    { min: 1, max: VALIDATION.PROJECT_NAME_MAX_LENGTH, message: `项目名称长度在1-${VALIDATION.PROJECT_NAME_MAX_LENGTH}个字符`, trigger: "blur" },
  ],
  description: [
    { max: VALIDATION.DESCRIPTION_MAX_LENGTH, message: `描述长度不能超过${VALIDATION.DESCRIPTION_MAX_LENGTH}个字符`, trigger: "blur" },
  ],
  categoryName: [
    { required: true, message: "请输入分类名称", trigger: "blur" },
    { min: 1, max: VALIDATION.CATEGORY_NAME_MAX_LENGTH, message: `分类名称长度在1-${VALIDATION.CATEGORY_NAME_MAX_LENGTH}个字符`, trigger: "blur" },
  ],
  url: [
    { required: true, message: "请输入URL", trigger: "blur" },
    { validator: createValidator(isValidUrl, "请输入有效的URL地址"), trigger: "blur" },
  ],
  days: [
    { required: true, message: "请输入有效天数", trigger: "blur" },
    { validator: createValidator(isValidDays, "天数必须在1-365之间"), trigger: "blur" },
  ],
};
