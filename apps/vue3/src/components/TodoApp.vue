<script setup lang="ts">
import { useRequest } from 'alova/client';
import { showConfirmDialog, showToast } from 'vant';
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import {
  createTodo,
  deleteTodo,
  listTodos,
  updateTodoStatus,
  type Todo,
  type TodoStatus,
} from '@/api/todo';
import { addSearchHistory, clearSearchHistory, getSearchHistory } from '@/utils/searchHistory';

type StatusFilter = '' | TodoStatus;

const PAGE_SIZE = 10;

const STATUS_TABS: { label: string; value: StatusFilter }[] = [
  { label: '全部', value: '' },
  { label: '待办', value: 'PENDING' },
  { label: '进行中', value: 'ACTIVE' },
  { label: '已完成', value: 'DONE' },
];

const STATUS_BADGE: Record<TodoStatus, { label: string; type: 'primary' | 'warning' | 'success' }> =
  {
    PENDING: { label: '待办', type: 'primary' },
    ACTIVE: { label: '进行中', type: 'warning' },
    DONE: { label: '已完成', type: 'success' },
  };

const route = useRoute();
const router = useRouter();

const isDone = (status: TodoStatus) => status === 'DONE';

const searchText = ref('');
const searchFocused = ref(false);
const history = ref<string[]>(getSearchHistory());
const status = ref<StatusFilter>('');

const todos = ref<Todo[]>([]);
const total = ref(0);
const pageNum = ref(1);

// vant List 状态
const listLoading = ref(false);
const listFinished = ref(false);
const refreshing = ref(false);
const firstLoading = ref(true);

// 新建待办弹窗
const showCreate = ref(false);
const draftTitle = ref('');
const draftDesc = ref('');

const { send: fetchList } = useRequest(
  (params: { pageNum: number }) =>
    listTodos({
      pageNum: params.pageNum,
      pageSize: PAGE_SIZE,
      title: searchText.value || undefined,
      status: status.value || undefined,
    }),
  { immediate: false },
);

async function loadMore() {
  listLoading.value = true;
  try {
    const data = await fetchList({ pageNum: pageNum.value });
    todos.value = pageNum.value === 1 ? data.list : [...todos.value, ...data.list];
    total.value = data.total;
    if (todos.value.length >= data.total || data.list.length === 0) {
      listFinished.value = true;
    } else {
      pageNum.value += 1;
    }
  } catch (err) {
    showToast(err instanceof Error ? err.message : '加载失败');
    listFinished.value = true;
  } finally {
    listLoading.value = false;
    firstLoading.value = false;
  }
}

function resetAndReload() {
  pageNum.value = 1;
  listFinished.value = false;
  todos.value = [];
  void loadMore();
}

async function onRefresh() {
  refreshing.value = true;
  pageNum.value = 1;
  listFinished.value = false;
  try {
    const data = await fetchList({ pageNum: 1 });
    todos.value = data.list;
    total.value = data.total;
    listFinished.value = todos.value.length >= data.total || data.list.length === 0;
    if (!listFinished.value) pageNum.value = 2;
  } catch (err) {
    showToast(err instanceof Error ? err.message : '刷新失败');
  } finally {
    refreshing.value = false;
  }
}

// 搜索：提交时记历史并重载
function onSearch() {
  const word = searchText.value.trim();
  if (word) history.value = addSearchHistory(word);
  searchFocused.value = false;
  resetAndReload();
}

function onSearchClear() {
  searchText.value = '';
  resetAndReload();
}

function applyHistory(word: string) {
  searchText.value = word;
  onSearch();
}

function onClearHistory() {
  history.value = clearSearchHistory();
}

const activeTab = computed({
  get: () => STATUS_TABS.findIndex((t) => t.value === status.value),
  set: (index: number) => {
    const next = STATUS_TABS[index]?.value ?? '';
    if (status.value === next) return;
    status.value = next;
  },
});

watch(status, () => resetAndReload());

const { send: submitTodo, loading: submitting } = useRequest(
  (body: { title: string; description?: string }) => createTodo(body),
  { immediate: false },
);

const { send: sendToggle } = useRequest(
  (id: number, next: TodoStatus) => updateTodoStatus(id, next),
  { immediate: false },
);

const { send: sendDelete } = useRequest((id: number) => deleteTodo(id), { immediate: false });

async function withError<T>(action: () => Promise<T>): Promise<T | null> {
  try {
    return await action();
  } catch (err) {
    showToast(err instanceof Error ? err.message : '操作失败');
    return null;
  }
}

async function addTodo() {
  const title = draftTitle.value.trim();
  if (!title || submitting.value) return;
  const created = await withError(() =>
    submitTodo({ title, description: draftDesc.value.trim() || undefined }),
  );
  if (created) {
    draftTitle.value = '';
    draftDesc.value = '';
    showCreate.value = false;
    showToast('已添加');
    resetAndReload();
  }
}

async function toggle(todo: Todo) {
  const next: TodoStatus = isDone(todo.status) ? 'PENDING' : 'DONE';
  const updated = await withError(() => sendToggle(todo.id, next));
  if (updated) {
    if (status.value && status.value !== updated.status) {
      resetAndReload();
    } else {
      todos.value = todos.value.map((t) => (t.id === todo.id ? updated : t));
    }
  }
}

