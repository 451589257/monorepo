import { useRequest, useWatcher } from 'alova/client';
import { useEffect, useMemo, useState, type FormEvent } from 'react';

import {
  createTodo,
  deleteTodo,
  listTodos,
  updateTodoStatus,
  type Todo,
  type TodoStatus,
} from '@/api/todo';

type StatusFilter = '' | TodoStatus;

const PAGE_SIZE = 10;

const STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
  { label: '全部', value: '' },
  { label: '待办', value: 'PENDING' },
  { label: '进行中', value: 'ACTIVE' },
  { label: '已完成', value: 'DONE' },
];

const STATUS_BADGE: Record<TodoStatus, { label: string; className: string }> = {
  PENDING: {
    label: '待办',
    className: 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white/70',
  },
  ACTIVE: {
    label: '进行中',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  },
  DONE: {
    label: '已完成',
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  },
};

const isDone = (status: TodoStatus) => status === 'DONE';

function TodoApp() {
  const [searchInput, setSearchInput] = useState('');
  const [searchText, setSearchText] = useState('');
  const [status, setStatus] = useState<StatusFilter>('');
  const [pageNum, setPageNum] = useState(1);

  const [todos, setTodos] = useState<Todo[]>([]);
  const [total, setTotal] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [draft, setDraft] = useState('');

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const {
    loading,
    send: refresh,
    onSuccess: onListSuccess,
    onError: onListError,
  } = useWatcher(
    () =>
      listTodos({
        pageNum,
        pageSize: PAGE_SIZE,
        title: searchText || undefined,
        status: status || undefined,
      }),
    [searchText, status, pageNum],
    { immediate: true, debounce: 0 },
  );

  onListSuccess(({ data }) => {
    setTodos(data.list);
    setTotal(data.total);
    setErrorMsg('');
    const max = Math.max(1, Math.ceil(data.total / PAGE_SIZE));
    if (pageNum > max) setPageNum(max);
  });
  onListError(({ error }) => {
    setErrorMsg(error.message || '加载失败');
  });

  useEffect(() => {
    const trimmed = searchInput.trim();
    if (trimmed === searchText) return;
    const timer = setTimeout(() => {
      setSearchText(trimmed);
      setPageNum(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, searchText]);

  function selectStatus(next: StatusFilter) {
    if (status === next) return;
    setStatus(next);
    setPageNum(1);
  }

  function goPrev() {
    if (pageNum > 1) setPageNum(pageNum - 1);
  }
  function goNext() {
    if (pageNum < totalPages) setPageNum(pageNum + 1);
  }

  const { loading: submitting, send: submitTodo } = useRequest(
    (title: string) => createTodo({ title }),
    { immediate: false },
  );

  const { send: sendToggle } = useRequest(
    (id: number, next: TodoStatus) => updateTodoStatus(id, next),
    { immediate: false },
  );

  const { send: sendDelete } = useRequest((id: number) => deleteTodo(id), {
    immediate: false,
  });

  const withError = async <T,>(action: () => Promise<T>): Promise<T | null> => {
    try {
      setErrorMsg('');
      return await action();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '操作失败');
      return null;
    }
  };

  async function addTodo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = draft.trim();
    if (!title || submitting) return;
    const created = await withError(() => submitTodo(title));
    if (created) {
      setDraft('');
      if (pageNum === 1) {
        await refresh();
      } else {
        setPageNum(1);
      }
    }
  }

  async function toggle(todo: Todo) {
    const next: TodoStatus = isDone(todo.status) ? 'PENDING' : 'DONE';
    const updated = await withError(() => sendToggle(todo.id, next));
    if (updated) {
      if (status && status !== updated.status) {
        await refresh();
      } else {
        setTodos((prev) => prev.map((t) => (t.id === todo.id ? updated : t)));
      }
    }
  }

  async function remove(id: number) {
    const ok = await withError(() => sendDelete(id));
    if (ok !== null) {
      if (todos.length === 1 && pageNum > 1) {
        setPageNum(pageNum - 1);
      } else {
        await refresh();
      }
    }
  }

  async function clearCompleted() {
    const res = await withError(() => listTodos({ pageNum: 1, pageSize: 1000, status: 'DONE' }));
    if (!res || res.list.length === 0) return;
    await withError(() => Promise.all(res.list.map((t) => sendDelete(t.id))));
    if (pageNum !== 1) {
      setPageNum(1);
    } else {
      await refresh();
    }
  }

  const hasResults = useMemo(() => todos.length > 0, [todos]);

  return (
    <section className="w-full max-w-xl rounded-3xl border border-slate-200/80 bg-white/90 p-7 shadow-[0_20px_50px_-20px_rgba(15,23,42,0.25)] backdrop-blur dark:border-white/10 dark:bg-slate-900/60 dark:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)]">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100 text-lg dark:bg-sky-500/15"
          >
            🚀
          </span>
          <div>
            <h1 className="text-2xl leading-tight font-semibold text-slate-900 dark:text-white">
              React Todo
            </h1>
            <p className="text-xs text-slate-500 dark:text-white/50">Hooks · alova</p>
          </div>
        </div>
        <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
          共 {total} 条
        </span>
      </header>

      <form className="flex gap-2" onSubmit={addTodo}>
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="今天打算完成什么？"
          disabled={submitting}
          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40 dark:focus:border-sky-400 dark:focus:ring-sky-400/20"
        />
        <button
          type="submit"
          disabled={!draft.trim() || submitting}
          className="rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-sky-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-sky-500"
        >
          {submitting ? '添加中…' : '添加'}
        </button>
      </form>

      <div className="relative mt-3">
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-slate-400 dark:text-white/40"
        >
          🔍
        </span>
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="搜索标题…"
          className="w-full rounded-xl border border-slate-200 bg-white py-2 pr-3 pl-9 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40 dark:focus:border-sky-400 dark:focus:ring-sky-400/20"
        />
      </div>

      {errorMsg && <p className="mt-3 text-xs text-rose-600 dark:text-rose-400">⚠ {errorMsg}</p>}

      <div className="mt-5 flex items-center justify-between gap-3">
        <div
          role="tablist"
          className="inline-flex rounded-xl bg-slate-100 p-1 text-xs dark:bg-white/5"
        >
          {STATUS_FILTERS.map((item) => (
            <button
              key={item.value || 'all'}
              type="button"
              role="tab"
              aria-selected={status === item.value}
              onClick={() => selectStatus(item.value)}
              className={`rounded-lg px-3 py-1.5 transition ${
                status === item.value
                  ? 'bg-white text-sky-700 shadow-sm dark:bg-sky-500/20 dark:text-sky-200'
                  : 'text-slate-500 hover:text-slate-800 dark:text-white/50 dark:hover:text-white/80'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={clearCompleted}
          className="rounded-lg px-2 py-1 text-xs text-slate-500 transition hover:text-rose-500 dark:text-white/50 dark:hover:text-rose-400"
        >
          清除已完成
        </button>
      </div>

      {loading ? (
        <p className="mt-10 text-center text-sm text-slate-400 dark:text-white/40">加载中…</p>
      ) : hasResults ? (
        <ul className="mt-5 space-y-2">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 transition hover:-translate-y-px hover:border-sky-300 hover:shadow-sm dark:border-white/10 dark:bg-white/5 dark:hover:border-sky-400/40 dark:hover:bg-white/[0.07]"
            >
              <input
                id={`react-todo-${todo.id}`}
                type="checkbox"
                checked={isDone(todo.status)}
                onChange={() => toggle(todo)}
                className="h-4 w-4 cursor-pointer accent-sky-500"
              />
              <label
                htmlFor={`react-todo-${todo.id}`}
                className={`flex-1 cursor-pointer truncate text-left text-sm transition ${
                  isDone(todo.status)
                    ? 'text-slate-400 line-through dark:text-white/40'
                    : 'text-slate-800 dark:text-white/90'
                }`}
              >
                {todo.title}
              </label>
              <span
                className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${STATUS_BADGE[todo.status].className}`}
              >
                {STATUS_BADGE[todo.status].label}
              </span>
              <button
                type="button"
                aria-label="删除"
                onClick={() => remove(todo.id)}
                className="rounded-md px-2 py-1 text-xs text-slate-400 opacity-0 transition hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100 dark:text-white/40 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
              >
                删除
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-10 flex flex-col items-center gap-2 text-center text-sm text-slate-400 dark:text-white/40">
          <span aria-hidden className="text-3xl">
            ✨
          </span>
          <p>{searchText || status ? '没有匹配的待办' : '还没有待办，加一个开始吧'}</p>
        </div>
      )}

      {totalPages > 1 && (
        <nav
          aria-label="分页"
          className="mt-5 flex items-center justify-between text-xs text-slate-500 dark:text-white/50"
        >
          <button
            type="button"
            disabled={pageNum <= 1}
            onClick={goPrev}
            className="rounded-lg border border-slate-200 px-3 py-1.5 transition hover:border-sky-400 hover:text-sky-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-500 dark:border-white/10 dark:hover:border-sky-400/60 dark:hover:text-sky-300 dark:disabled:hover:border-white/10 dark:disabled:hover:text-white/50"
          >
            上一页
          </button>
          <span>
            第 {pageNum} / 共 {totalPages} 页
          </span>
          <button
            type="button"
            disabled={pageNum >= totalPages}
            onClick={goNext}
            className="rounded-lg border border-slate-200 px-3 py-1.5 transition hover:border-sky-400 hover:text-sky-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-500 dark:border-white/10 dark:hover:border-sky-400/60 dark:hover:text-sky-300 dark:disabled:hover:border-white/10 dark:disabled:hover:text-white/50"
          >
            下一页
          </button>
        </nav>
      )}
    </section>
  );
}

export default TodoApp;
