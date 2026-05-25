export interface AuthUser {
  id: number;
  username: string;
  nickname: string | null;
  createTime: string;
  updateTime: string;
}

export interface AuthState {
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

let state: AuthState = load();
const listeners = new Set<() => void>();

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

function persist() {
  if (typeof localStorage === 'undefined') return;
  if (!state.accessToken && !state.refreshToken && !state.user) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function emit() {
  for (const fn of listeners) fn();
}

/** useSyncExternalStore 适配:订阅 */
export function subscribeAuth(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** useSyncExternalStore 适配:取快照(必须返回稳定引用) */
export function getAuthSnapshot(): AuthState {
  return state;
}

export function getAccessToken(): string | null {
  return state.accessToken;
}

export function getRefreshToken(): string | null {
  return state.refreshToken;
}

export function setAuth(payload: AuthCredentials) {
  state = {
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
    user: payload.user,
  };
  persist();
  emit();
}

export function setUser(user: AuthUser) {
  state = { ...state, user };
  persist();
  emit();
}

export function clearAuth() {
  state = { accessToken: null, refreshToken: null, user: null };
  persist();
  emit();
}

export function isLoggedIn(): boolean {
  return Boolean(state.accessToken);
}
