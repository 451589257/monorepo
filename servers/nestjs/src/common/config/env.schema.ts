import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

export enum NodeEnv {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export enum LogLevel {
  Trace = 'trace',
  Debug = 'debug',
  Info = 'info',
  Warn = 'warn',
  Error = 'error',
  Fatal = 'fatal',
  Silent = 'silent',
}

export class EnvVars {
  @IsEnum(NodeEnv)
  @IsOptional()
  NODE_ENV: NodeEnv = NodeEnv.Development;

  @IsInt()
  @Min(0)
  @Max(65535)
  @IsOptional()
  PORT: number = 3000;

  @IsEnum(LogLevel)
  @IsOptional()
  LOG_LEVEL?: LogLevel;

  @IsString()
  DATABASE_URL!: string;

  @IsString()
  @IsNotEmpty()
  JWT_SECRET!: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN?: string = '15m';

  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_SECRET!: string;

  @IsString()
  @IsOptional()
  JWT_REFRESH_EXPIRES_IN?: string = '7d';

  /** argon2id 内存开销(KiB)，OWASP 推荐 ≥19456(19MiB) */
  @IsInt()
  @Min(8192)
  @IsOptional()
  ARGON2_MEMORY_COST: number = 19456;

  /** argon2id 迭代次数，OWASP 推荐 ≥2 */
  @IsInt()
  @Min(2)
  @IsOptional()
  ARGON2_TIME_COST: number = 2;

  /** argon2id 并行度 */
  @IsInt()
  @Min(1)
  @Max(255)
  @IsOptional()
  ARGON2_PARALLELISM: number = 1;

  /** 认证接口限流时间窗(秒) */
  @IsInt()
  @Min(1)
  @IsOptional()
  AUTH_THROTTLE_TTL: number = 60;

  /** 认证接口限流窗口内最大请求数(按 IP) */
  @IsInt()
  @Min(1)
  @IsOptional()
  AUTH_THROTTLE_LIMIT: number = 5;

  /**
   * CORS 允许的来源,逗号分隔(如 http://localhost:5173,http://localhost:3000)。
   * 留空表示放行所有来源(仅建议开发环境)。
   */
  @IsString()
  @IsOptional()
  CORS_ORIGIN?: string;
}

/** 校验环境变量；失败时直接抛错让进程启动失败 */
export function validateEnv(config: Record<string, unknown>): EnvVars {
  const validated = plainToInstance(EnvVars, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(errors.map((e) => e.toString()).join('\n'));
  }
  return validated;
}
