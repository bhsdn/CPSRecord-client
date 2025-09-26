import { defineStore } from "pinia";
import { ref } from "vue";
import type { DocumentationEntry } from "@/types";
import type { ApiResponse } from "@/types/api";
import { api, unwrap } from "@/utils/api";

interface DocumentationFilters {
  categoryId?: number | null;
  projectId?: number | null;
  keyword?: string;
}

type RawDocumentationEntry = DocumentationEntry & {
  sub_project_id?: number;
  sub_project_name?: string;
  project_id?: number;
  project_name?: string;
  category_id?: number | null;
  category_name?: string;
  generated_at?: string;
  snapshot_json?: string | Record<string, unknown>;
};

interface DocumentationListApiData {
  entries?: RawDocumentationEntry[] | { items?: RawDocumentationEntry[] };
  generatedAt?: string | null;
  lastGeneratedAt?: string | null;
  lastSyncedAt?: string | null;
  syncedAt?: string | null;
}

const normalizeEntry = (raw: Partial<RawDocumentationEntry>): DocumentationEntry => {
  const resolvedCategoryId = raw.categoryId ?? raw.category_id;
  const categoryId =
    resolvedCategoryId === null || resolvedCategoryId === undefined
      ? null
      : Number(resolvedCategoryId);
  const categoryName = raw.categoryName ?? raw.category_name ?? "未分类";

  const rawSnapshot =
    raw.snapshot ?? raw.snapshot_json ?? (raw as { snapshotJson?: unknown }).snapshotJson;
  let snapshot: Record<string, unknown> = {};
  if (rawSnapshot && typeof rawSnapshot === "object") {
    snapshot = rawSnapshot as Record<string, unknown>;
  } else if (typeof rawSnapshot === "string" && rawSnapshot.trim()) {
    try {
      snapshot = JSON.parse(rawSnapshot);
    } catch (error) {
      snapshot = { 内容: rawSnapshot };
    }
  }

  return {
    id: Number(raw.id ?? 0),
    subProjectId: Number(raw.subProjectId ?? raw.sub_project_id ?? 0),
    subProjectName: raw.subProjectName ?? raw.sub_project_name ?? "",
    projectId: Number(raw.projectId ?? raw.project_id ?? 0),
    projectName: raw.projectName ?? raw.project_name ?? "",
    categoryId,
    categoryName,
    snapshot,
    generatedAt: raw.generatedAt ?? raw.generated_at ?? new Date().toISOString(),
  };
};

const extractEntries = (data?: DocumentationListApiData): RawDocumentationEntry[] => {
  if (!data) return [];
  if (Array.isArray(data.entries)) return data.entries;
  if (data.entries && typeof data.entries === "object") {
    const maybeItems = (data.entries as { items?: RawDocumentationEntry[] }).items;
    if (Array.isArray(maybeItems)) return maybeItems;
  }
  if (Array.isArray((data as unknown as { items?: RawDocumentationEntry[] }).items)) {
    return (data as unknown as { items?: RawDocumentationEntry[] }).items ?? [];
  }
  return [];
};

const resolveGeneratedAt = (data?: DocumentationListApiData, entries: DocumentationEntry[] = []) => {
  return (
    data?.generatedAt ??
    data?.lastGeneratedAt ??
    data?.lastSyncedAt ??
    data?.syncedAt ??
    entries[0]?.generatedAt ??
    null
  );
};

export const useDocumentationStore = defineStore("documentation", () => {
  const entries = ref<DocumentationEntry[]>([]);
  const loading = ref(false);
  const lastSyncedAt = ref<string | null>(null);
  const error = ref<string | null>(null);
  const lastFilters = ref<DocumentationFilters | null>(null);

  const fetchDocumentation = async (filters?: DocumentationFilters) => {
    const normalizedFilters: DocumentationFilters = {
      categoryId: filters?.categoryId ?? null,
      projectId: filters?.projectId ?? null,
      keyword: filters?.keyword?.trim() || "",
    };
    loading.value = true;
    error.value = null;
    lastFilters.value = normalizedFilters;

    try {
      const params: Record<string, number | string> = {};
      if (normalizedFilters.categoryId !== null) {
        params.categoryId = normalizedFilters.categoryId;
      }
      if (normalizedFilters.projectId !== null) {
        params.projectId = normalizedFilters.projectId;
      }
      if (normalizedFilters.keyword) {
        params.keyword = normalizedFilters.keyword;
      }

      const response = await api.get<ApiResponse<DocumentationListApiData>>("/documentation", {
        params,
      });
      const payload = unwrap(response);
      const rawEntries = extractEntries(payload.data);
      const documentationEntries = rawEntries
        .map((item) => normalizeEntry(item))
        .sort(
          (a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
        );

      entries.value = documentationEntries;
      lastSyncedAt.value = resolveGeneratedAt(payload.data, documentationEntries);
    } catch (err) {
      error.value = err instanceof Error ? err.message : "获取文档数据失败";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const regenerateDocumentation = async (subProjectIds?: number[]) => {
    await api.post<ApiResponse<unknown>>("/documentation/generate", {
      subProjectIds: subProjectIds?.length ? subProjectIds : undefined,
    });
    await fetchDocumentation(lastFilters.value ?? undefined);
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
