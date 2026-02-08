# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 约定
- 使用 pnpm + Turborepo（本仓库以 pnpm/turbo 脚本为准）
- 前端应用使用 Vite
- 后端为 NestJS（默认 Express）

## 通用工作原则（必须遵守）
- 变更最小化：只改与任务直接相关的内容，避免顺手重构/大范围格式化
- 依赖与锁文件：除非用户明确要求，否则不要新增/删除依赖，也不要修改 `pnpm-lock.yaml`
- 风格一致：遵循仓库现有代码风格与配置（见 `.prettierrc`、`eslint.config.js`）
- 可验证输出：完成后给出可复现的验证命令（优先在受影响包内运行）
- 安全修改：不做破坏性命令（如 `rm -rf`、`git reset --hard`）除非用户明确要求

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

## NestJS 规则（仅当修改 `servers/nestjs/**` 时必须遵守）
- 保持 NestJS 分层与依赖注入风格：Controller 只做协议层，业务逻辑放到 Service
- 不新增全局中间件/全局 Pipe/全局 Filter，除非用户明确要求并说明影响范围
- 不新增 DTO/校验依赖（例如 `class-validator` / `class-transformer`），除非用户明确要求

## 前端规则（仅当修改 `apps/**` 时必须遵守）
- 保持 Vite 项目结构与现有风格，不随意更换构建/路由/状态管理方案
- 组件与样式遵循现有写法与目录组织方式（优先参考同目录已有代码）

## 共享包规则（仅当修改 `packages/**` 时必须遵守）
- 保持工具库 API 稳定性：不做破坏性改动，除非用户明确要求并注明迁移影响

## 提交规则（必须遵守）
- 提交信息格式如下：

```text
feat: xxxx

- xxxx
- xxxx
- xxx
```

## 输出要求
- 明确列出改动文件与验证命令
