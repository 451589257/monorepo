import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * 注册 → 登录 → 访问受保护接口 → 刷新 → 登出 完整链路 e2e。
 * 用内存版 Prisma 桩支撑真实业务流程,聚焦验证鉴权与 token 旋转,不依赖真实数据库。
 */
describe('Auth (e2e)', () => {
  let app: INestApplication<App>;

  // 内存态用户表与 refresh token 表
  const users: Array<{
    id: number;
    username: string;
    passwordHash: string;
    nickname: string | null;
    createTime: Date;
    updateTime: Date;
  }> = [];
  const refreshTokens: Array<{
    id: number;
    tokenHash: string;
    userId: number;
    expiresAt: Date;
    revokedAt: Date | null;
    createTime: Date;
  }> = [];
  let userSeq = 0;
  let rtSeq = 0;

  const prismaMock = {
    user: {
      findUnique: jest.fn(({ where }: { where: { username?: string; id?: number } }) => {
        const found = users.find(
          (u) =>
            (where.username !== undefined && u.username === where.username) ||
            (where.id !== undefined && u.id === where.id),
        );
        return Promise.resolve(found ?? null);
      }),
      create: jest.fn(
        ({ data }: { data: { username: string; passwordHash: string; nickname?: string } }) => {
          const now = new Date();
          const user = {
            id: ++userSeq,
            username: data.username,
            passwordHash: data.passwordHash,
            nickname: data.nickname ?? null,
            createTime: now,
            updateTime: now,
          };
          users.push(user);
          return Promise.resolve(user);
        },
      ),
      update: jest.fn(
        ({ where, data }: { where: { id: number }; data: { passwordHash: string } }) => {
          const user = users.find((u) => u.id === where.id)!;
          user.passwordHash = data.passwordHash;
          return Promise.resolve(user);
        },
      ),
    },
    refreshToken: {
      create: jest.fn(
        ({ data }: { data: { tokenHash: string; userId: number; expiresAt: Date } }) => {
          const record = {
            id: ++rtSeq,
            tokenHash: data.tokenHash,
            userId: data.userId,
            expiresAt: data.expiresAt,
            revokedAt: null,
            createTime: new Date(),
          };
          refreshTokens.push(record);
          return Promise.resolve(record);
        },
      ),
      findUnique: jest.fn(({ where }: { where: { tokenHash: string } }) => {
        return Promise.resolve(refreshTokens.find((t) => t.tokenHash === where.tokenHash) ?? null);
      }),
      update: jest.fn(({ where, data }: { where: { id: number }; data: { revokedAt: Date } }) => {
        const record = refreshTokens.find((t) => t.id === where.id)!;
        record.revokedAt = data.revokedAt;
        return Promise.resolve(record);
      }),
      updateMany: jest.fn(({ where }: { where: { userId: number; revokedAt: null } }) => {
        refreshTokens
          .filter((t) => t.userId === where.userId && t.revokedAt === null)
          .forEach((t) => (t.revokedAt = new Date()));
        return Promise.resolve({ count: 0 });
      }),
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const creds = { username: 'e2euser', password: 'secret123' };
  let accessToken = '';
  let refreshToken = '';

  it('注册成功返回 token', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(creds)
      .expect(200)
      .expect(({ body }) => {
        expect(body.success).toBe(true);
        expect(body.data.accessToken).toBeDefined();
        expect(body.data.refreshToken).toBeDefined();
        expect(body.data.user).not.toHaveProperty('passwordHash');
      });
  });

  it('重复注册返回失败', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(creds)
      .expect(409)
      .expect(({ body }) => {
        expect(body.success).toBe(false);
      });
  });

  it('登录成功返回 token', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send(creds)
      .expect(200)
      .expect(({ body }) => {
        expect(body.data.accessToken).toBeDefined();
        accessToken = body.data.accessToken;
        refreshToken = body.data.refreshToken;
      });
  });

  it('错误密码登录返回 401', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ ...creds, password: 'wrong' })
      .expect(401);
  });

  it('无 token 访问 /auth/me 返回 401', async () => {
    await request(app.getHttpServer()).get('/auth/me').expect(401);
  });

  it('携带 token 访问 /auth/me 成功', async () => {
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.data.username).toBe(creds.username);
      });
  });

  it('刷新 token:旧 refresh 失效,换发新 token', async () => {
    const oldRefresh = refreshToken;
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: oldRefresh })
      .expect(200)
      .expect(({ body }) => {
        expect(body.data.accessToken).toBeDefined();
        refreshToken = body.data.refreshToken;
      });

    // 旧 refresh 已被旋转撤销,再次使用应失败
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: oldRefresh })
      .expect(401);
  });

  it('登出后 refresh token 失效', async () => {
    await request(app.getHttpServer()).post('/auth/logout').send({ refreshToken }).expect(200);

    await request(app.getHttpServer()).post('/auth/refresh').send({ refreshToken }).expect(401);
  });
});
