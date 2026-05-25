import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  /** 用户名,3~32 位字母/数字/下划线 */
  @IsString({ message: '用户名必须是字符串' })
  @IsNotEmpty({ message: '用户名不能为空' })
  @MinLength(3, { message: '用户名长度至少 3 位' })
  @MaxLength(32, { message: '用户名长度最多 32 位' })
  @Matches(/^[a-zA-Z0-9_]+$/, { message: '用户名只能包含字母、数字、下划线' })
  username!: string;

  /** 密码,6~64 位 */
  @IsString({ message: '密码必须是字符串' })
  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(6, { message: '密码长度至少 6 位' })
  @MaxLength(64, { message: '密码长度最多 64 位' })
  password!: string;

  /** 昵称 */
  @IsString({ message: '昵称必须是字符串' })
  @IsOptional()
  @MaxLength(32, { message: '昵称长度最多 32 位' })
  nickname?: string;
}
