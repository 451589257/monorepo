<script setup lang="ts">
import { useRequest } from 'alova/client';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { getMe, logout as logoutApi } from '@/api/auth';
import { authState, clearAuth, getRefreshToken, setUser } from '@/stores/auth';

const router = useRouter();
const errorMsg = ref('');

const { loading, send: refresh } = useRequest(() => getMe(), { immediate: false });

async function loadProfile() {
  errorMsg.value = '';
  try {
    const user = await refresh();
    setUser(user);
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : '加载失败';
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
  <section
    class="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white/90 p-7 shadow-[0_20px_50px_-20px_rgba(15,23,42,0.25)] backdrop-blur dark:border-white/10 dark:bg-slate-900/60"
  >
    <header class="mb-6 flex items-center gap-3">
      <span
        class="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-xl dark:bg-emerald-500/15"
      >
        👤
      </span>
      <div>
        <h1 class="text-xl font-semibold text-slate-900 dark:text-white">个人中心</h1>
        <p class="text-xs text-slate-500 dark:text-white/50">查看并管理你的账号</p>
      </div>
    </header>

    <p v-if="loading" class="text-sm text-slate-400 dark:text-white/40">加载中…</p>
    <p v-else-if="errorMsg" class="text-sm text-rose-600 dark:text-rose-400">⚠ {{ errorMsg }}</p>

    <dl
      v-else-if="authState.user"
      class="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-sm dark:border-white/10 dark:bg-white/5"
    >
      <div class="flex items-center justify-between">
        <dt class="text-slate-500 dark:text-white/50">用户 ID</dt>
        <dd class="font-medium text-slate-800 dark:text-white/90">#{{ authState.user.id }}</dd>
      </div>
      <div class="flex items-center justify-between">
        <dt class="text-slate-500 dark:text-white/50">用户名</dt>
        <dd class="font-medium text-slate-800 dark:text-white/90">{{ authState.user.username }}</dd>
      </div>
      <div class="flex items-center justify-between">
        <dt class="text-slate-500 dark:text-white/50">昵称</dt>
        <dd class="font-medium text-slate-800 dark:text-white/90">
          {{ authState.user.nickname || '—' }}
        </dd>
      </div>
      <div class="flex items-center justify-between">
        <dt class="text-slate-500 dark:text-white/50">注册时间</dt>
        <dd class="font-medium text-slate-800 dark:text-white/90">
          {{ formatTime(authState.user.createTime) }}
        </dd>
      </div>
      <div class="flex items-center justify-between">
        <dt class="text-slate-500 dark:text-white/50">最近更新</dt>
        <dd class="font-medium text-slate-800 dark:text-white/90">
          {{ formatTime(authState.user.updateTime) }}
        </dd>
      </div>
    </dl>

    <div class="mt-6 flex items-center justify-between gap-2">
      <button
        type="button"
        class="rounded-xl border border-slate-200 px-4 py-2 text-xs text-slate-600 transition hover:border-emerald-400 hover:text-emerald-600 dark:border-white/10 dark:text-white/70 dark:hover:border-emerald-400/60 dark:hover:text-emerald-300"
        :disabled="loading"
        @click="loadProfile"
      >
        刷新
      </button>
      <button
        type="button"
        class="rounded-xl bg-rose-500 px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-rose-600 active:scale-[0.99]"
        @click="onLogout"
      >
        登出当前会话
      </button>
    </div>
  </section>
</template>
