/**
 * 分页管理 Composable
 */

import { ref, computed, readonly } from "vue";
import type { Ref } from "vue";
import { PAGINATION } from "@/utils/constants";
import type { PaginationMeta } from "@/types";

export interface UsePaginationReturn {
  page: Ref<number>;
  limit: Ref<number>;
  total: Ref<number>;
  totalPages: Readonly<Ref<number>>;
  hasNext: Readonly<Ref<boolean>>;
  hasPrev: Readonly<Ref<boolean>>;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setTotal: (total: number) => void;
  setPagination: (pagination: PaginationMeta) => void;
  nextPage: () => void;
  prevPage: () => void;
  reset: () => void;
}

/**
 * 分页管理
 */
export function usePagination(
  initialPage = PAGINATION.DEFAULT_PAGE,
  initialLimit = PAGINATION.DEFAULT_LIMIT
): UsePaginationReturn {
  const page = ref(initialPage);
  const limit = ref(initialLimit);
  const total = ref(0);

  const totalPages = computed(() => Math.ceil(total.value / limit.value));
  const hasNext = computed(() => page.value < totalPages.value);
  const hasPrev = computed(() => page.value > 1);

  const setPage = (newPage: number) => {
    page.value = Math.max(1, Math.min(newPage, totalPages.value));
  };

  const setLimit = (newLimit: number) => {
    limit.value = Math.max(1, Math.min(newLimit, PAGINATION.MAX_LIMIT));
    // 重置到第一页
    page.value = 1;
  };

  const setTotal = (newTotal: number) => {
    total.value = Math.max(0, newTotal);
  };

  const setPagination = (pagination: PaginationMeta) => {
    page.value = pagination.page;
    limit.value = pagination.limit;
    total.value = pagination.total;
  };

  const nextPage = () => {
    if (hasNext.value) {
      page.value++;
    }
  };

  const prevPage = () => {
    if (hasPrev.value) {
      page.value--;
    }
  };

  const reset = () => {
    page.value = initialPage;
    limit.value = initialLimit;
    total.value = 0;
  };

  return {
    page,
    limit,
    total,
    totalPages: readonly(totalPages),
    hasNext: readonly(hasNext),
    hasPrev: readonly(hasPrev),
    setPage,
    setLimit,
    setTotal,
    setPagination,
    nextPage,
    prevPage,
    reset,
  };
}

