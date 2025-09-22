<template>
  <section v-if="subProject" class="space-y-6">
    <el-page-header class="rounded-lg border border-slate-200 bg-white p-4" @back="goBack">
      <template #content>
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div class="space-y-2">
            <h2 class="text-2xl font-semibold text-slate-900">{{ subProject.name }}</h2>
            <p class="text-sm text-slate-500">{{ subProject.description || "暂无描述" }}</p>
          </div>
          <div class="flex items-center gap-3 text-xs text-slate-500">
            <span class="flex items-center gap-1">
              <el-icon><Timer /></el-icon>
              更新于 {{ formatDate(subProject.updatedAt) }}
            </span>
            <span class="flex items-center gap-1">
              <el-icon><Document /></el-icon>
              内容 {{ subProject.contents.length }}
            </span>
            <span class="flex items-center gap-1">
              <el-icon><Tickets /></el-icon>
              文字口令 {{ subProject.textCommands.length }}
            </span>
          </div>
        </div>
      </template>
    </el-page-header>

    <el-card shadow="never" body-class="flex flex-wrap gap-3">
      <el-button type="primary" @click="openSubProjectDialog">
        <el-icon class="mr-1"><Edit /></el-icon>
        编辑子项目
      </el-button>
      <el-button type="primary" plain @click="openContentDialog()">
        <el-icon class="mr-1"><Plus /></el-icon>
        新增内容
      </el-button>
      <el-button type="primary" plain @click="openCommandDialog()">
        <el-icon class="mr-1"><ChatLineSquare /></el-icon>
        新增口令
      </el-button>
    </el-card>

    <el-alert
      v-if="loadError"
      type="error"
      :closable="false"
      show-icon
      title="数据加载异常"
      class="w-full"
    >
      <template #description>
        <div class="flex flex-col gap-2">
          <span>{{ loadError }}，请稍后重试。</span>
          <div class="flex gap-2">
            <el-button size="small" type="primary" @click="fetchDetail">重新加载</el-button>
          </div>
        </div>
      </template>
    </el-alert>

    <el-card shadow="never" body-class="space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="text-base font-semibold text-slate-800">内容列表</h3>
        <el-button type="primary" link @click="openContentDialog()">
          <el-icon class="mr-1"><Plus /></el-icon>新增内容
        </el-button>
      </div>
      <el-empty v-if="!subProject.contents.length" description="暂无内容" />
      <el-timeline v-else>
        <el-timeline-item
          v-for="content in subProject.contents"
          :key="content.id"
          :timestamp="formatDate(content.updatedAt)"
          placement="top"
        >
          <div class="rounded-lg border border-slate-200 bg-white p-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <el-tag effect="dark">{{ content.contentType.name }}</el-tag>
                <ExpiryStatus v-if="content.expiryDate" :expiry-date="content.expiryDate" size="small" />
              </div>
              <div class="flex items-center gap-2 text-sm">
                <el-button type="primary" link size="small" @click="openContentDialog(content)">编辑</el-button>
                <el-button type="danger" link size="small" @click="confirmDeleteContent(content)">删除</el-button>
              </div>
            </div>
            <p class="mt-2 whitespace-pre-wrap break-words text-sm text-slate-700">{{ content.contentValue }}</p>
          </div>
        </el-timeline-item>
      </el-timeline>
    </el-card>

    <TextCommandList
      :commands="subProject.textCommands"
      @add="openCommandDialog"
      @edit="openCommandDialog"
      @delete="confirmDeleteCommand"
    />
  </section>
  <el-empty v-else description="子项目不存在">
    <el-button type="primary" @click="goBack">返回</el-button>
  </el-empty>

  <el-dialog title="编辑子项目" :model-value="subProjectDialogVisible" width="520px" @close="closeSubProjectDialog">
    <SubProjectForm
      v-if="subProjectDialogVisible"
      :model-value="subProject"
      :submit-text="'保存修改'"
      :submitting="submitting"
      @submit="handleSubProjectSubmit"
      @cancel="closeSubProjectDialog"
    />
  </el-dialog>

  <el-dialog :title="contentDialogTitle" :model-value="contentDialogVisible" width="560px" @close="closeContentDialog">
    <ContentEditor
      v-if="contentDialogVisible"
      :content-types="contentTypes"
      :model-value="editingContent"
      :submit-text="editingContent ? '保存内容' : '新增内容'"
      :submitting="submitting"
      @submit="handleContentSubmit"
      @cancel="closeContentDialog"
    />
  </el-dialog>

  <el-dialog title="文字口令" :model-value="commandDialogVisible" width="520px" @close="closeCommandDialog">
    <el-form ref="commandFormRef" :model="commandForm" :rules="commandRules" label-width="100px">
      <el-form-item label="口令内容" prop="commandText">
        <el-input v-model="commandForm.commandText" type="textarea" :autosize="{ minRows: 3, maxRows: 5 }" />
      </el-form-item>
      <el-form-item label="有效天数" prop="expiryDays">
        <el-input-number v-model="commandForm.expiryDays" :min="1" :max="180" />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="flex justify-end gap-3">
        <el-button @click="closeCommandDialog">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleCommandSubmit">
          {{ editingCommand ? "保存口令" : "新增口令" }}
        </el-button>
      </div>
    </template>
  </el-dialog>

  <ConfirmDialog
    :visible="deleteContentDialogVisible"
    title="删除内容"
    description="确认删除该内容吗？"
    confirm-text="确认删除"
    :loading="submitting"
    @confirm="handleContentDelete"
    @cancel="handleCancelDeleteContent"
  />

  <ConfirmDialog
    :visible="deleteCommandDialogVisible"
    title="删除文字口令"
    description="确认删除该文字口令吗？"
    confirm-text="确认删除"
    :loading="submitting"
    @confirm="handleCommandDelete"
    @cancel="handleCancelDeleteCommand"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { storeToRefs } from "pinia";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import {
  Timer,
  Document,
  Tickets,
  Edit,
  Plus,
  ChatLineSquare,
} from "@element-plus/icons-vue";
import { useDateFormat } from "@/composables/useDateFormat";
import { useProjectsStore } from "@/stores/projects";
import { useSubProjectsStore } from "@/stores/subProjects";
import { useContentsStore } from "@/stores/contents";
import SubProjectForm from "@/components/subproject/SubProjectForm.vue";
import ContentEditor from "@/components/content/ContentEditor.vue";
import TextCommandList from "@/components/content/TextCommandList.vue";
import ConfirmDialog from "@/components/common/ConfirmDialog.vue";
import ExpiryStatus from "@/components/content/ExpiryStatus.vue";
import type { SubProjectContent, TextCommand } from "@/types";

