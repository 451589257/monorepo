import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';

import { AuthModule } from '@/auth/auth.module';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { validateEnv } from '@/common/config/env.schema';
import { ErrorResponseFilter } from '@/common/filters/error-response.filter';
import { LoggingInterceptor } from '@/common/logging/logging.interceptor';
import { ReqIdInterceptor } from '@/common/interceptors/req-id.interceptor';
import { SuccessResponseInterceptor } from '@/common/interceptors/success-response.interceptor';
import { buildLoggerOptions } from '@/common/logger/logger.config';
import { HealthModule } from '@/health/health.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { TodoModule } from '@/todo/todo.module';
import { UserModule } from '@/user/user.module';

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
    UserModule,
    AuthModule,
    TodoModule,
    HealthModule,
  ],
  controllers: [],
  providers: [
    // 全局守卫:默认所有接口需登录,使用 @Public() 跳过
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
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
