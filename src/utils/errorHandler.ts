/**
 * 全局错误处理器
 */

import { ElNotification } from "element-plus";
import { logger } from "./logger";

export interface ErrorInfo {
  message: string;
  stack?: string;
  componentName?: string;
  propsData?: any;
  info?: string;
}

/**
 * 全局错误处理类
 */
class ErrorHandler {
  private errorCount = 0;
  private readonly maxErrors = 10;
  private readonly timeWindow = 60000; // 1分钟
  private errorTimestamps: number[] = [];

  /**
   * 处理Vue错误
   */
  handleVueError(err: Error, instance: any, info: string): void {
    const errorInfo: ErrorInfo = {
      message: err.message,
      stack: err.stack,
      componentName: instance?.$options?.name || instance?.$options?.__name,
      propsData: instance?.$props,
      info,
    };

    logger.error("Vue Error", errorInfo);

    // 防止错误风暴
    if (this.shouldShowError()) {
      ElNotification({
        title: "应用错误",
        message: `组件错误：${errorInfo.message}`,
        type: "error",
        duration: 5000,
      });
    }
  }

  /**
   * 处理未捕获的Promise rejection
   */
  handleUnhandledRejection(event: PromiseRejectionEvent): void {
    logger.error("Unhandled Promise Rejection", {
      reason: event.reason,
      promise: event.promise,
    });

    if (this.shouldShowError()) {
      ElNotification({
        title: "异步错误",
        message: `Promise rejection: ${event.reason?.message || event.reason}`,
        type: "error",
        duration: 5000,
      });
    }
  }

  /**
   * 处理全局未捕获错误
   */
  handleGlobalError(event: ErrorEvent): void {
    logger.error("Global Error", {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
    });

    if (this.shouldShowError()) {
      ElNotification({
        title: "脚本错误",
        message: event.message,
        type: "error",
        duration: 5000,
      });
    }
  }

  /**
   * 处理网络错误
   */
  handleNetworkError(error: any): void {
    logger.error("Network Error", error);

    ElNotification({
      title: "网络错误",
      message: "网络连接失败，请检查网络设置",
      type: "error",
      duration: 5000,
    });
  }

  /**
   * 判断是否应该显示错误（防止错误风暴）
   */
  private shouldShowError(): boolean {
    const now = Date.now();
    
    // 清理过期的错误时间戳
    this.errorTimestamps = this.errorTimestamps.filter(
      (timestamp) => now - timestamp < this.timeWindow
    );

    // 检查错误频率
    if (this.errorTimestamps.length >= this.maxErrors) {
      if (this.errorTimestamps.length === this.maxErrors) {
        ElNotification({
          title: "错误过多",
          message: "检测到大量错误，已停止错误提示。请刷新页面或联系管理员。",
          type: "warning",
          duration: 0,
        });
      }
      return false;
    }

    this.errorTimestamps.push(now);
    return true;
  }

  /**
   * 重置错误计数
   */
  reset(): void {
    this.errorTimestamps = [];
    this.errorCount = 0;
  }
}

export const errorHandler = new ErrorHandler();

/**
 * 安装全局错误处理器
 */
export function setupErrorHandler(app: any): void {
  // Vue错误处理
  app.config.errorHandler = (err: Error, instance: any, info: string) => {
    errorHandler.handleVueError(err, instance, info);
  };

  // 警告处理
  app.config.warnHandler = (msg: string, instance: any, trace: string) => {
    if (import.meta.env.DEV) {
      console.warn("[Vue Warning]", msg, { instance, trace });
    }
  };

  // Promise rejection处理
  window.addEventListener("unhandledrejection", (event) => {
    errorHandler.handleUnhandledRejection(event);
  });

  // 全局错误处理
  window.addEventListener("error", (event) => {
    errorHandler.handleGlobalError(event);
  });

  // 资源加载错误
  window.addEventListener(
    "error",
    (event) => {
      const target = event.target as HTMLElement;
      if (target.tagName === "IMG" || target.tagName === "SCRIPT" || target.tagName === "LINK") {
        logger.warn("Resource Load Error", {
          tagName: target.tagName,
          src: (target as any).src || (target as any).href,
        });
      }
    },
    true
  );
}

