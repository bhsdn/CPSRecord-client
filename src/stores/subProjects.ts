import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { SubProject, SubProjectContent, TextCommand } from "@/types";
import { useAppStore } from "./app";
import { sampleSubProjects } from "./sample-data";
import { useProjectsStore } from "./projects";
import { calculateExpiryDate, getExpiryStatus } from "@/utils/date";

export const useSubProjectsStore = defineStore("subProjects", () => {
  const subProjects = ref<SubProject[]>([...sampleSubProjects]);
  const loading = ref(false);

  const getSubProjectsByProjectId = (projectId: number) =>
    subProjects.value
      .filter((sub) => sub.projectId === projectId && sub.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);

  const getSubProjectById = (id: number) =>
    subProjects.value.find((subProject) => subProject.id === id && subProject.isActive);

  const ensureSubProjectsForProject = async (_projectId: number) => {
    return true;
  };

  const replaceAll = (data: SubProject[]) => {
    subProjects.value = [...data];
  };

  const createSubProject = async (
    projectId: number,
    payload: Pick<SubProject, "name" | "description" | "sortOrder">
  ) => {
    const appStore = useAppStore();
    const id = appStore.nextId("subProject");
    const now = new Date().toISOString();
    const subProject: SubProject = {
      id,
      projectId,
      name: payload.name,
      description: payload.description,
      sortOrder: payload.sortOrder,
      contents: [],
      textCommands: [],
      createdAt: now,
      updatedAt: now,
      isActive: true,
    };
    subProjects.value.push(subProject);
    const projectStore = useProjectsStore();
    const project = projectStore.projects.find((item) => item.id === projectId);
    if (project) {
      project.subProjectCount = getSubProjectsByProjectId(projectId).length;
      project.updatedAt = now;
    }
    return subProject;
  };

  const updateSubProject = async (id: number, payload: Partial<SubProject>) => {
    const subProject = subProjects.value.find((item) => item.id === id);
    if (!subProject) throw new Error("子项目不存在");
    Object.assign(subProject, payload, {
      updatedAt: new Date().toISOString(),
    });
    return subProject;
  };

  const deleteSubProject = async (id: number) => {
    const subProject = subProjects.value.find((item) => item.id === id);
    if (!subProject) throw new Error("子项目不存在");
    subProject.isActive = false;
    const projectStore = useProjectsStore();
    const project = projectStore.projects.find((item) => item.id === subProject.projectId);
    if (project) {
      project.subProjectCount = getSubProjectsByProjectId(project.id).length;
      project.updatedAt = new Date().toISOString();
    }
    return subProject;
  };

  const reorderSubProjects = async (projectId: number, orderedIds: number[]) => {
    orderedIds.forEach((subProjectId, index) => {
      const subProject = subProjects.value.find((item) => item.id === subProjectId);
      if (subProject && subProject.projectId === projectId) {
        subProject.sortOrder = index + 1;
      }
    });
    return getSubProjectsByProjectId(projectId);
  };

  const addContentToSubProject = (
    subProjectId: number,
    content: Omit<SubProjectContent, "id" | "createdAt" | "updatedAt"> & {
      id?: number;
    }
  ) => {
    const subProject = subProjects.value.find((item) => item.id === subProjectId);
    if (!subProject) throw new Error("子项目不存在");
    const appStore = useAppStore();
    const now = new Date().toISOString();
    const id = content.id ?? appStore.nextId("content");
    const expiryDate =
      content.expiryDays && content.contentType.hasExpiry
        ? calculateExpiryDate(content.expiryDays)
        : content.expiryDate;
    const expiryStatus = expiryDate ? getExpiryStatus(expiryDate) : undefined;
    const newContent: SubProjectContent = {
      id,
      subProjectId,
      contentType: content.contentType,
      contentValue: content.contentValue,
      expiryDays: content.expiryDays,
      expiryDate,
      expiryStatus,
      createdAt: now,
      updatedAt: now,
    };
    const existingIndex = subProject.contents.findIndex((item) => item.id === id);
    if (existingIndex >= 0) {
      subProject.contents.splice(existingIndex, 1, newContent);
    } else {
      subProject.contents.push(newContent);
    }
    subProject.updatedAt = now;
    const projectStore = useProjectsStore();
    const project = projectStore.projects.find((item) => item.id === subProject.projectId);
    if (project) project.updatedAt = now;
    return newContent;
  };

  const removeContentFromSubProject = (subProjectId: number, contentId: number) => {
    const subProject = subProjects.value.find((item) => item.id === subProjectId);
    if (!subProject) throw new Error("子项目不存在");
    subProject.contents = subProject.contents.filter((item) => item.id !== contentId);
    subProject.updatedAt = new Date().toISOString();
  };

  const upsertTextCommand = (
    subProjectId: number,
    payload: Omit<TextCommand, "id" | "expiryDate" | "expiryStatus" | "createdAt" | "updatedAt"> & {
      id?: number;
    }
  ) => {
    const subProject = subProjects.value.find((item) => item.id === subProjectId);
    if (!subProject) throw new Error("子项目不存在");
    const appStore = useAppStore();
    const now = new Date().toISOString();
    const id = payload.id ?? appStore.nextId("command");
    const expiryDate = calculateExpiryDate(payload.expiryDays);
    const command: TextCommand = {
      id,
      subProjectId,
      commandText: payload.commandText,
      expiryDays: payload.expiryDays,
      expiryDate,
      expiryStatus: getExpiryStatus(expiryDate),
      createdAt: now,
      updatedAt: now,
    };
    const existingIndex = subProject.textCommands.findIndex((item) => item.id === id);
    if (existingIndex >= 0) {
      subProject.textCommands.splice(existingIndex, 1, command);
    } else {
      subProject.textCommands.push(command);
    }
    subProject.updatedAt = now;
    return command;
  };

  const removeTextCommand = (subProjectId: number, commandId: number) => {
    const subProject = subProjects.value.find((item) => item.id === subProjectId);
    if (!subProject) throw new Error("子项目不存在");
    subProject.textCommands = subProject.textCommands.filter((item) => item.id !== commandId);
    subProject.updatedAt = new Date().toISOString();
  };

  const subProjectStats = computed(() => {
    return subProjects.value.reduce(
      (acc, subProject) => {
        if (!subProject.isActive) return acc;
        acc.total += 1;
        acc.contentTotal += subProject.contents.length;
        acc.commandTotal += subProject.textCommands.length;
        return acc;
      },
      { total: 0, contentTotal: 0, commandTotal: 0 }
    );
  });

  return {
    subProjects,
    loading,
    getSubProjectsByProjectId,
    getSubProjectById,
    ensureSubProjectsForProject,
    replaceAll,
    createSubProject,
    updateSubProject,
    deleteSubProject,
    reorderSubProjects,
    addContentToSubProject,
    removeContentFromSubProject,
    upsertTextCommand,
    removeTextCommand,
    subProjectStats,
  };
});
