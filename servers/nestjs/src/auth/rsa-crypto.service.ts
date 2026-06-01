import {
  constants,
  createPrivateKey,
  generateKeyPairSync,
  privateDecrypt,
  type KeyObject,
} from 'node:crypto';

import { Injectable, OnModuleInit } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

/**
 * RSA 密码传输加解密服务。
 *
 * - 服务启动时动态生成 2048 位 RSA 密钥对，仅存内存（重启即换钥）
 * - 公钥以 SPKI/PEM 下发给前端，前端用 RSA-OAEP(SHA-256) 加密密码
 * - 后端用私钥解密，拿到明文后交由 PasswordService 做哈希校验
 *
 * 与前端 `@monorepo/utils` 的 `encryptPassword` 约定保持一致。
 */
@Injectable()
export class RsaCryptoService implements OnModuleInit {
  private publicKeyPem!: string;
  private privateKey!: KeyObject;

  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(RsaCryptoService.name);
  }

  onModuleInit(): void {
    const { publicKey, privateKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    this.publicKeyPem = publicKey;
    this.privateKey = createPrivateKey(privateKey);
    this.logger.info('RSA 密码传输密钥对已生成');
  }

  /** 获取 SPKI/PEM 公钥，供前端加密使用 */
  getPublicKey(): string {
    return this.publicKeyPem;
  }

  /**
   * 解密前端传来的 Base64 密文，返回明文密码。
   * @throws 当密文不是合法 RSA-OAEP(SHA-256) 密文时抛出
   */
  decrypt(cipherBase64: string): string {
    const decrypted = privateDecrypt(
      {
        key: this.privateKey,
        padding: constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      Buffer.from(cipherBase64, 'base64'),
    );
    return decrypted.toString('utf8');
  }
}
