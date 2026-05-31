import { ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getLoggerToken, PinoLogger } from 'nestjs-pino';

import { AuthService } from '@/auth/auth.service';
import { PasswordService } from '@/auth/password.service';
import { RefreshTokenService } from '@/auth/refresh-token.service';
import { UserService } from '@/user/user.service';

const fakeUser = {
  id: 1,
  username: 'alice',
  passwordHash: '$argon2id$hash',
  nickname: '爱丽丝',
  createTime: new Date('2026-01-01'),
  updateTime: new Date('2026-01-01'),
};

describe('AuthService', () => {
  let service: AuthService;
  let userService: jest.Mocked<
    Pick<UserService, 'findByUsername' | 'findById' | 'create' | 'updatePasswordHash'>
  >;
  let passwordService: jest.Mocked<Pick<PasswordService, 'hash' | 'verify' | 'needsRehash'>>;
  let refreshTokenService: jest.Mocked<Pick<RefreshTokenService, 'issue' | 'verify' | 'revoke'>>;
  let jwtService: { sign: jest.Mock };

  beforeEach(async () => {
    userService = {
      findByUsername: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      updatePasswordHash: jest.fn(),
    };
    passwordService = {
      hash: jest.fn(),
      verify: jest.fn(),
      needsRehash: jest.fn().mockReturnValue(false),
    };
    refreshTokenService = {
      issue: jest.fn().mockResolvedValue({ refreshToken: 'refresh-token', expiresIn: '7d' }),
      verify: jest.fn(),
      revoke: jest.fn(),
    };
    jwtService = { sign: jest.fn().mockReturnValue('access-token') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: userService },
        { provide: PasswordService, useValue: passwordService },
        { provide: RefreshTokenService, useValue: refreshTokenService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: { get: (_k: string, d?: unknown) => d } },
        {
          provide: PinoLogger,
          useValue: { setContext: jest.fn(), info: jest.fn(), warn: jest.fn() },
        },
        {
          provide: getLoggerToken(AuthService.name),
          useValue: { setContext: jest.fn(), info: jest.fn(), warn: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('用户名已存在时抛 ConflictException', async () => {
      userService.findByUsername.mockResolvedValue(fakeUser);
      await expect(
        service.register({ username: 'alice', password: 'secret123' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('注册成功返回 token 且不含 passwordHash', async () => {
      userService.findByUsername.mockResolvedValue(null);
      passwordService.hash.mockResolvedValue('$argon2id$new');
      userService.create.mockResolvedValue(fakeUser);

      const result = await service.register({ username: 'alice', password: 'secret123' });

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.user.username).toBe('alice');
    });
  });

  describe('login', () => {
    it('用户不存在时抛 UnauthorizedException', async () => {
      userService.findByUsername.mockResolvedValue(null);
      await expect(
        service.login({ username: 'nobody', password: 'secret123' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('密码错误时抛 UnauthorizedException', async () => {
      userService.findByUsername.mockResolvedValue(fakeUser);
      passwordService.verify.mockResolvedValue(false);
      await expect(service.login({ username: 'alice', password: 'wrong' })).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('密码正确时返回 token', async () => {
      userService.findByUsername.mockResolvedValue(fakeUser);
      passwordService.verify.mockResolvedValue(true);

      const result = await service.login({ username: 'alice', password: 'secret123' });

      expect(result.accessToken).toBe('access-token');
      expect(refreshTokenService.issue).toHaveBeenCalledWith(fakeUser.id);
    });

    it('历史 bcrypt 哈希在登录后升级为 argon2id', async () => {
      userService.findByUsername.mockResolvedValue(fakeUser);
      passwordService.verify.mockResolvedValue(true);
      passwordService.needsRehash.mockReturnValue(true);
      passwordService.hash.mockResolvedValue('$argon2id$upgraded');

      await service.login({ username: 'alice', password: 'secret123' });

      expect(passwordService.hash).toHaveBeenCalledWith('secret123');
      expect(userService.updatePasswordHash).toHaveBeenCalledWith(
        fakeUser.id,
        '$argon2id$upgraded',
      );
    });
  });

  describe('refresh', () => {
    it('旋转:旧 refresh 被撤销并签发新 token', async () => {
      const record = { id: 10, userId: fakeUser.id } as never;
      refreshTokenService.verify.mockResolvedValue({ payload: {} as never, record });
      userService.findById.mockResolvedValue(fakeUser);

      const result = await service.refresh('old-refresh');

      expect(refreshTokenService.revoke).toHaveBeenCalledWith(record);
      expect(result.accessToken).toBe('access-token');
    });

    it('用户已被删除时撤销 refresh 并抛 UnauthorizedException', async () => {
      const record = { id: 10, userId: 999 } as never;
      refreshTokenService.verify.mockResolvedValue({ payload: {} as never, record });
      userService.findById.mockResolvedValue(null);

      await expect(service.refresh('old-refresh')).rejects.toBeInstanceOf(UnauthorizedException);
      expect(refreshTokenService.revoke).toHaveBeenCalledWith(record);
    });
  });

  describe('logout', () => {
    it('撤销有效 refresh token', async () => {
      const record = { id: 10, userId: fakeUser.id } as never;
      refreshTokenService.verify.mockResolvedValue({ payload: {} as never, record });

      await expect(service.logout('refresh')).resolves.toEqual({ success: true });
      expect(refreshTokenService.revoke).toHaveBeenCalledWith(record);
    });

    it('无效 token 静默成功,不抛错', async () => {
      refreshTokenService.verify.mockRejectedValue(new UnauthorizedException());
      await expect(service.logout('invalid')).resolves.toEqual({ success: true });
    });
  });

  describe('getCurrentUser', () => {
    it('用户存在时返回脱敏信息', async () => {
      userService.findById.mockResolvedValue(fakeUser);
      const result = await service.getCurrentUser(1);
      expect(result).not.toHaveProperty('passwordHash');
      expect(result.id).toBe(1);
    });

    it('用户不存在时抛 NotFoundException', async () => {
      userService.findById.mockResolvedValue(null);
      await expect(service.getCurrentUser(999)).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
