import axios, { AxiosError, CanceledError } from "axios";
import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosRequestHeaders,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { ElMessage } from "element-plus";
import type { ApiResponse, ApiError } from "@/types/api";

/**
 * API 配置常量
 */
const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || "/api",
  TIMEOUT: 15000,
  RETRY_COUNT: 3,
  RETRY_DELAY: 1000,
} as const;

/**
 * 请求缓存管理
 */
class RequestCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly TTL = 5 * 60 * 1000; // 5分钟缓存

  set(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    // 检查是否过期
    if (Date.now() - cached.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  clear(): void {
    this.cache.clear();
  }

  generateKey(url: string, params?: any): string {
    return `${url}${params ? JSON.stringify(params) : ""}`;
  }
}

/**
 * 请求取消管理
 */
class RequestCanceler {
  private pendingRequests = new Map<string, AbortController>();

  add(key: string): AbortController {
    // 如果已存在相同请求，取消之前的
    this.cancel(key);
    
    const controller = new AbortController();
    this.pendingRequests.set(key, controller);
    return controller;
  }

  cancel(key: string): void {
    const controller = this.pendingRequests.get(key);
    if (controller) {
      controller.abort();
      this.pendingRequests.delete(key);
    }
  }

  remove(key: string): void {
    this.pendingRequests.delete(key);
  }

  cancelAll(): void {
    this.pendingRequests.forEach((controller) => controller.abort());
    this.pendingRequests.clear();
  }
}

/**
 * API 客户端类
 */
class ApiClient {
  private instance: AxiosInstance;
  private cache = new RequestCache();
  private canceler = new RequestCanceler();

  constructor() {
    this.instance = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
  }

  /**
   * 设置请求和响应拦截器
   */
  private setupInterceptors(): void {
    // 请求拦截器
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // 添加认证Token
        const token = localStorage.getItem("cps_token");
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // 添加请求ID用于追踪
        const requestId = Date.now().toString(36) + Math.random().toString(36).substr(2);
        if (config.headers) {
          config.headers["X-Request-ID"] = requestId;
        }

        // 打印请求日志（开发环境）
        if (import.meta.env.DEV) {
          console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
            params: config.params,
            data: config.data,
          });
        }

        return config;
      },
      (error) => {
        console.error("[API Request Error]", error);
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        // 打印响应日志（开发环境）
        if (import.meta.env.DEV) {
          console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
        }

        return response;
      },
      (error: AxiosError<ApiError>) => {
        // 处理请求取消
        if (error instanceof CanceledError) {
          console.log("[API] Request canceled:", error.message);
          return Promise.reject(error);
        }

        // 提取错误信息
        const errorData = error.response?.data;
        const message = this.getErrorMessage(error, errorData);

        // 显示错误提示
        this.handleErrorDisplay(error, message);

        // 打印错误日志
        console.error("[API Error]", {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          message,
          details: errorData?.details,
        });

        return Promise.reject(error);
      }
    );
  }

  /**
   * 获取错误信息
   */
  private getErrorMessage(error: AxiosError<ApiError>, errorData?: ApiError): string {
    // 业务错误
    if (errorData?.message) {
      return errorData.message;
    }

    // HTTP 状态码错误
    if (error.response?.status) {
      const statusMessages: Record<number, string> = {
        400: "请求参数错误",
        401: "未授权，请重新登录",
        403: "没有权限访问",
        404: "请求的资源不存在",
        500: "服务器内部错误",
        502: "网关错误",
        503: "服务暂不可用",
      };
      return statusMessages[error.response.status] || `请求失败（${error.response.status}）`;
    }

    // 网络错误
    if (error.code === "ECONNABORTED") {
      return "请求超时，请检查网络连接";
    }

    if (error.message === "Network Error") {
      return "网络连接失败，请检查网络";
    }

    return error.message || "未知错误";
  }

  /**
   * 处理错误显示
   */
  private handleErrorDisplay(error: AxiosError<ApiError>, message: string): void {
    // 401 需要跳转到登录页（未来功能）
    if (error.response?.status === 401) {
      // router.push("/login");
      ElMessage.error("登录已过期，请重新登录");
      return;
    }

    // 只显示网络错误和系统错误（5xx），业务错误（4xx）由调用方处理
    if (!error.response || error.response.status >= 500 || error.code === "ECONNABORTED" || error.message === "Network Error") {
      ElMessage.error(message);
    }
  }

  /**
   * GET 请求
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.get<T>(url, config);
  }

  /**
   * POST 请求
   */
  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.instance.post<T>(url, data, config);
  }

  /**
   * PUT 请求
   */
  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.instance.put<T>(url, data, config);
  }

  /**
   * PATCH 请求
   */
  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.instance.patch<T>(url, data, config);
  }

  /**
   * DELETE 请求
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.delete<T>(url, config);
  }

  /**
   * 带缓存的GET请求
   */
  async getCached<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    const cacheKey = this.cache.generateKey(url, config?.params);
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      return Promise.resolve({ data: cached } as AxiosResponse<T>);
    }

    const response = await this.get<T>(url, config);
    this.cache.set(cacheKey, response.data);
    return response;
  }

  /**
   * 取消请求
   */
  cancelRequest(key: string): void {
    this.canceler.cancel(key);
  }

  /**
   * 取消所有请求
   */
  cancelAllRequests(): void {
    this.canceler.cancelAll();
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
  }
}

/**
 * 导出API实例
 */
export const api = new ApiClient();

/**
 * 解析API响应，提取data字段
 */
export function unwrap<T>(response: AxiosResponse<ApiResponse<T>>): ApiResponse<T> {
  const payload = response.data;
  
  // 检查响应格式
  if (!payload || typeof payload !== "object") {
    throw new Error("无效的API响应格式");
  }

  // 检查业务状态
  if ("success" in payload && payload.success === false) {
    throw new Error(payload.message || payload.error || "接口请求失败");
  }

  return payload;
}

/**
 * 解析并提取data字段
 */
export function unwrapData<T>(response: AxiosResponse<ApiResponse<T>>): T | undefined {
  const payload = unwrap(response);
  return payload.data;
}

/**
 * 构建URL（替换路径参数）
 */
export function buildUrl(template: string, params: Record<string, string | number>): string {
  return template.replace(/:(\w+)/g, (_, key) => {
    const value = params[key];
    if (value === undefined) {
      throw new Error(`Missing URL parameter: ${key}`);
    }
    return String(value);
  });
}

/**
 * 判断是否为API错误
 */
export function isApiError(error: unknown): error is AxiosError<ApiError> {
  return axios.isAxiosError(error);
}

/**
 * 判断是否为请求取消错误
 */
export function isCancelError(error: unknown): error is CanceledError<unknown> {
  return axios.isCancel(error);
}
