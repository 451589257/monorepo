import { Module } from '@nestjs/common';

import { PrismaModule } from '@/prisma/prisma.module';
import { TodoModule } from '@/todo/todo.module';

@Module({
  imports: [PrismaModule, TodoModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
