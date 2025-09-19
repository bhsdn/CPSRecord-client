<template>
  <el-card shadow="never" body-class="space-y-4">
    <template #header>
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold text-slate-800">内容类型配置</h3>
          <p class="text-sm text-slate-500">自定义推广内容类型，支持文本、链接、图片等</p>
        </div>
        <el-button type="primary" @click="openDialog()">
          <el-icon class="mr-1"><Plus /></el-icon>
          新建内容类型
        </el-button>
      </div>
    </template>

    <el-table :data="contentTypes" border>
      <el-table-column prop="name" label="名称" width="160" />
      <el-table-column prop="fieldType" label="字段类型" width="140">
        <template #default="{ row }">
          <el-tag type="info">{{ fieldTypeLabels[row.fieldType] }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="hasExpiry" label="是否过期" width="120">
        <template #default="{ row }">
          <el-tag :type="row.hasExpiry ? 'warning' : 'success'">
            {{ row.hasExpiry ? '需要设置有效期' : '长期有效' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="isSystem" label="系统内置" width="120">
        <template #default="{ row }">
          <el-tag :type="row.isSystem ? 'info' : 'primary'">
            {{ row.isSystem ? '系统类型' : '自定义' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="description" label="描述">
        <template #default="{ row }">
          <span class="text-sm text-slate-600">{{ row.description || '暂无描述' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="openDialog(row)">编辑</el-button>
          <el-popconfirm
            v-if="!row.isSystem"
            title="确定删除该内容类型吗?"
            confirm-button-text="删除"
            cancel-button-text="取消"
            @confirm="handleDelete(row)"
          >
            <template #reference>
              <el-button type="danger" link size="small">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>
  </el-card>

  <el-dialog :title="dialogTitle" :model-value="dialogVisible" width="520px" @close="closeDialog">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="名称" prop="name">
        <el-input v-model="form.name" maxlength="50" show-word-limit placeholder="内容类型名称" />
      </el-form-item>
      <el-form-item label="字段类型" prop="fieldType">
        <el-select v-model="form.fieldType" placeholder="请选择字段类型">
          <el-option v-for="item in fieldTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="需要有效期" prop="hasExpiry">
        <el-switch v-model="form.hasExpiry" />
      </el-form-item>
      <el-form-item label="描述">
        <el-input
          v-model="form.description"
          type="textarea"
          :autosize="{ minRows: 2, maxRows: 4 }"
          maxlength="120"
          show-word-limit
          placeholder="描述该类型使用场景"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="flex justify-end gap-3">
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">保存</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import type { ContentType } from "@/types";
import { Plus } from "@element-plus/icons-vue";

const props = defineProps<{ contentTypes: ContentType[]; submitting?: boolean }>();
const emit = defineEmits<{
  (e: "create", payload: { name: string; fieldType: ContentType["fieldType"]; hasExpiry: boolean; description?: string }): void;
  (e: "update", id: number, payload: { name: string; fieldType: ContentType["fieldType"]; hasExpiry: boolean; description?: string }): void;
  (e: "delete", id: number): void;
}>();

const dialogVisible = ref(false);
const editing = ref<ContentType | null>(null);
const formRef = ref<FormInstance>();
const form = reactive({
  name: "",
  fieldType: "text" as ContentType["fieldType"],
  hasExpiry: false,
  description: "",
});

const fieldTypeLabels: Record<ContentType["fieldType"], string> = {
  text: "文本",
  url: "链接",
  image: "图片",
  date: "日期",
  number: "数字",
};

const fieldTypeOptions = Object.entries(fieldTypeLabels).map(([value, label]) => ({
  value: value as ContentType["fieldType"],
  label,
}));

const rules: FormRules = {
  name: [{ required: true, message: "请输入名称", trigger: "blur" }],
  fieldType: [{ required: true, message: "请选择字段类型", trigger: "change" }],
};

const dialogTitle = computed(() => (editing.value ? "编辑内容类型" : "新建内容类型"));

const resetForm = () => {
  form.name = "";
  form.fieldType = "text";
  form.hasExpiry = false;
  form.description = "";
};

const openDialog = (contentType?: ContentType) => {
  dialogVisible.value = true;
  if (contentType) {
    editing.value = contentType;
    form.name = contentType.name;
    form.fieldType = contentType.fieldType;
    form.hasExpiry = contentType.hasExpiry;
    form.description = contentType.description || "";
  } else {
    editing.value = null;
    resetForm();
  }
};

const closeDialog = () => {
  dialogVisible.value = false;
  editing.value = null;
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate((valid) => {
    if (!valid) return;
    const payload = {
      name: form.name.trim(),
      fieldType: form.fieldType,
      hasExpiry: form.hasExpiry,
      description: form.description.trim() || undefined,
    };
    if (editing.value) {
      emit("update", editing.value.id, payload);
    } else {
      emit("create", payload);
    }
    closeDialog();
  });
};

const handleDelete = (row: ContentType) => {
  emit("delete", row.id);
};
</script>
