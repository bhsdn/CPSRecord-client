<template>
  <section v-if="project" class="space-y-6">
    <el-page-header @back="router.back">
      <template #content>
        <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 class="text-2xl font-semibold text-slate-900">{{ project.name }}</h2>
            <p class="text-sm text-slate-500">{{ project.description || "暂无描述" }}</p>
          </div>
          <div class="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span class="flex items-center gap-1">
              <el-icon><Timer /></el-icon>
              更新于 {{ formatDate(project.updatedAt) }}
            </span>
            <span class="flex items-center gap-1">
              <el-icon><CollectionTag /></el-icon>
              子项目 {{ subProjects.length }}
            </span>
            <span class="flex items-center gap-1">
              <el-icon><Tickets /></el-icon>
              文字口令 {{ commandTotal }}
            </span>
          </div>
        </div>
      </template>
    </el-page-header>

    <el-card shadow="never" body-class="flex flex-wrap gap-3">
      <el-button type="primary" @click="openSubProjectDialog()">
        <el-icon class="mr-1"><Plus /></el-icon>
        新建子项目
      </el-button>
      <el-button type="primary" plain @click="openSortDialog" :disabled="!subProjects.length">
        <el-icon class="mr-1"><Rank /></el-icon>
        调整排序
      </el-button>
      <el-button type="primary" plain @click="openContentTypePage">
        <el-icon class="mr-1"><Setting /></el-icon>
        内容类型配置
      </el-button>
    </el-card>

    <SubProjectList
      :sub-projects="subProjects"
      :loading="subProjectLoading"
      @edit="openSubProjectDialog"
      @delete="confirmDeleteSubProject"
      @add-content="openContentDialog"
      @edit-content="(sub, content) => openContentDialog(sub, content)"
      @add-command="openCommandDialog"
      @edit-command="(sub, command) => openCommandDialog(sub, command)"
      @delete-command="confirmDeleteCommand"
    />
  </section>
  <el-empty v-else description="项目不存在或已被删除">
    <el-button type="primary" @click="router.push('/projects')">返回项目列表</el-button>
  </el-empty>

  <el-dialog :title="subProjectDialogTitle" :model-value="subProjectDialogVisible" width="520px" @close="closeSubProjectDialog">
    <SubProjectForm
      :model-value="editingSubProject"
      :submit-text="editingSubProject ? '保存修改' : '创建子项目'"
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

  <el-dialog title="调整子项目排序" :model-value="sortDialogVisible" width="640px" @close="closeSortDialog">
    <SubProjectSort :model-value="subProjects" :submitting="submitting" @update="handleSortUpdate" @cancel="closeSortDialog" />
  </el-dialog>

  <ConfirmDialog
    :visible="deleteSubProjectDialogVisible"
    title="删除子项目"
    description="删除后该子项目及内容将被隐藏，确认继续？"
    confirm-text="确认删除"
    :loading="submitting"
    @confirm="handleSubProjectDelete"
    @cancel="deleteSubProjectDialogVisible = false"
  />

  <ConfirmDialog
    :visible="deleteCommandDialogVisible"
    title="删除文字口令"
    description="确认删除该文字口令吗？"
    confirm-text="确认删除"
    :loading="submitting"
    @confirm="handleCommandDelete"
    @cancel="deleteCommandDialogVisible = false"
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
  CollectionTag,
  Tickets,
  Plus,
  Rank,
  Setting,
} from "@element-plus/icons-vue";
import { useDateFormat } from "@/composables/useDateFormat";
import { useProjectsStore } from "@/stores/projects";
import { useSubProjectsStore } from "@/stores/subProjects";
import { useContentsStore } from "@/stores/contents";
import SubProjectList from "@/components/subproject/SubProjectList.vue";
import SubProjectForm from "@/components/subproject/SubProjectForm.vue";
import SubProjectSort from "@/components/subproject/SubProjectSort.vue";
import ContentEditor from "@/components/content/ContentEditor.vue";
import ConfirmDialog from "@/components/common/ConfirmDialog.vue";
import type { ContentType, SubProject, SubProjectContent, TextCommand } from "@/types";

