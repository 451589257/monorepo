import { SetMetadata } from '@nestjs/common';

/** 守卫元数据 key,标记接口跳过 JWT 鉴权 */
export const IS_PUBLIC_KEY = 'auth:isPublic';

/**
 * 标记接口为公开接口,跳过全局 JwtAuthGuard。
 *
 * 用法:
 *   @Public()
 *   @Post('login')
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
