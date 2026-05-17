# React 应用

## 适用范围

`apps/react/**`

## 技术栈

- Vite
- React
- TypeScript
- ESLint flat config
- Prettier

## 项目结构

- `src/main.tsx`：应用入口。
- `src/App.tsx`：根组件。
- `src/App.css`、`src/index.css`：样式入口。
- `src/assets/`：静态资源。
- `vite.config.ts`：Vite 配置。
- `tsconfig*.json`：TypeScript 配置。
- `eslint.config.js`：模块级 ESLint 配置。

## 编码约束

- 保持 Vite + React 项目结构，不引入新的路由、状态管理或 UI 框架，除非任务明确要求。
- React 组件和样式优先沿用当前目录风格。
- `@` 别名指向 `apps/react/src`，路径配置以 `vite.config.ts` 和 `tsconfig.app.json` 为准。
- 共享逻辑只有在跨 workspace 复用时才放入 `packages/*`；React 专属逻辑留在 `apps/react` 内。
- UI 改动需要本地预览；启动服务前先确认。

## 验证命令

常用命令见 `apps/react/package.json`：

```bash
pnpm build
pnpm lint
pnpm format
```

开发和预览命令涉及启动本地服务，执行前先确认。

## 事实来源

具体依赖、脚本和配置以 `apps/react/package.json`、`vite.config.ts`、`tsconfig*.json`、`eslint.config.js`、源码为准。
