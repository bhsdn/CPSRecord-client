/**
 * 性能优化工具
 */

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function (this: any, ...args: Parameters<T>) {
    const context = this;

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return function (this: any, ...args: Parameters<T>) {
    const context = this;

    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;

      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * 延迟执行（用于性能优化）
 */
export function defer(callback: () => void): void {
  if (typeof requestIdleCallback !== "undefined") {
    requestIdleCallback(callback);
  } else {
    setTimeout(callback, 1);
  }
}

/**
 * 批量执行任务
 */
export async function batchExecute<T>(
  items: T[],
  executor: (item: T, index: number) => Promise<void>,
  batchSize = 10
): Promise<void> {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await Promise.all(batch.map((item, index) => executor(item, i + index)));
  }
}

/**
 * 图片预加载
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * 批量图片预加载
 */
export async function preloadImages(urls: string[]): Promise<void> {
  await Promise.all(urls.map((url) => preloadImage(url)));
}

/**
 * 延迟加载函数
 */
export function lazyLoad<T>(
  loader: () => Promise<T>,
  delay = 0
): Promise<T> {
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        const result = await loader();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }, delay);
  });
}

/**
 * 性能监控
 */
export class PerformanceMonitor {
  private marks = new Map<string, number>();

  /**
   * 开始计时
   */
  start(label: string): void {
    this.marks.set(label, performance.now());
  }

  /**
   * 结束计时并返回耗时
   */
  end(label: string): number {
    const startTime = this.marks.get(label);
    if (!startTime) {
      console.warn(`Performance mark "${label}" not found`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.marks.delete(label);

    if (import.meta.env.DEV) {
      console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  /**
   * 测量函数执行时间
   */
  async measure<T>(label: string, fn: () => Promise<T>): Promise<T> {
    this.start(label);
    try {
      return await fn();
    } finally {
      this.end(label);
    }
  }
}

export const performanceMonitor = new PerformanceMonitor();

/**
 * 内存优化 - 清理未使用的缓存
 */
export function clearUnusedCache(): void {
  // 清理 localStorage 中的过期数据
  const now = Date.now();
  const keys = Object.keys(localStorage);
  
  keys.forEach((key) => {
    if (key.startsWith("cache_")) {
      try {
        const item = JSON.parse(localStorage.getItem(key) || "{}");
        if (item.expiry && item.expiry < now) {
          localStorage.removeItem(key);
        }
      } catch (error) {
        // 忽略解析错误
      }
    }
  });
}

/**
 * 计算元素是否在视口中
 */
export function isInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

