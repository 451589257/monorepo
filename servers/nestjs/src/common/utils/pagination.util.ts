import { PaginationDto } from '@/common/dto/pagination.dto';
import { ListResponse } from '@/common/interfaces/response.interface';

/**
 * 构造分页列表响应
 * @param list 当前页数据
 * @param total 总条数
 * @param pagination 分页参数（pageNum、pageSize）
 */
export function toList<T>(list: T[], total: number, pagination?: PaginationDto): ListResponse<T> {
  return {
    list,
    total,
    pageNum: pagination?.pageNum ?? 1,
    pageSize: pagination?.pageSize ?? 10,
  };
}
