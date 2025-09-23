<template>
  <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
    <el-input
      v-model="model"
      placeholder="输入项目名称、描述搜索"
      clearable
      class="w-full md:w-80"
      :prefix-icon="Search"
    />
    <div class="flex items-center gap-2">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Search } from "@element-plus/icons-vue";

const model = defineModel<string>("modelValue", { default: "" });
</script>
