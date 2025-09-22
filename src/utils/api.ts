import axios from "axios";
import type {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosRequestHeaders,
  AxiosResponse,
} from "axios";
import { ElMessage } from "element-plus";
import type { ApiResponse } from "@/types/api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

class ApiClient {
  // Axios 实例用于统一管理请求配置与拦截器
  private instance: AxiosInstance;

  constructor() {
    // 创建基础配置的 Axios 实例，统一 API 入口与超时时间
    this.instance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 15000,
      withCredentials: true,
    });

    // 在请求发送前追加认证信息，便于后端识别用户身份
    this.instance.interceptors.request.use((config) => {
      const token = localStorage.getItem("cps_token");
      if (token) {
        if (!config.headers) {
          config.headers = {} as AxiosRequestHeaders;
        }
        (config.headers as AxiosRequestHeaders).Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // 统一处理响应错误，给出用户可见的错误提示
    this.instance.interceptors.response.use(
      (response) => response,
      (error: AxiosError<{ message?: string }>) => {
        const message =
          error.response?.data?.message || error.message || "网络请求失败";
        ElMessage.error(message);
        return Promise.reject(error);
      }
    );
  }

  // GET 请求封装，保持类型推断
  get<T>(url: string, config?: AxiosRequestConfig) {
    return this.instance.get<T>(url, config);
  }

  // POST 请求封装
  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return this.instance.post<T>(url, data, config);
  }

  // PUT 请求封装
  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return this.instance.put<T>(url, data, config);
  }

  // PATCH 请求封装
  patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return this.instance.patch<T>(url, data, config);
  }

  // DELETE 请求封装
  delete<T>(url: string, config?: AxiosRequestConfig) {
    return this.instance.delete<T>(url, config);
  }
}

export const api = new ApiClient();

// 统一解析后端响应，遇到业务失败时主动抛错，便于上层捕获
export function unwrap<T>(response: AxiosResponse<ApiResponse<T>>) {
  const payload = response.data;
  if (payload && typeof payload === "object" && "success" in payload && payload.success === false) {
    throw new Error(payload.message || "接口请求失败");
  }
  return payload;
}
