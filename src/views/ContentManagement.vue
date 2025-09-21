<template>
  <section class="space-y-6">
    <el-card shadow="never" body-class="space-y-4">
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 class="text-2xl font-semibold text-slate-900">内容类型管理</h2>
          <p class="text-sm text-slate-500">配置推广素材的字段类型与有效期规则，支持灵活扩展</p>
        </div>
        <div class="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span class="flex items-center gap-1">
            <el-icon><CollectionTag /></el-icon>
            子项目 {{ subProjectStats.total }}
          </span>
          <span class="flex items-center gap-1">
            <el-icon><Document /></el-icon>
            内容条目 {{ subProjectStats.contentTotal }}
          </span>
          <span class="flex items-center gap-1">
            <el-icon><Tickets /></el-icon>
            文字口令 {{ subProjectStats.commandTotal }}
          </span>
        </div>
      </div>

      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div class="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p class="text-xs text-slate-500">内容类型总数</p>
          <p class="mt-1 text-2xl font-semibold text-slate-900">{{ totalContentTypes }}</p>
        </div>
        <div class="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p class="text-xs text-slate-500">系统内置类型</p>
          <p class="mt-1 text-2xl font-semibold text-slate-900">{{ systemTypeCount }}</p>
        </div>
        <div class="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p class="text-xs text-slate-500">自定义类型</p>
          <p class="mt-1 text-2xl font-semibold text-slate-900">{{ customTypeCount }}</p>
        </div>
        <div class="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p class="text-xs text-slate-500">需要有效期的类型</p>
          <p class="mt-1 text-2xl font-semibold text-slate-900">{{ expiryTypeCount }}</p>
        </div>
      </div>
    </el-card>

    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <el-card shadow="never" body-class="space-y-3">
        <template #header>
          <div class="flex items-center justify-between">
            <span class="text-sm font-semibold text-slate-700">内容有效期状态</span>
            <el-tag size="small" type="warning">即将过期 {{ expirySummary.warning }}</el-tag>
          </div>
        </template>
        <div class="space-y-2 text-sm text-slate-600">
          <div class="flex items-center justify-between rounded border border-slate-200 px-3 py-2">
            <span class="flex items-center gap-2"><el-tag size="small" type="success">安全</el-tag></span>
            <span>{{ expirySummary.safe }}</span>
          </div>
          <div class="flex items-center justify-between rounded border border-slate-200 px-3 py-2">
            <span class="flex items-center gap-2"><el-tag size="small" type="warning">警告</el-tag></span>
            <span>{{ expirySummary.warning }}</span>
          </div>
          <div class="flex items-center justify-between rounded border border-slate-200 px-3 py-2">
            <span class="flex items-center gap-2"><el-tag size="small" type="danger">过期</el-tag></span>
            <span>{{ expirySummary.danger }}</span>
          </div>
        </div>
      </el-card>

      <el-card shadow="never" body-class="space-y-3">
        <template #header>
          <div class="flex items-center justify-between">
            <span class="text-sm font-semibold text-slate-700">到期内容提醒</span>
            <el-tag size="small" type="danger">{{ expiringContentCount }}</el-tag>
          </div>
        </template>
        <el-empty v-if="!expiringContentCount" description="暂无即将到期的内容" />
        <ul v-else class="space-y-3 text-sm text-slate-600">
          <li v-for="item in expiringSoonList" :key="item.id" class="rounded-lg border border-slate-200 p-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <el-tag size="small">{{ item.contentTypeName }}</el-tag>
                <span class="text-xs text-slate-500">{{ item.subProjectName }}</span>
              </div>
              <ExpiryStatus :expiry-date="item.expiryDate" size="small" />
            </div>
            <p class="mt-2 break-words text-slate-700">{{ item.contentValue }}</p>
            <p class="mt-1 text-xs text-slate-400">到期日 {{ formatDateOnly(item.expiryDate) }} · {{ item.expiryText }}</p>
          </li>
        </ul>
      </el-card>

      <el-card shadow="never" body-class="space-y-3">
        <template #header>
          <div class="flex items-center justify-between">
            <span class="text-sm font-semibold text-slate-700">口令到期提醒</span>
            <el-tag size="small" type="danger">{{ expiringCommandCount }}</el-tag>
          </div>
        </template>
        <el-empty v-if="!expiringCommandCount" description="暂无即将到期的口令" />
        <ul v-else class="space-y-3 text-sm text-slate-600">
          <li v-for="command in commandExpiringList" :key="command.id" class="rounded-lg border border-slate-200 p-3">
            <div class="flex items-center justify-between">
              <span class="font-medium text-slate-800">{{ command.commandText }}</span>
              <ExpiryStatus :expiry-date="command.expiryDate" size="small" />
            </div>
            <p class="mt-1 text-xs text-slate-500">{{ command.subProjectName }} · {{ command.expiryText }}</p>
          </li>
        </ul>
      </el-card>
    </div>

    <div class="grid gap-4 lg:grid-cols-3">
      <div class="lg:col-span-2">
        <LoadingSpinner v-if="loading" text="内容类型加载中..." />
        <ContentTypeManager
          v-else
          :content-types="contentTypes"
          :submitting="submitting"
          @create="handleCreateType"
          @update="handleUpdateType"
          @delete="handleDeleteType"
        />
      </div>
      <div class="space-y-4">
        <el-card shadow="never" body-class="space-y-2">
          <h3 class="text-sm font-semibold text-slate-700">操作提示</h3>
          <ul class="list-disc space-y-1 pl-5 text-xs text-slate-500">
            <li>系统内置类型不可删除，可编辑描述与时效设置</li>
            <li>自定义类型可随时调整字段类型以适配新场景</li>
            <li>时效内容会自动计算到期状态并在此提醒</li>
          </ul>
        </el-card>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { CollectionTag, Document, Tickets } from "@element-plus/icons-vue";
