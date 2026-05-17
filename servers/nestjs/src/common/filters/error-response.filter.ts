import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Response } from 'express';

import { CODE } from '@/common/code';

@Catch()
export class ErrorResponseFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let code: (typeof CODE)[keyof typeof CODE] = CODE.INTERNAL_ERROR;
    let msg: string | unknown[] | Record<string, unknown> = '服务器内部错误';

    if (exception) {
      const ex = exception as Record<string, unknown>;
      const exceptionResponse = ex.response;

      if (typeof exceptionResponse === 'string') {
        msg = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        // 优先取 message 字段（ValidationPipe 自定义消息）
        const rawMessage = (exceptionResponse as { message?: unknown }).message;
        if (Array.isArray(rawMessage)) {
          msg = (rawMessage[0] as string) ?? (ex.message as string);
        } else if (typeof rawMessage === 'string') {
          msg = rawMessage;
        } else {
          msg = ex.message as string;
        }
      } else {
        msg = (ex.message as string) || (exception as Error).message || '服务器内部错误';
      }

      const status = (exception as { status?: number }).status;
      if (status !== undefined) {
        code = status >= 500 ? CODE.INTERNAL_ERROR : CODE.FAIL;
      }
    }

    response.status(200).json({
      code,
      data: null,
      msg,
      success: false,
    });
  }
}
