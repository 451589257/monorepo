# 共享工具包

## 适用范围

`packages/utils/**`

## 技术栈

- TypeScript
- ESLint flat config
- Prettier

## 项目结构

- `src/index.ts`：包入口。
- `dist/`：构建产物。
- `package.json`：包名、导出入口和脚本。
- `tsconfig.json`：构建配置。
- `eslint.config.js`：模块级 ESLint 配置。

## 编码约束

- 包名为 `@monorepo/utils`，面向跨 workspace 复用。
- 只放通用、稳定、可复用的工具逻辑；单一应用或服务专属逻辑不要放入共享包。
- 对外 API 应保持兼容，破坏性变更需要明确影响范围和迁移方式。
- 新增导出时从 `src/index.ts` 统一管理。
- 不依赖具体 app 或 server，避免形成反向耦合。

## 验证命令

常用命令见 `packages/utils/package.json`：

```bash
pnpm build
pnpm lint
pnpm format
```

## 事实来源

具体导出、脚本、构建产物和类型声明以 `packages/utils/package.json`、`src/`、`tsconfig.json` 为准。
