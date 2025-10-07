<template>
  <nav class="mobile-nav">
    <RouterLink
      v-for="item in navItems"
      :key="item.path"
      :to="item.path"
      class="nav-item"
      :class="{ active: isActive(item.match) }"
    >
      <el-icon :size="20">
        <component :is="item.icon" />
      </el-icon>
      <span class="nav-label">{{ item.label }}</span>
    </RouterLink>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { List, Grid, Files, DocumentCopy } from '@element-plus/icons-vue';

const route = useRoute();

const navItems = computed(() => [
  {
    label: '项目',
    path: '/projects',
    match: '/projects',
    icon: List,
  },
  {
    label: '分类',
    path: '/project-categories',
    match: '/project-categories',
    icon: Grid,
  },
  {
    label: '内容',
    path: '/content-types',
    match: '/content-types',
    icon: Files,
  },
  {
    label: '文档',
    path: '/documentation',
    match: '/documentation',
    icon: DocumentCopy,
  },
]);

const isActive = (match: string) => {
  return route.path.startsWith(match);
};
</script>

<style scoped>
.mobile-nav {
  display: flex;
  justify-content: space-around;
  align-items: center;
  background: white;
  border-top: 1px solid #e5e7eb;
  padding: 0.5rem 0;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 0.5rem 1rem;
  color: #64748b;
  text-decoration: none;
  transition: all 0.2s ease;
  border-radius: 0.5rem;
  min-width: 60px;
}

.nav-item:active {
  background: #f1f5f9;
  transform: scale(0.95);
}

.nav-item.active {
  color: #3b82f6;
}

.nav-item.active :deep(.el-icon) {
  color: #3b82f6;
}

.nav-label {
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
}
</style>
