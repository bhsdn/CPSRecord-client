<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-width="96px" @submit.prevent>
    <el-form-item label="项目名称" prop="name">
      <el-input v-model="form.name" placeholder="请输入项目名称" maxlength="60" show-word-limit />
    </el-form-item>
    <el-form-item label="项目分类" prop="categoryId">
      <el-select
        v-model="form.categoryId"
        placeholder="请选择分类"
        class="w-full"
        :disabled="!categories.length"
      >
        <el-option v-for="category in categories" :key="category.id" :label="category.name" :value="category.id" />
      </el-select>
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
import { computed, reactive, ref, watch } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import type { Project, ProjectCategory } from "@/types";

interface Props {
  modelValue?: Partial<Project> | null;
  submitting?: boolean;
  submitText?: string;
  categories?: ProjectCategory[];
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  submitting: false,
  submitText: "提交",
  categories: () => [],
});

const emit = defineEmits<{
  (
    e: "submit",
    value: { name: string; description?: string | null; categoryId: number }
  ): void;
  (e: "cancel"): void;
}>();

const formRef = ref<FormInstance>();
const form = reactive({
  name: "",
  description: "",
  categoryId: undefined as number | undefined,
});

const categories = computed(() => props.categories);

const rules: FormRules = {
  name: [
    { required: true, message: "请输入项目名称", trigger: "blur" },
    { min: 2, max: 60, message: "长度在 2 到 60 个字符", trigger: "blur" },
  ],
  description: [{ max: 200, message: "描述不超过 200 字", trigger: "blur" }],
  categoryId: [{ required: true, message: "请选择项目分类", trigger: "change" }],
};

watch(
  () => props.modelValue,
  (value) => {
    if (value) {
      form.name = value.name ?? "";
      form.description = value.description ?? "";
      form.categoryId = value.categoryId ?? undefined;
    } else {
      form.name = "";
      form.description = "";
      form.categoryId = props.categories[0]?.id;
    }
  },
  { immediate: true }
);

watch(
  () => props.categories,
  (categories) => {
    if (!form.categoryId && categories.length) {
      form.categoryId = categories[0].id;
    }
  },
  { immediate: true, deep: true }
);

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate((valid) => {
    if (!valid) return;
    if (form.categoryId === undefined) return;
    emit("submit", {
      name: form.name.trim(),
      description: form.description.trim(),
      categoryId: form.categoryId,
    });
  });
};

const handleCancel = () => emit("cancel");
</script>
