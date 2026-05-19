import { Test, TestingModule } from '@nestjs/testing';
import { getLoggerToken, PinoLogger } from 'nestjs-pino';

import { PrismaService } from '@/prisma/prisma.service';
import { TodoController } from '@/todo/todo.controller';
import { TodoService } from '@/todo/todo.service';

describe('TodoController', () => {
  let controller: TodoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TodoController],
      providers: [
        TodoService,
        { provide: PrismaService, useValue: {} },
        {
          provide: PinoLogger,
          useValue: { setContext: jest.fn(), info: jest.fn(), debug: jest.fn() },
        },
        {
          provide: getLoggerToken(TodoService.name),
          useValue: { setContext: jest.fn(), info: jest.fn(), debug: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<TodoController>(TodoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
