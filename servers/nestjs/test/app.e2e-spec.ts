import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('TodoController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: {
    $transaction: jest.Mock;
    user: { findUnique: jest.Mock; create: jest.Mock };
    refreshToken: { create: jest.Mock };
    todo: {
      findMany: jest.Mock;
      count: jest.Mock;
    };
  };

  let accessToken = '';

  beforeAll(async () => {
    const user = {
      id: 1,
      username: 'todouser',
      passwordHash: '',
      nickname: null,
      createTime: new Date(),
      updateTime: new Date(),
    };

    prisma = {
      $transaction: jest.fn().mockResolvedValue([[], 0]),
      user: {
        // 注册:第一次查不到,创建后返回该用户
        findUnique: jest.fn().mockResolvedValueOnce(null).mockResolvedValue(user),
        create: jest.fn().mockImplementation(({ data }) => {
          user.passwordHash = data.passwordHash;
          return Promise.resolve(user);
        }),
      },
      refreshToken: {
        create: jest.fn().mockResolvedValue({}),
      },
      todo: {
        findMany: jest.fn().mockReturnValue([]),
        count: jest.fn().mockReturnValue(0),
      },
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // 注册一个用户拿 access token,供受保护的 todo 接口使用
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ username: 'todouser', password: 'secret123' });
    accessToken = res.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('未登录访问 /todo/list 返回 401', async () => {
    await request(app.getHttpServer())
      .post('/todo/list?pageNum=1&pageSize=10')
      .send({})
      .expect(401);
  });

  it('登录后 /todo/list (POST) 返回分页数据', async () => {
    await request(app.getHttpServer())
      .post('/todo/list?pageNum=1&pageSize=10')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual({
          code: 0,
          data: {
            list: [],
            total: 0,
            pageNum: 1,
            pageSize: 10,
          },
          msg: 'success',
          success: true,
        });
      });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });
});