import ContentTypeManager from "@/components/content/ContentTypeManager.vue";
import LoadingSpinner from "@/components/common/LoadingSpinner.vue";
import ExpiryStatus from "@/components/content/ExpiryStatus.vue";
import { useContents } from "@/composables/useContents";
import { useSubProjects } from "@/composables/useSubProjects";
import { useProjectsStore } from "@/stores/projects";
import { useDateFormat } from "@/composables/useDateFormat";
import type { ContentType } from "@/types";

type ExpirySummary = {
  safe: number;
  warning: number;
  danger: number;
};

const { contentTypes, loading, fetchContentTypes, createContentType, updateContentType, deleteContentType } = useContents();
const { subProjects, stats: subProjectStats, fetchSubProjectsByProject } = useSubProjects();
const projectsStore = useProjectsStore();
const { formatDateOnly, getExpiryStatus, getExpiryText } = useDateFormat();

const submitting = ref(false);

const totalContentTypes = computed(() => contentTypes.value.length);
const systemTypeCount = computed(() => contentTypes.value.filter((type) => type.isSystem).length);
const customTypeCount = computed(() => totalContentTypes.value - systemTypeCount.value);
const expiryTypeCount = computed(() => contentTypes.value.filter((type) => type.hasExpiry).length);

const allContents = computed(() =>
  subProjects.value.flatMap((subProject) =>
    subProject.contents.map((content) => ({
      ...content,
      subProjectName: subProject.name,
    }))
  )
);

const allCommands = computed(() =>
  subProjects.value.flatMap((subProject) =>
    subProject.textCommands.map((command) => ({
      ...command,
      subProjectName: subProject.name,
    }))
  )
);

const expirySummary = computed<ExpirySummary>(() => {
  return allContents.value.reduce<ExpirySummary>(
    (acc, content) => {
      if (!content.expiryDate) {
        acc.safe += 1;
        return acc;
      }
      const status = content.expiryStatus ?? getExpiryStatus(content.expiryDate);
      acc[status] += 1;
      return acc;
    },
    { safe: 0, warning: 0, danger: 0 }
  );
});

const expiringSoonList = computed(() =>
  allContents.value
    .filter((content) => content.expiryDate)
    .map((content) => ({
      id: content.id,
      contentTypeName: content.contentType.name,
      contentValue: content.contentValue,
      subProjectName: content.subProjectName,
      expiryDate: content.expiryDate!,
      status: content.expiryStatus ?? getExpiryStatus(content.expiryDate!),
      expiryText: getExpiryText(content.expiryDate!),
    }))
    .filter((item) => item.status !== "safe")
    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())
    .slice(0, 5)
);

const commandExpiringList = computed(() =>
  allCommands.value
    .map((command) => ({
      ...command,
      status: command.expiryStatus ?? getExpiryStatus(command.expiryDate),
      expiryText: getExpiryText(command.expiryDate),
    }))
    .filter((command) => command.status !== "safe")
    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())
    .slice(0, 5)
);

const expiringContentCount = computed(() => expiringSoonList.value.length);
const expiringCommandCount = computed(() => commandExpiringList.value.length);

const handleCreateType = async (payload: {
  name: string;
  fieldType: ContentType["fieldType"];
  hasExpiry: boolean;
  description?: string;
}) => {
  submitting.value = true;
  try {
    await createContentType(payload);
    ElMessage.success("内容类型创建成功");
  } catch (error) {
    ElMessage.error("创建内容类型失败");
  } finally {
    submitting.value = false;
  }
};

const handleUpdateType = async (
  id: number,
  payload: {
    name: string;
    fieldType: ContentType["fieldType"];
    hasExpiry: boolean;
    description?: string;
  }
) => {
  submitting.value = true;
  try {
    await updateContentType(id, payload);
    ElMessage.success("内容类型更新成功");
  } catch (error) {
    ElMessage.error("更新内容类型失败");
  } finally {
    submitting.value = false;
  }
};

const handleDeleteType = async (id: number) => {
  submitting.value = true;
  try {
    await deleteContentType(id);
    ElMessage.success("内容类型已删除");
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "删除内容类型失败");
  } finally {
    submitting.value = false;
  }
};

// 页面初始化时同时获取内容类型与所有项目的子项目数据，保证统计面板准确
onMounted(async () => {
  await Promise.all([
    fetchContentTypes(),
    (async () => {
      const projects = await projectsStore.fetchProjects();
      await Promise.all(projects.map((project) => fetchSubProjectsByProject(project.id)));
    })(),
  ]);
});
</script>
