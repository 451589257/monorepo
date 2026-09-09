<template>
  <div class="home">
    <van-nav-bar title="首页" fixed placeholder />

    <div class="home__body">
      <!-- 用户问候卡 -->
      <div class="hero">
        <div class="hero__avatar">
          <van-icon name="manager-o" />
        </div>
        <div class="hero__text">
          <p class="hero__hi">{{ greeting() }}，{{ username }} 👋</p>
          <p class="hero__sub">今天也要元气满满地完成待办哦</p>
        </div>
      </div>

      <!-- 骨架屏 -->
      <template v-if="loading">
        <div class="card-skeleton"><van-skeleton title :row="2" round /></div>
        <div class="card-skeleton"><van-skeleton title :row="3" round /></div>
      </template>

      <template v-else>
        <!-- 统计卡 -->
        <div class="stats">
          <div v-for="item in STATS" :key="item.label" class="stats__item">
            <span class="stats__value" :style="{ color: item.color }">{{ item.value }}</span>
            <span class="stats__label">{{ item.label }}</span>
          </div>
        </div>

        <!-- 完成进度 -->
        <div class="card">
          <div class="card__head">
            <span>完成进度</span>
            <span class="card__rate">{{ doneRate }}%</span>
          </div>
          <van-progress
            :percentage="doneRate"
            stroke-width="8"
            color="#07c160"
            track-color="var(--app-border)"
            :show-pivot="false"
          />
          <p class="card__hint">共 {{ total }} 条待办，已完成 {{ counts.DONE }} 条，加油 💪</p>
        </div>

        <!-- 状态分布可视化 -->
        <div class="card">
          <div class="card__head"><span>状态分布</span></div>
          <div v-if="total === 0" class="dist__empty">暂无数据</div>
          <div v-else class="dist">
            <div v-for="item in DISTRIBUTION" :key="item.label" class="dist__row">
              <span class="dist__label">{{ item.label }}</span>
              <div class="dist__track">
                <div
                  class="dist__bar"
                  :style="{ width: `${item.percent}%`, background: item.color }"
                ></div>
              </div>
              <span class="dist__value">{{ item.value }}</span>
            </div>
          </div>
        </div>
      </template>

      <!-- 快捷入口 -->
      <div class="panel">
        <p class="panel__title">快捷入口</p>
        <van-grid :column-num="4" :border="false">
          <van-grid-item v-for="item in SHORTCUTS" :key="item.label" @click="go(item.path)">
            <div class="shortcut">
              <span class="shortcut__icon" :style="{ background: item.color }">
                <van-icon :name="item.icon" />
              </span>
              <span class="shortcut__label">{{ item.label }}</span>
            </div>
          </van-grid-item>
        </van-grid>
      </div>

      <div class="refresh">
        <van-button
          round
          block
          plain
          type="primary"
          :loading="loading"
          loading-text="刷新中…"
          @click="onRefresh"
        >
          刷新数据
        </van-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRequest } from 'alova/client';
import { showToast } from 'vant';
import { computed } from 'vue';
import { useRouter } from 'vue-router';

import { listTodos, type TodoStatus } from '@/api/todo';
import { authState } from '@/stores/auth';

const router = useRouter();

const username = computed(() => authState.user?.nickname || authState.user?.username || '访客');

// 一次性拉取较大页，前端聚合各状态数量（不新增后端接口）
const { data, loading, send } = useRequest(() => listTodos({ pageNum: 1, pageSize: 1000 }), {
  immediate: true,
  initialData: { list: [], total: 0 },
});

const counts = computed(() => {
  const list = data.value?.list ?? [];
  const base: Record<TodoStatus, number> = { PENDING: 0, ACTIVE: 0, DONE: 0 };
  for (const todo of list) base[todo.status] += 1;
  return base;
});

const total = computed(() => data.value?.total ?? 0);
const doneRate = computed(() => {
  const t = total.value;
  if (!t) return 0;
  return Math.round((counts.value.DONE / t) * 100);
});

