<template>
  <section class="space-y-6">
    <el-card shadow="never" body-class="space-y-4">
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 class="text-2xl font-semibold text-slate-900">文档中心</h2>
          <p class="text-sm text-slate-500">展示已开启文档生成的子项目，便于快速查阅推广内容摘要</p>
        </div>
        <div class="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span class="flex items-center gap-1">
            <el-icon><DocumentCopy /></el-icon>
            文档总数：{{ entries.length }}
          </span>
          <span class="flex items-center gap-1">
            <el-icon><Timer /></el-icon>
            最近同步：{{ lastSyncedText }}
          </span>
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
            placeholder="搜索子项目或内容关键字"
            clearable
            class="w-full lg:flex-1"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
        <div class="flex flex-wrap gap-2">
          <el-button :loading="loading" type="primary" @click="handleSearch">
            <el-icon class="mr-1"><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="success" :loading="regenerating" @click="handleRegenerate">
            <el-icon class="mr-1"><Refresh /></el-icon>
            生成文档
          </el-button>
        </div>
      </div>
    </el-card>

    <LoadingSpinner v-if="loading" text="文档加载中..." />
    <template v-else>
      <el-empty
        v-if="!entries.length"
        description="暂无已开启文档生成的子项目，前往子项目开启文档开关后可在此查看"
      />
      <div v-else class="space-y-4">
        <el-card
          v-for="category in groupedEntries"
          :key="category.categoryId"
          shadow="never"
          body-class="space-y-4"
        >
          <template #header>
            <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div class="flex items-center gap-2 text-base font-semibold text-slate-800">
                <el-icon><Collection /></el-icon>
                {{ category.categoryName }}
              </div>
              <span class="text-xs text-slate-500">
                共 {{ category.projects.reduce((total, item) => total + item.entries.length, 0) }} 篇文档
              </span>
            </div>
          </template>

          <div class="space-y-4">
            <el-card
              v-for="project in category.projects"
              :key="project.projectId"
              shadow="never"
              body-class="space-y-3 border border-slate-200 rounded-lg"
            >
              <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <h3 class="text-sm font-semibold text-slate-800">{{ project.projectName }}</h3>
                <el-tag type="primary" size="small">子项目 {{ project.entries.length }}</el-tag>
              </div>

              <div class="space-y-3">
                <div
                  v-for="entry in project.entries"
                  :key="entry.id"
                  class="rounded-lg border border-slate-200 bg-white p-4"
                >
                  <div class="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h4 class="text-base font-semibold text-slate-800">{{ entry.subProjectName }}</h4>
                      <p class="text-xs text-slate-500">生成于 {{ formatDate(entry.generatedAt) }}</p>
                    </div>
                    <el-tag type="success" size="small">已启用</el-tag>
                  </div>

                  <div
                    v-if="Object.keys(entry.snapshot).length"
                    class="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3"
                  >
                    <div
                      v-for="(value, key) in entry.snapshot"
                      :key="key"
                      class="flex flex-col rounded border border-slate-100 bg-slate-50 p-3"
                    >
                      <span class="text-xs font-medium text-slate-500">{{ key }}</span>
                      <span class="break-words text-sm text-slate-700">{{ formatSnapshotValue(value) }}</span>
                    </div>
                  </div>
                  <p v-else class="mt-3 text-sm text-slate-500">暂无快照内容</p>
                </div>
              </div>
            </el-card>
          </div>
        </el-card>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { storeToRefs } from "pinia";
import { ElMessage } from "element-plus";
import { Collection, DocumentCopy, Refresh, Search, Timer } from "@element-plus/icons-vue";
import LoadingSpinner from "@/components/common/LoadingSpinner.vue";
import { useDocumentation } from "@/composables/useDocumentation";
import { useDateFormat } from "@/composables/useDateFormat";
import { useProjectCategoriesStore } from "@/stores/projectCategories";
import { useProjectsStore } from "@/stores/projects";

const { formatDate } = useDateFormat();
const documentation = useDocumentation();
const projectCategoriesStore = useProjectCategoriesStore();
const projectsStore = useProjectsStore();

const { entries, loading, lastSyncedAt, groupedByCategory: groupedEntries, fetchDocumentation, regenerateDocumentation } =
  documentation;
const { activeCategories } = storeToRefs(projectCategoriesStore);
const { projects } = storeToRefs(projectsStore);

const filters = reactive<{ categoryId: number | null; projectId: number | null; keyword: string }>({
  categoryId: null,
  projectId: null,
  keyword: "",
});

const regenerating = ref(false);

const lastSyncedText = computed(() => {
  if (!lastSyncedAt.value) return "尚未同步";
  return formatDate(lastSyncedAt.value);
});

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
    const exists = filteredProjects.value.some((project) => project.id === filters.projectId);
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
    ElMessage.success("已提交文档生成任务");
    await loadDocumentation();
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
      projectsStore.fetchProjects({ limit: 200 }),
    ]);
  } catch (error) {
    // 忽略单独的异常，错误会在各自的方法中提示
  } finally {
    await loadDocumentation();
  }
});
</script>
