export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'app.theme';

let mode: ThemeMode = load();
const listeners = new Set<() => void>();

function load(): ThemeMode {
  if (typeof localStorage === 'undefined') return 'light';
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  if (typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

function apply() {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.dataset.theme = mode;
  // antd-mobile 暗色：在 html 上设置 data-prefers-color-scheme
  root.setAttribute('data-prefers-color-scheme', mode);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, mode);
  }
}

function emit() {
  for (const fn of listeners) fn();
}

/** 应用启动时调用一次，将当前主题同步到 DOM */
export function setupTheme() {
  apply();
}

export function subscribeTheme(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getThemeSnapshot(): ThemeMode {
  return mode;
}

export function setTheme(next: ThemeMode) {
  if (mode === next) return;
  mode = next;
  apply();
  emit();
}

export function toggleTheme() {
  setTheme(mode === 'dark' ? 'light' : 'dark');
}
