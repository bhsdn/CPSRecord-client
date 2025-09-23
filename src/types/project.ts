import type { SubProjectContent, TextCommand } from "./content";

export interface Project {
  id: number;
  name: string;
  description?: string;
  subProjectCount: number;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface SubProject {
  id: number;
  projectId: number;
  name: string;
  description?: string;
  sortOrder: number;
  contents: SubProjectContent[];
  textCommands: TextCommand[];
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}
