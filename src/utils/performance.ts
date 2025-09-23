import type { Directive } from "vue";

type VisibleRange = {
  startIndex: number;
  endIndex: number;
  offsetY: number;
};

/**
 * VirtualScroll 用于在长列表场景下仅渲染可视区域的元素，减少 DOM 数量。
 * 默认会额外渲染两个元素作为缓冲，避免快速滚动导致的白屏。
 */
export class VirtualScroll {
  private container: HTMLElement;
  private itemHeight: number;
  private overscan: number;
  private visibleCount: number;

  constructor(container: HTMLElement, itemHeight: number, overscan = 2) {
    this.container = container;
    this.itemHeight = itemHeight;
    this.overscan = overscan;
    this.visibleCount = this.calculateVisibleCount();
  }

  private calculateVisibleCount() {
    const height = this.container.clientHeight || 0;
    return Math.ceil(height / this.itemHeight) + this.overscan * 2;
  }

  /**
   * 当容器尺寸发生变化时，重新计算可视数量。
   */
  recalculate() {
    this.visibleCount = this.calculateVisibleCount();
  }

  updateVisibleRange(scrollTop: number, totalCount: number): VisibleRange {
    if (totalCount <= 0) {
      return { startIndex: 0, endIndex: 0, offsetY: 0 };
    }

    const maxStartIndex = Math.max(totalCount - this.visibleCount, 0);
    let startIndex = Math.floor(scrollTop / this.itemHeight) - this.overscan;
    startIndex = Math.max(0, Math.min(startIndex, maxStartIndex));

    const endIndex = Math.min(startIndex + this.visibleCount, totalCount);
    const offsetY = startIndex * this.itemHeight;

    return { startIndex, endIndex, offsetY };
  }
}

/**
 * 自定义图片懒加载指令。使用 IntersectionObserver 在元素进入可视区域时再设置真实图片地址。
 */
export const vLazyload: Directive<HTMLImageElement, string> = {
  mounted(el, binding) {
    if (!binding.value) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.src = binding.value;
            el.classList.remove("lazy-loading");
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.1 }
    );

    el.classList.add("lazy-loading");
    observer.observe(el);

    (el as any).__lazyObserver__ = observer;
  },
  updated(el, binding) {
    if (binding.value && binding.value !== binding.oldValue) {
      el.src = "";
      el.classList.add("lazy-loading");
      const observer: IntersectionObserver | undefined = (el as any).__lazyObserver__;
      observer?.unobserve(el);
      observer?.observe(el);
    }
  },
  unmounted(el) {
    const observer: IntersectionObserver | undefined = (el as any).__lazyObserver__;
    observer?.disconnect();
    delete (el as any).__lazyObserver__;
  },
};

/**
 * 函数防抖：在一定时间内多次调用仅会执行最后一次。
 */
export function debounce<T extends (...args: any[]) => void>(func: T, wait: number): T {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  return function debounced(this: unknown, ...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      timeout = undefined;
      func.apply(this, args);
    }, wait);
  } as T;
}

/**
 * 函数节流：在限定时间内只会执行一次，避免频繁触发。
 */
export function throttle<T extends (...args: any[]) => void>(func: T, limit: number): T {
  let inThrottle = false;

  return function throttled(this: unknown, ...args: Parameters<T>) {
    if (inThrottle) return;
    inThrottle = true;
    func.apply(this, args);
    setTimeout(() => {
      inThrottle = false;
    }, limit);
  } as T;
}
