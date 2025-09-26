export interface DocumentationEntry {
  id: number;
  subProjectId: number;
  subProjectName: string;
  projectId: number;
  projectName: string;
  categoryId: number | null;
  categoryName: string;
  snapshot: Record<string, unknown>;
  generatedAt: string;
}
