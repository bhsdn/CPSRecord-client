<template>
  <section class="space-y-6">
    <el-card shadow="never" body-class="space-y-4">
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 class="text-2xl font-semibold text-slate-900">项目管理</h2>
          <p class="text-sm text-slate-500">集中管理所有推广项目，快速进入子项目及内容配置</p>
        </div>
        <div class="flex items-center gap-2 text-xs text-slate-500">
          <span class="flex items-center gap-1">
            <el-icon><Collection /></el-icon>
            项目总数：{{ pagination.total }}
          </span>
          <span class="flex items-center gap-1">
            <el-icon><TrendCharts /></el-icon>
            子项目总数：{{ projectStats.subProjectStats.total }}
          </span>
          <span class="flex items-center gap-1">
            <el-icon><Tickets /></el-icon>
            文字口令：{{ projectStats.subProjectStats.commandTotal }}
          </span>
        </div>
      </div>

      <ProjectSearch v-model="searchQuery">
        <el-button type="primary" @click="openCreateDialog">
          <el-icon class="mr-1"><Plus /></el-icon>
          新建项目
        </el-button>
      </ProjectSearch>
    </el-card>

    <el-alert v-if="loadError" type="error" :closable="false" class="w-full" title="项目列表加载失败">
      <template #description>
        <div class="flex flex-col gap-2">
          <span>{{ loadError }}，请稍后重试或点击重新加载。</span>
          <div class="flex flex-wrap gap-2">
            <el-button size="small" type="primary" @click="loadProjects">重新加载</el-button>
          </div>
        </div>
      </template>
    </el-alert>

    <LoadingSpinner v-if="loading" text="项目数据加载中..." />

    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <ProjectCard
        v-for="project in filteredProjects"
        :key="project.id"
        :project="project"
        @click="goProjectDetail(project.id)"
        @edit="openEditDialog"
        @delete="confirmDelete"
      />
    </div>

    <el-empty v-if="!loading && !filteredProjects.length" description="暂无项目，点击新建项目开始管理" />
  </section>

  <el-dialog :title="dialogTitle" :model-value="dialogVisible" width="520px" @close="closeDialog">
    <ProjectForm
      :model-value="editingProject"
      :submit-text="editingProject ? '保存修改' : '创建项目'"
      :submitting="submitting"
      @submit="handleSubmit"
      @cancel="closeDialog"
    />
  </el-dialog>

  <ConfirmDialog
    :visible="deleteDialogVisible"
    title="删除项目"
    description="确定删除该项目吗？项目及其子项目将被隐藏。"
    confirm-text="确认删除"
    :loading="submitting"
    @confirm="handleDelete"
    @cancel="deleteDialogVisible = false"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { TrendCharts, Tickets, Plus, Collection } from "@element-plus/icons-vue";
import ProjectCard from "@/components/project/ProjectCard.vue";
import ProjectForm from "@/components/project/ProjectForm.vue";
import ProjectSearch from "@/components/project/ProjectSearch.vue";
import LoadingSpinner from "@/components/common/LoadingSpinner.vue";
import ConfirmDialog from "@/components/common/ConfirmDialog.vue";
import { useProjects } from "@/composables/useProjects";
import type { Project } from "@/types";

const router = useRouter();
// 通过组合式函数获取项目列表及操作方法
const { filteredProjects, fetchProjects, createProject, updateProject, deleteProject, searchQuery, loading, projectStats, pagination } =
  useProjects();

const dialogVisible = ref(false);
const deleteDialogVisible = ref(false);
const editingProject = ref<Project | null>(null);
const deletingProject = ref<Project | null>(null);
const submitting = ref(false);
const loadError = ref<string | null>(null);

const dialogTitle = computed(() => (editingProject.value ? "编辑项目" : "新建项目"));

// 打开新建弹窗
const openCreateDialog = () => {
  editingProject.value = null;
  dialogVisible.value = true;
};

// 打开编辑弹窗
const openEditDialog = (project: Project) => {
  editingProject.value = project;
  dialogVisible.value = true;
};

// 关闭弹窗并重置状态
const closeDialog = () => {
  dialogVisible.value = false;
  editingProject.value = null;
};

// 处理创建或更新项目的提交逻辑
const handleSubmit = async (payload: { name: string; description?: string | null }) => {
  submitting.value = true;
  try {
    if (editingProject.value) {
      await updateProject(editingProject.value.id, payload);
      ElMessage.success("项目更新成功");
    } else {
      await createProject(payload);
      ElMessage.success("项目创建成功");
    }
    closeDialog();
  } catch (error) {
    ElMessage.error("操作失败，请稍后重试");
  } finally {
    submitting.value = false;
  }
};

// 跳转至项目详情页
const goProjectDetail = (id: number) => {
  router.push({ name: "ProjectDetail", params: { id } });
};

// 打开删除确认弹窗
const confirmDelete = (project: Project) => {
  deletingProject.value = project;
  deleteDialogVisible.value = true;
};

// 删除项目并同步提示
const handleDelete = async () => {
  if (!deletingProject.value) return;
  submitting.value = true;
  try {
    await deleteProject(deletingProject.value.id);
    ElMessage.success("项目已删除");
  } catch (error) {
    ElMessage.error("删除失败，请重试");
  } finally {
    submitting.value = false;
    deleteDialogVisible.value = false;
    deletingProject.value = null;
  }
};

// 主动拉取项目列表，并在失败时展示错误提示
const loadProjects = async () => {
  loadError.value = null;
  try {
    await fetchProjects();
  } catch (error) {
    const message = error instanceof Error ? error.message : "获取项目列表失败";
    loadError.value = message;
    ElMessage.error(message);
  }
};

onMounted(() => {
  loadProjects();
});
</script>
