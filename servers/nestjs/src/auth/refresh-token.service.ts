import { createHash, randomBytes } from 'node:crypto';

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { RefreshToken } from '@prisma/client';

import type { RefreshPayload } from '@/auth/types/jwt-payload.type';
import { PrismaService } from '@/prisma/prisma.service';

/**
 * Refresh token 策略(有状态):
 * - 签发:生成随机 jti → 用 jti 签 JWT → 存 jti 的 sha256 哈希到 DB
 * - 校验:验签 → 查 DB(必须存在、未撤销、未过期)
 * - 旋转:刷新时旧 refresh 立即作废,签发新 refresh
 * - 撤销:logout / 旋转旧 token / 退出全部设备
 */
@Injectable()
export class RefreshTokenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /** 为指定用户签发一组新的 refresh token,落库哈希 */
  async issue(userId: number): Promise<{ refreshToken: string; expiresIn: string }> {
    const secret = this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');
    const expiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');

    // jti 是真正的不可猜测随机串,JWT 只是其携带容器
    const jti = randomBytes(32).toString('hex');
    const payload: Omit<RefreshPayload, 'iat' | 'exp'> = { sub: userId, jti };

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret,
      expiresIn: expiresIn as JwtSignOptions['expiresIn'],
    });

    // 用 verify 拿出 exp,作为 DB 过期时间(避免在两处解析 expiresIn 字符串)
    const decoded = await this.jwtService.verifyAsync<RefreshPayload>(refreshToken, { secret });
    const expiresAt = new Date((decoded.exp ?? 0) * 1000);

    await this.prisma.refreshToken.create({
      data: {
        tokenHash: this.hashJti(jti),
        userId,
        expiresAt,
      },
    });

    return { refreshToken, expiresIn };
  }

  /** 校验 refresh token,返回对应 DB 记录;失败抛 401 */
  async verify(token: string): Promise<{ payload: RefreshPayload; record: RefreshToken }> {
    const secret = this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');

    let payload: RefreshPayload;
    try {
      payload = await this.jwtService.verifyAsync<RefreshPayload>(token, { secret });
    } catch {
      throw new UnauthorizedException('refreshToken 无效或已过期');
    }

    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hashJti(payload.jti) },
    });

    if (!record || record.userId !== payload.sub) {
      throw new UnauthorizedException('refreshToken 不存在');
    }
    if (record.revokedAt) {
      // 已撤销的 refresh 被再次使用 → 安全告警场景:连带撤销该用户全部 refresh
      await this.revokeAllByUser(record.userId);
      throw new UnauthorizedException('refreshToken 已被撤销,出于安全已注销所有会话');
    }
    if (record.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('refreshToken 已过期');
    }

    return { payload, record };
  }

  /** 撤销单个 refresh */
  async revoke(record: RefreshToken): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    });
  }

  /** 撤销该用户全部活跃 refresh(用于安全场景或登出全部设备) */
  async revokeAllByUser(userId: number): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private hashJti(jti: string): string {
    return createHash('sha256').update(jti).digest('hex');
  }
}
