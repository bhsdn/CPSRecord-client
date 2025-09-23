import { storeToRefs } from "pinia";
import { computed } from "vue";
import { useSubProjectsStore } from "@/stores/subProjects";
import { useContentsStore } from "@/stores/contents";

export function useSubProjects(projectId?: number) {
  const subProjectsStore = useSubProjectsStore();
  const contentsStore = useContentsStore();
  const { subProjects, subProjectStats } = storeToRefs(subProjectsStore);

  const subProjectList = computed(() => {
    if (!projectId) return subProjects.value.filter((item) => item.isActive);
    return subProjectsStore.getSubProjectsByProjectId(projectId);
  });

  const getSummary = (subProjectId: number) => contentsStore.getContentSummary(subProjectId);

  return {
    ...subProjectsStore,
    subProjects: subProjectList,
    stats: subProjectStats,
    getSummary,
  };
}
