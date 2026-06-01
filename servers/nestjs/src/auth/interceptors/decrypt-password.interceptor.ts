import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import type { Observable } from 'rxjs';

import { RsaCryptoService } from '@/auth/rsa-crypto.service';

/**
 * 在 ValidationPipe 之前，将请求体中的 `password` 字段（RSA 密文）解密回明文。
 *
 * 放在 controller 级别，只作用于登录/注册接口；解密后明文再走原有 DTO 校验与业务逻辑，
 * 因此 DTO、Service、相关单测都无需改动。
 */
@Injectable()
export class DecryptPasswordInterceptor implements NestInterceptor {
  constructor(private readonly rsaCryptoService: RsaCryptoService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const body = request.body as Record<string, unknown> | undefined;

    if (body && typeof body.password === 'string') {
      try {
        body.password = this.rsaCryptoService.decrypt(body.password);
      } catch {
        throw new BadRequestException('密码解密失败，请重试');
      }
    }

    return next.handle();
  }
}
