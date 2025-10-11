<template>
  <div class="space-y-4">
    <el-empty v-if="!loading && !subProjects.length" description="暂无子项目，立即创建一个吧" />

    <template v-else>
      <el-skeleton v-if="loading" animated :count="3">
        <template #template>
          <el-card class="mb-4">
            <el-skeleton-item variant="h1" style="width: 40%" />
            <el-skeleton-item variant="text" />
            <el-skeleton-item variant="text" />
          </el-card>
        </template>
      </el-skeleton>

      <el-collapse v-else accordion>
        <el-collapse-item v-for="subProject in subProjects" :key="subProject.id" :name="subProject.id">
          <template #title>
            <div class="flex w-full items-center justify-between gap-6 py-2 pl-4 pr-4">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-base font-semibold text-slate-800">{{ subProject.name }}</span>
                  <el-tag size="small" type="info">排序 {{ subProject.sortOrder }}</el-tag>
                </div>
                <p class="mt-1 text-xs text-slate-500">{{ subProject.description || '暂无描述' }}</p>
              </div>
              <div class="flex items-center gap-4 flex-shrink-0 flex-wrap md:flex-nowrap">
                <div class="flex items-center gap-3 text-xs text-slate-500">
                  <span class="flex items-center gap-1 whitespace-nowrap">
                    <el-icon>
                      <Document />
                    </el-icon>
                    内容 {{ subProject.contents.length }}
                  </span>
                  <span class="flex items-center gap-1 whitespace-nowrap">
                    <el-icon>
                      <Tickets />
                    </el-icon>
                    口令 {{ subProject.textCommands.length }}
                  </span>
                </div>
                <div class="flex items-center gap-2">
                  <el-tag :type="subProject.documentationEnabled ? 'success' : 'info'" size="small">
                    文档{{ subProject.documentationEnabled ? '已开启' : '未开启' }}
                  </el-tag>
                  <el-switch :model-value="subProject.documentationEnabled" size="small" @click.stop
                    @change="(value) => emit('toggle-documentation', subProject, value)" />
                </div>
              </div>
            </div>
          </template>

          <div class="grid gap-4 md:grid-cols-2">
            <el-card shadow="never" body-class="space-y-3">
              <div class="flex items-center justify-between">
                <h4 class="text-sm font-semibold text-slate-700">内容列表</h4>
                <el-button type="primary" link @click="emit('add-content', subProject)">
                  <el-icon class="mr-1">
                    <Plus />
                  </el-icon>
                  新增内容
                </el-button>
              </div>
              <el-empty v-if="!subProject.contents.length" description="暂无内容" :image-size="100" />
              <div v-else class="space-y-3 max-h-96 overflow-y-auto pr-2">
                <div v-for="content in subProject.contents" :key="content.id"
                  class="rounded-lg border border-slate-200 p-3 hover:border-primary-200 transition-colors">
                  <div class="flex items-center justify-between text-sm mb-2">
                    <div class="flex items-center gap-2 flex-wrap">
                      <el-tag size="small" effect="dark">{{ content.contentType.name }}</el-tag>
                      <ExpiryStatus v-if="content.expiryDate" :expiry-date="content.expiryDate" size="small" />
                      <el-tag v-if="subProject.documentationEnabled && content.showInDocumentation === false"
                        size="small" type="warning" title="该内容不会在文档中心显示">
                        <el-icon class="mr-1">
                          <View />
                        </el-icon>
                        文档隐藏
                      </el-tag>
                    </div>
                    <el-button type="text" size="small" @click="emit('edit-content', subProject, content)">
                      编辑
                    </el-button>
                  </div>

                  <!-- 图片类型：显示预览图 -->
                  <div v-if="content.contentType.fieldType === 'image'" class="space-y-2">
                    <div class="flex items-center justify-center w-full bg-slate-50 rounded p-3">
                      <el-image :src="content.contentValue" :style="getImagePreviewStyle(content)" fit="fill"
                        class="rounded shadow-sm cursor-pointer" :preview-src-list="[content.contentValue]" lazy>
                        <template #error>
                          <div class="flex items-center justify-center h-32 text-slate-400">
                            <span class="text-sm">图片加载失败</span>
                          </div>
                        </template>
                      </el-image>
                    </div>
                    <div v-if="content.uploadedImage" class="flex items-center gap-2 text-xs text-slate-400">
                      <span v-if="content.uploadedImage.width && content.uploadedImage.height">
                        {{ content.uploadedImage.width }} × {{ content.uploadedImage.height }}
                      </span>
                      <span>{{ content.uploadedImage.size.toFixed(2) }} KB</span>
                    </div>
                    <p class="text-xs text-slate-400 truncate">{{ content.contentValue }}</p>
                  </div>

                  <!-- 其他类型：显示文本内容 -->
                  <p v-else class="break-words text-sm text-slate-600 description-text">
                    {{ content.contentValue }}
                  </p>
                </div>
              </div>
            </el-card>

            <el-card shadow="never" body-class="space-y-3">
              <div class="flex items-center justify-between">
                <h4 class="text-sm font-semibold text-slate-700">文字口令</h4>
                <el-button type="primary" link @click="emit('add-command', subProject)">
                  <el-icon class="mr-1">
                    <ChatLineSquare />
                  </el-icon>
                  新增口令
                </el-button>
              </div>
              <el-empty v-if="!subProject.textCommands.length" description="暂无口令" :image-size="100" />
              <div v-else class="space-y-3 max-h-96 overflow-y-auto pr-2">
                <div v-for="command in subProject.textCommands" :key="command.id"
                  class="rounded-lg border border-slate-200 p-3">
                  <div class="flex items-center justify-between text-sm">
                    <span class="font-medium text-slate-700">{{ command.commandText }}</span>
                    <div class="flex items-center gap-2">
                      <ExpiryStatus :expiry-date="command.expiryDate" size="small" />
                      <el-dropdown @command="cmd => handleCommandAction(cmd, subProject, command)">
                        <span class="cursor-pointer text-primary-600">
                          <el-icon>
                            <MoreFilled />
                          </el-icon>
                        </span>
                        <template #dropdown>
                          <el-dropdown-menu>
                            <el-dropdown-item command="edit">编辑</el-dropdown-item>
                            <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                          </el-dropdown-menu>
                        </template>
                      </el-dropdown>
                    </div>
                  </div>
                </div>
              </div>
            </el-card>
          </div>

          <div class="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-4 pr-4">
            <el-button size="small" @click="emit('edit', subProject)">编辑子项目</el-button>
            <el-button size="small" type="danger" plain @click="emit('delete', subProject)">删除</el-button>
          </div>
        </el-collapse-item>
      </el-collapse>
    </template>
  </div>
