<script setup lang="ts">
import { useRequest } from 'alova/client';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import { register as registerApi } from '@/api/auth';
import { setAuth } from '@/stores/auth';

const router = useRouter();

const username = ref('');
const password = ref('');
const confirmPassword = ref('');
const nickname = ref('');
const errorMsg = ref('');

// 与后端 RegisterDto 对齐
const USERNAME_RE = /^[a-zA-Z0-9_]+$/;

const validation = computed<string | null>(() => {
  const u = username.value.trim();
  if (u.length < 3 || u.length > 32) return '用户名长度需在 3 ~ 32 位';
  if (!USERNAME_RE.test(u)) return '用户名只能包含字母、数字、下划线';
  if (password.value.length < 6 || password.value.length > 64) return '密码长度需在 6 ~ 64 位';
  if (password.value !== confirmPassword.value) return '两次输入的密码不一致';
  if (nickname.value && nickname.value.length > 32) return '昵称长度最多 32 位';
  return null;
});

const canSubmit = computed(
  () => username.value && password.value && confirmPassword.value && !validation.value,
);

const { loading, send } = useRequest(
  () =>
    registerApi({
      username: username.value.trim(),
      password: password.value,
      nickname: nickname.value.trim() || undefined,
    }),
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
    router.push('/todos');
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : '注册失败';
  }
}
</script>

<template>
  <section
    class="w-full max-w-sm rounded-3xl border border-slate-200/80 bg-white/90 p-7 shadow-[0_20px_50px_-20px_rgba(15,23,42,0.25)] backdrop-blur dark:border-white/10 dark:bg-slate-900/60"
  >
    <header class="mb-6">
      <h1 class="text-2xl font-semibold text-slate-900 dark:text-white">注册</h1>
      <p class="mt-1 text-xs text-slate-500 dark:text-white/50">创建账号开始使用。</p>
    </header>

    <form class="space-y-4" @submit.prevent="onSubmit">
      <label class="block">
        <span class="text-xs font-medium text-slate-600 dark:text-white/70">用户名</span>
        <input
          v-model="username"
          type="text"
          autocomplete="username"
          class="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40"
          placeholder="3 ~ 32 位，字母/数字/下划线"
        />
      </label>
      <label class="block">
        <span class="text-xs font-medium text-slate-600 dark:text-white/70">昵称（选填）</span>
        <input
          v-model="nickname"
          type="text"
          class="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40"
          placeholder="可空，最长 32 位"
        />
      </label>
      <label class="block">
        <span class="text-xs font-medium text-slate-600 dark:text-white/70">密码</span>
        <input
          v-model="password"
          type="password"
          autocomplete="new-password"
          class="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40"
          placeholder="6 ~ 64 位"
        />
      </label>
      <label class="block">
        <span class="text-xs font-medium text-slate-600 dark:text-white/70">确认密码</span>
        <input
          v-model="confirmPassword"
          type="password"
          autocomplete="new-password"
          class="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40"
          placeholder="再输一次"
        />
      </label>

      <p v-if="validation" class="text-xs text-amber-600 dark:text-amber-300">{{ validation }}</p>
      <p v-if="errorMsg" class="text-xs text-rose-600 dark:text-rose-400">⚠ {{ errorMsg }}</p>

      <button
        type="submit"
        :disabled="!canSubmit || loading"
        class="w-full rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-emerald-500"
      >
        {{ loading ? '注册中…' : '注册并登录' }}
      </button>
    </form>

    <p class="mt-6 text-center text-xs text-slate-500 dark:text-white/50">
      已经有账号？
      <RouterLink
        to="/login"
        class="font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-300 dark:hover:text-emerald-200"
      >
        去登录
      </RouterLink>
    </p>
  </section>
</template>
