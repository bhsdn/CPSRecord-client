﻿# Repository Guidelines

## 项目结构与模块组织
本仓库基于 Vite + Vue3 + TypeScript, 所有业务代码位于 `src` 目录，按职责拆分为 `components/`, `views/`, `stores/`, `composables/`, `utils/` 等子目录；全局样式与 Tailwind 配置集中在 `src/styles` 与根目录下的 `tailwind.config.cjs`。公共资源存放在 `public`，文档与产品说明整理在 `docs/` 与根目录 `PRD.md`，请保持新增模块的结构与现有目录一致。

## 构建、开发与测试命令
- `npm install`：安装依赖，推荐使用同版本 Node 与 npm。
- `npm run dev`：启动本地开发服务器（默认 http://localhost:5173）。
- `npm run build`：执行 `vue-tsc` 类型检查并构建产物到 `dist/`。
- `npm run preview`：基于构建结果启动只读预览服务。
- `npm run lint`：使用 ESLint 校验 `.ts/.vue` 代码。
- `npm run test:unit`：以 Vitest + jsdom 运行单元测试。

## 代码风格与命名约定
项目采用 TypeScript 与 `<script setup>` 组合式 API，组件与 store 使用帕斯卡命名（如 `ProjectList.vue`、`useProjectStore`），工具函数使用驼峰命名。请遵循两空格缩进、尾随逗号保留、单引号优先的 ESLint 规则，引用内部模块时优先使用 `@/` 路径别名。样式层面以 Tailwind 原子类为主，若需自定义样式应放在 `src/styles` 并通过 PostCSS 变量复用。

## 测试指引
单元测试使用 Vitest 搭配 `@vue/test-utils`，新测试文件应命名为 `*.spec.ts` 并放入与被测代码相邻的目录。提交前至少覆盖关键分支逻辑与 Pinia store 对外暴露的 action，确保 `npm run test:unit` 通过；若添加异步请求逻辑，请使用 axios mock 或测试用 fake server 保持测试可重复。

## 提交与合并请求规范
Git 历史遵循动词前缀格式（如 `feat:`, `bugfix:`, `docs:`），使用中英文结合的简洁描述；必须要追加中文说明。创建 PR 时请在描述中说明变更动机、主要实现点与回归影响，关联相关 Issue，并在涉及界面更新时附带截图或录屏，同时确认 lint 与测试命令均已通过。

## 配置与环境
示例环境变量位于根目录 `.env`，新增敏感配置请放入 `.env.local` 并在文档中说明使用方式。后端基础地址通过 `VITE_API_BASE_URL` 管理，若需连接不同环境，请同步更新 README 与部署说明，避免在源码中硬编码常量。
