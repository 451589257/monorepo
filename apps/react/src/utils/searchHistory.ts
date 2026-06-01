const STORAGE_KEY = 'todo.searchHistory';
const MAX = 10;

/** 读取搜索历史（最新在前） */
export function getSearchHistory(): string[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

/** 追加一条搜索词，去重并置顶，超出上限截断 */
export function addSearchHistory(keyword: string): string[] {
  const word = keyword.trim();
  if (!word) return getSearchHistory();
  const next = [word, ...getSearchHistory().filter((w) => w !== word)].slice(0, MAX);
  persist(next);
  return next;
}

/** 清空搜索历史 */
export function clearSearchHistory(): string[] {
  persist([]);
  return [];
}

function persist(list: string[]) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}
