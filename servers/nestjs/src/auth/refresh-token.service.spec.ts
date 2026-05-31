import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

import { RefreshTokenService } from '@/auth/refresh-token.service';
import { PrismaService } from '@/prisma/prisma.service';

describe('RefreshTokenService', () => {
  let service: RefreshTokenService;
  let prisma: {
    refreshToken: {
      create: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
  };
  let jwtService: { signAsync: jest.Mock; verifyAsync: jest.Mock };

  beforeEach(async () => {
    prisma = {
      refreshToken: {
        create: jest.fn().mockResolvedValue({}),
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({}),
      },
    };
    jwtService = {
      signAsync: jest.fn().mockResolvedValue('signed-refresh'),
      verifyAsync: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        {
          provide: ConfigService,
          useValue: { getOrThrow: () => 'refresh-secret', get: (_k: string, d?: unknown) => d },
        },
      ],
    }).compile();

    service = module.get<RefreshTokenService>(RefreshTokenService);
  });

  describe('issue', () => {
    it('签发 token 并落库哈希', async () => {
      const exp = Math.floor(Date.now() / 1000) + 7 * 24 * 3600;
      jwtService.verifyAsync.mockResolvedValue({ sub: 1, jti: 'jti', exp });

      const result = await service.issue(1);

      expect(result.refreshToken).toBe('signed-refresh');
      expect(prisma.refreshToken.create).toHaveBeenCalledTimes(1);
      const createArg = prisma.refreshToken.create.mock.calls[0][0];
      expect(createArg.data.userId).toBe(1);
      // 落库的是哈希,不是明文 jti
      expect(createArg.data.tokenHash).not.toBe('jti');
    });
  });

  describe('verify', () => {
    it('验签失败时抛 UnauthorizedException', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('bad'));
      await expect(service.verify('token')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('记录不存在时抛 UnauthorizedException', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: 1, jti: 'jti' });
      prisma.refreshToken.findUnique.mockResolvedValue(null);
      await expect(service.verify('token')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('userId 不匹配时抛 UnauthorizedException', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: 1, jti: 'jti' });
      prisma.refreshToken.findUnique.mockResolvedValue({ id: 1, userId: 2, revokedAt: null });
      await expect(service.verify('token')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('token 已撤销时连带撤销全部会话并抛错', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: 1, jti: 'jti' });
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 1,
        userId: 1,
        revokedAt: new Date(),
      });

      await expect(service.verify('token')).rejects.toBeInstanceOf(UnauthorizedException);
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 1, revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('token 已过期时抛 UnauthorizedException', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: 1, jti: 'jti' });
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 1,
        userId: 1,
        revokedAt: null,
        expiresAt: new Date(Date.now() - 1000),
      });
      await expect(service.verify('token')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('有效 token 返回 payload 与记录', async () => {
      const record = {
        id: 1,
        userId: 1,
        revokedAt: null,
        expiresAt: new Date(Date.now() + 100_000),
      };
      jwtService.verifyAsync.mockResolvedValue({ sub: 1, jti: 'jti' });
      prisma.refreshToken.findUnique.mockResolvedValue(record);

      const result = await service.verify('token');
      expect(result.record).toBe(record);
    });
  });

  describe('revoke', () => {
    it('按 id 更新 revokedAt', async () => {
      await service.revoke({ id: 5 } as never);
      expect(prisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });
});
