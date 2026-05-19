import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Request, Response } from 'express';
import type { Observable } from 'rxjs';

import { REQUEST_ID_HEADER } from '@/common/logger/logger.config';

/**
 * 把 pino-http 注入到 req 上的 reqId（uuid）写到响应头 X-Request-Uuid，
 * 便于前端报错时携带，快速定位日志。
 */
@Injectable()
export class ReqIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request & { id?: string | number }>();
    const response = http.getResponse<Response>();

    const reqId = request.id;
    if (reqId !== undefined && !response.headersSent) {
      response.setHeader(REQUEST_ID_HEADER, String(reqId));
    }

    return next.handle();
  }
}
