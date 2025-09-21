import { defineStore } from "pinia";
import { reactive } from "vue";

export const useAppStore = defineStore("app", () => {
  // 使用 Set 记录当前正在执行的全局加载任务，便于在页面顶部展示统一的加载态
  const loadingStack = reactive(new Set<string>());

  const startLoading = (key: string) => {
    loadingStack.add(key);
  };

  const stopLoading = (key: string) => {
    loadingStack.delete(key);
  };

  const isLoading = (key?: string) => {
    if (key) return loadingStack.has(key);
    return loadingStack.size > 0;
  };

  return {
    startLoading,
    stopLoading,
    isLoading,
  };
});
