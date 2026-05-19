import { ValidationPipe, type NestInterceptor } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { Logger } from 'nestjs-pino';

import { AppModule } from '@/app.module';
import {
  LoggingInterceptor,
  ReqIdInterceptor,
  SuccessResponseInterceptor,
} from '@/common/interceptors';
import { setupSwagger } from '@/common/swagger/swagger.setup';

async function bootstrap() {
  const port = process.env.PORT ?? 3000;
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // 使用 nestjs-pino 接管全局日志
  const logger = app.get(Logger);
  app.useLogger(logger);

  // 添加全局管道
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

  // 拦截器顺序：reqId → logging → success
  // - ReqIdInterceptor   先把 reqId 写到响应头
  // - LoggingInterceptor 记录原始业务返回值（在包装之前）
  // - SuccessResponseInterceptor 统一包装为 {code,data,msg}
  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(
    new ReqIdInterceptor(),
    new LoggingInterceptor(reflector),
    new SuccessResponseInterceptor(),
  );
  // 全局异常过滤器通过 APP_FILTER 注册（参见 AppModule）

  // 挂载 Swagger 文档
  const swaggerPath = setupSwagger(app);

  await app.listen(port);
  logger.log(`🚀 服务已启动: http://localhost:${port}`, 'Bootstrap');
  logger.log(`📖 接口文档: http://localhost:${port}/${swaggerPath}`, 'Bootstrap');
}
void bootstrap();
