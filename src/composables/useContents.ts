import { storeToRefs } from "pinia";
import { computed } from "vue";
import { useContentsStore } from "@/stores/contents";

export function useContents(subProjectId?: number) {
  const contentsStore = useContentsStore();
  const { contentTypes, loading } = storeToRefs(contentsStore);

  const availableContentTypes = computed(() => contentTypes.value);

  const getSummary = subProjectId
    ? () => contentsStore.getContentSummary(subProjectId)
    : undefined;

  return {
    ...contentsStore,
    contentTypes: availableContentTypes,
    loading,
    getSummary,
  };
}
