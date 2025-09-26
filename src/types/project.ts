import type { SubProjectContent, TextCommand } from "./content";

export interface ProjectCategory {
  id: number;
  name: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  projectCount?: number;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  categoryId: number | null;
  category?: ProjectCategory;
  subProjectCount: number;
  documentationCount: number;
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
  documentationEnabled: boolean;
  documentationGeneratedAt?: string | null;
  contents: SubProjectContent[];
  textCommands: TextCommand[];
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}
