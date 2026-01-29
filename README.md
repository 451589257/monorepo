# monorepo

## 项目简介
- Monorepo：pnpm workspaces + Turborepo
- 前端：Vite + React、Vite + Vue3
- 后端：NestJS（默认 Express）
- 共享包：packages/utils（@monorepo/utils）

## 目录结构
- apps/
  - react：React 应用
  - vue3：Vue3 应用
- servers/
  - nestjs：NestJS 服务端应用
- packages/
  - utils：共享工具库

## 入口文件
- React：apps/react/src/main.tsx
- Vue3：apps/vue3/src/main.ts
- NestJS：servers/nestjs/src/main.ts

## 常用命令（根目录）

安装依赖：

```bash
pnpm install
```

开发：

```bash
pnpm dev
```

构建：

```bash
pnpm build
```

Lint：

```bash
pnpm lint
```

格式化：

```bash
pnpm format
```

测试：

```bash
pnpm test
```

## 包级命令（在包目录执行）
- apps/react：pnpm dev | build | lint | format | preview
- apps/vue3：pnpm dev | build | lint | format | preview
- servers/nestjs：pnpm dev | build | lint | test | start:prod
- packages/utils：pnpm build | lint | format

## 任务编排（Turborepo）
- dev：常驻任务（persistent）
- build：输出到 dist/**
- format：不缓存（cache=false）
