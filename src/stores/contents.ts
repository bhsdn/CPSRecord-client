import { defineStore } from "pinia";
import { ref } from "vue";
import type { ContentType } from "@/types";
import { sampleContentTypes } from "./sample-data";
import { useAppStore } from "./app";
import { useSubProjectsStore } from "./subProjects";
import { getExpiryStatus } from "@/utils/date";

export const useContentsStore = defineStore("contents", () => {
  const contentTypes = ref<ContentType[]>([...sampleContentTypes]);
  const loading = ref(false);

  const fetchContentTypes = async () => {
    loading.value = true;
    try {
      await new Promise((resolve) => setTimeout(resolve, 100));
    } finally {
      loading.value = false;
    }
  };

  const createContentType = async (
    payload: Pick<ContentType, "name" | "fieldType" | "hasExpiry" | "description">
  ) => {
    const appStore = useAppStore();
    const id = appStore.nextId("contentType");
    const contentType: ContentType = {
      id,
      name: payload.name,
      fieldType: payload.fieldType,
      hasExpiry: payload.hasExpiry,
      description: payload.description,
      isSystem: false,
    };
    contentTypes.value.push(contentType);
    return contentType;
  };

  const updateContentType = async (id: number, payload: Partial<ContentType>) => {
    const contentType = contentTypes.value.find((item) => item.id === id);
    if (!contentType) throw new Error("内容类型不存在");
    Object.assign(contentType, payload);
    return contentType;
  };

  const deleteContentType = async (id: number) => {
    const contentType = contentTypes.value.find((item) => item.id === id);
    if (!contentType) throw new Error("内容类型不存在");
    if (contentType.isSystem) {
      throw new Error("系统内容类型不可删除");
    }
    contentTypes.value = contentTypes.value.filter((item) => item.id !== id);
  };

  const addContent = async (
    subProjectId: number,
    payload: {
      contentTypeId: number;
      contentValue: string;
      expiryDays?: number;
    }
  ) => {
    const subProjectsStore = useSubProjectsStore();
    const contentType = contentTypes.value.find((item) => item.id === payload.contentTypeId);
    if (!contentType) throw new Error("内容类型不存在");
    return subProjectsStore.addContentToSubProject(subProjectId, {
      contentType,
      contentValue: payload.contentValue,
      expiryDays: payload.expiryDays,
    });
  };

  const updateContent = async (
    subProjectId: number,
    contentId: number,
    payload: {
      contentTypeId: number;
      contentValue: string;
      expiryDays?: number;
    }
  ) => {
    const subProjectsStore = useSubProjectsStore();
    const contentType = contentTypes.value.find((item) => item.id === payload.contentTypeId);
    if (!contentType) throw new Error("内容类型不存在");
    return subProjectsStore.addContentToSubProject(subProjectId, {
      id: contentId,
      contentType,
      contentValue: payload.contentValue,
      expiryDays: payload.expiryDays,
    });
  };

  const removeContent = async (subProjectId: number, contentId: number) => {
    const subProjectsStore = useSubProjectsStore();
    return subProjectsStore.removeContentFromSubProject(subProjectId, contentId);
  };

  const addTextCommand = async (
    subProjectId: number,
    payload: { commandText: string; expiryDays: number }
  ) => {
    const subProjectsStore = useSubProjectsStore();
    return subProjectsStore.upsertTextCommand(subProjectId, payload);
  };

  const updateTextCommand = async (
    subProjectId: number,
    commandId: number,
    payload: { commandText: string; expiryDays: number }
  ) => {
    const subProjectsStore = useSubProjectsStore();
    return subProjectsStore.upsertTextCommand(subProjectId, {
      id: commandId,
      ...payload,
    });
  };

  const removeTextCommand = async (subProjectId: number, commandId: number) => {
    const subProjectsStore = useSubProjectsStore();
    return subProjectsStore.removeTextCommand(subProjectId, commandId);
  };

  const getContentSummary = (subProjectId: number) => {
    const subProjectsStore = useSubProjectsStore();
    const subProject = subProjectsStore.getSubProjectById(subProjectId);
    if (!subProject) return { total: 0, expiringSoon: 0 };
    const expiringSoon = subProject.contents.filter((content) =>
      content.expiryDate ? getExpiryStatus(content.expiryDate) !== "safe" : false
    ).length;
    return {
      total: subProject.contents.length,
      expiringSoon,
    };
  };

  return {
    contentTypes,
    loading,
    fetchContentTypes,
    createContentType,
    updateContentType,
    deleteContentType,
    addContent,
    updateContent,
    removeContent,
    addTextCommand,
    updateTextCommand,
    removeTextCommand,
    getContentSummary,
  };
});
