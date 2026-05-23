import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { tap } from 'rxjs';
import type { Observable } from 'rxjs';

import { LOG_REQUEST_KEY, type LogRequestOptions } from '@/common/logging/log-request.decorator';

// 敏感字段，记录前替换为 ***
const SENSITIVE_KEYS = new Set([
  'password',
  'pwd',
  'token',
  'accesstoken',
  'refreshtoken',
  'authorization',
  'secret',
  'apikey',
]);

// 单条日志中 payload 的最大长度，超过会截断，避免大响应撑爆日志
const MAX_PAYLOAD_LENGTH = 2000;

function sanitize(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(sanitize);
  if (typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
      result[key] = SENSITIVE_KEYS.has(key.toLowerCase()) ? '***' : sanitize(v);
    }
    return result;
  }
  return value;
}

function truncate(payload: unknown): unknown {
  try {
    const str = JSON.stringify(payload);
    if (str && str.length > MAX_PAYLOAD_LENGTH) {
      return `${str.slice(0, MAX_PAYLOAD_LENGTH)}...[truncated ${str.length - MAX_PAYLOAD_LENGTH} chars]`;
    }
    return payload;
  } catch {
    return '[unserializable]';
  }
}

type ReqLogger = {
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
};

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request & { log?: ReqLogger }>();
    const start = Date.now();

    // 仅在贴了 @LogRequest 的接口上记录详情；未贴注解的接口由 pino-http 输出基础访问日志即可
    const options = this.reflector.getAllAndOverride<Required<LogRequestOptions> | undefined>(
      LOG_REQUEST_KEY,
      [context.getHandler(), context.getClass()],
    );

    const reqLog = request.log;
    const slowMs = options?.slowMs ?? 1000;

    return next.handle().pipe(
      tap({
        next: (data) => {
          if (!reqLog) return;
          const cost = Date.now() - start;

          if (options) {
            const payload: Record<string, unknown> = {
              type: 'request',
              method: request.method,
              url: request.originalUrl,
              query: sanitize(request.query),
              cost,
            };
            if (options.body) payload.body = sanitize(request.body);
            if (options.response) payload.response = truncate(sanitize(data));

            if (cost >= slowMs) {
              reqLog.warn({ ...payload, slowMs }, '慢请求');
            } else {
              reqLog.info(payload, '请求详情');
            }
            return;
          }

          // 未贴注解：仅做慢请求兜底，不打 body/response
          if (cost >= slowMs) {
            reqLog.warn(
              {
                type: 'request',
                method: request.method,
                url: request.originalUrl,
                cost,
                slowMs,
              },
              '慢请求',
            );
          }
        },
        error: (err: Error) => {
          if (!reqLog) return;
          const cost = Date.now() - start;
          reqLog.warn(
            {
              type: 'request',
              method: request.method,
              url: request.originalUrl,
              query: sanitize(request.query),
              body: options?.body !== false ? sanitize(request.body) : undefined,
              error: err?.message,
              cost,
            },
            '请求异常',
          );
        },
      }),
    );
  }
}
