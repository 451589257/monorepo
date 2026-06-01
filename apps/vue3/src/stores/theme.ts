import { reactive, readonly, watchEffect } from 'vue';

export type ThemeMode = 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
}

const STORAGE_KEY = 'app.theme';

function load(): ThemeMode {
  if (typeof localStorage === 'undefined') return 'light';
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  // 跟随系统偏好
  if (typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

const state = reactive<ThemeState>({ mode: load() });

/** 只读响应式快照 */
export const themeState = readonly(state);

export function setTheme(mode: ThemeMode) {
  state.mode = mode;
}

export function toggleTheme() {
  state.mode = state.mode === 'dark' ? 'light' : 'dark';
}

/**
 * 同步主题到 <html> 上：
 * - Vant 暗色用 `van-theme-dark` class（挂在 html 上）
 * - 自定义区块用 [data-theme] 选择器
 */
export function setupTheme() {
  watchEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.dataset.theme = state.mode;
    root.classList.toggle('van-theme-dark', state.mode === 'dark');
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, state.mode);
    }
  });
}
