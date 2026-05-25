import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { Request } from 'express';

import type { JwtPayload } from '@/auth/types/jwt-payload.type';

/**
 * 从请求中取出 JwtAuthGuard 写入的当前用户信息。
 *
 * 用法:
 *   @Get('me')
 *   me(@CurrentUser() user: JwtPayload) { ... }
 */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<Request & { user?: JwtPayload }>();
  return request.user;
});
