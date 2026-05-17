import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';

import { ErrorResponseFilter } from '../src/common/filters';
import { SuccessResponseInterceptor } from '../src/common/interceptors';
import { PrismaService } from '../src/prisma/prisma.service';
import { AppModule } from '../src/app.module';

describe('TodoController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: {
    $transaction: jest.Mock;
    todo: {
      findMany: jest.Mock;
      count: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn().mockResolvedValue([[], 0]),
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
    app.useGlobalPipes(
      new ValidationPipe({
        stopAtFirstError: true,
        whitelist: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );
    app.useGlobalInterceptors(new SuccessResponseInterceptor());
    app.useGlobalFilters(new ErrorResponseFilter());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/todo/list (POST)', async () => {
    await request(app.getHttpServer())
      .post('/todo/list?pageNum=1&pageSize=10')
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
