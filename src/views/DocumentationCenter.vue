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
              <p class="text-sm text-slate-500 mt-1">概览管理已开启文档的子项目，支持批量操作</p>
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
          <el-select
            v-model="filters.categoryId"
            placeholder="选择主项目分类"
            clearable
            class="w-full lg:w-48"
            @change="handleCategoryChange"
          >
            <el-option :value="null" label="全部分类" />
            <el-option
              v-for="category in activeCategories"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            />
          </el-select>
          <el-select
            v-model="filters.projectId"
            placeholder="选择主项目"
            clearable
            class="w-full lg:w-52"
            @change="handleProjectChange"
          >
            <el-option :value="null" label="全部项目" />
            <el-option
              v-for="project in filteredProjects"
              :key="project.id"
              :label="project.name"
              :value="project.id"
            />
          </el-select>
          <el-input
            v-model="filters.keyword"
            placeholder="搜索子项目名称"
            clearable
            class="w-full lg:flex-1"
            @keyup.enter="handleSearch"
          >
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

    <!-- 批量操作栏 -->
    <el-card v-if="entries.length" shadow="never" class="batch-operations-card">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center gap-3">
          <el-checkbox v-model="selectAll" :indeterminate="isIndeterminate" @change="handleSelectAll">全选</el-checkbox>
          <span class="text-sm text-slate-500">已选择 {{ selectedEntries.length }} / {{ entries.length }} 个文档</span>
        </div>
        <div class="flex gap-2">
          <el-button
            :disabled="!selectedEntries.length"
            :loading="batchDisabling"
            type="warning"
            size="small"
            @click="handleBatchDisableDocumentation"
          >
            <el-icon class="mr-1">
              <Close />
            </el-icon>
            批量关闭文档 ({{ selectedEntries.length }})
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
            <p class="text-sm text-slate-400">还没有子项目开启文档生成功能</p>
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

    <!-- 文档概览 - 卡片网格布局 -->
    <div v-else class="documentation-overview">
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <el-card
          v-for="entry in entries"
          :key="entry.id"
          shadow="hover"
          class="documentation-card"
          :class="{ selected: selectedEntries.includes(entry.id) }"
        >
          <template #header>
            <div class="flex items-center justify-between">
              <el-checkbox
                :model-value="selectedEntries.includes(entry.id)"
                @change="(checked: boolean) => handleSelectEntry(entry.id, checked)"
              />
              <el-tag type="success" size="small" effect="plain">文档已启用</el-tag>
            </div>
          </template>

          <div class="space-y-3">
            <!-- 子项目名称 -->
            <div>
              <h4 class="text-lg font-semibold text-slate-800 mb-1 line-clamp-2">
                {{ entry.subProjectName }}
              </h4>
              <div class="flex items-center gap-1 text-xs text-slate-500">
                <el-icon class="text-blue-500">
                  <Folder />
                </el-icon>
                <span>{{ entry.categoryName }}</span>
                <el-divider direction="vertical" />
                <el-icon class="text-green-500">
                  <Collection />
                </el-icon>
                <span>{{ entry.projectName }}</span>
              </div>
            </div>

            <!-- 文档信息 -->
            <div class="space-y-2">
              <div class="flex items-center justify-between text-sm">
                <span class="text-slate-600">内容数量：</span>
                <span class="font-medium text-slate-800">{{ Object.keys(entry.snapshot).length }} 项</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-slate-600">生成时间：</span>
                <span class="font-medium text-slate-800">{{ formatDate(entry.generatedAt) }}</span>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="flex gap-2 pt-2 border-t border-slate-100">
              <el-button
                type="primary"
                size="small"
                text
                @click="handleViewProject(entry.projectId, entry.subProjectId)"
              >
                <el-icon class="mr-1">
                  <View />
                </el-icon>
                查看详情
              </el-button>
              <el-button
                type="warning"
                size="small"
                text
                :loading="disablingEntries.includes(entry.id)"
                @click="handleDisableDocumentation(entry)"
              >
                <el-icon class="mr-1">
                  <Close />
                </el-icon>
                关闭文档
              </el-button>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Collection,
  Document,
  DocumentCopy,
  Folder,
  Refresh,
  Search,
  Timer,
  Plus,
  Close,
  View,
} from '@element-plus/icons-vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import { useDocumentation } from '@/composables/useDocumentation';
import { useDateFormat } from '@/composables/useDateFormat';
import { useProjectCategoriesStore } from '@/stores/projectCategories';
import { useProjectsStore } from '@/stores/projects';
import { useSubProjectsStore } from '@/stores/subProjects';
import type { DocumentationEntry } from '@/types';

const router = useRouter();

const { formatDate } = useDateFormat();
const documentation = useDocumentation();
const projectCategoriesStore = useProjectCategoriesStore();
const projectsStore = useProjectsStore();
const subProjectsStore = useSubProjectsStore();

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
  keyword: '',
});

const regenerating = ref(false);

// 批量选择状态
const selectedEntries = ref<number[]>([]);
const batchDisabling = ref(false);
const disablingEntries = ref<number[]>([]);

// 全选状态
const selectAll = computed({
  get: () => selectedEntries.value.length === entries.value.length && entries.value.length > 0,
  set: (value: boolean) => {
    if (value) {
      selectedEntries.value = entries.value.map(entry => entry.id);
    } else {
      selectedEntries.value = [];
    }
  },
});

const isIndeterminate = computed(
  () => selectedEntries.value.length > 0 && selectedEntries.value.length < entries.value.length
);

