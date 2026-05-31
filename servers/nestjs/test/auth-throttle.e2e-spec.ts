import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import { App } from 'supertest/types';

import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';

const THROTTLE_LIMIT = 3;

describe('Auth 限流 (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot({
          throttlers: [{ ttl: 60_000, limit: THROTTLE_LIMIT }],
        }),
      ],
      controllers: [AuthController],
      providers: [
        // 登录直接返回固定结果,聚焦验证限流而非业务逻辑
        {
          provide: AuthService,
          useValue: { login: jest.fn().mockResolvedValue({ accessToken: 'token' }) },
        },
        { provide: ConfigService, useValue: { get: () => undefined } },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('登录超过阈值后返回 429', async () => {
    const server = app.getHttpServer();
    const body = { username: 'alice', password: 'secret123' };

    // 前 limit 次放行
    for (let i = 0; i < THROTTLE_LIMIT; i++) {
      await request(server).post('/auth/login').send(body).expect(201);
    }

    // 第 limit+1 次被限流
    await request(server).post('/auth/login').send(body).expect(429);
  });
});