</template>

<script setup lang="ts">
import { Document, Tickets, Plus, ChatLineSquare, MoreFilled, View } from '@element-plus/icons-vue';
import type { SubProject, SubProjectContent, TextCommand } from '@/types';
import ExpiryStatus from '@/components/content/ExpiryStatus.vue';

interface Props {
  subProjects: SubProject[];
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  (e: 'edit', subProject: SubProject): void;
  (e: 'delete', subProject: SubProject): void;
  (e: 'add-content', subProject: SubProject): void;
  (e: 'edit-content', subProject: SubProject, content: SubProjectContent): void;
  (e: 'add-command', subProject: SubProject): void;
  (e: 'edit-command', subProject: SubProject, command: TextCommand): void;
  (e: 'delete-command', subProject: SubProject, command: TextCommand): void;
  (e: 'toggle-documentation', subProject: SubProject, enabled: boolean): void;
}>();

const handleCommandAction = (command: 'edit' | 'delete', subProject: SubProject, textCommand: TextCommand) => {
  if (command === 'edit') emit('edit-command', subProject, textCommand);
  if (command === 'delete') emit('delete-command', subProject, textCommand);
};

// 根据图片宽高计算预览尺寸，等比例缩放
const getImagePreviewStyle = (content: SubProjectContent) => {
  if (!content.uploadedImage?.width || !content.uploadedImage?.height) {
    return { maxWidth: '100%', maxHeight: '400px' };
  }

  const maxWidth = 500; // 最大显示宽度
  const maxHeight = 400; // 最大显示高度
  const { width, height } = content.uploadedImage;
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
};
</script>
<style scoped>
.description-text {
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
