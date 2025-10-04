import type { SearchParams } from "./common";

/**
 * 文档条目
 */
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

/**
 * 文档查询参数
 */
export interface QueryDocumentationParams extends SearchParams {
  categoryId?: number;
  projectId?: number;
  keyword?: string;
}

/**
 * 生成文档DTO
 */
export interface GenerateDocumentationDto {
  subProjectIds?: number[];
}

/**
 * 分组的文档数据（按分类）
 */
export interface GroupedDocumentation {
  categoryId: number | null;
  categoryName: string;
  projects: GroupedProject[];
}

/**
 * 分组的项目数据
 */
export interface GroupedProject {
  projectId: number;
  projectName: string;
  entries: DocumentationEntry[];
}
