import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { ProjectCategory } from "@/types";
import type { ApiResponse } from "@/types/api";
import { api, unwrap } from "@/utils/api";

interface CategoryListResponse {
  items?: RawProjectCategory[];
}

type RawProjectCategory = ProjectCategory & {
  sort_order?: number;
  is_active?: boolean;
  project_count?: number;
};

const normalizeCategory = (raw: Partial<RawProjectCategory>): ProjectCategory => ({
  id: Number(raw.id ?? 0),
  name: raw.name ?? "",
  description: raw.description ?? "",
  sortOrder: raw.sortOrder ?? raw.sort_order ?? 0,
  isActive: raw.isActive ?? raw.is_active ?? true,
  projectCount: raw.projectCount ?? raw.project_count,
});

export const useProjectCategoriesStore = defineStore("projectCategories", () => {
  const categories = ref<ProjectCategory[]>([]);
  const loading = ref(false);

  const fetchCategories = async () => {
    loading.value = true;
    try {
      const response = await api.get<ApiResponse<CategoryListResponse | RawProjectCategory[]>>("/project-categories");
      const payload = unwrap(response);
      const data = payload.data;
      const items = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
        ? data.items
        : [];
      categories.value = items.map((item) => normalizeCategory(item));
    } catch (error) {
      throw error instanceof Error ? error : new Error("获取项目分类失败");
    } finally {
      loading.value = false;
    }
  };

  const activeCategories = computed(() => categories.value.filter((item) => item.isActive));

  const createCategory = async (payload: Omit<ProjectCategory, 'id' | 'projectCount'>) => {
    try {
      const response = await api.post<ApiResponse<RawProjectCategory>>('/project-categories', payload);
      const data = unwrap(response);
      const newCategory = normalizeCategory(data.data);
      categories.value.push(newCategory);
      return newCategory;
    } catch (error) {
      throw error instanceof Error ? error : new Error('创建项目分类失败');
    }
  };

  const updateCategory = async (id: number, payload: Partial<ProjectCategory>) => {
    try {
      const response = await api.put<ApiResponse<RawProjectCategory>>(`/project-categories/${id}`, payload);
      const data = unwrap(response);
      const updatedCategory = normalizeCategory(data.data);
      const index = categories.value.findIndex((item) => item.id === id);
      if (index !== -1) {
        categories.value[index] = updatedCategory;
      }
      return updatedCategory;
    } catch (error) {
      throw error instanceof Error ? error : new Error('更新项目分类失败');
    }
  };

  const deleteCategory = async (id: number) => {
    try {
      await api.delete(`/project-categories/${id}`);
      categories.value = categories.value.filter((item) => item.id !== id);
    } catch (error) {
      throw error instanceof Error ? error : new Error('删除项目分类失败');
    }
  };

  const getCategoryById = (id: number) => {
    return categories.value.find((item) => item.id === id);
  };

  return {
    categories,
    activeCategories,
    loading,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
  };
});
