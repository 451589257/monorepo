import { Test, TestingModule } from '@nestjs/testing';
import { getLoggerToken, PinoLogger } from 'nestjs-pino';

import { PrismaService } from '@/prisma/prisma.service';
import { TodoService } from '@/todo/todo.service';

describe('TodoService', () => {
  let service: TodoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
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

    service = module.get<TodoService>(TodoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
