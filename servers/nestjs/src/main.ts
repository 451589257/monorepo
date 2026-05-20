import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';

import { AppModule } from '@/app.module';
import { setupSwagger } from '@/common/swagger/swagger.setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

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
