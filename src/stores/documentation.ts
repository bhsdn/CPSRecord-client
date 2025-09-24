import { defineStore } from "pinia";
import { ref } from "vue";
import type { DocumentationEntry, SubProject } from "@/types";
import { useProjectsStore } from "@/stores/projects";
import { useSubProjectsStore } from "@/stores/subProjects";

interface DocumentationFilters {
  categoryId?: number | null;
  projectId?: number | null;
  keyword?: string;
}

const buildSnapshot = (subProject: SubProject): Record<string, unknown> => {
  const snapshot: Record<string, unknown> = {};
  subProject.contents.forEach((content) => {
    const label = content.contentType?.name || `内容 #${content.id}`;
    snapshot[label] = content.contentValue;
    if (content.expiryDate) {
      snapshot[`${label}（到期）`] = content.expiryDate;
    }
  });
  if (subProject.textCommands.length) {
    snapshot["文字口令"] = subProject.textCommands
      .map((command) =>
        command.expiryDate
          ? `${command.commandText}（有效至 ${command.expiryDate}）`
          : command.commandText
      )
      .join(" / ");
  }
  if (subProject.description) {
    snapshot["子项目描述"] = subProject.description;
  }
  return snapshot;
};

const matchKeyword = (
  subProject: SubProject,
  snapshot: Record<string, unknown>,
  keyword?: string
) => {
  const normalized = keyword?.trim().toLowerCase();
  if (!normalized) return true;
  const fields: string[] = [
    subProject.name,
    subProject.description ?? "",
    ...subProject.contents.map((item) => item.contentValue || ""),
    ...subProject.textCommands.map((item) => item.commandText || ""),
    ...Object.entries(snapshot).map(([key, value]) => `${key} ${String(value ?? "")}`),
  ];
  return fields.some((field) => field.toLowerCase().includes(normalized));
};

export const useDocumentationStore = defineStore("documentation", () => {
  const projectsStore = useProjectsStore();
  const subProjectsStore = useSubProjectsStore();

  const entries = ref<DocumentationEntry[]>([]);
  const loading = ref(false);
  const lastSyncedAt = ref<string | null>(null);
  const error = ref<string | null>(null);
  const lastFilters = ref<DocumentationFilters | null>(null);

  const ensureProjectsLoaded = async () => {
    if (!projectsStore.projects.length) {
      await projectsStore.fetchProjects({ limit: 200 });
    }
  };

  const resolveProjects = async (filters: DocumentationFilters) => {
    await ensureProjectsLoaded();
    const { categoryId = null, projectId = null } = filters;
    let candidates = projectsStore.projects.filter((project) => project.isActive);
    if (categoryId !== null) {
      candidates = candidates.filter((project) => project.categoryId === categoryId);
    }
    if (projectId !== null) {
      let target = candidates.find((project) => project.id === projectId);
      if (!target) {
        const fetched = await projectsStore.fetchProjectById(projectId);
        if (fetched && fetched.isActive) {
          target = fetched;
        }
      }
      candidates = target && target.isActive ? [target] : [];
    }
    return candidates;
  };

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
      const projects = await resolveProjects(normalizedFilters);
      if (!projects.length) {
        entries.value = [];
        lastSyncedAt.value = new Date().toISOString();
        return;
      }

      const results = await Promise.all(
        projects.map(async (project) => {
          const subProjects = await subProjectsStore.fetchSubProjectsByProject(project.id);
          return { projectId: project.id, subProjects };
        })
      );

      const documentationEntries: DocumentationEntry[] = [];

      results.forEach(({ projectId, subProjects }) => {
        const project = projectsStore.getProjectById(projectId);
        if (!project) return;
        subProjects
          .filter((subProject) => subProject.isActive && subProject.documentationEnabled)
          .forEach((subProject) => {
            const snapshot = buildSnapshot(subProject);
            if (!matchKeyword(subProject, snapshot, normalizedFilters.keyword)) {
              return;
            }
            documentationEntries.push({
              id: subProject.id,
              subProjectId: subProject.id,
              subProjectName: subProject.name,
              projectId: project.id,
              projectName: project.name,
              categoryId: project.categoryId,
              categoryName: project.category?.name ?? "未分类",
              snapshot,
              generatedAt:
                subProject.documentationGeneratedAt ?? subProject.updatedAt ?? new Date().toISOString(),
            });
          });
      });

      documentationEntries.sort((a, b) => {
        return new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime();
      });

      entries.value = documentationEntries;
      lastSyncedAt.value = new Date().toISOString();
    } catch (err) {
      error.value = err instanceof Error ? err.message : "获取文档数据失败";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const regenerateDocumentation = async (subProjectIds?: number[]) => {
    void subProjectIds;
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
