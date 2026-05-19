import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';

import { ErrorResponseFilter } from '@/common/filters';
import { loggerModuleOptions } from '@/common/logger/logger.config';
import { PrismaModule } from '@/prisma/prisma.module';
import { TodoModule } from '@/todo/todo.module';

@Module({
  imports: [LoggerModule.forRoot(loggerModuleOptions), PrismaModule, TodoModule],
  controllers: [],
  providers: [
    {
      provide: APP_FILTER,
      useClass: ErrorResponseFilter,
    },
  ],
})
export class AppModule {}
