<template>
  <el-dialog
    :model-value="visible"
    :title="title"
    width="420px"
    @close="handleCancel"
  >
    <div class="flex items-start gap-3">
      <el-icon class="text-xl text-red-500"><WarningFilled /></el-icon>
      <div class="space-y-1">
        <p class="text-base font-medium text-slate-800">{{ description }}</p>
        <p class="text-sm text-slate-500">{{ subDescription }}</p>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleConfirm">
          {{ confirmText }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { WarningFilled } from "@element-plus/icons-vue";

interface Props {
  visible: boolean;
  title?: string;
  description: string;
  subDescription?: string;
  confirmText?: string;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: "确认操作",
  confirmText: "确认",
  loading: false,
  subDescription: "该操作不可撤销，请谨慎操作",
});

const emit = defineEmits<{ (e: "confirm"): void; (e: "cancel"): void }>();

const handleConfirm = () => {
  emit("confirm");
};

const handleCancel = () => {
  emit("cancel");
};
</script>
