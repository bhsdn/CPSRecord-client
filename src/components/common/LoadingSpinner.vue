<template>
  <div class="flex items-center justify-center py-12 text-slate-500">
    <el-icon class="mr-2 animate-spin text-xl"><Loading /></el-icon>
    <span>{{ text }}</span>
  </div>
</template>

<script setup lang="ts">
import { Loading } from "@element-plus/icons-vue";

interface Props {
  text?: string;
}

const props = withDefaults(defineProps<Props>(), {
  text: "数据加载中...",
});
</script>
