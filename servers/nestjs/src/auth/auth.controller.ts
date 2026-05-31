import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle, ThrottlerGuard } from '@nestjs/throttler';

import { AuthService } from '@/auth/auth.service';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { Public } from '@/auth/decorators/public.decorator';
import { LoginDto } from '@/auth/dto/login.dto';
import { RefreshTokenDto } from '@/auth/dto/refresh-token.dto';
import { RegisterDto } from '@/auth/dto/register.dto';
import type { JwtPayload } from '@/auth/types/jwt-payload.type';
import { LogRequest } from '@/common/logging/log-request.decorator';

@ApiTags('Auth')
@LogRequest()
@UseGuards(ThrottlerGuard)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @ApiOperation({ summary: '用户注册' })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @ApiOperation({ summary: '用户登录' })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @ApiOperation({ summary: '刷新 token(旧 refresh 立即失效)' })
  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Public()
  @ApiOperation({ summary: '登出(撤销当前 refresh token)' })
  @Post('logout')
  logout(@Body() dto: RefreshTokenDto) {
    return this.authService.logout(dto.refreshToken);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前登录用户' })
  @SkipThrottle()
  @Get('me')
  me(@CurrentUser() user: JwtPayload) {
    return this.authService.getCurrentUser(user.sub);
  }
}
