# Vue3 应用

## 适用范围

`apps/vue3/**`

## 技术栈

- Vite
- Vue 3
- TypeScript
- ESLint flat config
- Prettier

## 项目结构

- `src/main.ts`：应用入口。
- `src/App.vue`：根组件。
- `src/components/`：Vue 组件。
- `src/assets/`：静态资源。
- `src/style.css`：全局样式。
- `vite.config.ts`：Vite 配置。
- `tsconfig*.json`：TypeScript 配置。
- `eslint.config.js`：模块级 ESLint 配置。

## 编码约束

- 保持 Vite + Vue 3 项目结构，不引入新的路由、状态管理或 UI 框架，除非任务明确要求。
- Vue 单文件组件优先使用现有风格；修改组件前先查看同目录已有组件。
- `@` 别名指向 `apps/vue3/src`，路径配置以 `vite.config.ts` 和 `tsconfig.app.json` 为准。
- 共享逻辑只有在跨 workspace 复用时才放入 `packages/*`；Vue3 专属逻辑留在 `apps/vue3` 内。
- UI 改动需要本地预览；启动服务前先确认。

## 验证命令

常用命令见 `apps/vue3/package.json`：

```bash
pnpm build
pnpm lint
pnpm format
```

开发和预览命令涉及启动本地服务，执行前先确认。

## 事实来源

具体依赖、脚本和配置以 `apps/vue3/package.json`、`vite.config.ts`、`tsconfig*.json`、`eslint.config.js`、源码为准。
