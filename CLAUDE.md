# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 约定
- 使用 pnpm + Turborepo（README 仍提到 Bun，但本仓库以 pnpm/turbo 脚本为准）
- 前端应用使用 Vite
- 后端为 NestJS（默认 Express）

## 常用命令（根目录）
- 安装依赖：pnpm install
- 开发：pnpm dev
- 构建：pnpm build
- Lint：pnpm lint
- 格式化：pnpm format
- 测试：pnpm test

## 包级命令（在包目录执行）
- apps/react：pnpm dev | build | lint | format | preview
- apps/vue3：pnpm dev | build | lint | format | preview
- servers/nestjs：pnpm dev | build | lint | test | start:prod 等
- packages/utils：pnpm build | lint | format

### 单测示例（NestJS）
- 在 servers/nestjs 执行：pnpm test -- app.controller.spec.ts

## 代码结构（高层）
- apps/：前端应用（React 与 Vue3），均依赖 @monorepo/utils
- packages/：共享包（utils 工具库）
- servers/：后端服务（NestJS 应用，入口为 src/main.ts）
- 根目录脚本通过 turbo 编排各包的 dev/build/lint/test
