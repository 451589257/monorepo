import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';

import { PasswordService } from '@/auth/password.service';

describe('PasswordService', () => {
  let service: PasswordService;

  beforeEach(() => {
    // 用较低的内存/迭代参数加速测试,仍走真实 argon2id 实现
    const config = {
      get: (key: string, defaultValue?: number) => {
        const map: Record<string, number> = {
          ARGON2_MEMORY_COST: 8192,
          ARGON2_TIME_COST: 2,
          ARGON2_PARALLELISM: 1,
        };
        return map[key] ?? defaultValue;
      },
    } as unknown as ConfigService;
    service = new PasswordService(config);
  });

  it('生成的哈希为 argon2id 格式且自带随机 salt', async () => {
    const h1 = await service.hash('secret123');
    const h2 = await service.hash('secret123');
    expect(h1.startsWith('$argon2id$')).toBe(true);
    // 随机 salt 使两次哈希结果不同
    expect(h1).not.toBe(h2);
  });

  it('校验正确/错误密码', async () => {
    const hashed = await service.hash('secret123');
    await expect(service.verify(hashed, 'secret123')).resolves.toBe(true);
    await expect(service.verify(hashed, 'wrong')).resolves.toBe(false);
  });

  it('兼容历史 bcrypt 哈希校验', async () => {
    const bcryptHash = await bcrypt.hash('legacyPwd', 10);
    await expect(service.verify(bcryptHash, 'legacyPwd')).resolves.toBe(true);
    await expect(service.verify(bcryptHash, 'wrong')).resolves.toBe(false);
  });

  it('损坏的哈希一律视为不匹配', async () => {
    await expect(service.verify('not-a-valid-hash', 'whatever')).resolves.toBe(false);
  });

  it('needsRehash 仅对 bcrypt 哈希返回 true', async () => {
    const bcryptHash = await bcrypt.hash('legacyPwd', 10);
    const argonHash = await service.hash('secret123');
    expect(service.needsRehash(bcryptHash)).toBe(true);
    expect(service.needsRehash(argonHash)).toBe(false);
  });
});
