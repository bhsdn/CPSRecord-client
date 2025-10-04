import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useDocumentationStore } from "@/stores/documentation";
import type { DocumentationEntry } from "@/types";

export function useDocumentation() {
  const documentationStore = useDocumentationStore();
  const { entries, loading, lastSyncedAt, error } = storeToRefs(documentationStore);

  const groupedByCategory = computed(() => {
    const map = new Map<
      number,
      {
        categoryName: string;
        projects: Map<
          number,
          {
            projectName: string;
            entries: DocumentationEntry[];
          }
        >;
      }
    >();

    entries.value.forEach((entry) => {
      const categoryKey = entry.categoryId ?? -1;
      if (!map.has(categoryKey)) {
        map.set(categoryKey, {
          categoryName: entry.categoryName || "未分类",
          projects: new Map(),
        });
      }
      const categoryGroup = map.get(categoryKey)!;
      if (!categoryGroup.projects.has(entry.projectId)) {
        categoryGroup.projects.set(entry.projectId, {
          projectName: entry.projectName,
          entries: [],
        });
      }
      categoryGroup.projects.get(entry.projectId)!.entries.push(entry);
    });

    return Array.from(map.entries()).map(([categoryId, value]) => ({
      categoryId,
      categoryName: value.categoryName,
      projects: Array.from(value.projects.entries()).map(([projectId, project]) => ({
        projectId,
        projectName: project.projectName,
        entries: project.entries,
      })),
    }));
  });

  return {
    entries,
    loading,
    lastSyncedAt,
    error,
    groupedByCategory,
    fetchDocumentation: documentationStore.fetchDocumentation,
    regenerateDocumentation: documentationStore.regenerateDocumentation,
  };
}
