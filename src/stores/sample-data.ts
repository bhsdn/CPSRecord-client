import { DEFAULT_CONTENT_TYPES } from "@/utils/constants";
import type {
  ContentType,
  Project,
  ProjectCategory,
  SubProject,
  SubProjectContent,
  TextCommand,
} from "@/types";
import { calculateExpiryDate, getExpiryStatus } from "@/utils/date";

const now = new Date().toISOString();

const sampleContents: SubProjectContent[] = [
  {
    id: 1,
    subProjectId: 1,
    contentType: DEFAULT_CONTENT_TYPES[0],
    contentValue: "https://cps.example.com/short/abc123",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 2,
    subProjectId: 1,
    contentType: DEFAULT_CONTENT_TYPES[2],
    contentValue: "团购超级优惠",
    expiryDays: 7,
    expiryDate: calculateExpiryDate(7),
    expiryStatus: getExpiryStatus(calculateExpiryDate(7)),
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 3,
    subProjectId: 2,
    contentType: DEFAULT_CONTENT_TYPES[5],
    contentValue: "https://cdn.example.com/images/product.png",
    createdAt: now,
    updatedAt: now,
  },
];

const sampleCommands: TextCommand[] = [
  {
    id: 1,
    subProjectId: 1,
    commandText: "复制口令打开淘宝",
    expiryDays: 5,
    expiryDate: calculateExpiryDate(5),
    expiryStatus: getExpiryStatus(calculateExpiryDate(5)),
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 2,
    subProjectId: 2,
    commandText: "京东超值券",
    expiryDays: 2,
    expiryDate: calculateExpiryDate(2),
    expiryStatus: getExpiryStatus(calculateExpiryDate(2)),
    createdAt: now,
    updatedAt: now,
  },
];

export const sampleSubProjects: SubProject[] = [
  {
    id: 1,
    projectId: 1,
    name: "数码家电",
    description: "618 主推数码产品",
    sortOrder: 1,
    documentationEnabled: true,
    documentationGeneratedAt: now,
    contents: sampleContents.filter((content) => content.subProjectId === 1),
    textCommands: sampleCommands.filter((command) => command.subProjectId === 1),
    createdAt: now,
    updatedAt: now,
    isActive: true,
  },
  {
    id: 2,
    projectId: 1,
    name: "居家百货",
    description: "热门居家用品",
    sortOrder: 2,
    documentationEnabled: false,
    documentationGeneratedAt: null,
    contents: sampleContents.filter((content) => content.subProjectId === 2),
    textCommands: sampleCommands.filter((command) => command.subProjectId === 2),
    createdAt: now,
    updatedAt: now,
    isActive: true,
  },
  {
    id: 3,
    projectId: 2,
    name: "直播爆款",
    description: "抖音直播热销",
    sortOrder: 1,
    documentationEnabled: true,
    documentationGeneratedAt: now,
    contents: [],
    textCommands: [],
    createdAt: now,
    updatedAt: now,
    isActive: true,
  },
];

export const sampleProjectCategories: ProjectCategory[] = [
  {
    id: 1,
    name: "电商平台",
    description: "各大电商主站活动",
    sortOrder: 1,
    isActive: true,
    projectCount: 1,
  },
  {
    id: 2,
    name: "内容渠道",
    description: "达人、直播等渠道",
    sortOrder: 2,
    isActive: true,
    projectCount: 1,
  },
];

export const sampleProjects: Project[] = [
  {
    id: 1,
    name: "618 大促项目",
    description: "618 大促全渠道推广计划",
    categoryId: 1,
    category: sampleProjectCategories[0],
    subProjectCount: 2,
    documentationCount: 1,
    createdAt: now,
    updatedAt: now,
    isActive: true,
  },
  {
    id: 2,
    name: "抖音内容投放",
    description: "抖音达人合作推广",
    categoryId: 2,
    category: sampleProjectCategories[1],
    subProjectCount: 1,
    documentationCount: 1,
    createdAt: now,
    updatedAt: now,
    isActive: true,
  },
];

export const sampleContentTypes: ContentType[] = [...DEFAULT_CONTENT_TYPES];

export const sampleIdState = {
  project: sampleProjects.length,
  subProject: sampleSubProjects.length,
  content: sampleContents.length,
  command: sampleCommands.length,
  contentType: sampleContentTypes.length,
  category: sampleProjectCategories.length,
};
