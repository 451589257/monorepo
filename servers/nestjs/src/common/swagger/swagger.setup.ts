import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import pkg from '../../../package.json';

/** Swagger 文档挂载路径 */
export const SWAGGER_PATH = 'api-docs';

/**
 * 配置并挂载 Swagger 文档
 * @returns 文档访问路径，便于启动日志统一打印
 */
export function setupSwagger(app: INestApplication): string {
  const config = new DocumentBuilder()
    .setTitle('Nest Demo API')
    .setDescription('Todo 服务接口文档')
    .setVersion(pkg.version)
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(SWAGGER_PATH, app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  return SWAGGER_PATH;
}
