<template>
  <div class="empty-state">
    <el-empty :description="description" :image-size="imageSize">
      <template #image>
        <slot name="icon">
          <el-icon :size="iconSize" class="text-slate-300">
            <component :is="icon" />
          </el-icon>
        </slot>
      </template>
      <template #description>
        <div class="space-y-2">
          <p class="text-base font-medium text-slate-600">{{ title }}</p>
          <p v-if="description" class="text-sm text-slate-400">
            {{ description }}
          </p>
          <slot name="extra"></slot>
        </div>
      </template>
    </el-empty>
  </div>
</template>

<script setup lang="ts">
import { Document } from "@element-plus/icons-vue";

interface Props {
  title?: string;
  description?: string;
  icon?: any;
  iconSize?: number;
  imageSize?: number;
}

withDefaults(defineProps<Props>(), {
  title: "暂无数据",
  icon: Document,
  iconSize: 80,
  imageSize: 100,
});
</script>

<style scoped>
.empty-state {
  padding: 3rem 1rem;
}

:deep(.el-empty__description p) {
  margin: 0;
}
</style>

