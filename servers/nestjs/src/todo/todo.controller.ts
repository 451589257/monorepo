import { Body, Controller, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import type { JwtPayload } from '@/auth/types/jwt-payload.type';
import { LogRequest } from '@/common/logging/log-request.decorator';
import { PaginationDto } from '@/common/pagination/pagination.dto';
import { CustomParseIntPipe } from '@/common/pipes/parse-int.pipe';
import { CreateTodoDto } from '@/todo/dto/create-todo.dto';
import { ListTodoBodyDto } from '@/todo/dto/list-todo-body.dto';
import { UpdateTodoStatusDto } from '@/todo/dto/update-todo-status.dto';
import { UpdateTodoDto } from '@/todo/dto/update-todo.dto';
import { TodoService } from '@/todo/todo.service';

@ApiTags('Todo')
@ApiBearerAuth()
@LogRequest() // 类级别开启:本控制器下所有接口默认记录详细日志
@Controller('todo')
export class TodoController {
  constructor(private readonly todoService: TodoService) {}

  @ApiOperation({ summary: '创建待办' })
  @Post('create')
  create(@CurrentUser() user: JwtPayload, @Body() createTodoDto: CreateTodoDto) {
    return this.todoService.create(user.sub, createTodoDto);
  }

  @ApiOperation({ summary: '更新待办' })
  @Post('update/:id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', CustomParseIntPipe) id: number,
    @Body() updateTodoDto: UpdateTodoDto,
  ) {
    return this.todoService.update(user.sub, id, updateTodoDto);
  }

  @ApiOperation({ summary: '删除待办' })
  @Post('delete/:id')
  delete(@CurrentUser() user: JwtPayload, @Param('id', CustomParseIntPipe) id: number) {
    return this.todoService.delete(user.sub, id);
  }

  @ApiOperation({ summary: '更新待办状态' })
  @Post('updateStatus/:id')
  updateStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id', CustomParseIntPipe) id: number,
    @Body() updateTodoStatusDto: UpdateTodoStatusDto,
  ) {
    return this.todoService.updateStatus(user.sub, id, updateTodoStatusDto);
  }

  @ApiOperation({ summary: '分页查询待办列表' })
  // 列表接口响应较大，关闭 response 记录，避免日志过长
  @LogRequest({ response: false, slowMs: 500 })
  @Post('list')
  list(
    @CurrentUser() user: JwtPayload,
    @Query() query: PaginationDto,
    @Body() body: ListTodoBodyDto,
  ) {
    return this.todoService.list(user.sub, { ...query, ...body });
  }
}
