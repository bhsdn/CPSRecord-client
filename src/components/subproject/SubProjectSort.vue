<template>
  <div class="space-y-4">
    <el-alert type="info" title="拖拽或使用按钮调整排序，排序越小越靠前" show-icon />
    <el-table :data="internalList" row-key="id" border>
      <el-table-column type="index" width="60" label="#" />
      <el-table-column prop="name" label="子项目名称" min-width="220" />
      <el-table-column prop="description" label="描述" min-width="260">
        <template #default="{ row }">
          <span class="text-sm text-slate-600">{{ row.description || "--" }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160">
        <template #default="{ $index }">
          <div class="flex items-center gap-2">
            <el-button size="small" :disabled="$index === 0" @click="moveUp($index)">
              上移
            </el-button>
            <el-button
              size="small"
              :disabled="$index === internalList.length - 1"
              @click="moveDown($index)"
            >
              下移
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
    <div class="flex justify-end gap-3">
      <el-button @click="emit('cancel')">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleConfirm">保存排序</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import type { SubProject } from "@/types";

interface Props {
  modelValue: SubProject[];
  submitting?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  submitting: false,
});

const emit = defineEmits<{
  (e: "update", ids: number[]): void;
  (e: "cancel"): void;
}>();

const internalList = ref<SubProject[]>([]);

watch(
  () => props.modelValue,
  (value) => {
    internalList.value = value.slice().sort((a, b) => a.sortOrder - b.sortOrder);
  },
  { immediate: true }
);

const moveUp = (index: number) => {
  if (index === 0) return;
  const list = internalList.value;
  [list[index - 1], list[index]] = [list[index], list[index - 1]];
};

const moveDown = (index: number) => {
  const list = internalList.value;
  if (index >= list.length - 1) return;
  [list[index + 1], list[index]] = [list[index], list[index + 1]];
};

const handleConfirm = () => {
  const ids = internalList.value.map((item) => item.id);
  emit("update", ids);
};
</script>
