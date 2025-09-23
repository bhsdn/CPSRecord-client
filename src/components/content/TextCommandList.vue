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

    <div v-else class="space-y-3">
      <div class="command-toolbar">
        <div class="text-xs text-slate-500">
          <span>{{ summaryText }}</span>
          <span v-if="selectedExpiredIds.length" class="ml-2 text-primary-600">
            已选择 {{ selectedExpiredIds.length }} 个过期口令
          </span>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <el-button size="small" plain :disabled="!hasExpired" @click="handleSelectAllExpired">
            {{ selectAllText }}
          </el-button>
          <el-button
            size="small"
            type="danger"
            plain
            :disabled="!hasSelected"
            @click="emitBulkDelete"
          >
            批量删除选中
          </el-button>
        </div>
      </div>

      <div ref="listRef" class="command-list">
        <div class="virtual-spacer" :style="{ height: `${commandList.length * ITEM_HEIGHT}px` }">
          <el-checkbox-group v-model="selectedExpiredIds">
            <el-timeline
              class="virtual-inner"
              :style="{ transform: `translateY(${visibleRange.offsetY}px)` }"
            >
              <el-timeline-item
                v-for="command in visibleCommands"
                :key="command.id"
                :timestamp="formatDate(command.updatedAt)"
                placement="top"
                type="primary"
              >
                <div class="command-item">
                  <div class="flex items-start justify-between gap-3">
                    <div class="flex-1">
                      <p class="text-sm font-medium text-slate-800">{{ command.commandText }}</p>
                      <p class="mt-1 text-xs text-slate-500">有效期：{{ command.expiryDays }} 天</p>
                    </div>
                    <ExpiryStatus :expiry-date="command.expiryDate" size="small" />
                  </div>

                  <div v-if="$slots.command" class="mt-3 text-sm text-slate-700">
                    <slot name="command" :command="command" />
                  </div>

                  <div class="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                    <el-checkbox
                      v-if="command.expiryStatus === 'danger'"
                      :label="command.id"
                      size="small"
                    >
                      选择过期口令
                    </el-checkbox>
                    <div class="ml-auto flex items-center gap-2">
                      <el-button type="primary" link size="small" @click="emit('edit', command)">
                        编辑
                      </el-button>
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
                </div>
              </el-timeline-item>
            </el-timeline>
          </el-checkbox-group>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import type { TextCommand } from "@/types";
import { Plus } from "@element-plus/icons-vue";
import ExpiryStatus from "@/components/content/ExpiryStatus.vue";
import { useDateFormat } from "@/composables/useDateFormat";
import { VirtualScroll } from "@/utils/performance";

const props = defineProps<{ commands: TextCommand[] }>();
const emit = defineEmits<{
  (e: "add"): void;
  (e: "edit", command: TextCommand): void;
  (e: "delete", command: TextCommand): void;
  (e: "bulk-delete", commands: TextCommand[]): void;
}>();

const ITEM_HEIGHT = 132;

type VisibleRange = {
  startIndex: number;
  endIndex: number;
  offsetY: number;
};

const { formatDate } = useDateFormat();
const commandList = computed(() => props.commands ?? []);

const listRef = ref<HTMLElement | null>(null);
const virtualScroll = ref<VirtualScroll | null>(null);
const visibleRange = ref<VisibleRange>({
  startIndex: 0,
  endIndex: commandList.value.length,
  offsetY: 0,
});

const selectedExpiredIds = ref<number[]>([]);

const expiredCommands = computed(() =>
  commandList.value.filter((command) => command.expiryStatus === "danger")
);
const expiredCommandIds = computed(() => expiredCommands.value.map((command) => command.id));
const selectedExpiredCommands = computed(() =>
  expiredCommands.value.filter((command) => selectedExpiredIds.value.includes(command.id))
);

