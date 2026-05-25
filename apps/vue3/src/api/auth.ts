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
