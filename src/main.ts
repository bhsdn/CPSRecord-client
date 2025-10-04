/**
 * 应用入口文件
 */

import { createApp } from "vue";
import { createPinia } from "pinia";
import ElementPlus from "element-plus";
import zhCn from "element-plus/dist/locale/zh-cn.mjs";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";

import App from "./App.vue";
import router from "./router";
import { setupErrorHandler } from "./utils/errorHandler";
import { logger } from "./utils/logger";

import "element-plus/dist/index.css";
import "./styles/index.css";

// 创建应用实例
const app = createApp(App);
const pinia = createPinia();

// 安装插件
app.use(pinia);
app.use(router);
app.use(ElementPlus, {
  locale: zhCn,
  size: "default",
});

// 注册全局图标组件
Object.entries(ElementPlusIconsVue).forEach(([name, component]) => {
  app.component(name, component);
});

// 设置全局错误处理
setupErrorHandler(app);

// 应用挂载
app.mount("#app");

// 应用启动日志
logger.info("CPS推广项目管理系统已启动", {
  version: import.meta.env.VITE_APP_VERSION || "1.0.0",
  env: import.meta.env.MODE,
  baseUrl: import.meta.env.VITE_API_BASE_URL,
});

// 开发环境下暴露logger到window
if (import.meta.env.DEV) {
  (window as any).__logger__ = logger;
  (window as any).__router__ = router;
  console.log("开发模式：已暴露 __logger__ 和 __router__ 到全局");
}
