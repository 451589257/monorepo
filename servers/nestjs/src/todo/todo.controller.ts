import { Body, Controller, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { PaginationDto } from '@/common/dto/pagination.dto';
import { CustomParseIntPipe } from '@/common/pipes/parse-int.pipe';
import { CreateTodoDto } from '@/todo/dto/create-todo.dto';
import { ListTodoBodyDto } from '@/todo/dto/list-todo-body.dto';
import { UpdateTodoStatusDto } from '@/todo/dto/update-todo-status.dto';
import { UpdateTodoDto } from '@/todo/dto/update-todo.dto';
import { TodoService } from '@/todo/todo.service';

@ApiTags('Todo')
@Controller('todo')
export class TodoController {
  constructor(private readonly todoService: TodoService) {}

  @ApiOperation({ summary: '创建待办' })
  @Post('create')
  create(@Body() createTodoDto: CreateTodoDto) {
    return this.todoService.create(createTodoDto);
  }

  @ApiOperation({ summary: '更新待办' })
  @Post('update/:id')
  update(@Param('id', CustomParseIntPipe) id: number, @Body() updateTodoDto: UpdateTodoDto) {
    return this.todoService.update(id, updateTodoDto);
  }

  @ApiOperation({ summary: '删除待办' })
  @Post('delete/:id')
  delete(@Param('id', CustomParseIntPipe) id: number) {
    return this.todoService.delete(id);
  }

  @ApiOperation({ summary: '更新待办状态' })
  @Post('updateStatus/:id')
  updateStatus(
    @Param('id', CustomParseIntPipe) id: number,
    @Body() updateTodoStatusDto: UpdateTodoStatusDto,
  ) {
    return this.todoService.updateStatus(id, updateTodoStatusDto);
  }

  @ApiOperation({ summary: '分页查询待办列表' })
  @Post('list')
  list(@Query() query: PaginationDto, @Body() body: ListTodoBodyDto) {
    return this.todoService.list({ ...query, ...body });
  }
}
