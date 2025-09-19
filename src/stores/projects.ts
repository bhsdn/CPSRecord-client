import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { Project } from "@/types";
import { useAppStore } from "./app";
import { sampleProjects, sampleSubProjects } from "./sample-data";
import { useSubProjectsStore } from "./subProjects";
import { formatDate } from "@/utils/date";

export const useProjectsStore = defineStore("projects", () => {
  const projects = ref<Project[]>([...sampleProjects]);
  const loading = ref(false);
  const searchQuery = ref("");

  const filteredProjects = computed(() => {
    if (!searchQuery.value) return projects.value.filter((item) => item.isActive);
    const query = searchQuery.value.toLowerCase();
    return projects.value.filter((project) => {
      if (!project.isActive) return false;
      return (
        project.name.toLowerCase().includes(query) ||
        project.description?.toLowerCase().includes(query)
      );
    });
  });

  const getProjectById = (id: number) =>
    projects.value.find((project) => project.id === id && project.isActive);

  const fetchProjects = async () => {
    loading.value = true;
    try {
      // simulate network latency
      await new Promise((resolve) => setTimeout(resolve, 200));
      // ensure sub project counts are up to date
      const subProjectsStore = useSubProjectsStore();
      projects.value = projects.value.map((project) => ({
        ...project,
        subProjectCount: subProjectsStore
          .getSubProjectsByProjectId(project.id)
          .filter((item) => item.isActive).length,
      }));
    } finally {
      loading.value = false;
    }
  };

  const createProject = async (projectData: Pick<Project, "name" | "description">) => {
    const appStore = useAppStore();
    const subProjectsStore = useSubProjectsStore();
    const id = appStore.nextId("project");
    const now = new Date().toISOString();
    const project: Project = {
      id,
      name: projectData.name,
      description: projectData.description,
      createdAt: now,
      updatedAt: now,
      subProjectCount: 0,
      isActive: true,
    };
    projects.value.unshift(project);
    await subProjectsStore.ensureSubProjectsForProject(id);
    return project;
  };

  const updateProject = async (id: number, payload: Partial<Project>) => {
    const target = projects.value.find((project) => project.id === id);
    if (!target) throw new Error("项目不存在");
    Object.assign(target, payload, {
      updatedAt: new Date().toISOString(),
    });
    return target;
  };

  const deleteProject = async (id: number) => {
    const target = projects.value.find((project) => project.id === id);
    if (!target) throw new Error("项目不存在");
    target.isActive = false;
    target.updatedAt = new Date().toISOString();
    return target;
  };

  const importSampleData = () => {
    const subProjectsStore = useSubProjectsStore();
    subProjectsStore.replaceAll(sampleSubProjects);
    projects.value = [...sampleProjects];
  };

  const getProjectSummary = computed(() => {
    const total = projects.value.filter((item) => item.isActive).length;
    const updatedAt = projects.value
      .filter((item) => item.isActive)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]
      ?.updatedAt;
    return {
      total,
      updatedAt: updatedAt ? formatDate(updatedAt) : "",
    };
  });

  return {
    projects,
    loading,
    searchQuery,
    filteredProjects,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    getProjectById,
    importSampleData,
    getProjectSummary,
  };
});
