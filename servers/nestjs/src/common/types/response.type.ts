import type { CodeType } from '@/common/constants/code';

export interface Response<T = unknown> {
  code: CodeType;
  data: T;
  msg: string;
  success: boolean;
}
