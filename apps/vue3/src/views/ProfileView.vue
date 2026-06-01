<script setup lang="ts">
import { useRequest } from 'alova/client';
import { showConfirmDialog, showToast } from 'vant';
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';

import { getMe, logout as logoutApi } from '@/api/auth';
import { authState, clearAuth, getRefreshToken, setUser } from '@/stores/auth';

const router = useRouter();

const { loading, send: refresh } = useRequest(() => getMe(), { immediate: false });

const user = computed(() => authState.user);
const displayName = computed(() => user.value?.nickname || user.value?.username || '未登录');

async function loadProfile() {
  try {
    const me = await refresh();
    setUser(me);
  } catch (err) {
    showToast(err instanceof Error ? err.message : '加载失败');
  }
}

onMounted(loadProfile);

function formatTime(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

async function onLogout() {
  try {
    await showConfirmDialog({
      title: '退出登录',
      message: '确认退出当前账号吗？',
      confirmButtonText: '退出',
      confirmButtonColor: '#ee0a24',
    });
  } catch {
    // 用户取消
    return;
  }
  const refreshToken = getRefreshToken();
  if (refreshToken) {
    try {
      await logoutApi(refreshToken);
    } catch {
      // 登出失败也清本地态
    }
  }
  clearAuth();
  router.push({ name: 'login' });
}
</script>

<template>
  <div class="profile">
    <van-nav-bar title="我的" fixed placeholder />

    <!-- 用户卡片 -->
    <div class="profile__hero">
      <div class="profile__avatar">
        <van-icon name="manager" />
      </div>
      <div class="profile__meta">
        <p class="profile__name">{{ displayName }}</p>
        <p v-if="user" class="profile__id">ID #{{ user.id }}</p>
      </div>
    </div>

    <div class="profile__body">
      <van-cell-group inset title="账号信息">
        <van-cell title="用户名" :value="user?.username || '—'" />
        <van-cell title="昵称" :value="user?.nickname || '—'" />
        <van-cell title="注册时间" :value="formatTime(user?.createTime)" />
        <van-cell title="最近更新" :value="formatTime(user?.updateTime)" />
      </van-cell-group>

      <van-cell-group inset title="操作" class="profile__group">
        <van-cell
          title="刷新资料"
          icon="replay"
          is-link
          :class="{ 'is-loading': loading }"
          @click="loadProfile"
        />
        <van-cell title="待办列表" icon="todo-list-o" is-link to="/todos" />
        <van-cell title="设置" icon="setting-o" is-link to="/settings" />
      </van-cell-group>

      <div class="profile__logout">
        <van-button round block type="danger" @click="onLogout">退出登录</van-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile {
  min-height: 100vh;
  background: var(--app-page-bg);
}

.profile__hero {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 24px 20px;
  background: linear-gradient(135deg, var(--app-hero-from) 0%, var(--app-hero-to) 100%);
  color: #fff;
}

.profile__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  font-size: 32px;
}

.profile__name {
  margin: 0;
  font-size: 19px;
  font-weight: 700;
}

.profile__id {
  margin: 4px 0 0;
  font-size: 12px;
  opacity: 0.9;
}

.profile__body {
  padding: 12px 0;
}

.profile__group {
  margin-top: 12px;
}

.profile__logout {
  margin: 24px 16px 0;
}
</style>
