# NestJS 服务镜像(多阶段构建)
# 构建上下文为仓库根目录,在根目录执行:
#   docker build -f servers/nestjs/Dockerfile -t monorepo-nestjs .
# 运行:
#   docker run -p 3000:3000 --env-file servers/nestjs/.env.production monorepo-nestjs

# ---------- 基础层:启用 pnpm ----------
FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
# Prisma 引擎在 debian-slim 下需要 openssl
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /repo

# ---------- 依赖层:仅装 nestjs 子包依赖 ----------
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY servers/nestjs/package.json servers/nestjs/package.json
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --filter nestjs... --frozen-lockfile

# ---------- 构建层:生成 Prisma Client 并编译 ----------
FROM deps AS build
COPY servers/nestjs servers/nestjs
WORKDIR /repo/servers/nestjs
RUN pnpm prisma generate
RUN pnpm build

# ---------- 运行层:仅保留生产依赖与产物 ----------
FROM base AS runner
ENV NODE_ENV=production
WORKDIR /repo

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY servers/nestjs/package.json servers/nestjs/package.json
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --filter nestjs... --frozen-lockfile --prod

WORKDIR /repo/servers/nestjs
# 编译产物、Prisma schema 与生成的 client
COPY --from=build /repo/servers/nestjs/dist ./dist
COPY --from=build /repo/servers/nestjs/prisma ./prisma
COPY --from=build /repo/servers/nestjs/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3000
CMD ["node", "dist/src/main.js"]
