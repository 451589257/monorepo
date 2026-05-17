import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '@/prisma/prisma.service';
import { TodoService } from '@/todo/todo.service';

describe('TodoService', () => {
  let service: TodoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TodoService, { provide: PrismaService, useValue: {} }],
    }).compile();

    service = module.get<TodoService>(TodoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
