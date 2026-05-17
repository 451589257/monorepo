import { TodoStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class ListTodoBodyDto {
  /** 标题（模糊匹配） */
  @IsString({ message: 'title必须是字符串' })
  @IsOptional()
  title?: string;

  /** 状态 */
  @IsEnum(TodoStatus, { message: 'status必须是有效的枚举值' })
  @IsOptional()
  status?: TodoStatus;

  /** 更新时间 */
  @IsString({ message: 'updateTime必须是字符串' })
  @IsOptional()
  updateTime?: string;
}
