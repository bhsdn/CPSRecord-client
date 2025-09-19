<template>
  <el-tag :type="tagType" :size="size" class="expiry-status">
    <el-icon class="mr-1">
      <Clock v-if="status === 'safe'" />
      <Warning v-else-if="status === 'warning'" />
      <Close v-else />
    </el-icon>
    {{ expiryText }}
  </el-tag>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Clock, Warning, Close } from "@element-plus/icons-vue";
import { useDateFormat } from "@/composables/useDateFormat";

type TagSize = "large" | "default" | "small";

interface Props {
  expiryDate: string;
  size?: TagSize;
}

const props = withDefaults(defineProps<Props>(), {
  size: "default" as TagSize,
});

const { getExpiryStatus, getExpiryText } = useDateFormat();

const status = computed(() => getExpiryStatus(props.expiryDate));
const expiryText = computed(() => getExpiryText(props.expiryDate));

const tagType = computed(() => {
  switch (status.value) {
    case "safe":
      return "success";
    case "warning":
      return "warning";
    case "danger":
      return "danger";
    default:
      return "info";
  }
});
</script>

<style scoped>
.expiry-status {
  display: inline-flex;
  align-items: center;
}
</style>
