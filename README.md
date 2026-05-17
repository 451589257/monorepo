# monorepo

## 项目简介

这是一个 TypeScript Monorepo，用 pnpm workspaces 管理包，用 Turborepo 编排任务。

- 前端应用：React、Vue3
- 后端服务：NestJS
- 共享包：`@monorepo/utils`
- 数据访问：Prisma
- 包管理：pnpm

## 环境

- Node.js：22，见 `mise.toml`
- pnpm：10，见 `package.json`

## 工作区地图

```text
.
├── apps/
│   ├── react/      # React 前端应用
│   └── vue3/       # Vue3 前端应用
├── servers/
│   └── nestjs/     # NestJS API 服务
├── packages/
│   └── utils/      # 共享工具包
└── docs/           # 按需读取的架构与模块文档
```

workspace 范围见 `pnpm-workspace.yaml`：

- `apps/*`
- `servers/*`
- `packages/*`

## 模块入口

| 模块 | 职责 | 入口/索引 |
| --- | --- | --- |
| `apps/react` | React 前端应用 | `apps/react/src/main.tsx` |
| `apps/vue3` | Vue3 前端应用 | `apps/vue3/src/main.ts` |
| `servers/nestjs` | NestJS API 服务 | `servers/nestjs/src/main.ts` |
| `packages/utils` | 共享工具包 | `packages/utils/src/index.ts` |

## 深入文档

README 只提供项目地图。需要更多背景或局部编码约束时，按任务读取对应文档：

| 文档 | 内容 |
| --- | --- |
| [docs/architecture.md](docs/architecture.md) | 整体架构、workspace 边界、跨模块约定 |
| [docs/apps-vue3.md](docs/apps-vue3.md) | Vue3 应用结构、技术栈、局部编码约束 |
| [docs/apps-react.md](docs/apps-react.md) | React 应用结构、技术栈、局部编码约束 |
| [docs/servers-nestjs.md](docs/servers-nestjs.md) | NestJS 服务结构、技术栈、局部编码约束 |
| [docs/packages-utils.md](docs/packages-utils.md) | 共享工具包结构、导出约定、兼容性要求 |

## 关键文件

| 文件 | 用途 |
| --- | --- |
| `package.json` | 根脚本、包管理器版本、公共开发依赖 |
| `pnpm-workspace.yaml` | workspace 范围 |
| `turbo.json` | Turborepo 任务编排 |
| `tsconfig.base.json` | TypeScript 基础配置 |
| `eslint.config.js` | 根 ESLint flat config |
| `servers/nestjs/prisma/schema.prisma` | Prisma 数据模型 |

## 常用命令

在根目录执行：

```bash
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm format
pnpm test
```

只启动 NestJS 服务：

```bash
pnpm dev:nest
```

包级脚本以对应目录下的 `package.json` 为准。

## 查找上下文

执行具体任务时，先通过 README 定位相关 docs，再优先读取目标模块的代码、配置和测试：

- 修改前端：查看对应 `apps/*/package.json`、入口文件、组件和样式。
- 修改 NestJS：查看 `servers/nestjs/package.json`、目标模块、测试和 Prisma 配置。
- 修改共享逻辑：查看 `packages/*/package.json`、源码入口和使用方。
- 修改构建/工程配置：查看根 `package.json`、`turbo.json`、`pnpm-workspace.yaml` 和相关 tsconfig/eslint 配置。

README 和 docs 是索引与辅助说明。若文档与代码或配置不一致，以代码和配置为准。

## 约定

- `dist/`、`.turbo/`、`node_modules/` 是产物或缓存，不作为源码上下文来源。
- `.env` 和包含凭据的信息不得提交。
- 需要本地启动服务或预览 UI 时，先确认再启动。
