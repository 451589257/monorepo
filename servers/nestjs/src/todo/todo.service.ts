import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import dayjs from 'dayjs';
import { isNil, omitBy } from 'es-toolkit';

import { PaginationDto } from '@/common/dto/pagination.dto';
import { toList } from '@/common/utils/pagination.util';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateTodoDto } from '@/todo/dto/create-todo.dto';
import { ListTodoBodyDto } from '@/todo/dto/list-todo-body.dto';
import { UpdateTodoStatusDto } from '@/todo/dto/update-todo-status.dto';
import { UpdateTodoDto } from '@/todo/dto/update-todo.dto';

@Injectable()
export class TodoService {
  constructor(private readonly prisma: PrismaService) {}

  create(createTodoDto: CreateTodoDto) {
    return this.prisma.todo.create({ data: createTodoDto });
  }

  update(id: number, updateTodoDto: UpdateTodoDto) {
    return this.prisma.todo.update({
      where: { id },
      data: updateTodoDto,
    });
  }

  delete(id: number) {
    return this.prisma.todo.delete({ where: { id } });
  }

  updateStatus(id: number, updateTodoStatusDto: UpdateTodoStatusDto) {
    return this.prisma.todo.update({
      where: { id },
      data: { status: updateTodoStatusDto.status },
    });
  }

  async list(params: PaginationDto & Partial<ListTodoBodyDto>) {
    const { pageNum = 1, pageSize = 10, title, status, updateTime } = params;

    const updateTimeDate = updateTime ? dayjs(updateTime) : null;

    const where = omitBy(
      {
        title: title ? { contains: title } : undefined,
        status,
        updateTime: updateTimeDate?.isValid() ? { gte: updateTimeDate.toDate() } : undefined,
      },
      isNil,
    ) as Prisma.TodoWhereInput;

    const [list, total] = await this.prisma.$transaction([
      this.prisma.todo.findMany({
        where,
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
        orderBy: { updateTime: 'desc' },
      }),
      this.prisma.todo.count({ where }),
    ]);

    return toList(list, total, { pageNum, pageSize });
  }
}
