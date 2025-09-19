import { defineStore } from "pinia";
import { reactive } from "vue";
import { sampleIdState } from "./sample-data";

interface IdState {
  project: number;
  subProject: number;
  content: number;
  command: number;
  contentType: number;
}

export const useAppStore = defineStore("app", () => {
  const idState = reactive<IdState>({ ...sampleIdState });
  const loadingStack = reactive(new Set<string>());

  const nextId = (key: keyof IdState) => {
    idState[key] += 1;
    return idState[key];
  };

  const startLoading = (key: string) => {
    loadingStack.add(key);
  };

  const stopLoading = (key: string) => {
    loadingStack.delete(key);
  };

  const isLoading = (key?: string) => {
    if (key) return loadingStack.has(key);
    return loadingStack.size > 0;
  };

  return {
    idState,
    nextId,
    startLoading,
    stopLoading,
    isLoading,
  };
});
