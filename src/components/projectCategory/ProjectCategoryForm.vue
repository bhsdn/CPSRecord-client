<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" @submit.prevent>
    <el-form-item label="分类名称" prop="name">
      <el-input v-model="form.name" placeholder="请输入分类名称" maxlength="100" show-word-limit />
    </el-form-item>

    <el-form-item label="分类描述" prop="description">
      <el-input
        v-model="form.description"
        type="textarea"
        :autosize="{ minRows: 3, maxRows: 6 }"
        maxlength="500"
        show-word-limit
        placeholder="补充分类说明信息"
      />
    </el-form-item>

    <el-form-item label="排序权重" prop="sortOrder">
      <el-input-number v-model="form.sortOrder" :min="0" :max="9999" :step="1" />
      <span class="ml-2 text-xs text-slate-500">数值越大排序越靠前</span>
    </el-form-item>

    <el-form-item label="是否启用" prop="isActive">
      <el-switch v-model="form.isActive" active-text="启用" inactive-text="停用" />
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
import { reactive, ref, watch } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import type { ProjectCategory } from '@/types';

interface Props {
  modelValue?: Partial<ProjectCategory> | null;
  submitting?: boolean;
  submitText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  submitting: false,
  submitText: '提交',
});

const emit = defineEmits<{
  (e: 'submit', value: { name: string; description?: string; sortOrder: number; isActive: boolean }): void;
  (e: 'cancel'): void;
}>();

const formRef = ref<FormInstance>();
const form = reactive({
  name: '',
  description: '',
  sortOrder: 0,
  isActive: true,
});

const rules: FormRules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 1, max: 100, message: '长度在 1 到 100 个字符', trigger: 'blur' },
  ],
  description: [{ max: 500, message: '描述不超过 500 字', trigger: 'blur' }],
  sortOrder: [{ required: true, message: '请输入排序权重', trigger: 'blur' }],
};

watch(
  () => props.modelValue,
  value => {
    if (value) {
      form.name = value.name ?? '';
      form.description = value.description ?? '';
      form.sortOrder = value.sortOrder ?? 0;
      form.isActive = value.isActive ?? true;
    } else {
      form.name = '';
      form.description = '';
      form.sortOrder = 0;
      form.isActive = true;
    }
  },
  { immediate: true }
);

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(valid => {
    if (!valid) return;
    emit('submit', {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      sortOrder: form.sortOrder,
      isActive: form.isActive,
    });
  });
};

const handleCancel = () => emit('cancel');
</script>
