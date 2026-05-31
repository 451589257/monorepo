import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import dayjs from 'dayjs';
import { isNil, omitBy } from 'es-toolkit';
import { PinoLogger } from 'nestjs-pino';

import { PaginationDto } from '@/common/pagination/pagination.dto';
import { toList } from '@/common/pagination/pagination.util';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateTodoDto } from '@/todo/dto/create-todo.dto';
import { ListTodoBodyDto } from '@/todo/dto/list-todo-body.dto';
import { UpdateTodoStatusDto } from '@/todo/dto/update-todo-status.dto';
import { UpdateTodoDto } from '@/todo/dto/update-todo.dto';

@Injectable()
export class TodoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(TodoService.name);
  }

  async create(userId: number, createTodoDto: CreateTodoDto) {
    const todo = await this.prisma.todo.create({ data: { ...createTodoDto, userId } });
    this.logger.info({ id: todo.id, userId }, '创建 Todo 成功');
    return todo;
  }

  async update(userId: number, id: number, updateTodoDto: UpdateTodoDto) {
    await this.ensureOwned(userId, id);
    const todo = await this.prisma.todo.update({
      where: { id },
      data: updateTodoDto,
    });
    this.logger.info({ id, userId }, '更新 Todo 成功');
    return todo;
  }

  async delete(userId: number, id: number) {
    await this.ensureOwned(userId, id);
    const todo = await this.prisma.todo.delete({ where: { id } });
    this.logger.info({ id, userId }, '删除 Todo 成功');
    return todo;
  }

  async updateStatus(userId: number, id: number, updateTodoStatusDto: UpdateTodoStatusDto) {
    await this.ensureOwned(userId, id);
    const todo = await this.prisma.todo.update({
      where: { id },
      data: { status: updateTodoStatusDto.status },
    });
    this.logger.info({ id, userId, status: updateTodoStatusDto.status }, '更新 Todo 状态成功');
    return todo;
  }

  async list(userId: number, params: PaginationDto & Partial<ListTodoBodyDto>) {
    const { pageNum = 1, pageSize = 10, title, status, updateTime } = params;

    const updateTimeDate = updateTime ? dayjs(updateTime) : null;

    const where = omitBy(
      {
        userId,
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

    this.logger.debug({ pageNum, pageSize, total, userId }, '查询 Todo 列表');
    return toList(list, total, { pageNum, pageSize });
  }

  /** 校验 Todo 存在且属于当前用户,否则抛 404(不暴露他人数据的存在性) */
  private async ensureOwned(userId: number, id: number) {
    const todo = await this.prisma.todo.findFirst({ where: { id, userId } });
    if (!todo) {
      throw new NotFoundException('待办不存在');
    }
    return todo;
  }
}
