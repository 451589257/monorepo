<script setup lang="ts">
import { useRequest, useWatcher } from 'alova/client';
import { computed, ref } from 'vue';

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

const STATUS_BADGE: Record<TodoStatus, { label: string; class: string }> = {
  PENDING: {
    label: '待办',
    class: 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white/70',
  },
  ACTIVE: {
    label: '进行中',
    class: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  },
  DONE: {
    label: '已完成',
    class: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  },
};

const isDone = (status: TodoStatus) => status === 'DONE';

const searchInput = ref('');
const searchText = ref('');
const status = ref<StatusFilter>('');
const pageNum = ref(1);

const todos = ref<Todo[]>([]);
const total = ref(0);
const errorMsg = ref('');
const draft = ref('');

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / PAGE_SIZE)));

const {
  loading,
  send: refresh,
  onSuccess: onListSuccess,
  onError: onListError,
} = useWatcher(
  () =>
    listTodos({
      pageNum: pageNum.value,
      pageSize: PAGE_SIZE,
      title: searchText.value || undefined,
      status: status.value || undefined,
    }),
  [searchText, status, pageNum],
  { immediate: true, debounce: 0 },
);

onListSuccess(({ data }) => {
  todos.value = data.list;
  total.value = data.total;
  errorMsg.value = '';
  const max = Math.max(1, Math.ceil(data.total / PAGE_SIZE));
  if (pageNum.value > max) pageNum.value = max;
});
onListError(({ error }) => {
  errorMsg.value = error.message || '加载失败';
});

let searchTimer: ReturnType<typeof setTimeout> | null = null;
function onSearchInput(value: string) {
  searchInput.value = value;
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    if (searchText.value === value.trim()) return;
    searchText.value = value.trim();
    pageNum.value = 1;
  }, 300);
}

function setStatus(next: StatusFilter) {
  if (status.value === next) return;
  status.value = next;
  pageNum.value = 1;
}