const route = useRoute();
const router = useRouter();
const { formatDate } = useDateFormat();

const projectsStore = useProjectsStore();
const subProjectsStore = useSubProjectsStore();
const contentsStore = useContentsStore();
const { contentTypes } = storeToRefs(contentsStore);

const projectId = Number(route.params.id);
const project = computed(() => projectsStore.getProjectById(projectId));
const subProjects = computed(() => subProjectsStore.getSubProjectsByProjectId(projectId));
const commandTotal = computed(() =>
  subProjects.value.reduce((total, sub) => total + sub.textCommands.length, 0)
);
const subProjectLoading = ref(false);

const dialogVisibleStates = reactive({
  subProject: false,
  content: false,
  command: false,
  sort: false,
  deleteSubProject: false,
  deleteCommand: false,
});

const submitting = ref(false);
const editingSubProject = ref<SubProject | null>(null);
const deletingSubProject = ref<SubProject | null>(null);
const editingContent = ref<SubProjectContent | null>(null);
const targetSubProject = ref<SubProject | null>(null);
const editingCommand = ref<TextCommand | null>(null);
const deletingCommand = ref<{ subProject: SubProject; command: TextCommand } | null>(null);

const commandFormRef = ref<FormInstance>();
const commandForm = reactive({
  commandText: "",
  expiryDays: 7,
});

const commandRules: FormRules = {
  commandText: [{ required: true, message: "请输入口令内容", trigger: "blur" }],
  expiryDays: [{ required: true, message: "请输入有效天数", trigger: "change" }],
};

const subProjectDialogVisible = computed({
  get: () => dialogVisibleStates.subProject,
  set: (value: boolean) => (dialogVisibleStates.subProject = value),
});
const contentDialogVisible = computed({
  get: () => dialogVisibleStates.content,
  set: (value: boolean) => (dialogVisibleStates.content = value),
});
const commandDialogVisible = computed({
  get: () => dialogVisibleStates.command,
  set: (value: boolean) => (dialogVisibleStates.command = value),
});
const sortDialogVisible = computed({
  get: () => dialogVisibleStates.sort,
  set: (value: boolean) => (dialogVisibleStates.sort = value),
});
const deleteSubProjectDialogVisible = computed({
  get: () => dialogVisibleStates.deleteSubProject,
  set: (value: boolean) => (dialogVisibleStates.deleteSubProject = value),
});
const deleteCommandDialogVisible = computed({
  get: () => dialogVisibleStates.deleteCommand,
  set: (value: boolean) => (dialogVisibleStates.deleteCommand = value),
});

const subProjectDialogTitle = computed(() =>
  editingSubProject.value ? "编辑子项目" : "新建子项目"
);

const contentDialogTitle = computed(() =>
  `${editingContent.value ? "编辑" : "新增"}内容`
);

const fetchDetail = async () => {
  if (!project.value) {
    await projectsStore.fetchProjects();
  }
  subProjectLoading.value = true;
  try {
    await Promise.all([
      subProjectsStore.ensureSubProjectsForProject(projectId),
      contentsStore.fetchContentTypes(),
    ]);
  } finally {
    subProjectLoading.value = false;
  }
};

const openSubProjectDialog = (subProject?: SubProject) => {
  editingSubProject.value = subProject ?? null;
  subProjectDialogVisible.value = true;
};

const closeSubProjectDialog = () => {
  subProjectDialogVisible.value = false;
  editingSubProject.value = null;
};

const handleSubProjectSubmit = async (payload: {
  name: string;
  description?: string;
  sortOrder: number;
}) => {
  submitting.value = true;
  try {
    if (editingSubProject.value) {
      await subProjectsStore.updateSubProject(editingSubProject.value.id, payload);
      ElMessage.success("子项目更新成功");
    } else {
      await subProjectsStore.createSubProject(projectId, payload);
      ElMessage.success("子项目创建成功");
    }
    closeSubProjectDialog();
  } catch (error) {
    ElMessage.error("子项目操作失败");
  } finally {
    submitting.value = false;
  }
};

