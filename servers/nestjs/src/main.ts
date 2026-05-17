import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from '@/app.module';
import { ErrorResponseFilter } from '@/common/filters';
import { SuccessResponseInterceptor } from '@/common/interceptors';

async function bootstrap() {
  const port = process.env.PORT ?? 3000;
  const app = await NestFactory.create(AppModule);
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
  // 添加全局响应拦截器
  app.useGlobalInterceptors(new SuccessResponseInterceptor());
  // 添加全局异常过滤器
  app.useGlobalFilters(new ErrorResponseFilter());

  // 配置 Swagger 文档
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Nest Demo API')
    .setDescription('Todo 服务接口文档')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(port);
  console.log(`🚀 服务已启动: http://localhost:${port}`);
  console.log(`📖 接口文档: http://localhost:${port}/api-docs`);
}
void bootstrap();