function goPrev() {
  if (pageNum.value > 1) pageNum.value -= 1;
}
function goNext() {
  if (pageNum.value < totalPages.value) pageNum.value += 1;
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

async function withError<T>(action: () => Promise<T>): Promise<T | null> {
  try {
    errorMsg.value = '';
    return await action();
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : '操作失败';
    return null;
  }
}

async function addTodo() {
  const title = draft.value.trim();
  if (!title || submitting.value) return;
  const created = await withError(() => submitTodo(title));
  if (created) {
    draft.value = '';
    if (pageNum.value === 1) {
      await refresh();
    } else {
      pageNum.value = 1;
    }
  }
}

async function toggle(todo: Todo) {
  const next: TodoStatus = isDone(todo.status) ? 'PENDING' : 'DONE';
  const updated = await withError(() => sendToggle(todo.id, next));
  if (updated) {
    if (status.value && status.value !== updated.status) {
      await refresh();
    } else {
      todos.value = todos.value.map((t) => (t.id === todo.id ? updated : t));
    }
  }
}

async function remove(id: number) {
  const ok = await withError(() => sendDelete(id));
  if (ok !== null) {
    if (todos.value.length === 1 && pageNum.value > 1) {
      pageNum.value -= 1;
    } else {
      await refresh();
    }
  }
}

async function clearCompleted() {
  const res = await withError(() => listTodos({ pageNum: 1, pageSize: 1000, status: 'DONE' }));
  if (!res || res.list.length === 0) return;
  await withError(() => Promise.all(res.list.map((t) => sendDelete(t.id))));
  if (pageNum.value !== 1) {
    pageNum.value = 1;
  } else {
    await refresh();
  }
}

const hasResults = computed(() => todos.value.length > 0);
</script>

<template>
  <section
    class="w-full max-w-xl rounded-3xl border border-slate-200/80 bg-white/90 p-7 shadow-[0_20px_50px_-20px_rgba(15,23,42,0.25)] backdrop-blur dark:border-white/10 dark:bg-slate-900/60 dark:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)]"
  >
    <header class="mb-6 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <span
          class="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-lg dark:bg-emerald-500/15"
          aria-hidden="true"
        >
          ✅
        </span>
        <div>
          <h1 class="text-2xl leading-tight font-semibold text-slate-900 dark:text-white">
            Vue 3 Todo
          </h1>
          <p class="text-xs text-slate-500 dark:text-white/50">Composition API · alova</p>
        </div>
      </div>
      <span
        class="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
      >
        共 {{ total }} 条
      </span>
    </header>

    <form class="flex gap-2" @submit.prevent="addTodo">
      <input
        v-model="draft"
        type="text"
        placeholder="今天打算完成什么？"
        :disabled="submitting"
        class="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40 dark:focus:border-emerald-400 dark:focus:ring-emerald-400/20"
      />
      <button
        type="submit"
        :disabled="!draft.trim() || submitting"
        class="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-emerald-500"
      >
        {{ submitting ? '添加中…' : '添加' }}
      </button>
    </form>

    <div class="relative mt-3">
      <span
        class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-slate-400 dark:text-white/40"
        aria-hidden="true"
      >
        🔍
      </span>
      <input
        :value="searchInput"
        type="search"
        placeholder="搜索标题…"
        class="w-full rounded-xl border border-slate-200 bg-white py-2 pr-3 pl-9 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40 dark:focus:border-emerald-400 dark:focus:ring-emerald-400/20"
        @input="onSearchInput(($event.target as HTMLInputElement).value)"
      />
    </div>

    <p v-if="errorMsg" class="mt-3 text-xs text-rose-600 dark:text-rose-400">⚠ {{ errorMsg }}</p>

    <div class="mt-5 flex items-center justify-between gap-3">
      <div class="inline-flex rounded-xl bg-slate-100 p-1 text-xs dark:bg-white/5" role="tablist">
        <button
          v-for="item in STATUS_FILTERS"
          :key="item.value || 'all'"
          type="button"
          role="tab"
          :aria-selected="status === item.value"
          class="rounded-lg px-3 py-1.5 transition"
          :class="
            status === item.value
              ? 'bg-white text-emerald-700 shadow-sm dark:bg-emerald-500/20 dark:text-emerald-200'
              : 'text-slate-500 hover:text-slate-800 dark:text-white/50 dark:hover:text-white/80'
          "
          @click="setStatus(item.value)"
        >
          {{ item.label }}
        </button>
      </div>
      <button
        type="button"
        class="rounded-lg px-2 py-1 text-xs text-slate-500 transition hover:text-rose-500 dark:text-white/50 dark:hover:text-rose-400"
        @click="clearCompleted"
      >
        清除已完成
      </button>
    </div>

    <p v-if="loading" class="mt-10 text-center text-sm text-slate-400 dark:text-white/40">
      加载中…
    </p>

    <ul v-else-if="hasResults" class="mt-5 space-y-2">
      <li
        v-for="todo in todos"
        :key="todo.id"
        class="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 transition hover:-translate-y-px hover:border-emerald-300 hover:shadow-sm dark:border-white/10 dark:bg-white/5 dark:hover:border-emerald-400/40 dark:hover:bg-white/[0.07]"
      >
        <input
          :id="`vue3-todo-${todo.id}`"
          type="checkbox"
          :checked="isDone(todo.status)"
          class="h-4 w-4 cursor-pointer accent-emerald-500"
          @change="toggle(todo)"
        />
        <label
          :for="`vue3-todo-${todo.id}`"
          class="flex-1 cursor-pointer truncate text-left text-sm transition"
          :class="
            isDone(todo.status)
              ? 'text-slate-400 line-through dark:text-white/40'
              : 'text-slate-800 dark:text-white/90'
          "
        >
          {{ todo.title }}
        </label>
        <span
          class="rounded-md px-2 py-0.5 text-[11px] font-medium"
          :class="STATUS_BADGE[todo.status].class"
        >
          {{ STATUS_BADGE[todo.status].label }}
        </span>
        <button
          type="button"
          aria-label="删除"
          class="rounded-md px-2 py-1 text-xs text-slate-400 opacity-0 transition group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-600 dark:text-white/40 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
          @click="remove(todo.id)"
        >
          删除
        </button>
      </li>
    </ul>

    <div
      v-else
      class="mt-10 flex flex-col items-center gap-2 text-center text-sm text-slate-400 dark:text-white/40"
    >
      <span class="text-3xl" aria-hidden="true">✨</span>
      <p>{{ searchText || status ? '没有匹配的待办' : '还没有待办，加一个开始吧' }}</p>
    </div>

    <nav
      v-if="totalPages > 1"
      class="mt-5 flex items-center justify-between text-xs text-slate-500 dark:text-white/50"
      aria-label="分页"
    >
      <button
        type="button"
        :disabled="pageNum <= 1"
        class="rounded-lg border border-slate-200 px-3 py-1.5 transition hover:border-emerald-400 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-500 dark:border-white/10 dark:hover:border-emerald-400/60 dark:hover:text-emerald-300 dark:disabled:hover:border-white/10 dark:disabled:hover:text-white/50"
        @click="goPrev"
      >
        上一页
      </button>
      <span>第 {{ pageNum }} / 共 {{ totalPages }} 页</span>
      <button
        type="button"
        :disabled="pageNum >= totalPages"
        class="rounded-lg border border-slate-200 px-3 py-1.5 transition hover:border-emerald-400 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-500 dark:border-white/10 dark:hover:border-emerald-400/60 dark:hover:text-emerald-300 dark:disabled:hover:border-white/10 dark:disabled:hover:text-white/50"
        @click="goNext"
      >
        下一页
      </button>
    </nav>
  </section>
</template>
