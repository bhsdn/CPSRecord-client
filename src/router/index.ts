/**
 * 路由配置
 */

import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw, RouteLocationNormalized, NavigationGuardNext } from "vue-router";
import { ElMessage } from "element-plus";

/**
 * 扩展路由元信息
 */
declare module "vue-router" {
  interface RouteMeta {
    title?: string;
    keepAlive?: boolean;
    requiresAuth?: boolean;
    permissions?: string[];
    icon?: string;
    breadcrumb?: boolean;
    hidden?: boolean;
  }
}

/**
 * 路由配置
 */
const routes: RouteRecordRaw[] = [
  {
    path: "/",
    redirect: "/projects",
  },
  {
    path: "/projects",
    name: "ProjectList",
    component: () => import("@/views/ProjectList.vue"),
    meta: {
      title: "项目管理",
      keepAlive: true,
      icon: "Collection",
      breadcrumb: true,
    },
  },
  {
    path: "/projects/:id",
    name: "ProjectDetail",
    component: () => import("@/views/ProjectDetail.vue"),
    meta: {
      title: "项目详情",
      icon: "Document",
      breadcrumb: true,
    },
  },
  {
    path: "/projects/:projectId/subprojects/:id",
    name: "SubProjectDetail",
    component: () => import("@/views/SubProjectDetail.vue"),
    meta: {
      title: "子项目详情",
      icon: "Folder",
      breadcrumb: true,
    },
  },
  {
    path: "/content-types",
    name: "ContentManagement",
    component: () => import("@/views/ContentManagement.vue"),
    meta: {
      title: "内容类型管理",
      icon: "Setting",
      breadcrumb: true,
    },
  },
  {
    path: "/documentation",
    name: "DocumentationCenter",
    component: () => import("@/views/DocumentationCenter.vue"),
    meta: {
      title: "文档中心",
      icon: "DocumentCopy",
      keepAlive: true,
      breadcrumb: true,
    },
  },
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: () => import("@/views/NotFound.vue"),
    meta: {
      title: "页面不存在",
      hidden: true,
    },
  },
];

/**
 * 创建路由实例
 */
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }
    return { top: 0, behavior: "smooth" };
  },
});

/**
 * 全局前置守卫
 */
router.beforeEach((to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
  // 设置页面标题
  if (to.meta?.title) {
    document.title = `${to.meta.title} - CPS推广项目管理系统`;
  } else {
    document.title = "CPS推广项目管理系统";
  }

  // 权限验证（未来功能）
  if (to.meta?.requiresAuth) {
    const token = localStorage.getItem("cps_token");
    if (!token) {
      ElMessage.warning("请先登录");
      next({ name: "Login", query: { redirect: to.fullPath } });
      return;
    }
  }

  // 打印路由导航日志（开发环境）
  if (import.meta.env.DEV) {
    console.log(`[Router] ${from.path} -> ${to.path}`);
  }

  next();
});

/**
 * 全局后置钩子
 */
router.afterEach((to: RouteLocationNormalized) => {
  // 页面加载完成后的处理
  if (import.meta.env.DEV) {
    console.log(`[Router] Navigation completed: ${to.path}`);
  }
});

/**
 * 全局错误处理
 */
router.onError((error) => {
  console.error("[Router Error]", error);
  ElMessage.error("页面加载失败，请刷新重试");
});

export default router;
