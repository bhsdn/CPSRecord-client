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
  name?: string;
  description?: string;
  sub_project_id?: number;
  sub_project_name?: string;
  project_id?: number;
  project_name?: string;
  category_id?: number | null;
  category_name?: string;
  generated_at?: string;
  snapshot_json?: string | Record<string, unknown>;
  snapshotJson?: string | Record<string, unknown>;
  snapshotData?: string | Record<string, unknown>;
  project?: {
    id?: number | string;
    name?: string;
    category?: {
      id?: number | string | null;
      name?: string;
    } | null;
  } | null;
  subProject?: {
    id?: number | string;
    name?: string;
  } | null;
  category?: {
    id?: number | string | null;
    name?: string;
  } | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return !!value && typeof value === "object" && !Array.isArray(value);
};

const normalizeEntry = (raw: Partial<RawDocumentationEntry>): DocumentationEntry => {
  const project = isRecord(raw.project) ? raw.project : null;
  const subProject = isRecord(raw.subProject) ? raw.subProject : null;
  const category = isRecord(raw.category) ? raw.category : project?.category ?? null;

  const resolvedCategoryId =
    raw.categoryId ??
    raw.category_id ??
    (category && category.id !== undefined ? category.id : null);
  const categoryId =
    resolvedCategoryId === null || resolvedCategoryId === undefined || resolvedCategoryId === ""
      ? null
      : Number(resolvedCategoryId);
  const categoryName =
    raw.categoryName ??
    raw.category_name ??
    (isRecord(category) && typeof category.name === "string" ? category.name : undefined) ??
    "未分类";

  const resolvedProjectId = raw.projectId ?? raw.project_id ?? project?.id;
  const projectId = Number(resolvedProjectId ?? 0);
  const projectName =
    raw.projectName ??
    raw.project_name ??
    (typeof project?.name === "string" ? project.name : "");

  // 修改：如果 raw.id 存在且没有 subProjectId，说明后端直接返回的子项目数据（id 就是 subProjectId）
  const resolvedSubProjectId = raw.subProjectId ?? raw.sub_project_id ?? subProject?.id ?? (raw.id && !raw.subProjectId ? raw.id : undefined);
  const subProjectId = Number(resolvedSubProjectId ?? 0);
  
  // 修改：如果 raw.name 存在且没有 subProjectName，说明后端直接返回的子项目数据（name 就是 subProjectName）
  let subProjectName = raw.subProjectName ?? raw.sub_project_name;
  if (!subProjectName && typeof subProject?.name === "string") {
    subProjectName = subProject.name;
  }
  if (!subProjectName && typeof raw.name === "string" && !raw.subProjectName && !raw.sub_project_name) {
    subProjectName = raw.name;
  }
  if (!subProjectName) {
    subProjectName = "";
  }

  let rawSnapshot: unknown =
    raw.snapshot ??
    raw.snapshot_json ??
    raw.snapshotJson ??
    raw.snapshotData;

  let snapshot: Record<string, unknown> = {};
  if (isRecord(rawSnapshot)) {
    snapshot = rawSnapshot as Record<string, unknown>;
  } else if (typeof rawSnapshot === "string" && rawSnapshot.trim()) {
    try {
      snapshot = JSON.parse(rawSnapshot);
    } catch (error) {
      snapshot = { 内容: rawSnapshot };
    }
  }

  const generatedAt =
    raw.generatedAt ?? raw.generated_at ?? (subProject as { lastDocumentationAt?: string })?.lastDocumentationAt;

  return {
    id: Number(raw.id ?? 0),
    subProjectId,
    subProjectName,
    projectId,
    projectName,
    categoryId,
    categoryName,
    snapshot,
    generatedAt: generatedAt ?? new Date().toISOString(),
  };
};

const extractEntries = (data?: unknown): RawDocumentationEntry[] => {
  // 如果直接是数组，直接返回（后端直接返回数组的情况）
  if (Array.isArray(data)) return data;
  
  if (!data || typeof data !== "object") return [];
  
  const dataObj = data as Record<string, unknown>;
  
  // 如果 data.entries 是数组
  if (Array.isArray(dataObj.entries)) return dataObj.entries;
  
  // 如果 data.entries.items 是数组
  if (dataObj.entries && typeof dataObj.entries === "object") {
    const entries = dataObj.entries as Record<string, unknown>;
    if (Array.isArray(entries.items)) return entries.items;
  }
  
  // 如果 data.items 是数组
  if (Array.isArray(dataObj.items)) return dataObj.items;
  
  return [];
};

const resolveGeneratedAt = (data?: unknown, entries: DocumentationEntry[] = []) => {
  if (!data || typeof data !== "object") return null;
  
  const dataObj = data as Record<string, unknown>;
  return (
    (typeof dataObj.generatedAt === "string" ? dataObj.generatedAt : null) ??
    (typeof dataObj.lastGeneratedAt === "string" ? dataObj.lastGeneratedAt : null) ??
    (typeof dataObj.lastSyncedAt === "string" ? dataObj.lastSyncedAt : null) ??
    (typeof dataObj.syncedAt === "string" ? dataObj.syncedAt : null) ??
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

      const response = await api.get<ApiResponse<unknown>>("/documentation", {
        params,
      });
      const payload = unwrap(response);
      
      // 后端直接返回数组在 data 字段中
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

