import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';

import { AuthController } from '@/auth/auth.controller';
import { AuthService } from '@/auth/auth.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { PasswordService } from '@/auth/password.service';
import { RefreshTokenService } from '@/auth/refresh-token.service';
import { RsaCryptoService } from '@/auth/rsa-crypto.service';
import { UserModule } from '@/user/user.module';

@Module({
  imports: [
    UserModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRES_IN', '7d') as JwtSignOptions['expiresIn'],
        },
      }),
    }),
    // 认证接口限流:防暴力破解/撞库。默认内存存储,多实例部署需替换为 Redis 存储
    // 注意:限流只通过 AuthController 上的 @UseGuards(ThrottlerGuard) 生效,不全局拦截
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>('AUTH_THROTTLE_TTL', 60) * 1000,
            limit: config.get<number>('AUTH_THROTTLE_LIMIT', 5),
          },
        ],
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, RefreshTokenService, PasswordService, RsaCryptoService, JwtAuthGuard],
  exports: [AuthService, JwtAuthGuard, JwtModule],
})
export class AuthModule {}
