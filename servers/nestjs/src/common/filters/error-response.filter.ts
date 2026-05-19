import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';
import { PinoLogger } from 'nestjs-pino';

import { CODE } from '@/common/code';
import { REQUEST_ID_HEADER } from '@/common/logger/logger.config';

@Catch()
export class ErrorResponseFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(ErrorResponseFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { id?: string | number }>();

    // 异常路径下拦截器不执行，这里兜底把 reqId 写到响应头
    if (request.id !== undefined && !response.headersSent) {
      response.setHeader(REQUEST_ID_HEADER, String(request.id));
    }

    let code: (typeof CODE)[keyof typeof CODE] = CODE.INTERNAL_ERROR;
    let msg: string | unknown[] | Record<string, unknown> = '服务器内部错误';
    let status = 500;

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      status = exception.getStatus();

      if (typeof exceptionResponse === 'string') {
        msg = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const rawMessage = (exceptionResponse as { message?: unknown }).message;
        if (Array.isArray(rawMessage)) {
          msg = (rawMessage[0] as string) ?? exception.message;
        } else if (typeof rawMessage === 'string') {
          msg = rawMessage;
        } else {
          msg = exception.message;
        }
      } else {
        msg = exception.message;
      }

      code = status >= 500 ? CODE.INTERNAL_ERROR : CODE.FAIL;
    } else if (exception instanceof Error) {
      msg = exception.message || '服务器内部错误';
    }

    // 记录错误日志：5xx 用 error（带堆栈），4xx 用 warn
    const logPayload = {
      method: request.method,
      url: request.originalUrl ?? request.url,
      statusCode: status,
      msg,
    };
    if (status >= 500) {
      this.logger.error(
        { err: exception instanceof Error ? exception : undefined, ...logPayload },
        '请求异常',
      );
    } else {
      this.logger.warn(logPayload, '请求失败');
    }

    response.status(200).json({
      code,
      data: null,
      msg,
      success: false,
    });
  }
}
