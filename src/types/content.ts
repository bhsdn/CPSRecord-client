export type ContentFieldType = "text" | "url" | "image" | "date" | "number";

export interface ContentType {
  id: number;
  name: string;
  fieldType: ContentFieldType;
  hasExpiry: boolean;
  isSystem: boolean;
  description?: string;
}

export interface SubProjectContent {
  id: number;
  subProjectId: number;
  contentType: ContentType;
  contentValue: string;
  uploadedImageId?: number;
  uploadedImage?: {
    id: number;
    key: string;
    name: string;
    width?: number;
    height?: number;
    size: number;
    links: {
      url: string;
      thumbnail_url: string;
    };
  };
  expiryDays?: number;
  expiryDate?: string;
  expiryStatus?: "safe" | "warning" | "danger";
  showInDocumentation?: boolean; // 是否在文档中显示
  createdAt: string;
  updatedAt: string;
}

export interface TextCommand {
  id: number;
  subProjectId: number;
  commandText: string;
  expiryDays: number;
  expiryDate: string;
  expiryStatus: "safe" | "warning" | "danger";
  createdAt: string;
  updatedAt: string;
}
