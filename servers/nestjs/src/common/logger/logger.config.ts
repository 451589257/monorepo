import { randomUUID } from 'node:crypto';
import type { IncomingMessage } from 'node:http';

import { ConfigService } from '@nestjs/config';
import type { Params } from 'nestjs-pino';

import { LogLevel, NodeEnv } from '@/common/config/env.validation';

/** 请求 ID 响应头名 */
export const REQUEST_ID_HEADER = 'X-Request-Uuid';
const REQUEST_ID_HEADER_LOWER = REQUEST_ID_HEADER.toLowerCase();

/** 上游已带则复用，否则生成 uuid */
const genReqId = (req: IncomingMessage): string => {
  const upstream = req.headers[REQUEST_ID_HEADER_LOWER];
  if (typeof upstream === 'string' && upstream.length > 0) return upstream;
  return randomUUID();
};

/** 噪声路径不打 HTTP 访问日志 */
const isIgnoredUrl = (url?: string) =>
  !!url && (url.startsWith('/api-docs') || url === '/favicon.ico');

/** 基于 ConfigService 构建 nestjs-pino 配置 */
export const buildLoggerOptions = (config: ConfigService): Params => {
  const nodeEnv = config.get<NodeEnv>('NODE_ENV', NodeEnv.Development);
  const isProd = nodeEnv === NodeEnv.Production;
  const logLevel = config.get<LogLevel>('LOG_LEVEL') ?? (isProd ? LogLevel.Info : LogLevel.Debug);

  /** 开发态控制台美化输出 */
  const consoleTarget = {
    target: 'pino-pretty',
    level: logLevel,
    options: {
      singleLine: true,
      colorize: true,
      translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
      ignore: 'pid,hostname,req,res,responseTime',
      messageFormat: '{context} {msg}',
    },
  };

  /** 按天滚动落盘，size 触发时追加序号 */
  const fileTarget = {
    target: 'pino-roll',
    level: 'info',
    options: {
      file: 'logs/app.log',
      frequency: 'daily',
      size: '10m',
      mkdir: true,
      dateFormat: 'yyyy-MM-dd',
    },
  };

  return {
    pinoHttp: {
      level: logLevel,
      genReqId,
      transport: {
        targets: [...(isProd ? [] : [consoleTarget]), fileTarget],
      },
      // 自定义请求日志的字段裁剪
      serializers: {
        req: (req: { method: string; url: string }) => ({
          method: req.method,
          url: req.url,
        }),
        res: (res: { statusCode: number }) => ({
          statusCode: res.statusCode,
        }),
      },
      autoLogging: {
        ignore: (req: { url?: string }) => isIgnoredUrl(req.url),
      },
      customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
      customSuccessMessage: (req, res, responseTime) => {
        const { method, url } = req as { method: string; url: string };
        return `${method} ${url} ${res.statusCode} - ${responseTime}ms`;
      },
      customErrorMessage: (req, res, err) => {
        const { method, url } = req as { method: string; url: string };
        return `${method} ${url} ${res.statusCode} - ${err.message}`;
      },
    },
  };
};
