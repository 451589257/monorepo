import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '@/prisma/prisma.service';
import { TodoController } from '@/todo/todo.controller';
import { TodoService } from '@/todo/todo.service';

describe('TodoController', () => {
  let controller: TodoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TodoController],
      providers: [TodoService, { provide: PrismaService, useValue: {} }],
    }).compile();

    controller = module.get<TodoController>(TodoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
