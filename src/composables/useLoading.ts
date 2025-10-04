/**
 * 加载状态管理 Composable
 */

import { ref, readonly } from "vue";
import type { Ref } from "vue";

export interface UseLoadingReturn {
  loading: Readonly<Ref<boolean>>;
  setLoading: (value: boolean) => void;
  withLoading: <T>(fn: () => Promise<T>) => Promise<T>;
}

/**
 * 加载状态管理
 */
export function useLoading(initialValue = false): UseLoadingReturn {
  const loading = ref(initialValue);

  const setLoading = (value: boolean) => {
    loading.value = value;
  };

  const withLoading = async <T>(fn: () => Promise<T>): Promise<T> => {
    loading.value = true;
    try {
      return await fn();
    } finally {
      loading.value = false;
    }
  };

  return {
    loading: readonly(loading),
    setLoading,
    withLoading,
  };
}

