import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { hash, verify, Algorithm, type Options } from '@node-rs/argon2';
import * as bcrypt from 'bcryptjs';

// Algorithm 是 ambient const enum,isolatedModules 下不能作为值访问,这里用字面量并做类型校验
const ARGON2ID: Algorithm = 2;

/**
 * 密码哈希服务
 *
 * - 新密码统一使用 argon2id(OWASP 当前首推)
 * - 兼容历史 bcrypt 哈希:登录时可校验,并提示需要重哈希以平滑迁移
 */
@Injectable()
export class PasswordService {
  private readonly argon2Options: Options;

  constructor(private readonly config: ConfigService) {
    this.argon2Options = {
      algorithm: ARGON2ID,
      memoryCost: this.config.get<number>('ARGON2_MEMORY_COST', 19456),
      timeCost: this.config.get<number>('ARGON2_TIME_COST', 2),
      parallelism: this.config.get<number>('ARGON2_PARALLELISM', 1),
    };
  }

  /** 生成 argon2id 哈希(自带随机 salt 与参数,存完整 PHC 字符串) */
  hash(plain: string): Promise<string> {
    return hash(plain, this.argon2Options);
  }

  /** 校验明文与哈希是否匹配,自动识别 argon2 / bcrypt 两种格式 */
  async verify(hashed: string, plain: string): Promise<boolean> {
    if (this.isBcryptHash(hashed)) {
      return bcrypt.compare(plain, hashed);
    }
    try {
      return await verify(hashed, plain, this.argon2Options);
    } catch {
      // 哈希格式损坏或不可识别,一律视为不匹配
      return false;
    }
  }

  /**
   * 判断是否需要重哈希:
   * - 历史 bcrypt 哈希 → 需要迁移到 argon2
   * 调用方应在密码校验通过后调用,据此异步更新存储
   */
  needsRehash(hashed: string): boolean {
    return this.isBcryptHash(hashed);
  }

  /** bcrypt 哈希以 $2a$ / $2b$ / $2y$ 开头 */
  private isBcryptHash(hashed: string): boolean {
    return /^\$2[aby]\$/.test(hashed);
  }
}
