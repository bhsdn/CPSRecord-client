<template>
  <header class="sticky top-0 z-30 bg-white shadow-sm border-b border-slate-200">
    <div class="max-w-7xl mx-auto flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
      <div class="flex items-center gap-3">
        <div class="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-600">
          <el-icon class="text-2xl"><Collection /></el-icon>
        </div>
        <div>
          <h1 class="text-xl font-semibold text-slate-900">CPS 推广项目管理系统</h1>
          <p class="text-sm text-slate-500">集中管理项目、子项目和推广内容</p>
        </div>
      </div>

      <div class="flex flex-1 flex-col gap-3 md:flex-row md:items-center md:justify-end">
        <div class="flex items-center gap-3 text-sm text-slate-500">
          <div class="flex items-center gap-1">
            <el-icon><FolderOpened /></el-icon>
            <span>项目数：{{ projectStats.totalProjects }}</span>
          </div>
          <div class="hidden items-center gap-1 md:flex">
            <el-icon><Timer /></el-icon>
            <span>最近更新：{{ projectStats.lastUpdated || "--" }}</span>
          </div>
        </div>
        <nav class="flex items-center gap-2">
          <RouterLink
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="rounded-full px-4 py-2 text-sm font-medium transition"
            :class="
              route.path.startsWith(item.match)
                ? 'bg-primary-600 text-white shadow'
                : 'text-slate-600 hover:bg-slate-100'
            "
          >
            <component :is="item.icon" class="mr-1" />
            {{ item.label }}
          </RouterLink>
        </nav>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { useProjects } from "@/composables/useProjects";
import { Collection, FolderOpened, Timer, List, Files, DocumentCopy } from "@element-plus/icons-vue";

const route = useRoute();
const { projectStats } = useProjects();

const navItems = computed(() => [
  {
    label: "项目管理",
    path: "/projects",
    match: "/projects",
    icon: List,
  },
  {
    label: "内容类型",
    path: "/content-types",
    match: "/content-types",
    icon: Files,
  },
  {
    label: "文档中心",
    path: "/documentation",
    match: "/documentation",
    icon: DocumentCopy,
  },
]);
</script>
