<template>
  <el-card class="category-card">
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <h3 class="text-lg font-semibold text-slate-800">{{ category.name }}</h3>
          <el-tag :type="category.isActive ? 'success' : 'info'" size="small">
            {{ category.isActive ? '已启用' : '已停用' }}
          </el-tag>
        </div>
        <el-dropdown @command="handleCommand" trigger="click">
          <el-button type="text" size="small" @click.stop>
            <el-icon>
              <MoreFilled />
            </el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="edit">编辑</el-dropdown-item>
              <el-dropdown-item command="toggle" divided>
                {{ category.isActive ? '停用' : '启用' }}
              </el-dropdown-item>
              <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </template>

    <div class="space-y-3">
      <p class="text-sm text-slate-600 line-clamp-3">
        {{ category.description || '暂无描述' }}
      </p>

      <div class="flex items-center justify-between text-sm">
        <div class="flex items-center gap-4 text-slate-500">
          <span class="flex items-center gap-1">
            <el-icon>
              <Collection />
            </el-icon>
            {{ category.activeProjectCount || 0 }} 个项目
          </span>
          <span class="flex items-center gap-1">
            <el-icon>
              <Sort />
            </el-icon>
            排序: {{ category.sortOrder }}
          </span>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import type { ProjectCategory } from '@/types';
import { MoreFilled, Collection, Sort } from '@element-plus/icons-vue';

interface Props {
  category: ProjectCategory;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'edit', category: ProjectCategory): void;
  (e: 'delete', category: ProjectCategory): void;
  (e: 'toggle', category: ProjectCategory): void;
}>();

const handleCommand = (command: string) => {
  switch (command) {
    case 'edit':
      emit('edit', props.category);
      break;
    case 'delete':
      emit('delete', props.category);
      break;
    case 'toggle':
      emit('toggle', props.category);
      break;
  }
};
</script>

<script lang="ts">
export default {
  name: 'ProjectCategoryCard',
};
</script>

<style scoped>
.category-card {
  transition: box-shadow 0.3s;
}

.category-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
