<template>
  <div class="not-found-page">
    <el-result icon="warning" title="404" sub-title="抱歉，您访问的页面不存在">
      <template #icon>
        <el-icon :size="100" class="text-slate-300">
          <WarningFilled />
        </el-icon>
      </template>
      <template #extra>
        <div class="space-y-3">
          <p class="text-sm text-slate-500">可能的原因：</p>
          <ul class="text-sm text-slate-600 space-y-1">
            <li>• 页面地址输入错误</li>
            <li>• 页面已被删除或移动</li>
            <li>• 链接已过期</li>
          </ul>
          <div class="flex justify-center gap-3 mt-6">
            <el-button type="primary" @click="goHome">
              <el-icon class="mr-1">
                <HomeFilled />
              </el-icon>
              返回首页
            </el-button>
            <el-button @click="goBack">
              <el-icon class="mr-1">
                <Back />
              </el-icon>
              返回上一页
            </el-button>
          </div>
        </div>
      </template>
    </el-result>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { WarningFilled, HomeFilled, Back } from "@element-plus/icons-vue";

const router = useRouter();

const goHome = () => {
  router.push("/");
};

const goBack = () => {
  router.back();
};
</script>

<style scoped>
.not-found-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 120px);
  padding: 2rem;
}

:deep(.el-result__title) {
  font-size: 3rem;
  font-weight: bold;
  color: #64748b;
}
</style>

