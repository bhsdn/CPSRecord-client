<template>
  <div class="content-editor">
    <el-form ref="formRef" :model="formData" :rules="rules" label-width="110px" @submit.prevent>
      <el-form-item label="内容类型" prop="contentTypeId">
        <el-select v-model="formData.contentTypeId" placeholder="请选择内容类型" @change="handleContentTypeChange">
          <el-option v-for="type in contentTypes" :key="type.id" :label="type.name" :value="type.id" />
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
        <div class="w-full">
          <el-upload
            class="upload-demo"
            drag
            :auto-upload="false"
            accept="image/*"
            :show-file-list="false"
            :on-change="handleImageChange"
            :before-upload="beforeImageUpload"
          >
            <el-icon v-if="!imagePreview && !imageUploading" class="el-icon--upload text-4xl">
              <UploadFilled />
            </el-icon>
            <div v-if="!imagePreview && !imageUploading" class="el-upload__text">
              拖拽文件到此处或点击上传
              <em>（最大1.5MB）</em>
            </div>
            <el-progress v-if="imageUploading" :percentage="uploadProgress" :stroke-width="6" class="mt-4 px-4" />
            <div v-if="imagePreview" class="flex items-center justify-center w-full p-4 bg-slate-50 rounded">
              <el-image
                :src="imagePreview"
                :style="imagePreviewStyle"
                fit="fill"
                class="rounded shadow-sm"
                :preview-src-list="[imagePreview]"
              />
            </div>
          </el-upload>
          <div v-if="imageInfo && !imageUploading" class="mt-2 space-y-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                <el-tag size="small" type="success">{{ imageInfo.name }}</el-tag>
                <span v-if="imageInfo.width && imageInfo.height" class="whitespace-nowrap">
                  尺寸: {{ imageInfo.width }} × {{ imageInfo.height }}
                </span>
                <span class="whitespace-nowrap">大小: {{ imageInfo.size.toFixed(2) }} KB</span>
              </div>
              <el-button type="danger" link size="small" @click="clearImage">清除</el-button>
            </div>
            <p class="text-xs text-slate-400 truncate">链接: {{ formData.contentValue }}</p>
          </div>
        </div>
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
import { computed, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules, UploadFile, UploadRawFile } from 'element-plus';
import type { ContentType, SubProjectContent } from '@/types';
import { UploadFilled } from '@element-plus/icons-vue';
import { useImageUpload } from '@/composables/useImageUpload';

interface Props {
  contentTypes: ContentType[];
  modelValue?: SubProjectContent | null;
  submitting?: boolean;
  submitText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  submitting: false,
  submitText: '保存',
});

const emit = defineEmits<{
  (e: 'submit', payload: { contentTypeId: number; contentValue: string; expiryDays?: number }): void;
  (e: 'cancel'): void;
}>();

const formRef = ref<FormInstance>();
const formData = ref({
  contentTypeId: undefined as number | undefined,
  contentValue: '',
  expiryDays: undefined as number | undefined,
});

const { uploading: imageUploading, uploadProgress, uploadImage, validateImage, getImageDimensions } = useImageUpload();
const imagePreview = ref('');
const imageInfo = ref<{
  url: string;
  width?: number;
  height?: number;
  size: number;
  name: string;
  md5?: string;
  key?: string;
} | null>(null);

const selectedContentType = computed(() => props.contentTypes.find(type => type.id === formData.value.contentTypeId));

// 根据图片宽高计算预览尺寸，等比例缩放
const imagePreviewStyle = computed(() => {
  if (!imageInfo.value?.width || !imageInfo.value?.height) {
    return { maxWidth: '100%', maxHeight: '320px' };
  }

  const maxWidth = 500; // 最大显示宽度
  const maxHeight = 320; // 最大显示高度
  const { width, height } = imageInfo.value;
  const aspectRatio = width / height;

  // 根据宽高比计算实际显示尺寸
  if (aspectRatio > maxWidth / maxHeight) {
    // 宽度较大，以宽度为准
    const displayWidth = Math.min(width, maxWidth);
    return {
      width: `${displayWidth}px`,
      height: `${displayWidth / aspectRatio}px`,
    };
  } else {
    // 高度较大，以高度为准
    const displayHeight = Math.min(height, maxHeight);
    return {
      width: `${displayHeight * aspectRatio}px`,
      height: `${displayHeight}px`,
    };
  }
});

const calculatedExpiryDate = computed(() => {
  if (!formData.value.expiryDays) return '--';
  const date = new Date();
  date.setDate(date.getDate() + formData.value.expiryDays);
  return date.toLocaleDateString('zh-CN');
});

const rules: FormRules = {
  contentTypeId: [{ required: true, message: '请选择内容类型', trigger: 'change' }],
  contentValue: [{ required: true, message: '请输入内容', trigger: 'blur' }],
  expiryDays: [{ required: true, message: '请输入有效天数', trigger: 'blur' }],
};

watch(
  () => props.modelValue,
  value => {
    if (value) {
      formData.value = {
        contentTypeId: value.contentType.id,
        contentValue: value.contentValue,
        expiryDays: value.expiryDays,
      };
      // 如果是图片类型，设置预览
      if (value.contentType.fieldType === 'image' && value.contentValue) {
        imagePreview.value = value.contentValue;
        imageInfo.value = {
          url: value.contentValue,
          size: 0,
          name: '已上传图片',
        };
      }
    } else {
      formData.value = {
        contentTypeId: undefined,
        contentValue: '',
        expiryDays: undefined,
      };
      imagePreview.value = '';
      imageInfo.value = null;
    }
  },
  { immediate: true }
);

const handleContentTypeChange = () => {
  formData.value.contentValue = '';
  formData.value.expiryDays = undefined;
  imagePreview.value = '';
  imageInfo.value = null;
};

const beforeImageUpload = (rawFile: UploadRawFile) => {
  return validateImage(rawFile);
};

const handleImageChange = async (uploadFile: UploadFile) => {
  if (!uploadFile.raw) return;

  try {
    // 获取图片尺寸
    const dimensions = await getImageDimensions(uploadFile.raw);

    // 上传到图床（使用默认配置：公开，相册 1761）
    const uploadedImage = await uploadImage(uploadFile.raw);

    // 保存图片信息（包含本地读取的宽高）
    imageInfo.value = {
      url: uploadedImage.links.url,
      width: dimensions.width,
      height: dimensions.height,
      size: uploadedImage.size,
      name: uploadedImage.name,
      md5: uploadedImage.md5,
      key: uploadedImage.key,
    };

    // 保存图片 URL 到表单
    formData.value.contentValue = uploadedImage.links.url;
    imagePreview.value = uploadedImage.links.url;

    ElMessage.success('图片上传成功');
  } catch (error) {
    console.error('图片上传失败:', error);
    // 错误消息已在 useImageUpload 中处理
  }
};

const clearImage = () => {
  formData.value.contentValue = '';
  imagePreview.value = '';
  imageInfo.value = null;
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
    if (!formData.value.contentTypeId) return;
    emit('submit', {
      contentTypeId: formData.value.contentTypeId,
      contentValue: formData.value.contentValue.trim(),
      expiryDays: formData.value.expiryDays,
    });
  } catch (error) {
    // ignore validation error
  }
};

const handleCancel = () => emit('cancel');
</script>

<style scoped>
.content-editor {
  padding: 12px 0;
}
</style>
