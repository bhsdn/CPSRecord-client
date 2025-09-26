<template>
  <el-card class="project-card cursor-pointer transition-shadow hover:shadow-lg" @click="handleClick">
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-slate-800 truncate">{{ project.name }}</h3>
        <el-dropdown @command="handleCommand" trigger="click" @click.stop>
          <el-button type="text" size="small">
            <el-icon><MoreFilled /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="edit">编辑</el-dropdown-item>
              <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </template>

    <div class="space-y-3">
      <div class="flex items-center gap-2 text-xs">
        <el-tag v-if="project.category?.name" size="small" type="success">{{ project.category.name }}</el-tag>
        <el-tag v-else size="small" type="info">未分类</el-tag>
        <el-tag size="small" type="primary">
          <el-icon class="mr-1 align-middle"><DocumentCopy /></el-icon>
          文档 {{ project.documentationCount }}
        </el-tag>
      </div>
      <p class="line-clamp-2 text-sm text-slate-600">
        {{ project.description || "暂无描述" }}
      </p>
      <div class="flex items-center justify-between text-xs text-slate-500">
        <span class="flex items-center gap-1">
          <el-icon><CollectionTag /></el-icon>
          {{ project.subProjectCount }} 个子项目
        </span>
        <span>{{ formatDate(project.updatedAt) }}</span>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import type { Project } from "@/types";
import { useDateFormat } from "@/composables/useDateFormat";
import { CollectionTag, DocumentCopy, MoreFilled } from "@element-plus/icons-vue";

interface Props {
  project: Project;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "click", project: Project): void;
  (e: "edit", project: Project): void;
  (e: "delete", project: Project): void;
}>();

const { formatDate } = useDateFormat();

const handleClick = () => {
  emit("click", props.project);
};

const handleCommand = (command: string) => {
  if (command === "edit") {
    emit("edit", props.project);
  }
  if (command === "delete") {
    emit("delete", props.project);
  }
};
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
