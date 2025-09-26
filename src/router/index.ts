import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";

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
    },
  },
  {
    path: "/projects/:id",
    name: "ProjectDetail",
    component: () => import("@/views/ProjectDetail.vue"),
    meta: {
      title: "项目详情",
    },
  },
  {
    path: "/projects/:projectId/subprojects/:id",
    name: "SubProjectDetail",
    component: () => import("@/views/SubProjectDetail.vue"),
    meta: {
      title: "子项目管理",
    },
  },
  {
    path: "/content-types",
    name: "ContentManagement",
    component: () => import("@/views/ContentManagement.vue"),
    meta: {
      title: "内容类型管理",
    },
  },
  {
    path: "/documentation",
    name: "DocumentationCenter",
    component: () => import("@/views/DocumentationCenter.vue"),
    meta: {
      title: "文档中心",
    },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

router.beforeEach((to, _from, next) => {
  if (to.meta?.title) {
    document.title = `${to.meta.title} - CPS推广项目管理`;
  }
  next();
});

export default router;
