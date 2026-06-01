import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';

import { AuthController } from '@/auth/auth.controller';
import { AuthService } from '@/auth/auth.service';
import { RsaCryptoService } from '@/auth/rsa-crypto.service';
import type { JwtPayload } from '@/auth/types/jwt-payload.type';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<
    Pick<AuthService, 'register' | 'login' | 'refresh' | 'logout' | 'getCurrentUser'>
  >;
  let rsaCryptoService: jest.Mocked<Pick<RsaCryptoService, 'getPublicKey' | 'decrypt'>>;

  beforeEach(async () => {
    authService = {
      register: jest.fn(),
      login: jest.fn(),
      refresh: jest.fn(),
      logout: jest.fn(),
      getCurrentUser: jest.fn(),
    };
    rsaCryptoService = {
      getPublicKey: jest
        .fn()
        .mockReturnValue('-----BEGIN PUBLIC KEY-----\nMOCK\n-----END PUBLIC KEY-----'),
      decrypt: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: RsaCryptoService, useValue: rsaCryptoService },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('publicKey 返回 RSA 公钥', () => {
    expect(controller.publicKey()).toEqual({
      publicKey: '-----BEGIN PUBLIC KEY-----\nMOCK\n-----END PUBLIC KEY-----',
    });
    expect(rsaCryptoService.getPublicKey).toHaveBeenCalled();
  });

  it('register 委托给 authService.register', async () => {
    const dto = { username: 'alice', password: 'secret123' };
    await controller.register(dto);
    expect(authService.register).toHaveBeenCalledWith(dto);
  });

  it('login 委托给 authService.login', async () => {
    const dto = { username: 'alice', password: 'secret123' };
    await controller.login(dto);
    expect(authService.login).toHaveBeenCalledWith(dto);
  });

  it('refresh 透传 refreshToken', async () => {
    await controller.refresh({ refreshToken: 'rt' });
    expect(authService.refresh).toHaveBeenCalledWith('rt');
  });

  it('logout 透传 refreshToken', async () => {
    await controller.logout({ refreshToken: 'rt' });
    expect(authService.logout).toHaveBeenCalledWith('rt');
  });

  it('me 用当前用户 sub 查询', async () => {
    const user: JwtPayload = { sub: 7, username: 'alice' };
    await controller.me(user);
    expect(authService.getCurrentUser).toHaveBeenCalledWith(7);
  });
});
