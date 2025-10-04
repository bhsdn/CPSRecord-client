<template>
  <section class="documentation-center space-y-6">
    <!-- 页面头部 -->
    <el-card shadow="never" class="header-card">
      <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div class="header-info">
          <div class="flex items-center gap-3">
            <el-icon :size="28" class="text-primary">
              <DocumentCopy />
            </el-icon>
            <div>
              <h2 class="text-2xl font-bold text-slate-900">文档中心</h2>
              <p class="text-sm text-slate-500 mt-1">
                实时展示已开启文档的子项目内容，快速查阅推广素材
              </p>
            </div>
          </div>
        </div>
        <div class="stats-bar flex flex-wrap items-center gap-4 text-sm">
          <div class="stat-item">
            <el-icon class="text-blue-500">
              <Folder />
            </el-icon>
            <span class="ml-1 text-slate-600">分类：</span>
            <span class="font-semibold text-slate-900">{{ categoryCount }}</span>
          </div>
          <div class="stat-item">
            <el-icon class="text-green-500">
              <Collection />
            </el-icon>
            <span class="ml-1 text-slate-600">项目：</span>
            <span class="font-semibold text-slate-900">{{ projectCount }}</span>
          </div>
          <div class="stat-item">
            <el-icon class="text-purple-500">
              <Document />
            </el-icon>
            <span class="ml-1 text-slate-600">文档：</span>
            <span class="font-semibold text-slate-900">{{ entries.length }}</span>
          </div>
          <el-divider direction="vertical" />
          <div class="stat-item text-xs text-slate-500">
            <el-icon>
              <Timer />
            </el-icon>
            <span class="ml-1">最近同步：{{ lastSyncedText }}</span>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div class="flex flex-1 flex-col gap-3 lg:flex-row lg:items-center">
          <el-select v-model="filters.categoryId" placeholder="选择主项目分类" clearable class="w-full lg:w-48" @change="handleCategoryChange">
            <el-option :value="null" label="全部分类" />
            <el-option v-for="category in activeCategories" :key="category.id" :label="category.name" :value="category.id" />
          </el-select>
          <el-select v-model="filters.projectId" placeholder="选择主项目" clearable class="w-full lg:w-52" @change="handleProjectChange">
            <el-option :value="null" label="全部项目" />
            <el-option v-for="project in filteredProjects" :key="project.id" :label="project.name" :value="project.id" />
          </el-select>
          <el-input v-model="filters.keyword" placeholder="搜索子项目或内容关键字" clearable class="w-full lg:flex-1" @keyup.enter="handleSearch">
            <template #prefix>
              <el-icon>
                <Search />
              </el-icon>
            </template>
          </el-input>
        </div>
        <div class="flex flex-wrap gap-2">
          <el-button :loading="loading" type="primary" @click="handleSearch">
            <el-icon class="mr-1">
              <Search />
            </el-icon>
            查询
          </el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="success" :loading="regenerating" @click="handleRegenerate">
            <el-icon class="mr-1">
              <Refresh />
            </el-icon>
            生成文档
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 加载状态 -->
    <LoadingSpinner v-if="loading" text="正在加载文档..." />

    <!-- 空状态 -->
    <template v-else-if="!entries.length">
      <el-empty description="" class="py-12">
        <template #image>
          <el-icon :size="80" class="text-slate-300">
            <Document />
          </el-icon>
        </template>
        <template #description>
          <div class="space-y-2">
            <p class="text-base font-medium text-slate-600">暂无文档内容</p>
            <p class="text-sm text-slate-400">
              还没有子项目开启文档生成功能
            </p>
            <el-button type="primary" size="small" class="mt-3" @click="goToProjects">
              <el-icon class="mr-1">
                <Plus />
              </el-icon>
              前往开启文档
            </el-button>
          </div>
        </template>
      </el-empty>
    </template>

    <!-- 文档内容 - 三级结构展示 -->
    <div v-else class="documentation-list space-y-6">
      <!-- 分类级别 -->
      <div v-for="category in groupedEntries" :key="category.categoryId" class="category-section">
        <div class="category-header mb-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="category-icon">
                <el-icon :size="20" class="text-blue-600">
                  <Folder />
                </el-icon>
              </div>
              <div>
                <h3 class="text-lg font-bold text-slate-800">
                  {{ category.categoryName }}
                </h3>
                <p class="text-xs text-slate-500 mt-0.5">
                  {{ category.projects.length }} 个项目 ·
                  {{ category.projects.reduce((total, item) => total + item.entries.length, 0) }} 篇文档
                </p>
              </div>
            </div>
            <el-tag type="info" size="small">{{ category.categoryName }}</el-tag>
          </div>
        </div>

        <!-- 项目级别 -->
        <div class="projects-container space-y-4 ml-6">
          <el-card v-for="project in category.projects" :key="project.projectId" shadow="hover" class="project-card">
            <template #header>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <el-icon class="text-green-600">
                    <Collection />
                  </el-icon>
                  <span class="text-base font-semibold text-slate-800">
                    {{ project.projectName }}
                  </span>
                </div>
                <div class="flex items-center gap-2">
                  <el-tag type="primary" size="small">
                    {{ project.entries.length }} 个子项目
                  </el-tag>
                </div>
              </div>
            </template>

            <!-- 子项目级别 -->
            <div class="subprojects-container space-y-4">
              <div v-for="entry in project.entries" :key="entry.id" class="subproject-item">
                <div class="subproject-header">
                  <div class="flex items-start justify-between gap-3">
                    <div class="flex-1">
                      <div class="flex items-center gap-2 mb-2">
                        <el-icon class="text-purple-600">
                          <Document />
                        </el-icon>
                        <h4 class="text-base font-semibold text-slate-800">
                          {{ entry.subProjectName }}
                        </h4>
                        <el-tag type="success" size="small" effect="plain">
                          文档已生成
                        </el-tag>
                      </div>
                      <div class="flex items-center gap-3 text-xs text-slate-500">
                        <span class="flex items-center gap-1">
                          <el-icon>
                            <Clock />
                          </el-icon>
                          生成于 {{ formatDate(entry.generatedAt) }}
                        </span>
                        <el-divider direction="vertical" />
                        <span>{{ Object.keys(entry.snapshot).length }} 项内容</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 快照内容展示 -->
                <div v-if="Object.keys(entry.snapshot).length" class="snapshot-content mt-4">
                  <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div v-for="(value, key) in entry.snapshot" :key="key" class="snapshot-item">
                      <div class="flex items-start gap-2">
                        <el-icon class="text-blue-500 mt-1">
                          <Files />
                        </el-icon>
                        <div class="flex-1 min-w-0">
                          <div class="text-xs font-medium text-slate-600 mb-1">
                            {{ key }}
                          </div>
                          <div class="text-sm text-slate-800 break-all">
                            {{ formatSnapshotValue(value) }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <el-empty v-else description="该子项目暂无内容" :image-size="60" class="py-4" />
              </div>
            </div>
          </el-card>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { ElMessage } from "element-plus";
import {
  Collection,
  Document,
  DocumentCopy,
  Folder,
  Refresh,
  Search,
  Timer,
  Plus,
  Clock,
  Files,
} from "@element-plus/icons-vue";
import LoadingSpinner from "@/components/common/LoadingSpinner.vue";
import { useDocumentation } from "@/composables/useDocumentation";
import { useDateFormat } from "@/composables/useDateFormat";
import { useProjectCategoriesStore } from "@/stores/projectCategories";
import { useProjectsStore } from "@/stores/projects";

const router = useRouter();

const { formatDate } = useDateFormat();
const documentation = useDocumentation();
const projectCategoriesStore = useProjectCategoriesStore();
const projectsStore = useProjectsStore();

const {
  entries,
  loading,
  lastSyncedAt,
  groupedByCategory: groupedEntries,
  fetchDocumentation,
  regenerateDocumentation,
} = documentation;
const { activeCategories } = storeToRefs(projectCategoriesStore);
const { projects } = storeToRefs(projectsStore);

const filters = reactive<{
  categoryId: number | null;
  projectId: number | null;
  keyword: string;
}>({
  categoryId: null,
  projectId: null,
  keyword: "",
});

const regenerating = ref(false);

const lastSyncedText = computed(() => {
  if (!lastSyncedAt.value) return "尚未同步";
  return formatDate(lastSyncedAt.value);
});

// 统计信息
const categoryCount = computed(() => {
  return groupedEntries.value.length;
});

const projectCount = computed(() => {
  return groupedEntries.value.reduce((total, category) => {
    return total + category.projects.length;
  }, 0);
});

// 导航到项目列表
const goToProjects = () => {
  router.push("/projects");
};

const filteredProjects = computed(() => {
  const categoryId = filters.categoryId;
  return projects.value.filter((project) => {
    if (!project.isActive) return false;
    if (categoryId !== null && project.categoryId !== categoryId) return false;
    return true;
  });
});

const formatSnapshotValue = (value: unknown) => {
  if (value === null || value === undefined) return "--";
  if (typeof value === "object") {
    try {
      return JSON.stringify(value, null, 2);
    } catch (error) {
      return String(value);
    }
  }
  return String(value);
};

const loadDocumentation = async () => {
  try {
    await fetchDocumentation({
      categoryId: filters.categoryId ?? undefined,
      projectId: filters.projectId ?? undefined,
      keyword: filters.keyword.trim() || undefined,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "获取文档数据失败";
    ElMessage.error(message);
  }
};

const handleSearch = () => {
  loadDocumentation();
};

const handleReset = () => {
  filters.categoryId = null;
  filters.projectId = null;
  filters.keyword = "";
  loadDocumentation();
};

const handleCategoryChange = () => {
  if (filters.projectId !== null) {
    const exists = filteredProjects.value.some(
      (project) => project.id === filters.projectId
    );
    if (!exists) filters.projectId = null;
  }
  loadDocumentation();
};

const handleProjectChange = () => {
  loadDocumentation();
};

const handleRegenerate = async () => {
  regenerating.value = true;
  try {
    await regenerateDocumentation();
    ElMessage.success("文档生成任务已提交");
  } catch (error) {
    const message = error instanceof Error ? error.message : "生成文档失败";
    ElMessage.error(message);
  } finally {
    regenerating.value = false;
  }
};

onMounted(async () => {
  try {
    await Promise.allSettled([
      projectCategoriesStore.fetchCategories(),
      projectsStore.fetchProjects({ limit: 100 }),
    ]);
  } catch (error) {
    // 忽略单独的异常，错误会在各自的方法中提示
  } finally {
    await loadDocumentation();
  }
});
</script>

<style scoped>
.documentation-center {
  min-height: calc(100vh - 120px);
}

/* 头部卡片 */
.header-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
}

.header-card :deep(.el-card__body) {
  padding: 1.5rem;
}

.header-info h2,
.header-info p {
  color: white;
}

.stats-bar .stat-item {
  display: flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.stats-bar .el-icon {
  font-size: 16px;
}

.stats-bar .el-divider {
  background-color: rgba(255, 255, 255, 0.3);
}

/* 分类区域 */
.category-section {
  animation: fadeInUp 0.5s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.category-header {
  padding: 1rem;
  background: linear-gradient(to right, #f8fafc, #f1f5f9);
  border-left: 4px solid #3b82f6;
  border-radius: 0.5rem;
}

.category-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: #eff6ff;
  border-radius: 0.5rem;
}

/* 项目卡片 */
.project-card {
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
}

.project-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
}

.project-card :deep(.el-card__header) {
  background: #f8fafc;
  border-bottom: 2px solid #e2e8f0;
  padding: 1rem 1.25rem;
}

/* 子项目 */
.subprojects-container {
  padding: 0.5rem 0;
}

.subproject-item {
  padding: 1.25rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  transition: all 0.3s ease;
}

.subproject-item:hover {
  background: #f8fafc;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transform: translateY(-2px);
}

.subproject-header {
  padding-bottom: 0.75rem;
  border-bottom: 1px dashed #e2e8f0;
}

/* 快照内容 */
.snapshot-content {
  padding-top: 1rem;
}

.snapshot-item {
  padding: 0.875rem;
  background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
}

.snapshot-item:hover {
  background: white;
  border-color: #3b82f6;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.1);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .header-card :deep(.el-card__body) {
    padding: 1rem;
  }

  .stats-bar {
    flex-direction: column;
    align-items: flex-start !important;
    gap: 0.5rem;
  }

  .stats-bar .el-divider {
    display: none;
  }

  .category-header {
    padding: 0.75rem;
  }

  .projects-container {
    margin-left: 0 !important;
  }

  .subproject-item {
    padding: 1rem;
  }

  .snapshot-content .grid {
    grid-template-columns: 1fr !important;
  }
}

/* 空状态美化 */
:deep(.el-empty__description p) {
  margin: 0;
}

/* 加载动画 */
.documentation-list {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
