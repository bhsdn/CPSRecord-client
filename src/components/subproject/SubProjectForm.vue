<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" @submit.prevent>
    <el-form-item label="子项目名称" prop="name">
      <el-input v-model="form.name" placeholder="请输入子项目名称" maxlength="60" show-word-limit />
    </el-form-item>
    <el-form-item label="子项目描述" prop="description">
      <el-input
        v-model="form.description"
        type="textarea"
        :autosize="{ minRows: 3, maxRows: 6 }"
        maxlength="200"
        show-word-limit
        placeholder="子项目的目标、渠道等信息"
      />
    </el-form-item>
    <el-form-item label="排序" prop="sortOrder">
      <el-input-number v-model="form.sortOrder" :min="1" :max="999" />
    </el-form-item>
    <div class="flex justify-end gap-3 pt-2">
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        {{ submitText }}
      </el-button>
    </div>
  </el-form>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import type { SubProject } from "@/types";

interface Props {
  modelValue?: Partial<SubProject> | null;
  submitting?: boolean;
  submitText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  submitting: false,
  submitText: "提交",
});

const emit = defineEmits<{
  (
    e: "submit",
    value: { name: string; description?: string; sortOrder: number }
  ): void;
  (e: "cancel"): void;
}>();

const formRef = ref<FormInstance>();
const form = reactive({
  name: "",
  description: "",
  sortOrder: 1,
});

const rules: FormRules = {
  name: [
    { required: true, message: "请输入子项目名称", trigger: "blur" },
    { min: 2, max: 60, message: "长度在 2 到 60 个字符", trigger: "blur" },
  ],
  description: [{ max: 200, message: "描述不超过 200 字", trigger: "blur" }],
  sortOrder: [{ required: true, message: "请输入排序", trigger: "change" }],
};

watch(
  () => props.modelValue,
  (value) => {
    if (value) {
      form.name = value.name ?? "";
      form.description = value.description ?? "";
      form.sortOrder = value.sortOrder ?? 1;
    } else {
      form.name = "";
      form.description = "";
      form.sortOrder = 1;
    }
  },
  { immediate: true }
);

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate((valid) => {
    if (!valid) return;
    emit("submit", {
      name: form.name.trim(),
      description: form.description.trim(),
      sortOrder: form.sortOrder,
    });
  });
};

const handleCancel = () => emit("cancel");
</script>
