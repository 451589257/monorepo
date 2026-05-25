import { reactive, readonly } from 'vue';

export interface AuthUser {
  id: number;
  username: string;
  nickname: string | null;
  createTime: string;
  updateTime: string;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
}

export interface AuthCredentials {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

const STORAGE_KEY = 'auth.state';

function load(): AuthState {
  if (typeof localStorage === 'undefined') {
    return { accessToken: null, refreshToken: null, user: null };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { accessToken: null, refreshToken: null, user: null };
    const parsed = JSON.parse(raw) as Partial<AuthState>;
    return {
      accessToken: parsed.accessToken ?? null,
      refreshToken: parsed.refreshToken ?? null,
      user: parsed.user ?? null,
    };
  } catch {
    return { accessToken: null, refreshToken: null, user: null };
  }
}

const state = reactive<AuthState>(load());

function persist() {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      accessToken: state.accessToken,
      refreshToken: state.refreshToken,
      user: state.user,
    }),
  );
}

/** 只读响应式快照,组件中订阅 */
export const authState = readonly(state);

export function getAccessToken(): string | null {
  return state.accessToken;
}

export function getRefreshToken(): string | null {
  return state.refreshToken;
}

export function setAuth(payload: AuthCredentials) {
  state.accessToken = payload.accessToken;
  state.refreshToken = payload.refreshToken;
  state.user = payload.user;
  persist();
}

export function setUser(user: AuthUser) {
  state.user = user;
  persist();
}

export function clearAuth() {
  state.accessToken = null;
  state.refreshToken = null;
  state.user = null;
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function isLoggedIn(): boolean {
  return Boolean(state.accessToken);
}
