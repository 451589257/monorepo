import { createAlova } from 'alova';
import adapterFetch from 'alova/fetch';
import VueHook from 'alova/vue';

import { clearAuth, getAccessToken, getRefreshToken, setAuth, type AuthUser } from '@/stores/auth';

interface ApiEnvelope<T = unknown> {
  code: number;
  data: T;
  msg: string;
  success: boolean;
}

export interface MethodMeta {
  /** 跳过 token 注入与 401 自动刷新(用于登录/注册/刷新接口本身) */
  skipAuth?: boolean;
  /** 内部标记:本 method 已重放过,避免死循环 */
  retried?: boolean;
}

interface RefreshResultData {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

let refreshingPromise: Promise<string> | null = null;

/** 并发去重的 access token 刷新 */
async function refreshAccessToken(): Promise<string> {
  if (refreshingPromise) return refreshingPromise;

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return Promise.reject(new Error('未登录或登录已过期'));
  }

  refreshingPromise = (async () => {
    try {
      // 这里直接用 fetch,绕开 alova 拦截器,避免 refresh 自身又触发 401 流程
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      const payload = (await res.json()) as ApiEnvelope<RefreshResultData>;
      if (!res.ok || !payload.success) {
        throw new Error(payload.msg || '会话已过期，请重新登录');
      }
      setAuth({
        accessToken: payload.data.accessToken,
        refreshToken: payload.data.refreshToken,
        user: payload.data.user,
      });
      return payload.data.accessToken;
    } finally {
      refreshingPromise = null;
    }
  })();

  return refreshingPromise;
}

export const alovaInstance = createAlova({
  baseURL: '/api',
  statesHook: VueHook,
  requestAdapter: adapterFetch(),
  cacheFor: null,
  beforeRequest(method) {
    method.config.headers = {
      'Content-Type': 'application/json',
      ...method.config.headers,
    };
    const meta = (method.meta ?? {}) as MethodMeta;
    if (!meta.skipAuth) {
      const token = getAccessToken();
      if (token) {
        method.config.headers.Authorization = `Bearer ${token}`;
      }
    }
  },
  responded: {
    onSuccess: async (response, method) => {
      const meta = (method.meta ?? {}) as MethodMeta;

      // 401 → 尝试刷新 + 重放原请求(登录/注册/刷新接口除外)
      if (response.status === 401 && !meta.skipAuth && !meta.retried && getRefreshToken()) {
        method.meta = { ...meta, retried: true };
        try {
          await refreshAccessToken();
        } catch (err) {
          clearAuth();
          throw err instanceof Error ? err : new Error('会话已过期，请重新登录');
        }
        // 重放:会再次走 beforeRequest 注入新 token
        return (await method.send(true)) as unknown;
      }

      if (!response.ok) {
        if (response.status === 401 && !meta.skipAuth) {
          clearAuth();
        }
        let msg = `HTTP ${response.status}`;
        try {
          const errPayload = (await response.clone().json()) as Partial<ApiEnvelope>;
          if (errPayload?.msg) msg = errPayload.msg;
        } catch {
          // 响应非 JSON,沿用 HTTP 状态码文案
        }
        throw new Error(msg);
      }

      const payload = (await response.json()) as ApiEnvelope;
      if (!payload.success) {
        throw new Error(payload.msg || '请求失败');
      }
      return payload.data;
    },
    onError: (error) => {
      throw error;
    },
  },
});
