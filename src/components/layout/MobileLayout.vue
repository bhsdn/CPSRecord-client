<template>
  <div class="mobile-layout">
    <header class="mobile-header">
      <div class="header-content">
        <el-button v-if="showBack" type="text" size="large" @click="handleBack">
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
        <h1 class="header-title">{{ title }}</h1>
        <div class="header-actions">
          <slot name="actions" />
        </div>
      </div>
    </header>

    <main class="mobile-main">
      <slot />
    </main>

    <footer v-if="$slots.footer" class="mobile-footer">
      <slot name="footer" />
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft } from "@element-plus/icons-vue";
import { useRouter } from "vue-router";

interface Props {
  title: string;
  showBack?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showBack: true,
});

const router = useRouter();

const handleBack = () => {
  router.back();
};
</script>

<style scoped>
.mobile-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f5;
}

.mobile-header {
  background: white;
  border-bottom: 1px solid #e5e5e5;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  display: flex;
  align-items: center;
  padding: 0 16px;
  height: 56px;
  gap: 12px;
}

.header-title {
  flex: 1;
  text-align: center;
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.header-actions {
  min-width: 44px;
  display: flex;
  justify-content: flex-end;
}

.mobile-main {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.mobile-footer {
  background: white;
  border-top: 1px solid #e5e5e5;
  padding: 12px 16px;
}
</style>
