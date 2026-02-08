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
type: 简要标题
# 或
type(scope): 简要标题

- 要点1（可写影响范围，如 nestjs / apps/vue3 / packages/utils）
- 要点2
- 要点3
```

- 标题要求：
  - `type` 必填；`scope` 可选（涉及明确模块时建议加）
  - 标题一句话概括改动主题，避免空泛描述

- body 要求：
  - 使用 bullet 列表逐条说明“做了什么”
  - 以重点概况为主，可按复杂度展开，不限制条目数量
  - 涉及多个模块时，建议在条目内标明影响范围

- 示例（无 scope）：

```text
feat: 重构 usePagination 与 useForm，新增无限加载与事件多播支持

- 重构 usePagination，移除 table/page 嵌套对象，改为扁平化属性返回，提升使用便捷性
- 新增 append 模式支持无限加载场景，增加 loadingMore、hasMore、loadMore 等状态与方法
- 支持 data 异步提取与 dedupeKey 去重配置，优化大数据列表处理
- 将 onSuccess/onError/onComplete 改为多播订阅模式，支持重复注册多个回调
- 优化 useForm，send 方法支持返回 undefined/null 视为成功，新增 messages 文案配置覆盖默认错误提示
- 统一 useForm 错误返回结构，区分重复提交、后端失败、请求异常三种场景
- 优化 v-input-filter 指令，增加输入法合成阶段处理与事件清理，修复 IME 输入异常
- 新增 usePagination 与 useForm 完整单元测试覆盖
- 更新相关文档、示例代码，为 playground 集成 UnoCSS 并重构样式
```

- 示例（有 scope）：

```text
feat(servers/nestjs): 优化用户查询接口与缓存策略

- 调整查询参数与默认分页行为，减少慢查询
- 新增 Redis 缓存与失效逻辑，降低接口平均耗时
- 补充 e2e 测试与接口文档说明
```

- 前缀按场景选择：
  - `feat`：新增功能或能力
  - `fix`：修复缺陷或异常行为
  - `chore`：依赖、脚本、工程配置等杂务变更
  - `docs`：文档内容变更
  - `refactor`：重构（不新增功能、不修复缺陷）
  - `test`：测试用例或测试配置变更
  - `style`：仅代码风格或格式调整
  - `perf`：性能优化
  - `ci`：CI/CD 流程与配置变更
  - `build`：构建系统或打包配置变更

## 输出要求
- 明确列出改动文件与验证命令
