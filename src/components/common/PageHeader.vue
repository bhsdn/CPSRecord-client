<template>
  <el-card shadow="never" class="page-header">
    <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <!-- 左侧：标题和描述 -->
      <div class="header-content">
        <div class="flex items-center gap-3">
          <el-icon v-if="icon" :size="32" class="text-primary">
            <component :is="icon" />
          </el-icon>
          <div>
            <h1 class="text-2xl font-bold text-slate-900">{{ title }}</h1>
            <p v-if="description" class="text-sm text-slate-500 mt-1">
              {{ description }}
            </p>
          </div>
        </div>
      </div>

      <!-- 右侧：操作按钮 -->
      <div class="header-actions">
        <slot name="actions"></slot>
      </div>
    </div>

    <!-- 额外内容 -->
    <div v-if="$slots.extra" class="mt-4">
      <slot name="extra"></slot>
    </div>
  </el-card>
</template>

<script setup lang="ts">
interface Props {
  title: string;
  description?: string;
  icon?: any;
}

defineProps<Props>();
</script>

<style scoped>
.page-header {
  margin-bottom: 1.5rem;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .header-actions {
    width: 100%;
  }

  .header-actions :deep(.el-button) {
    flex: 1;
  }
}
</style>

