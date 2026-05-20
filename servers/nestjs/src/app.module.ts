import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';

import { validateEnv } from '@/common/config/env.validation';
import { ErrorResponseFilter } from '@/common/filters';
import {
  LoggingInterceptor,
  ReqIdInterceptor,
  SuccessResponseInterceptor,
} from '@/common/interceptors';
import { buildLoggerOptions } from '@/common/logger/logger.config';
import { PrismaModule } from '@/prisma/prisma.module';
import { TodoModule } from '@/todo/todo.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      // .env.{NODE_ENV} 优先于 .env；.env 只保留 Prisma CLI 需要的 DATABASE_URL
      envFilePath: [`.env.${process.env.NODE_ENV ?? 'development'}`, '.env'],
      validate: validateEnv,
    }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => buildLoggerOptions(config),
    }),
    PrismaModule,
    TodoModule,
  ],
  controllers: [],
  providers: [
    // 全局校验管道
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        stopAtFirstError: true,
        whitelist: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    },
    // 全局异常过滤器
    {
      provide: APP_FILTER,
      useClass: ErrorResponseFilter,
    },
    // 全局拦截器：reqId → logging → success（按声明顺序执行）
    {
      provide: APP_INTERCEPTOR,
      useClass: ReqIdInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: SuccessResponseInterceptor,
    },
  ],
})
export class AppModule {}