const confirmDeleteSubProject = (subProject: SubProject) => {
  deletingSubProject.value = subProject;
  deleteSubProjectDialogVisible.value = true;
};

const handleSubProjectDelete = async () => {
  if (!deletingSubProject.value) return;
  submitting.value = true;
  try {
    await subProjectsStore.deleteSubProject(deletingSubProject.value.id);
    ElMessage.success("子项目已删除");
  } catch (error) {
    ElMessage.error("删除子项目失败");
  } finally {
    submitting.value = false;
    deleteSubProjectDialogVisible.value = false;
    deletingSubProject.value = null;
  }
};

const openContentDialog = (subProject: SubProject, content?: SubProjectContent) => {
  targetSubProject.value = subProject;
  editingContent.value = content ?? null;
  contentDialogVisible.value = true;
};

const closeContentDialog = () => {
  contentDialogVisible.value = false;
  targetSubProject.value = null;
  editingContent.value = null;
};

const handleContentSubmit = async (payload: {
  contentTypeId: number;
  contentValue: string;
  expiryDays?: number;
}) => {
  if (!targetSubProject.value) return;
  submitting.value = true;
  try {
    if (editingContent.value) {
      await contentsStore.updateContent(targetSubProject.value.id, editingContent.value.id, payload);
      ElMessage.success("内容更新成功");
    } else {
      await contentsStore.addContent(targetSubProject.value.id, payload);
      ElMessage.success("内容新增成功");
    }
    closeContentDialog();
  } catch (error) {
    ElMessage.error("内容操作失败");
  } finally {
    submitting.value = false;
  }
};

const openCommandDialog = (subProject: SubProject, command?: TextCommand) => {
  targetSubProject.value = subProject;
  editingCommand.value = command ?? null;
  commandForm.commandText = command?.commandText ?? "";
  commandForm.expiryDays = command?.expiryDays ?? 7;
  commandDialogVisible.value = true;
};

const closeCommandDialog = () => {
  commandDialogVisible.value = false;
  targetSubProject.value = null;
  editingCommand.value = null;
  commandForm.commandText = "";
  commandForm.expiryDays = 7;
};

const handleCommandSubmit = async () => {
  if (!commandFormRef.value || !targetSubProject.value) return;
  await commandFormRef.value.validate(async (valid) => {
    if (!valid) return;
    submitting.value = true;
    try {
      if (editingCommand.value) {
        await contentsStore.updateTextCommand(targetSubProject.value.id, editingCommand.value.id, {
          commandText: commandForm.commandText,
          expiryDays: commandForm.expiryDays,
        });
        ElMessage.success("口令更新成功");
      } else {
        await contentsStore.addTextCommand(targetSubProject.value.id, {
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
  });
};

const confirmDeleteCommand = (subProject: SubProject, command: TextCommand) => {
  deletingCommand.value = { subProject, command };
  deleteCommandDialogVisible.value = true;
};

const handleCommandDelete = async () => {
  if (!deletingCommand.value) return;
  submitting.value = true;
  try {
    await contentsStore.removeTextCommand(
      deletingCommand.value.subProject.id,
      deletingCommand.value.command.id
    );
    ElMessage.success("口令已删除");
  } catch (error) {
    ElMessage.error("删除口令失败");
  } finally {
    submitting.value = false;
    deleteCommandDialogVisible.value = false;
    deletingCommand.value = null;
  }
};

const openSortDialog = () => {
  sortDialogVisible.value = true;
};

const closeSortDialog = () => {
  sortDialogVisible.value = false;
};

const handleSortUpdate = async (ids: number[]) => {
  submitting.value = true;
  try {
    await subProjectsStore.reorderSubProjects(projectId, ids);
    ElMessage.success("排序已更新");
    closeSortDialog();
  } catch (error) {
    ElMessage.error("更新排序失败");
  } finally {
    submitting.value = false;
  }
};

const openContentTypePage = () => {
  router.push({ name: "ContentManagement" });
};

onMounted(fetchDetail);
</script>
