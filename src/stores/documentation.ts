import { defineStore } from "pinia";
import { ref } from "vue";
import type { DocumentationEntry } from "@/types";
import type { ApiResponse } from "@/types/api";
import { api, unwrap } from "@/utils/api";

interface DocumentationListPayload {
  entries?: RawDocumentationEntry[];
  generatedAt?: string;
  generated_at?: string;
}

type RawDocumentationEntry = DocumentationEntry & {
  sub_project_id?: number;
  sub_project_name?: string;
  project_id?: number;
  project_name?: string;
  category_id?: number | null;
  category_name?: string | null;
  generated_at?: string;
  snapshot?: Record<string, unknown>;
};

const normalizeDocumentationEntry = (
  raw: Partial<RawDocumentationEntry>
): DocumentationEntry => ({
  id: Number(raw.id ?? 0),
  subProjectId: raw.subProjectId ?? raw.sub_project_id ?? 0,
  subProjectName: raw.subProjectName ?? raw.sub_project_name ?? "",
  projectId: raw.projectId ?? raw.project_id ?? 0,
  projectName: raw.projectName ?? raw.project_name ?? "",
  categoryId: raw.categoryId ?? raw.category_id ?? null,
  categoryName: raw.categoryName ?? raw.category_name ?? "未分类",
  snapshot: (raw.snapshot as Record<string, unknown>) ?? {},
  generatedAt: raw.generatedAt ?? raw.generated_at ?? new Date().toISOString(),
});

export const useDocumentationStore = defineStore("documentation", () => {
  const entries = ref<DocumentationEntry[]>([]);
  const loading = ref(false);
  const lastSyncedAt = ref<string | null>(null);
  const error = ref<string | null>(null);

  const fetchDocumentation = async (params?: {
    categoryId?: number | null;
    projectId?: number | null;
    keyword?: string;
  }) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get<ApiResponse<DocumentationListPayload | RawDocumentationEntry[]>>(
        "/documentation",
        {
          params,
        }
      );
      const payload = unwrap(response);
      const data = payload.data;
      const items = Array.isArray(data)
        ? data
        : Array.isArray(data?.entries)
        ? data.entries
        : [];
      entries.value = items.map((item) => normalizeDocumentationEntry(item));
      const generatedAt = (Array.isArray(data) ? null : data?.generatedAt ?? data?.generated_at) ?? null;
      lastSyncedAt.value = generatedAt;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "获取文档数据失败";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const regenerateDocumentation = async (subProjectIds?: number[]) => {
    await api.post<ApiResponse<null>>("/documentation/generate", { subProjectIds });
  };

  return {
    entries,
    loading,
    lastSyncedAt,
    error,
    fetchDocumentation,
    regenerateDocumentation,
  };
});
