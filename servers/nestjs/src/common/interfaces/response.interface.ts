export interface Response<T = unknown> {
  code: number;
  data: T;
  msg: string;
  success: boolean;
}

export interface ListResponse<T = unknown> {
  list: T[];
  total: number;
  pageNum?: number;
  pageSize?: number;
}
