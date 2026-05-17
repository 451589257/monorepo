# NestJS 服务

## 适用范围

`servers/nestjs/**`

## 技术栈

- NestJS
- Prisma
- SQLite
- Jest
- Swagger
- TypeScript

## 项目结构

- `src/main.ts`：服务启动入口和全局能力注册。
- `src/app.module.ts`：根模块。
- `src/common/`：通用响应、异常、拦截器、管道、DTO、工具。
- `src/prisma/`：Prisma 模块和服务。
- `src/todo/`：Todo 业务模块。
- `prisma/schema.prisma`：数据库模型和 datasource。
- `test/`：e2e 测试。

## 编码约束

- 保持 NestJS 分层：Controller 负责协议层，Service 负责业务逻辑，数据访问通过 Prisma 相关服务完成。
- 新业务优先按模块组织，模块内部放 controller、service、dto、测试。
- 通用能力放入 `src/common/`，业务专属逻辑不要提前抽到 common。
- 修改数据库模型时，同步考虑 Prisma 迁移、生成客户端和相关测试。
- 全局 Pipe、Filter、Interceptor 会影响所有接口，除非任务明确要求，不要随意新增或修改。
- `@/*` 指向 `servers/nestjs/src/*`，路径配置以 `tsconfig.json` 和测试配置为准。

## 验证命令

常用命令见 `servers/nestjs/package.json`：

```bash
pnpm build
pnpm lint
pnpm test
pnpm test:e2e
```

Prisma 命令见 `servers/nestjs/package.json`。涉及启动服务或 Prisma Studio 时，执行前先确认。

## 事实来源

具体依赖、脚本、DTO、路由、响应结构、数据库字段以 `servers/nestjs/package.json`、`src/`、`prisma/schema.prisma`、测试和配置文件为准。