const lastSyncedText = computed(() => {
  if (!lastSyncedAt.value) return '尚未同步';
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
  router.push('/projects');
};

const filteredProjects = computed(() => {
  const categoryId = filters.categoryId;
  return projects.value.filter(project => {
    if (!project.isActive) return false;
    if (categoryId !== null && project.categoryId !== categoryId) return false;
    return true;
  });
});

// 批量选择处理
const handleSelectAll = (value: boolean) => {
  selectAll.value = value;
};

const handleSelectEntry = (entryId: number, checked: boolean) => {
  if (checked) {
    if (!selectedEntries.value.includes(entryId)) {
      selectedEntries.value.push(entryId);
    }
  } else {
    const index = selectedEntries.value.indexOf(entryId);
    if (index > -1) {
      selectedEntries.value.splice(index, 1);
    }
  }
};

// 导航到项目详情
const handleViewProject = (projectId: number, subProjectId: number) => {
  router.push(`/projects/${projectId}/subprojects/${subProjectId}`);
};

// 单个关闭文档
const handleDisableDocumentation = async (entry: DocumentationEntry) => {
  try {
    await ElMessageBox.confirm(`确定要关闭子项目 "${entry.subProjectName}" 的文档功能吗？`, '关闭文档确认', {
      confirmButtonText: '确定关闭',
      cancelButtonText: '取消',
      type: 'warning',
    });

    disablingEntries.value.push(entry.id);

    await subProjectsStore.updateSubProject(entry.subProjectId, {
      documentationEnabled: false,
    });

    ElMessage.success('文档功能已关闭');
    await loadDocumentation();

    // 从选中列表中移除
    const index = selectedEntries.value.indexOf(entry.id);
    if (index > -1) {
      selectedEntries.value.splice(index, 1);
    }
  } catch (error) {
    if (error !== 'cancel') {
      const message = error instanceof Error ? error.message : '关闭文档功能失败';
      ElMessage.error(message);
    }
  } finally {
    const index = disablingEntries.value.indexOf(entry.id);
    if (index > -1) {
      disablingEntries.value.splice(index, 1);
    }
  }
};

// 批量关闭文档
const handleBatchDisableDocumentation = async () => {
  if (!selectedEntries.value.length) return;

  try {
    const selectedNames = entries.value
      .filter(entry => selectedEntries.value.includes(entry.id))
      .map(entry => entry.subProjectName);

    await ElMessageBox.confirm(
      `确定要关闭以下 ${selectedEntries.value.length} 个子项目的文档功能吗？\n\n${selectedNames.join('\n')}`,
      '批量关闭文档确认',
      {
        confirmButtonText: '确定关闭',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );

    batchDisabling.value = true;

    // 获取需要更新的子项目ID
    const subProjectIds = entries.value
      .filter(entry => selectedEntries.value.includes(entry.id))
      .map(entry => entry.subProjectId);

    // 批量更新子项目
    const updatePromises = subProjectIds.map(subProjectId =>
      subProjectsStore.updateSubProject(subProjectId, { documentationEnabled: false })
    );

    await Promise.all(updatePromises);

    ElMessage.success(`已成功关闭 ${selectedEntries.value.length} 个子项目的文档功能`);
    selectedEntries.value = [];
    await loadDocumentation();
  } catch (error) {
    if (error !== 'cancel') {
      const message = error instanceof Error ? error.message : '批量关闭文档功能失败';
      ElMessage.error(message);
    }
  } finally {
    batchDisabling.value = false;
  }
};

const loadDocumentation = async () => {
  try {
    await fetchDocumentation({
      categoryId: filters.categoryId ?? undefined,
      projectId: filters.projectId ?? undefined,
      keyword: filters.keyword.trim() || undefined,
    });
    // 清空选中状态
    selectedEntries.value = [];
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取文档数据失败';
    ElMessage.error(message);
  }
};

const handleSearch = () => {
  loadDocumentation();
};

const handleReset = () => {
  filters.categoryId = null;
  filters.projectId = null;
  filters.keyword = '';
  loadDocumentation();
};

const handleCategoryChange = () => {
  if (filters.projectId !== null) {
    const exists = filteredProjects.value.some(project => project.id === filters.projectId);
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
    ElMessage.success('文档生成任务已提交');
  } catch (error) {
    const message = error instanceof Error ? error.message : '生成文档失败';
    ElMessage.error(message);
  } finally {
    regenerating.value = false;
  }
};

onMounted(async () => {
  try {
    await Promise.allSettled([projectCategoriesStore.fetchCategories(), projectsStore.fetchProjects({ limit: 100 })]);
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
.header-card,
.batch-operations-card {
  background: white;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.header-card :deep(.el-card__body),
.batch-operations-card :deep(.el-card__body) {
  padding: 1.5rem;
}

.batch-operations-card {
  border-color: #f59e0b;
  background: #fffbeb;
}

.stats-bar .stat-item {
  display: flex;
  align-items: center;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
}

.stats-bar .el-icon {
  font-size: 16px;
}

.stats-bar .el-divider {
  background-color: #d1d5db;
}

/* 文档概览 */
.documentation-overview {
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

/* 文档卡片 */
.documentation-card {
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
  position: relative;
}

.documentation-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
  transform: translateY(-2px);
}

.documentation-card.selected {
  border-color: #f59e0b;
  background: #fffbeb;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.1);
}

.documentation-card :deep(.el-card__header) {
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  padding: 0.75rem 1rem;
}

.documentation-card.selected :deep(.el-card__header) {
  background: #fef3c7;
  border-bottom-color: #f59e0b;
}

.documentation-card :deep(.el-card__body) {
  padding: 1rem;
}

/* 文本截断样式 */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .header-card :deep(.el-card__body),
  .batch-operations-card :deep(.el-card__body) {
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

  .documentation-overview .grid {
    grid-template-columns: 1fr !important;
  }
}

/* 空状态美化 */
:deep(.el-empty__description p) {
  margin: 0;
}

/* 加载动画 */
.documentation-overview {
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