const STATS = computed(() => [
  { label: '全部', value: total.value, color: '#1989fa' },
  { label: '进行中', value: counts.value.ACTIVE, color: '#ff976a' },
  { label: '已完成', value: counts.value.DONE, color: '#07c160' },
]);

// 状态分布（可视化条形）
const DISTRIBUTION = computed(() => {
  const t = total.value || 1;
  return [
    {
      label: '待办',
      value: counts.value.PENDING,
      color: '#1989fa',
      percent: (counts.value.PENDING / t) * 100,
    },
    {
      label: '进行中',
      value: counts.value.ACTIVE,
      color: '#ff976a',
      percent: (counts.value.ACTIVE / t) * 100,
    },
    {
      label: '已完成',
      value: counts.value.DONE,
      color: '#07c160',
      percent: (counts.value.DONE / t) * 100,
    },
  ];
});

const SHORTCUTS = [
  { label: '我的待办', icon: 'todo-list-o', path: '/todos', color: '#1989fa' },
  { label: '新建待办', icon: 'add-o', path: '/todos?create=1', color: '#07c160' },
  { label: '个人中心', icon: 'user-o', path: '/profile', color: '#ff976a' },
  { label: '设置', icon: 'setting-o', path: '/settings', color: '#7232dd' },
];

function go(path: string) {
  router.push(path);
}

function greeting() {
  const h = new Date().getHours();
  if (h < 6) return '夜深了';
  if (h < 12) return '早上好';
  if (h < 14) return '中午好';
  if (h < 18) return '下午好';
  return '晚上好';
}

async function onRefresh() {
  await send();
  showToast('已刷新');
}
</script>

<style scoped>
.home {
  min-height: 100vh;
  background: var(--app-page-bg);
  padding-bottom: 16px;
}

.home__body {
  padding: 12px 16px;
}

.hero {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--app-hero-from) 0%, var(--app-hero-to) 100%);
  color: #fff;
  box-shadow: 0 8px 20px -8px rgba(25, 137, 250, 0.5);
}

.hero__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  font-size: 26px;
}

.hero__hi {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
}

.hero__sub {
  margin: 4px 0 0;
  font-size: 12px;
  opacity: 0.9;
}

.card-skeleton {
  margin-top: 12px;
  padding: 16px;
  border-radius: 16px;
  background: var(--app-card);
}

.stats {
  display: flex;
  margin-top: 12px;
  padding: 16px 0;
  border-radius: 16px;
  background: var(--app-card);
  box-shadow: var(--app-card-shadow);
}

.stats__item {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stats__item + .stats__item {
  border-left: 1px solid var(--app-border);
}

.stats__value {
  font-size: 22px;
  font-weight: 700;
}

.stats__label {
  font-size: 12px;
  color: var(--app-text-3);
}

.card {
  margin-top: 12px;
  padding: 16px;
  border-radius: 16px;
  background: var(--app-card);
  box-shadow: var(--app-card-shadow);
}

.card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: var(--app-text);
}

.card__rate {
  color: #07c160;
}

.card__hint {
  margin: 12px 0 0;
  font-size: 12px;
  color: var(--app-text-3);
}

.dist {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dist__empty {
  font-size: 12px;
  color: var(--app-text-3);
}

.dist__row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dist__label {
  width: 44px;
  font-size: 12px;
  color: var(--app-text-2);
}

.dist__track {
  flex: 1;
  height: 8px;
  border-radius: 999px;
  background: var(--app-border);
  overflow: hidden;
}

.dist__bar {
  height: 100%;
  border-radius: 999px;
  transition: width 0.4s ease;
}

.dist__value {
  width: 28px;
  font-size: 12px;
  text-align: right;
  color: var(--app-text-2);
}

.panel {
  margin-top: 12px;
  padding: 16px 8px 4px;
  border-radius: 16px;
  background: var(--app-card);
  box-shadow: var(--app-card-shadow);
}

.panel__title {
  margin: 0 0 4px 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--app-text);
}

.shortcut {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.shortcut__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  color: #fff;
  font-size: 22px;
}

.shortcut__label {
  font-size: 12px;
  color: var(--app-text-2);
}

.refresh {
  margin-top: 16px;
}
</style>
