<template>
  <section class="space-y-6">
    <el-card shadow="never">
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 class="text-2xl font-semibold text-slate-900">项目分类管理</h2>
          <p class="text-sm text-slate-500">管理项目分类，支持分类的创建、编辑、排序和启停</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <el-radio-group v-model="statusFilter" size="small">
            <el-radio-button value="all">全部 ({{ categories.length }})</el-radio-button>
            <el-radio-button value="active">已启用 ({{ activeCount }})</el-radio-button>
            <el-radio-button value="inactive">已停用 ({{ inactiveCount }})</el-radio-button>
          </el-radio-group>
          <el-button type="primary" @click="openCreateDialog">
            <el-icon class="mr-1">
              <Plus />
            </el-icon>
            新建分类
          </el-button>
        </div>
      </div>
    </el-card>

    <el-alert v-if="loadError" type="error" :closable="false" class="w-full" title="分类列表加载失败">
      <template #description>
        <div class="flex flex-col gap-2">
          <span>{{ loadError }}，请稍后重试或点击重新加载。</span>
          <div class="flex flex-wrap gap-2">
            <el-button size="small" type="primary" @click="loadCategories">重新加载</el-button>
          </div>
        </div>
      </template>
    </el-alert>

    <LoadingSpinner v-if="loading" text="分类数据加载中..." />

    <div v-else-if="sortedCategories.length" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <ProjectCategoryCard
        v-for="category in sortedCategories"
        :key="category.id"
        :category="category"
        @edit="openEditDialog"
        @delete="confirmDelete"
        @toggle="handleToggle"
      />
    </div>

    <el-empty v-else :description="emptyDescription" />
  </section>

  <el-dialog :title="dialogTitle" :model-value="dialogVisible" width="520px" @close="closeDialog">
    <ProjectCategoryForm
      :model-value="editingCategory"
      :submit-text="editingCategory ? '保存修改' : '创建分类'"
      :submitting="submitting"
      @submit="handleSubmit"
      @cancel="closeDialog"
    />
  </el-dialog>

  <ConfirmDialog
    :visible="deleteDialogVisible"
    title="删除分类"
    :description="deleteConfirmText"
    confirm-text="确认删除"
    :loading="submitting"
    @confirm="handleDelete"
    @cancel="deleteDialogVisible = false"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { ElMessage } from 'element-plus';
import { Plus, Collection } from '@element-plus/icons-vue';
import ProjectCategoryCard from '@/components/projectCategory/ProjectCategoryCard.vue';
import ProjectCategoryForm from '@/components/projectCategory/ProjectCategoryForm.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
import { useProjectCategoriesStore } from '@/stores/projectCategories';
import type { ProjectCategory } from '@/types';

const projectCategoriesStore = useProjectCategoriesStore();
const { categories, loading } = storeToRefs(projectCategoriesStore);

const dialogVisible = ref(false);
const deleteDialogVisible = ref(false);
const editingCategory = ref<ProjectCategory | null>(null);
const deletingCategory = ref<ProjectCategory | null>(null);
const submitting = ref(false);
const loadError = ref<string | null>(null);
const statusFilter = ref<'all' | 'active' | 'inactive'>('all');

const activeCount = computed(() => categories.value.filter(c => c.isActive).length);
const inactiveCount = computed(() => categories.value.filter(c => !c.isActive).length);

const filteredCategories = computed(() => {
  if (statusFilter.value === 'active') {
    return categories.value.filter(c => c.isActive);
  }
  if (statusFilter.value === 'inactive') {
    return categories.value.filter(c => !c.isActive);
  }
  return categories.value;
});

const sortedCategories = computed(() => {
  return [...filteredCategories.value].sort((a, b) => b.sortOrder - a.sortOrder);
});

const dialogTitle = computed(() => (editingCategory.value ? '编辑分类' : '新建分类'));

const emptyDescription = computed(() => {
  if (statusFilter.value === 'active') {
    return '暂无启用的分类';
  }
  if (statusFilter.value === 'inactive') {
    return '暂无停用的分类';
  }
  return '暂无分类，点击新建分类开始管理';
});

const deleteConfirmText = computed(() => {
  if (!deletingCategory.value) return '确定删除该分类吗？';
  const count = deletingCategory.value.activeProjectCount || 0;
  if (count > 0) {
    return `该分类下有 ${count} 个项目，删除后这些项目需要重新分配分类。确定删除吗？`;
  }
  return '确定删除该分类吗？分类删除后无法恢复。';
});

const openCreateDialog = () => {
  editingCategory.value = null;
  dialogVisible.value = true;
};

const openEditDialog = (category: ProjectCategory) => {
  editingCategory.value = category;
  dialogVisible.value = true;
};

const closeDialog = () => {
  dialogVisible.value = false;
  editingCategory.value = null;
};

const handleSubmit = async (payload: { name: string; description?: string; sortOrder: number; isActive: boolean }) => {
  submitting.value = true;
  try {
    if (editingCategory.value) {
      await projectCategoriesStore.updateCategory(editingCategory.value.id, payload);
      ElMessage.success('分类更新成功');
    } else {
      await projectCategoriesStore.createCategory(payload);
      ElMessage.success('分类创建成功');
    }
    closeDialog();
  } catch (error) {
    const message = error instanceof Error ? error.message : '操作失败';
    ElMessage.error(message);
  } finally {
    submitting.value = false;
  }
};

const handleToggle = async (category: ProjectCategory) => {
  try {
    await projectCategoriesStore.updateCategory(category.id, {
      isActive: !category.isActive,
    });
    ElMessage.success(category.isActive ? '分类已停用' : '分类已启用');
  } catch (error) {
    const message = error instanceof Error ? error.message : '操作失败';
    ElMessage.error(message);
  }
};

const confirmDelete = (category: ProjectCategory) => {
  deletingCategory.value = category;
  deleteDialogVisible.value = true;
};

const handleDelete = async () => {
  if (!deletingCategory.value) return;
  submitting.value = true;
  try {
    await projectCategoriesStore.deleteCategory(deletingCategory.value.id);
    ElMessage.success('分类已删除');
  } catch (error) {
    const message = error instanceof Error ? error.message : '删除失败';
    ElMessage.error(message);
  } finally {
    submitting.value = false;
    deleteDialogVisible.value = false;
    deletingCategory.value = null;
  }
};

const loadCategories = async () => {
  loadError.value = null;
  try {
    await projectCategoriesStore.fetchCategories();
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取分类列表失败';
    loadError.value = message;
    ElMessage.error(message);
  }
};

onMounted(() => {
  loadCategories();
});
</script>
