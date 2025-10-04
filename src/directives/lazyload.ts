/**
 * 图片懒加载指令
 */

import type { Directive, DirectiveBinding } from "vue";

interface LazyLoadElement extends HTMLImageElement {
  _lazyObserver?: IntersectionObserver;
}

const lazyload: Directive = {
  mounted(el: LazyLoadElement, binding: DirectiveBinding) {
    const { value } = binding;
    
    if (!value) return;

    // 创建 IntersectionObserver
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as LazyLoadElement;
            const src = value;

            // 添加加载类
            img.classList.add("lazy-loading");

            // 创建临时图片用于预加载
            const tempImg = new Image();
            tempImg.onload = () => {
              img.src = src;
              img.classList.remove("lazy-loading");
              img.classList.add("lazy-loaded");
              observer.unobserve(img);
            };
            tempImg.onerror = () => {
              img.classList.remove("lazy-loading");
              img.classList.add("lazy-error");
              observer.unobserve(img);
            };
            tempImg.src = src;
          }
        });
      },
      {
        rootMargin: "50px", // 提前50px开始加载
        threshold: 0.01,
      }
    );

    // 保存 observer 引用
    el._lazyObserver = observer;
    observer.observe(el);

    // 设置占位符
    if (!el.src) {
      el.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E";
    }
  },

  unmounted(el: LazyLoadElement) {
    // 清理 observer
    if (el._lazyObserver) {
      el._lazyObserver.disconnect();
      delete el._lazyObserver;
    }
  },
};

export default lazyload;

