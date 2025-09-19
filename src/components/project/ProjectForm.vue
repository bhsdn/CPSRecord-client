<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-width="96px" @submit.prevent>
    <el-form-item label="项目名称" prop="name">
      <el-input v-model="form.name" placeholder="请输入项目名称" maxlength="60" show-word-limit />
    </el-form-item>
    <el-form-item label="项目描述" prop="description">
      <el-input
        v-model="form.description"
        type="textarea"
        :autosize="{ minRows: 3, maxRows: 6 }"
        maxlength="200"
        show-word-limit
        placeholder="补充项目背景、目标等信息"
      />
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
import type { Project } from "@/types";

interface Props {
  modelValue?: Partial<Project> | null;
  submitting?: boolean;
  submitText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  submitting: false,
  submitText: "提交",
});

const emit = defineEmits<{
  (e: "submit", value: { name: string; description?: string | null }): void;
  (e: "cancel"): void;
}>();

const formRef = ref<FormInstance>();
const form = reactive({
  name: "",
  description: "",
});

const rules: FormRules = {
  name: [
    { required: true, message: "请输入项目名称", trigger: "blur" },
    { min: 2, max: 60, message: "长度在 2 到 60 个字符", trigger: "blur" },
  ],
  description: [{ max: 200, message: "描述不超过 200 字", trigger: "blur" }],
};

watch(
  () => props.modelValue,
  (value) => {
    if (value) {
      form.name = value.name ?? "";
      form.description = value.description ?? "";
    } else {
      form.name = "";
      form.description = "";
    }
  },
  { immediate: true }
);

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate((valid) => {
    if (!valid) return;
    emit("submit", { name: form.name.trim(), description: form.description.trim() });
  });
};

const handleCancel = () => emit("cancel");
</script>
