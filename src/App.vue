<!--
 * @Descripttion: js
 * @Version: 1.0
 * @Author: name
 * @Date: 2025-09-20 01:29:01
 * @LastEditors: name
 * @LastEditTime: 2025-10-08 01:51:51
-->
<template>
  <!-- 桌面端布局 -->
  <div v-if="!isMobile" class="min-h-screen bg-slate-100">
    <AppHeader />
    <main class="max-w-7xl mx-auto px-4 py-6">
      <router-view />
    </main>
  </div>

  <!-- 移动端布局 -->
  <MobileLayout v-else :title="pageTitle" :show-back="showBackButton">
    <router-view />
    <template #footer>
      <MobileNavigation />
    </template>
  </MobileLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import AppHeader from '@/components/common/AppHeader.vue';
import MobileLayout from '@/components/layout/MobileLayout.vue';
import MobileNavigation from '@/components/common/MobileNavigation.vue';

const route = useRoute();

// 移动端检测
const isMobile = ref(false);
const checkMobile = () => {
  isMobile.value = window.innerWidth < 768;
};

// 页面标题
const pageTitle = computed(() => {
  return (route.meta?.title as string) || 'CPS 项目管理';
});

// 是否显示返回按钮
const showBackButton = computed(() => {
  const noBackRoutes = ['/projects', '/project-categories', '/content-types', '/documentation'];
  return !noBackRoutes.includes(route.path);
});

onMounted(() => {
  checkMobile();
  window.addEventListener('resize', checkMobile);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile);
});
</script>