const route = useRoute();
const router = useRouter();
const { formatDate } = useDateFormat();

const projectsStore = useProjectsStore();
const subProjectsStore = useSubProjectsStore();
const contentsStore = useContentsStore();
const { contentTypes } = storeToRefs(contentsStore);

const projectId = Number(route.params.projectId);
const subProjectId = Number(route.params.id);
const subProject = computed(() => subProjectsStore.getSubProjectById(subProjectId));

const submitting = ref(false);
// 记录接口错误信息，便于在界面展示统一提示
const loadError = ref<string | null>(null);
const editingContent = ref<SubProjectContent | null>(null);
const deleteContentTarget = ref<SubProjectContent | null>(null);
const editingCommand = ref<TextCommand | null>(null);
const deleteCommandTarget = ref<TextCommand | null>(null);

const commandFormRef = ref<FormInstance>();
const commandForm = reactive({
  commandText: "",
  expiryDays: 7,
});

const commandRules: FormRules = {
  commandText: [{ required: true, message: "请输入口令内容", trigger: "blur" }],
  expiryDays: [{ required: true, message: "请输入有效天数", trigger: "change" }],
};

const dialogStates = reactive({
  subProject: false,
  content: false,
  command: false,
  deleteContent: false,
  deleteCommand: false,
});

const subProjectDialogVisible = computed({
  get: () => dialogStates.subProject,
  set: (value: boolean) => (dialogStates.subProject = value),
});
const contentDialogVisible = computed({
  get: () => dialogStates.content,
  set: (value: boolean) => (dialogStates.content = value),
});
const commandDialogVisible = computed({
  get: () => dialogStates.command,
  set: (value: boolean) => (dialogStates.command = value),
});
const deleteContentDialogVisible = computed({
  get: () => dialogStates.deleteContent,
  set: (value: boolean) => (dialogStates.deleteContent = value),
});
const deleteCommandDialogVisible = computed({
  get: () => dialogStates.deleteCommand,
  set: (value: boolean) => (dialogStates.deleteCommand = value),
});

const contentDialogTitle = computed(() => (editingContent.value ? "编辑内容" : "新增内容"));

