<template>
  <div class="search-bar">
    <el-input :model-value="modelValue" :placeholder="placeholder" clearable :size="size" @update:model-value="handleInput" @keyup.enter="handleSearch" @clear="handleClear">
      <template #prefix>
        <el-icon>
          <Search />
        </el-icon>
      </template>
      <template v-if="showButton" #append>
        <el-button :icon="Search" @click="handleSearch">
          {{ buttonText }}
        </el-button>
      </template>
    </el-input>
  </div>
</template>

<script setup lang="ts">
import { Search } from "@element-plus/icons-vue";

interface Props {
  modelValue: string;
  placeholder?: string;
  size?: "large" | "default" | "small";
  showButton?: boolean;
  buttonText?: string;
}

interface Emits {
  (e: "update:modelValue", value: string): void;
  (e: "search", value: string): void;
  (e: "clear"): void;
}

withDefaults(defineProps<Props>(), {
  placeholder: "请输入搜索关键字",
  size: "default",
  showButton: false,
  buttonText: "搜索",
});

const emit = defineEmits<Emits>();

const handleInput = (value: string) => {
  emit("update:modelValue", value);
};

const handleSearch = () => {
  emit("search", "");
};

const handleClear = () => {
  emit("clear");
};
</script>

<style scoped>
.search-bar :deep(.el-input-group__append) {
  padding: 0;
}

.search-bar :deep(.el-input-group__append .el-button) {
  margin: 0;
}
</style>

