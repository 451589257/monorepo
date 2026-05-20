import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTodoDto {
  /** 标题 */
  @IsString({ message: '标题必须是字符串' })
  @IsNotEmpty({ message: '标题不能为空' })
  title!: string;

  /** 描述 */
  @IsString({ message: '描述必须是字符串' })
  @IsOptional()
  description?: string;
}
