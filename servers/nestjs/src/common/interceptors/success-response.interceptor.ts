import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Response as ExpressResponse } from 'express';
import { map, Observable } from 'rxjs';

import { CODE } from '@/common/code';
import { Response } from '@/common/interfaces/response.interface';

@Injectable()
export class SuccessResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response> {
    // 统一将成功响应的 HTTP 状态码设置为 200
    const response = context.switchToHttp().getResponse<ExpressResponse>();
    response.status(HttpStatus.OK);

    return next.handle().pipe(
      map((data: unknown) => ({
        code: CODE.SUCCESS,
        data,
        msg: 'success',
        success: true,
      })),
    );
  }
}
