import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  /** 用户名 */
  @IsString({ message: '用户名必须是字符串' })
  @IsNotEmpty({ message: '用户名不能为空' })
  username!: string;

  /** 密码 */
  @IsString({ message: '密码必须是字符串' })
  @IsNotEmpty({ message: '密码不能为空' })
  password!: string;
}
