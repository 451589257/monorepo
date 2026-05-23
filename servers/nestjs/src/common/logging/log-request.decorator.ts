import { SetMetadata } from '@nestjs/common';

export const LOG_REQUEST_KEY = 'log:request';

export interface LogRequestOptions {
  /** 是否记录请求 body，默认 true */
  body?: boolean;
  /** 是否记录响应内容，默认 true */
  response?: boolean;
  /** 慢请求阈值（毫秒），超过则 warn，默认 1000 */
  slowMs?: number;
}

/**
 * 标记接口需要记录详细的请求/响应日志。
 *
 * 用法：
 *   @LogRequest()
 *   @LogRequest({ response: false, slowMs: 500 })
 */
export const LogRequest = (options: LogRequestOptions = {}) =>
  SetMetadata(LOG_REQUEST_KEY, {
    body: true,
    response: true,
    slowMs: 1000,
    ...options,
  } satisfies Required<LogRequestOptions>);
