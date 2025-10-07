<template>
  <header class="sticky top-0 z-30 bg-white shadow-sm border-b border-slate-200">
    <div class="max-w-7xl mx-auto flex flex-col gap-3 px-4 py-3 md:py-4 md:flex-row md:items-center md:justify-between">
      <!-- Logo和标题 - 移动端紧凑显示 -->
      <div class="flex items-center gap-2 md:gap-3">
        <div
          class="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-primary-100 text-primary-600"
        >
          <el-icon class="text-xl md:text-2xl"><Collection /></el-icon>
        </div>
        <div>
          <h1 class="text-base md:text-xl font-semibold text-slate-900">CPS 推广项目管理系统</h1>
          <p class="hidden md:block text-sm text-slate-500">集中管理项目、子项目和推广内容</p>
        </div>
      </div>

      <!-- 导航和统计 - 移动端简化 -->
      <div class="flex flex-1 flex-col gap-2 md:gap-3 md:flex-row md:items-center md:justify-end">
        <!-- 统计信息 - 移动端隐藏 -->
        <div class="hidden md:flex items-center gap-3 text-sm text-slate-500">
          <div class="flex items-center gap-1">
            <el-icon><FolderOpened /></el-icon>
            <span>项目数：{{ projectStats.totalProjects }}</span>
          </div>
          <div class="flex items-center gap-1">
            <el-icon><Timer /></el-icon>
            <span>最近更新：{{ projectStats.lastUpdated || '--' }}</span>
          </div>
        </div>

        <!-- 导航菜单 -->
        <nav class="flex items-center gap-1 md:gap-2 overflow-x-auto scrollbar-hide">
          <RouterLink
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="rounded-full px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-medium transition whitespace-nowrap flex-shrink-0"
            :class="
              route.path.startsWith(item.match)
                ? 'bg-primary-600 text-white shadow'
                : 'text-slate-600 hover:bg-slate-100'
            "
          >
            <el-icon class="mr-0.5 md:mr-1" :size="14">
              <component :is="item.icon" />
            </el-icon>
            {{ item.label }}
          </RouterLink>
        </nav>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { useProjects } from '@/composables/useProjects';
import { Collection, FolderOpened, Timer, List, Files, DocumentCopy, Grid } from '@element-plus/icons-vue';

const route = useRoute();
const { projectStats } = useProjects();

const navItems = computed(() => [
  {
    label: '项目管理',
    path: '/projects',
    match: '/projects',
    icon: List,
  },
  {
    label: '项目分类',
    path: '/project-categories',
    match: '/project-categories',
    icon: Grid,
  },
  {
    label: '内容类型',
    path: '/content-types',
    match: '/content-types',
    icon: Files,
  },
  {
    label: '文档中心',
    path: '/documentation',
    match: '/documentation',
    icon: DocumentCopy,
  },
]);
</script>

<style scoped>
/* 移动端优化 */
@media (max-width: 768px) {
  header {
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }

  .max-w-7xl {
    gap: 0.5rem !important;
  }

  /* 隐藏滚动条但保持滚动功能 */
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
}
</style>
