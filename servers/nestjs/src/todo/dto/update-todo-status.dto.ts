import { TodoStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateTodoStatusDto {
  /** 状态：PENDING、ACTIVE 或 DONE */
  @IsEnum(TodoStatus, { message: '状态必须是 PENDING、ACTIVE 或 DONE' })
  @IsNotEmpty({ message: '状态不能为空' })
  status!: TodoStatus;
}