async function remove(todo: Todo) {
  try {
    await showConfirmDialog({
      title: '删除待办',
      message: `确认删除「${todo.title}」吗？`,
      confirmButtonText: '删除',
      confirmButtonColor: '#ee0a24',
    });
  } catch {
    return;
  }
  const ok = await withError(() => sendDelete(todo.id));
  if (ok !== null) {
    showToast('已删除');
    resetAndReload();
  }
}

function openDetail(todo: Todo) {
  router.push({ name: 'todo-detail', params: { id: todo.id } });
}

onMounted(() => {
  const q = route.query;
  if (typeof q.status === 'string' && ['PENDING', 'ACTIVE', 'DONE'].includes(q.status)) {
    status.value = q.status as TodoStatus;
  }
  if (q.create === '1') {
    showCreate.value = true;
  }
  resetAndReload();
});
</script>

<template>
  <div class="todo">
    <van-nav-bar title="待办" fixed placeholder>
      <template #right>
        <van-icon name="plus" size="20" @click="showCreate = true" />
      </template>
    </van-nav-bar>

    <van-search
      v-model="searchText"
      placeholder="搜索标题"
      shape="round"
      @search="onSearch"
      @clear="onSearchClear"
      @focus="searchFocused = true"
    />

    <!-- 搜索历史 -->
    <div v-if="searchFocused && history.length" class="todo__history">
      <div class="todo__history-head">
        <span>搜索历史</span>
        <van-icon name="delete-o" @click="onClearHistory" />
      </div>
      <div class="todo__history-tags">
        <van-tag
          v-for="word in history"
          :key="word"
          plain
          type="primary"
          size="medium"
          @click="applyHistory(word)"
        >
          {{ word }}
        </van-tag>
      </div>
    </div>

    <van-tabs v-model:active="activeTab" sticky offset-top="46px" line-width="20">
      <van-tab v-for="tab in STATUS_TABS" :key="tab.value || 'all'" :title="tab.label" />
    </van-tabs>

    <div class="todo__body">
      <!-- 首屏骨架屏 -->
      <template v-if="firstLoading">
        <div v-for="i in 5" :key="i" class="todo__skeleton">
          <van-skeleton title :row="1" round />
        </div>
      </template>

      <van-pull-refresh v-else v-model="refreshing" @refresh="onRefresh">
        <van-list
          v-model:loading="listLoading"
          :finished="listFinished"
          finished-text="没有更多了"
          @load="loadMore"
        >
          <van-swipe-cell v-for="todo in todos" :key="todo.id" class="todo__cell">
            <van-cell center :border="true" clickable @click="openDetail(todo)">
              <template #icon>
                <van-checkbox
                  :model-value="isDone(todo.status)"
                  shape="round"
                  class="todo__check"
                  @click.stop="toggle(todo)"
                />
              </template>
              <template #title>
                <span class="todo__title" :class="{ 'todo__title--done': isDone(todo.status) }">
                  {{ todo.title }}
                </span>
                <span v-if="todo.description" class="todo__desc">{{ todo.description }}</span>
              </template>
              <template #value>
                <van-tag :type="STATUS_BADGE[todo.status].type" round>
                  {{ STATUS_BADGE[todo.status].label }}
                </van-tag>
              </template>
            </van-cell>
            <template #right>
              <van-button
                square
                type="danger"
                text="删除"
                class="todo__del"
                @click="remove(todo)"
              />
            </template>
          </van-swipe-cell>

          <van-empty
            v-if="listFinished && todos.length === 0"
            :description="searchText || status ? '没有匹配的待办' : '还没有待办，点右上角添加吧'"
          />
        </van-list>
      </van-pull-refresh>
    </div>

    <!-- 新建待办弹窗 -->
    <van-dialog
      v-model:show="showCreate"
      title="新建待办"
      show-cancel-button
      confirm-button-text="添加"
      :confirm-button-disabled="!draftTitle.trim()"
      @confirm="addTodo"
    >
      <div class="todo__create">
        <van-field
          v-model="draftTitle"
          label="标题"
          placeholder="今天打算完成什么？"
          maxlength="100"
          autofocus
        />
        <van-field
          v-model="draftDesc"
          label="描述"
          type="textarea"
          placeholder="补充说明（选填）"
          rows="2"
          autosize
          maxlength="200"
          show-word-limit
        />
      </div>
    </van-dialog>
  </div>
</template>

<style scoped>
.todo {
  min-height: 100vh;
  background: var(--app-page-bg);
}

.todo__history {
  margin: 0 12px 8px;
  padding: 12px;
  border-radius: 12px;
  background: var(--app-card);
  box-shadow: var(--app-card-shadow);
}

.todo__history-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 12px;
  color: var(--app-text-3);
}

.todo__history-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.todo__body {
  padding: 8px 12px 12px;
}

.todo__skeleton {
  margin-bottom: 12px;
  padding: 14px;
  border-radius: 12px;
  background: var(--app-card);
}

.todo__cell {
  margin-bottom: 8px;
  border-radius: 12px;
  overflow: hidden;
  background: var(--app-card);
}

.todo__check {
  margin-right: 10px;
}

.todo__title {
  font-size: 15px;
  color: var(--app-text);
}

.todo__title--done {
  color: var(--app-text-3);
  text-decoration: line-through;
}

.todo__desc {
  display: block;
  margin-top: 2px;
  font-size: 12px;
  color: var(--app-text-3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.todo__del {
  height: 100%;
}

.todo__create {
  padding: 8px 0;
}
</style>
