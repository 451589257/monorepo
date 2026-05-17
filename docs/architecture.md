# 整体架构

## 适用范围

仓库根目录、workspace 编排、跨模块依赖和工程配置。

## 分层职责

- `apps/*`：前端应用，面向浏览器运行。
- `servers/*`：服务端应用，面向 API 或后端运行。
- `packages/*`：跨 workspace 复用的库和工具。
- `docs/*`：按需读取的项目说明和模块级约束。

## 工作区边界

workspace 范围由 `pnpm-workspace.yaml` 定义：

- `apps/*`
- `servers/*`
- `packages/*`

新增模块时优先放入既有边界：

- 新前端应用放入 `apps/`。
- 新后端服务放入 `servers/`。
- 可跨应用复用的逻辑放入 `packages/`。

## 任务编排

根目录通过 Turborepo 统一编排 workspace 脚本：

- 根脚本见 `package.json`。
- 任务依赖和缓存规则见 `turbo.json`。
- 包级脚本以各 workspace 的 `package.json` 为准。

## 依赖方向

- 应用和服务可以依赖 `packages/*`。
- `packages/*` 不应反向依赖具体应用或服务。
- 跨模块共享逻辑应先确认是否确实复用，避免为了单次使用提前抽象。

## 配置来源

- Node 和 pnpm 版本见 `mise.toml`、根 `package.json`。
- TypeScript 基础规则见 `tsconfig.base.json`。
- ESLint 根配置见 `eslint.config.js`。
- 模块级覆盖配置见对应 workspace 目录。

## 验证入口

常用根命令：

```bash
pnpm build
pnpm lint
pnpm test
```

具体任务优先在受影响 workspace 内运行更小范围的验证命令。

## 事实来源

本文只描述稳定边界和查找路径。具体脚本、依赖、构建输出、缓存策略以代码和配置文件为准。
