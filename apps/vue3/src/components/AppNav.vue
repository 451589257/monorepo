<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, useRouter } from 'vue-router';

import { logout as logoutApi } from '@/api/auth';
import { authState, clearAuth, getRefreshToken, isLoggedIn } from '@/stores/auth';

const router = useRouter();

const loggedIn = computed(() => isLoggedIn() && Boolean(authState.user));
const username = computed(() => authState.user?.nickname || authState.user?.username || '');

async function onLogout() {
  const refresh = getRefreshToken();
  if (refresh) {
    try {
      await logoutApi(refresh);
    } catch {
      // 登出对无效 token 服务端会静默成功；此处即便失败也清本地态
    }
  }
  clearAuth();
  router.push({ name: 'login' });
}
</script>

<template>
  <nav
    class="sticky top-0 z-10 mb-6 flex items-center justify-between border-b border-slate-200/70 bg-white/80 px-6 py-3 backdrop-blur dark:border-white/10 dark:bg-slate-900/70"
  >
    <RouterLink
      to="/todos"
      class="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-white"
    >
      <span class="text-lg">🌿</span>
      <span>Vue3 Demo</span>
    </RouterLink>
    <div class="flex items-center gap-2 text-sm">
      <template v-if="loggedIn">
        <RouterLink
          to="/todos"
          class="rounded-lg px-3 py-1.5 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-700 dark:text-white/60 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-300"
          active-class="bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
        >
          待办
        </RouterLink>
        <RouterLink
          to="/profile"
          class="rounded-lg px-3 py-1.5 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-700 dark:text-white/60 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-300"
          active-class="bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
        >
          个人中心
        </RouterLink>
        <span class="ml-1 text-xs text-slate-500 dark:text-white/50">你好，{{ username }}</span>
        <button
          type="button"
          class="ml-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition hover:border-rose-300 hover:text-rose-600 dark:border-white/10 dark:text-white/70 dark:hover:border-rose-400/40 dark:hover:text-rose-300"
          @click="onLogout"
        >
          登出
        </button>
      </template>
      <template v-else>
        <RouterLink
          to="/login"
          class="rounded-lg px-3 py-1.5 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-700 dark:text-white/60 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-300"
        >
          登录
        </RouterLink>
        <RouterLink
          to="/register"
          class="rounded-lg bg-emerald-500 px-3 py-1.5 text-white shadow-sm transition hover:bg-emerald-600"
        >
          注册
        </RouterLink>
      </template>
    </div>
  </nav>
</template>