// 进入子项目详情时同时拉取子项目最新数据与内容类型
const fetchDetail = async () => {
  loadError.value = null;
  try {
    await Promise.all([
      projectsStore.fetchProjectById(projectId),
      subProjectsStore.fetchSubProjectsByProject(projectId),
      contentsStore.fetchContentTypes(),
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "加载子项目详情失败";
    loadError.value = message;
    ElMessage.error(message);
  }
};

const goBack = () => {
  router.push({ name: "ProjectDetail", params: { id: projectId } });
};

const openSubProjectDialog = () => {
  subProjectDialogVisible.value = true;
};

const closeSubProjectDialog = () => {
  subProjectDialogVisible.value = false;
};

const handleSubProjectSubmit = async (payload: { name: string; description?: string; sortOrder: number }) => {
  if (!subProject.value) return;
  submitting.value = true;
  try {
    await subProjectsStore.updateSubProject(subProject.value.id, payload);
    ElMessage.success("子项目更新成功");
    closeSubProjectDialog();
  } catch (error) {
    ElMessage.error("更新子项目失败");
  } finally {
    submitting.value = false;
  }
};

const openContentDialog = (content?: SubProjectContent) => {
  editingContent.value = content ?? null;
  contentDialogVisible.value = true;
};

const closeContentDialog = () => {
  contentDialogVisible.value = false;
  editingContent.value = null;
};

const handleContentSubmit = async (payload: { contentTypeId: number; contentValue: string; expiryDays?: number }) => {
  if (!subProject.value) return;
  submitting.value = true;
  try {
    if (editingContent.value) {
      await contentsStore.updateContent(subProject.value.id, editingContent.value.id, payload);
      ElMessage.success("内容更新成功");
    } else {
      await contentsStore.addContent(subProject.value.id, payload);
      ElMessage.success("内容新增成功");
    }
    closeContentDialog();
  } catch (error) {
    ElMessage.error("内容操作失败");
  } finally {
    submitting.value = false;
  }
};

const confirmDeleteContent = (content: SubProjectContent) => {
  deleteContentTarget.value = content;
  deleteContentDialogVisible.value = true;
};

const handleContentDelete = async () => {
  if (!deleteContentTarget.value || !subProject.value) return;
  submitting.value = true;
  try {
    await contentsStore.removeContent(subProject.value.id, deleteContentTarget.value.id);
    ElMessage.success("内容已删除");
  } catch (error) {
    ElMessage.error("删除内容失败");
  } finally {
    submitting.value = false;
    deleteContentDialogVisible.value = false;
    deleteContentTarget.value = null;
  }
};

const openCommandDialog = (command?: TextCommand) => {
  editingCommand.value = command ?? null;
  commandForm.commandText = command?.commandText ?? "";
  commandForm.expiryDays = command?.expiryDays ?? 7;
  commandDialogVisible.value = true;
};

const closeCommandDialog = () => {
  commandDialogVisible.value = false;
  editingCommand.value = null;
  commandForm.commandText = "";
  commandForm.expiryDays = 7;
  commandFormRef.value?.clearValidate();
};

const handleCommandSubmit = async () => {
  if (!commandFormRef.value || !subProject.value) return;
  const valid = await commandFormRef.value.validate().catch(() => false);
  if (!valid) return;
  submitting.value = true;
  try {
    if (editingCommand.value) {
      await contentsStore.updateTextCommand(subProject.value.id, editingCommand.value.id, {
        commandText: commandForm.commandText,
        expiryDays: commandForm.expiryDays,
      });
      ElMessage.success("口令更新成功");
    } else {
      await contentsStore.addTextCommand(subProject.value.id, {
        commandText: commandForm.commandText,
        expiryDays: commandForm.expiryDays,
      });
      ElMessage.success("口令新增成功");
    }
    closeCommandDialog();
  } catch (error) {
    ElMessage.error("口令操作失败");
  } finally {
    submitting.value = false;
  }
};

const confirmDeleteCommand = (command: TextCommand) => {
  deleteCommandTarget.value = command;
  deleteCommandDialogVisible.value = true;
};

const handleCommandDelete = async () => {
  if (!deleteCommandTarget.value || !subProject.value) return;
  submitting.value = true;
  try {
    await contentsStore.removeTextCommand(subProject.value.id, deleteCommandTarget.value.id);
    ElMessage.success("口令已删除");
  } catch (error) {
    ElMessage.error("删除口令失败");
  } finally {
    submitting.value = false;
    deleteCommandDialogVisible.value = false;
    deleteCommandTarget.value = null;
  }
};

const handleCancelDeleteContent = () => {
  deleteContentDialogVisible.value = false;
  deleteContentTarget.value = null;
};

const handleCancelDeleteCommand = () => {
  deleteCommandDialogVisible.value = false;
  deleteCommandTarget.value = null;
};

onMounted(fetchDetail);
</script>
