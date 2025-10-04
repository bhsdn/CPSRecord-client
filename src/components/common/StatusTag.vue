<template>
  <el-tag :type="tagType" :size="size" :effect="effect">
    <el-icon v-if="showIcon" class="mr-1">
      <component :is="iconComponent" />
    </el-icon>
    <slot>{{ text }}</slot>
  </el-tag>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { SuccessFilled, WarningFilled, CircleCloseFilled, InfoFilled } from "@element-plus/icons-vue";
import type { ExpiryStatus } from "@/types";

interface Props {
  status: ExpiryStatus | "active" | "inactive" | "enabled" | "disabled" | string;
  text?: string;
  size?: "large" | "default" | "small";
  effect?: "dark" | "light" | "plain";
  showIcon?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  size: "default",
  effect: "light",
  showIcon: false,
});

const tagType = computed(() => {
  switch (props.status) {
    case "safe":
    case "active":
    case "enabled":
      return "success";
    case "warning":
      return "warning";
    case "danger":
    case "inactive":
    case "disabled":
      return "danger";
    default:
      return "info";
  }
});

const iconComponent = computed(() => {
  switch (props.status) {
    case "safe":
    case "active":
    case "enabled":
      return SuccessFilled;
    case "warning":
      return WarningFilled;
    case "danger":
    case "inactive":
    case "disabled":
      return CircleCloseFilled;
    default:
      return InfoFilled;
  }
});
</script>

