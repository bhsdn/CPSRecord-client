<template>
  <div class="content-editor">
    <el-form ref="formRef" :model="formData" :rules="rules" label-width="110px" @submit.prevent>
      <el-form-item label="内容类型" prop="contentTypeId">
        <el-select v-model="formData.contentTypeId" placeholder="请选择内容类型" @change="handleContentTypeChange">
          <el-option
            v-for="type in contentTypes"
            :key="type.id"
            :label="type.name"
            :value="type.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item v-if="selectedContentType?.fieldType === 'text'" label="内容" prop="contentValue">
        <el-input
          v-model="formData.contentValue"
          type="textarea"
          :autosize="{ minRows: 3, maxRows: 6 }"
          placeholder="请输入文本内容"
        />
      </el-form-item>

      <el-form-item v-else-if="selectedContentType?.fieldType === 'url'" label="链接" prop="contentValue">
        <el-input v-model="formData.contentValue" placeholder="请输入链接地址" />
      </el-form-item>

      <el-form-item v-else-if="selectedContentType?.fieldType === 'image'" label="图片" prop="contentValue">
        <el-upload
          class="upload-demo"
          drag
          :auto-upload="false"
          accept="image/*"
          :on-change="handleImageChange"
        >
          <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
          <div class="el-upload__text">拖拽文件到此处或点击上传</div>
        </el-upload>
        <p v-if="formData.contentValue" class="mt-2 text-xs text-slate-500">{{ formData.contentValue }}</p>
      </el-form-item>

      <el-form-item v-if="selectedContentType?.hasExpiry" label="有效天数" prop="expiryDays">
        <el-input-number v-model="formData.expiryDays" :min="1" :max="180" />
        <span class="ml-3 text-xs text-slate-500">预估到期：{{ calculatedExpiryDate }}</span>
      </el-form-item>

      <div class="flex justify-end gap-3 pt-2">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ submitText }}
        </el-button>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { FormInstance, FormRules, UploadFile } from "element-plus";
import type { ContentType, SubProjectContent } from "@/types";
import { UploadFilled } from "@element-plus/icons-vue";

interface Props {
  contentTypes: ContentType[];
  modelValue?: SubProjectContent | null;
  submitting?: boolean;
  submitText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  submitting: false,
  submitText: "保存",
});

const emit = defineEmits<{
  (e: "submit", payload: { contentTypeId: number; contentValue: string; expiryDays?: number }): void;
  (e: "cancel"): void;
}>();

const formRef = ref<FormInstance>();
const formData = ref({
  contentTypeId: undefined as number | undefined,
  contentValue: "",
  expiryDays: undefined as number | undefined,
});

const selectedContentType = computed(() =>
  props.contentTypes.find((type) => type.id === formData.value.contentTypeId)
);

const calculatedExpiryDate = computed(() => {
  if (!formData.value.expiryDays) return "--";
  const date = new Date();
  date.setDate(date.getDate() + formData.value.expiryDays);
  return date.toLocaleDateString("zh-CN");
});

const rules: FormRules = {
  contentTypeId: [{ required: true, message: "请选择内容类型", trigger: "change" }],
  contentValue: [{ required: true, message: "请输入内容", trigger: "blur" }],
  expiryDays: [{ required: true, message: "请输入有效天数", trigger: "blur" }],
};

watch(
  () => props.modelValue,
  (value) => {
    if (value) {
      formData.value = {
        contentTypeId: value.contentType.id,
        contentValue: value.contentValue,
        expiryDays: value.expiryDays,
      };
    } else {
      formData.value = {
        contentTypeId: undefined,
        contentValue: "",
        expiryDays: undefined,
      };
    }
  },
  { immediate: true }
);

const handleContentTypeChange = () => {
  formData.value.contentValue = "";
  formData.value.expiryDays = undefined;
};

const handleImageChange = (file: UploadFile) => {
  if (file.url) {
    formData.value.contentValue = file.url;
  } else if (file.raw) {
    formData.value.contentValue = file.name;
  }
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
    if (!formData.value.contentTypeId) return;
    emit("submit", {
      contentTypeId: formData.value.contentTypeId,
      contentValue: formData.value.contentValue.trim(),
      expiryDays: formData.value.expiryDays,
    });
  } catch (error) {
    // ignore validation error
  }
};

const handleCancel = () => emit("cancel");
</script>

<style scoped>
.content-editor {
  padding: 12px 0;
}
</style>