const hasExpired = computed(() => expiredCommandIds.value.length > 0);
const hasSelected = computed(() => selectedExpiredIds.value.length > 0);
const selectAllText = computed(() =>
  selectedExpiredIds.value.length === expiredCommandIds.value.length && hasExpired.value
    ? "取消全选"
    : "全选过期"
);
const summaryText = computed(
  () => `过期 ${expiredCommandIds.value.length} / 总数 ${commandList.value.length}`
);

const visibleCommands = computed(() => {
  const { startIndex, endIndex } = visibleRange.value;
  if (startIndex === 0 && endIndex === 0) {
    return commandList.value;
  }
  return commandList.value.slice(startIndex, endIndex);
});

const destroyVirtualScroll = () => {
  if (listRef.value) {
    listRef.value.removeEventListener("scroll", handleScroll);
  }
  virtualScroll.value = null;
};

const updateVisibleRange = () => {
  if (!virtualScroll.value || !listRef.value) {
    visibleRange.value = {
      startIndex: 0,
      endIndex: commandList.value.length,
      offsetY: 0,
    };
    return;
  }
  virtualScroll.value.recalculate();
  visibleRange.value = virtualScroll.value.updateVisibleRange(
    listRef.value.scrollTop,
    commandList.value.length
  );
};

const handleScroll = () => {
  if (!virtualScroll.value || !listRef.value) return;
  visibleRange.value = virtualScroll.value.updateVisibleRange(
    listRef.value.scrollTop,
    commandList.value.length
  );
};

const setupVirtualScroll = () => {
  destroyVirtualScroll();
  if (!listRef.value) return;
  virtualScroll.value = new VirtualScroll(listRef.value, ITEM_HEIGHT);
  listRef.value.addEventListener("scroll", handleScroll, { passive: true });
  updateVisibleRange();
};

const handleResize = () => {
  if (!listRef.value || !virtualScroll.value) return;
  virtualScroll.value.recalculate();
  updateVisibleRange();
};

onMounted(() => {
  nextTick(() => {
    if (commandList.value.length) {
      setupVirtualScroll();
    }
  });
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  destroyVirtualScroll();
  window.removeEventListener("resize", handleResize);
});

watch(
  () => commandList.value.length,
  (count) => {
    if (!count) {
      destroyVirtualScroll();
      visibleRange.value = { startIndex: 0, endIndex: 0, offsetY: 0 };
      selectedExpiredIds.value = [];
      return;
    }
    nextTick(() => {
      if (!virtualScroll.value && listRef.value) {
        setupVirtualScroll();
      } else {
        updateVisibleRange();
      }
    });
  }
);

watch(
  commandList,
  () => {
    nextTick(() => {
      updateVisibleRange();
    });
  },
  { deep: true }
);

watch(expiredCommandIds, (ids) => {
  selectedExpiredIds.value = selectedExpiredIds.value.filter((id) => ids.includes(id));
});

const handleSelectAllExpired = () => {
  if (!hasExpired.value) return;
  if (selectedExpiredIds.value.length === expiredCommandIds.value.length) {
    selectedExpiredIds.value = [];
  } else {
    selectedExpiredIds.value = [...expiredCommandIds.value];
  }
};

const emitBulkDelete = () => {
  if (!selectedExpiredCommands.value.length) return;
  emit("bulk-delete", selectedExpiredCommands.value);
};

const clearSelection = () => {
  selectedExpiredIds.value = [];
};

defineExpose({ clearSelection });
</script>

<style scoped>
.command-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  background-color: #f1f5f9;
}

.command-list {
  max-height: 420px;
  overflow-y: auto;
  position: relative;
  padding-right: 4px;
}

.virtual-spacer {
  position: relative;
}

.virtual-inner {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}

.command-item {
  min-height: 120px;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background-color: #ffffff;
}

.command-item + .command-item {
  margin-top: 12px;
}

.lazy-loading {
  filter: blur(6px);
  transition: filter 0.3s ease;
}
</style>
