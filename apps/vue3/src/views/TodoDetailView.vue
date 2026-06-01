<script setup lang="ts">
import { useRequest } from 'alova/client';
import { showConfirmDialog, showToast } from 'vant';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import {
  deleteTodo,
  listTodos,
  updateTodo,
  updateTodoStatus,
  type Todo,
  type TodoStatus,
} from '@/api/todo';

const route = useRoute();
const router = useRouter();

const id = Number(route.params.id);

const STATUS_META: Record<TodoStatus, { label: string; type: 'primary' | 'warning' | 'success' }> =
  {
    PENDING: { label: '待办', type: 'primary' },
    ACTIVE: { label: '进行中', type: 'warning' },
    DONE: { label: '已完成', type: 'success' },
  };

const STATUS_ACTIONS = [
  { name: '待办', value: 'PENDING' as TodoStatus },
  { name: '进行中', value: 'ACTIVE' as TodoStatus },
  { name: '已完成', value: 'DONE' as TodoStatus },
];

const todo = ref<Todo | null>(null);
const loading = ref(true);
const showStatusSheet = ref(false);
const showEdit = ref(false);
const editTitle = ref('');
const editDesc = ref('');

// 无 get-by-id 接口：用 list 拉取后按 id 兜底查找
const { send: fetchList } = useRequest(() => listTodos({ pageNum: 1, pageSize: 1000 }), {
  immediate: false,
});

async function load() {
  loading.value = true;
  try {
    const data = await fetchList();
    todo.value = data.list.find((t) => t.id === id) ?? null;
    if (!todo.value) showToast('待办不存在或已删除');
  } catch (err) {
    showToast(err instanceof Error ? err.message : '加载失败');
  } finally {
    loading.value = false;
  }
}

onMounted(load);

function formatTime(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

const statusMeta = computed(() => (todo.value ? STATUS_META[todo.value.status] : null));

const { send: sendStatus } = useRequest((next: TodoStatus) => updateTodoStatus(id, next), {
  immediate: false,
});

async function onSelectStatus(action: { value: TodoStatus }) {
  if (!todo.value || action.value === todo.value.status) {
    showStatusSheet.value = false;
    return;
  }
  try {
    const updated = await sendStatus(action.value);
    todo.value = updated;
    showToast('状态已更新');
  } catch (err) {
    showToast(err instanceof Error ? err.message : '更新失败');
  } finally {
    showStatusSheet.value = false;
  }
}

function openEdit() {
  if (!todo.value) return;
  editTitle.value = todo.value.title;
  editDesc.value = todo.value.description ?? '';
  showEdit.value = true;
}

const { send: sendUpdate, loading: saving } = useRequest(
  (body: { title: string; description?: string }) => updateTodo(id, body),
  { immediate: false },
);

async function onSaveEdit() {
  const title = editTitle.value.trim();
  if (!title) {
    showToast('标题不能为空');
    return;
  }
  try {
    const updated = await sendUpdate({ title, description: editDesc.value.trim() || undefined });
    todo.value = updated;
    showEdit.value = false;
    showToast('已保存');
  } catch (err) {
    showToast(err instanceof Error ? err.message : '保存失败');
  }
}

const { send: sendDelete } = useRequest(() => deleteTodo(id), { immediate: false });

async function onDelete() {
  try {
    await showConfirmDialog({
      title: '删除待办',
      message: '确认删除这条待办吗？',
      confirmButtonText: '删除',
      confirmButtonColor: '#ee0a24',
    });
  } catch {
    return;
  }
  try {
    await sendDelete();
    showToast('已删除');
    router.back();
  } catch (err) {
    showToast(err instanceof Error ? err.message : '删除失败');
  }
}
</script>

<template>
  <div class="detail">
    <van-nav-bar title="待办详情" left-arrow fixed placeholder @click-left="router.back()" />

    <div v-if="loading" class="detail__skeleton">
      <van-skeleton title :row="3" round />
    </div>

    <template v-else-if="todo">
      <div class="detail__card">
        <div class="detail__head">
          <h2 class="detail__title" :class="{ 'detail__title--done': todo.status === 'DONE' }">
            {{ todo.title }}
          </h2>
          <van-tag v-if="statusMeta" :type="statusMeta.type" round size="medium">
            {{ statusMeta.label }}
          </van-tag>
        </div>
        <p class="detail__desc">{{ todo.description || '暂无描述' }}</p>
      </div>

      <van-cell-group inset title="信息">
        <van-cell title="编号" :value="`#${todo.id}`" />
        <van-cell title="创建时间" :value="formatTime(todo.createTime)" />
        <van-cell title="更新时间" :value="formatTime(todo.updateTime)" />
      </van-cell-group>

      <van-cell-group inset class="detail__group">
        <van-cell title="修改状态" is-link @click="showStatusSheet = true">
          <template #value>
            <span v-if="statusMeta">{{ statusMeta.label }}</span>
          </template>
        </van-cell>
        <van-cell title="编辑内容" icon="edit" is-link @click="openEdit" />
      </van-cell-group>

      <div class="detail__actions">
        <van-button block type="danger" plain @click="onDelete">删除待办</van-button>
      </div>
    </template>

    <van-empty v-else description="待办不存在或已删除" />

    <!-- 状态切换 ActionSheet -->
    <van-action-sheet
      v-model:show="showStatusSheet"
      :actions="STATUS_ACTIONS"
      cancel-text="取消"
      title="修改状态"
      @select="onSelectStatus"
    />

    <!-- 编辑弹窗 -->
    <van-dialog
      v-model:show="showEdit"
      title="编辑待办"
      show-cancel-button
      confirm-button-text="保存"
      :confirm-button-disabled="!editTitle.trim() || saving"
      :before-close="undefined"
      @confirm="onSaveEdit"
    >
      <div class="detail__edit">
        <van-field v-model="editTitle" label="标题" placeholder="标题" maxlength="100" />
        <van-field
          v-model="editDesc"
          label="描述"
          type="textarea"
          placeholder="补充说明（选填）"
          rows="3"
          autosize
          maxlength="200"
          show-word-limit
        />
      </div>
    </van-dialog>
  </div>
</template>

<style scoped>
.detail {
  min-height: 100vh;
  background: var(--app-page-bg);
  padding-bottom: 24px;
}

.detail__skeleton {
  margin: 16px;
  padding: 16px;
  border-radius: 16px;
  background: var(--app-card);
}

.detail__card {
  margin: 12px 16px;
  padding: 18px;
  border-radius: 16px;
  background: var(--app-card);
  box-shadow: var(--app-card-shadow);
}

.detail__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.detail__title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--app-text);
  word-break: break-word;
}

.detail__title--done {
  color: var(--app-text-3);
  text-decoration: line-through;
}

.detail__desc {
  margin: 12px 0 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--app-text-2);
  white-space: pre-wrap;
  word-break: break-word;
}

.detail__group {
  margin-top: 12px;
}

.detail__actions {
  margin: 24px 16px 0;
}

.detail__edit {
  padding: 8px 0;
}
</style>
