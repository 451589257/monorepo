import { encryptPassword } from '@monorepo/utils';

import { alovaInstance } from '@/api';
import type { AuthUser } from '@/stores/auth';

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: string;
  refreshExpiresIn: string;
  user: AuthUser;
}

/** 内存缓存公钥，避免每次登录/注册都请求一次 */
let publicKeyCache: string | null = null;

const fetchPublicKey = () =>
  alovaInstance.Get<{ publicKey: string }>('/auth/public-key', { meta: { skipAuth: true } });

/** 获取后端 RSA 公钥（带内存缓存） */
async function getPublicKey(): Promise<string> {
  if (publicKeyCache) return publicKeyCache;
  const { publicKey } = await fetchPublicKey();
  publicKeyCache = publicKey;
  return publicKey;
}

/**
 * 用后端 RSA 公钥加密密码。密钥可能因服务重启失效，失败时清缓存重试一次。
 * 提交登录/注册前调用，把返回的密文作为 password 传给 login/register。
 */
export async function encryptUserPassword(password: string): Promise<string> {
  try {
    return await encryptPassword(password, await getPublicKey());
  } catch {
    publicKeyCache = null;
    return encryptPassword(password, await getPublicKey());
  }
}

export const register = (body: { username: string; password: string; nickname?: string }) =>
  alovaInstance.Post<AuthResult>('/auth/register', body, { meta: { skipAuth: true } });

export const login = (body: { username: string; password: string }) =>
  alovaInstance.Post<AuthResult>('/auth/login', body, { meta: { skipAuth: true } });

export const logout = (refreshToken: string) =>
  alovaInstance.Post<{ success: boolean }>(
    '/auth/logout',
    { refreshToken },
    { meta: { skipAuth: true } },
  );

export const getMe = () => alovaInstance.Get<AuthUser>('/auth/me');
