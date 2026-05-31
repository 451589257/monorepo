import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';

import { AppModule } from '@/app.module';
import { setupSwagger } from '@/common/swagger/swagger.setup';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });

  // 信任反向代理,使限流/日志能取到真实客户端 IP(X-Forwarded-For)
  app.set('trust proxy', 1);

  // 使用 nestjs-pino 接管全局日志
  const logger = app.get(Logger);
  app.useLogger(logger);

  // 挂载 Swagger 文档
  const swaggerPath = setupSwagger(app);

  const config = app.get(ConfigService);
  const port = config.get<number>('PORT', 3000);

  await app.listen(port);
  logger.log(`🚀 服务已启动: http://localhost:${port}`, 'Bootstrap');
  logger.log(`📖 接口文档: http://localhost:${port}/${swaggerPath}`, 'Bootstrap');
}
void bootstrap();
