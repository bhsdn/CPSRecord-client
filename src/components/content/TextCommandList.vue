<template>
  <el-card shadow="never" body-class="space-y-3">
    <template #header>
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-base font-semibold text-slate-800">文字口令</h3>
          <p class="text-xs text-slate-500">展示并管理该子项目下的所有文字口令</p>
        </div>
        <el-button type="primary" size="small" @click="emit('add')">
          <el-icon class="mr-1"><Plus /></el-icon>
          新增口令
        </el-button>
      </div>
    </template>

    <el-empty v-if="!commandList.length" description="暂无文字口令" />
    <el-timeline v-else>
      <el-timeline-item
        v-for="command in commandList"
        :key="command.id"
        :timestamp="formatDate(command.updatedAt)"
        placement="top"
        type="primary"
      >
        <div class="rounded-lg border border-slate-200 bg-white p-3">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm font-medium text-slate-800">{{ command.commandText }}</p>
              <p class="mt-1 text-xs text-slate-500">有效期：{{ command.expiryDays }} 天</p>
            </div>
            <ExpiryStatus :expiry-date="command.expiryDate" size="small" />
          </div>
          <div class="mt-3 flex justify-end gap-2 text-sm">
            <el-button type="primary" link size="small" @click="emit('edit', command)">编辑</el-button>
            <el-popconfirm
              title="确定删除该口令吗？"
              confirm-button-text="删除"
              cancel-button-text="取消"
              @confirm="emit('delete', command)"
            >
              <template #reference>
                <el-button type="danger" link size="small">删除</el-button>
              </template>
            </el-popconfirm>
          </div>
        </div>
      </el-timeline-item>
    </el-timeline>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { TextCommand } from "@/types";
import { Plus } from "@element-plus/icons-vue";
import ExpiryStatus from "@/components/content/ExpiryStatus.vue";
import { useDateFormat } from "@/composables/useDateFormat";

const props = defineProps<{ commands: TextCommand[] }>();
const emit = defineEmits<{
  (e: "add"): void;
  (e: "edit", command: TextCommand): void;
  (e: "delete", command: TextCommand): void;
}>();

const { formatDate } = useDateFormat();
const commandList = computed(() => props.commands ?? []);
</script>
