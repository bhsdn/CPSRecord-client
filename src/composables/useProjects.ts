import { storeToRefs } from "pinia";
import { computed } from "vue";
import { useProjectsStore } from "@/stores/projects";
import { useSubProjectsStore } from "@/stores/subProjects";

export function useProjects() {
  const projectsStore = useProjectsStore();
  const subProjectsStore = useSubProjectsStore();
  const { filteredProjects, loading, searchQuery, getProjectSummary } = storeToRefs(projectsStore);
  const { subProjectStats } = storeToRefs(subProjectsStore);

  const projectStats = computed(() => ({
    totalProjects: getProjectSummary.value.total,
    lastUpdated: getProjectSummary.value.updatedAt,
    subProjectStats: subProjectStats.value,
  }));

  return {
    ...projectsStore,
    filteredProjects,
    loading,
    searchQuery,
    projectStats,
  };
}
