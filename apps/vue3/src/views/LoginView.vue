<script setup lang="ts">
import { useRequest } from 'alova/client';
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { login as loginApi } from '@/api/auth';
import { setAuth } from '@/stores/auth';

const router = useRouter();
const route = useRoute();

const username = ref('');
const password = ref('');
const errorMsg = ref('');

const canSubmit = computed(() => username.value.trim() && password.value);

const { loading, send } = useRequest(
  () => loginApi({ username: username.value.trim(), password: password.value }),
  { immediate: false },
);

async function onSubmit() {
  if (!canSubmit.value || loading.value) return;
  errorMsg.value = '';
  try {
    const result = await send();
    setAuth({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    });
    const redirect = (route.query.redirect as string | undefined) || '/todos';
    router.push(redirect);
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : '登录失败';
  }
}
</script>

<template>
  <section
    class="w-full max-w-sm rounded-3xl border border-slate-200/80 bg-white/90 p-7 shadow-[0_20px_50px_-20px_rgba(15,23,42,0.25)] backdrop-blur dark:border-white/10 dark:bg-slate-900/60"
  >
    <header class="mb-6">
      <h1 class="text-2xl font-semibold text-slate-900 dark:text-white">登录</h1>
      <p class="mt-1 text-xs text-slate-500 dark:text-white/50">欢迎回来，请输入账号继续。</p>
    </header>

    <form class="space-y-4" @submit.prevent="onSubmit">
      <label class="block">
        <span class="text-xs font-medium text-slate-600 dark:text-white/70">用户名</span>
        <input
          v-model="username"
          type="text"
          autocomplete="username"
          class="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40 dark:focus:border-emerald-400 dark:focus:ring-emerald-400/20"
          placeholder="请输入用户名"
        />
      </label>
      <label class="block">
        <span class="text-xs font-medium text-slate-600 dark:text-white/70">密码</span>
        <input
          v-model="password"
          type="password"
          autocomplete="current-password"
          class="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40 dark:focus:border-emerald-400 dark:focus:ring-emerald-400/20"
          placeholder="请输入密码"
        />
      </label>

      <p v-if="errorMsg" class="text-xs text-rose-600 dark:text-rose-400">⚠ {{ errorMsg }}</p>

      <button
        type="submit"
        :disabled="!canSubmit || loading"
        class="w-full rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-emerald-500"
      >
        {{ loading ? '登录中…' : '登录' }}
      </button>
    </form>

    <p class="mt-6 text-center text-xs text-slate-500 dark:text-white/50">
      还没有账号？
      <RouterLink
        to="/register"
        class="font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-300 dark:hover:text-emerald-200"
      >
        去注册
      </RouterLink>
    </p>
  </section>
</template>
