import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PinoLogger } from 'nestjs-pino';

import { LoginDto } from '@/auth/dto/login.dto';
import { RegisterDto } from '@/auth/dto/register.dto';
import { RefreshTokenService } from '@/auth/refresh-token.service';
import type { JwtPayload } from '@/auth/types/jwt-payload.type';
import { UserService } from '@/user/user.service';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AuthService.name);
  }

  async register(dto: RegisterDto) {
    const exists = await this.userService.findByUsername(dto.username);
    if (exists) {
      throw new ConflictException('用户名已被占用');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.userService.create({
      username: dto.username,
      passwordHash,
      nickname: dto.nickname,
    });

    this.logger.info({ userId: user.id, username: user.username }, '用户注册成功');
    return this.buildAuthResult(user);
  }

  async login(dto: LoginDto) {
    const user = await this.userService.findByUsername(dto.username);
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const matched = await bcrypt.compare(dto.password, user.passwordHash);
    if (!matched) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    this.logger.info({ userId: user.id, username: user.username }, '用户登录成功');
    return this.buildAuthResult(user);
  }

  /** 用 refresh token 换一组新 access+refresh,旧 refresh 立即作废(旋转) */
  async refresh(refreshToken: string) {
    const { record } = await this.refreshTokenService.verify(refreshToken);

    const user = await this.userService.findById(record.userId);
    if (!user) {
      // 用户已被删除,撤销该 refresh
      await this.refreshTokenService.revoke(record);
      throw new UnauthorizedException('用户不存在');
    }

    // 旋转:旧 token 撤销 → 签发新 token
    await this.refreshTokenService.revoke(record);
    this.logger.info({ userId: user.id }, '刷新 token 成功');
    return this.buildAuthResult(user);
  }

  /** 登出当前 refresh token(其他设备不受影响) */
  async logout(refreshToken: string) {
    try {
      const { record } = await this.refreshTokenService.verify(refreshToken);
      await this.refreshTokenService.revoke(record);
      this.logger.info({ userId: record.userId }, '用户登出成功');
    } catch {
      // 登出对无效 token 静默成功,避免被用来探测 token 状态
    }
    return { success: true };
  }

  async getCurrentUser(userId: number) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return this.toUserVo(user);
  }

  private async buildAuthResult(user: User) {
    const payload: JwtPayload = { sub: user.id, username: user.username };
    const accessExpiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '15m');
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: accessExpiresIn as JwtSignOptions['expiresIn'],
    });

    const { refreshToken, expiresIn: refreshExpiresIn } = await this.refreshTokenService.issue(
      user.id,
    );

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: accessExpiresIn,
      refreshExpiresIn,
      user: this.toUserVo(user),
    };
  }

  private toUserVo(user: User) {
    // 不返回 passwordHash
    const { id, username, nickname, createTime, updateTime } = user;
    return { id, username, nickname, createTime, updateTime };
  }
}
