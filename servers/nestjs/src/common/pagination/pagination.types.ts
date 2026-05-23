export interface ListResponse<T = unknown> {
  list: T[];
  total: number;
  pageNum?: number;
  pageSize?: number;
}
