import { IsInt, IsOptional, Min } from 'class-validator';

export class PaginationDto {
  /** 页码，从 1 开始 */
  @Min(1, { message: '页码必须大于等于1' })
  @IsInt({ message: 'pageNum必须是数字' })
  @IsOptional()
  pageNum?: number = 1;

  /** 每页数量 */
  @Min(1, { message: '页码必须大于等于1' })
  @IsInt({ message: 'pageSize必须是数字' })
  @IsOptional()
  pageSize?: number = 10;
}
