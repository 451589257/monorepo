<script setup lang="ts">
import { useRequest } from 'alova/client';
import { showToast } from 'vant';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import { register as registerApi, encryptUserPassword } from '@/api/auth';
import { setAuth } from '@/stores/auth';

const router = useRouter();

const username = ref('');
const password = ref('');
const confirmPassword = ref('');
const nickname = ref('');

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
  (encryptedPassword: string) =>
    registerApi({
      username: username.value.trim(),
      password: encryptedPassword,
      nickname: nickname.value.trim() || undefined,
    }),
  { immediate: false },
);

async function onSubmit() {
  if (validation.value) {
    showToast(validation.value);
    return;
  }
  if (!canSubmit.value || loading.value) return;
  try {
    const encryptedPassword = await encryptUserPassword(password.value);
    const result = await send(encryptedPassword);
    setAuth({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    });
    router.push('/home');
  } catch (err) {
    showToast(err instanceof Error ? err.message : '注册失败');
  }
}
</script>

<template>
  <div class="auth">
    <van-nav-bar title="注册" left-arrow fixed placeholder @click-left="router.back()" />

    <div class="auth__hero">
      <div class="auth__logo">✨</div>
      <h1 class="auth__title">创建账号</h1>
      <p class="auth__sub">注册后即可开始使用</p>
    </div>

    <van-form class="auth__form" @submit="onSubmit">
      <van-cell-group inset>
        <van-field
          v-model="username"
          name="username"
          label="用户名"
          placeholder="3 ~ 32 位，字母/数字/下划线"
          autocomplete="username"
          clearable
        />
        <van-field
          v-model="nickname"
          name="nickname"
          label="昵称"
          placeholder="选填，最长 32 位"
          clearable
        />
        <van-field
          v-model="password"
          type="password"
          name="password"
          label="密码"
          placeholder="6 ~ 64 位"
          autocomplete="new-password"
        />
        <van-field
          v-model="confirmPassword"
          type="password"
          name="confirmPassword"
          label="确认密码"
          placeholder="再输入一次密码"
          autocomplete="new-password"
        />
      </van-cell-group>

      <p v-if="validation" class="auth__tip">{{ validation }}</p>

      <div class="auth__actions">
        <van-button
          round
          block
          type="primary"
          native-type="submit"
          :loading="loading"
          loading-text="注册中…"
          :disabled="!canSubmit"
        >
          注册并登录
        </van-button>
      </div>
    </van-form>

    <p class="auth__foot">
      已经有账号？
      <RouterLink class="auth__link" to="/login">去登录</RouterLink>
    </p>
  </div>
</template>

<style scoped>
.auth {
  min-height: 100vh;
  background: var(--app-page-bg);
}

.auth__hero {
  padding: 24px 16px 8px;
  text-align: center;
}

.auth__logo {
  font-size: 44px;
}

.auth__title {
  margin: 12px 0 4px;
  font-size: 22px;
  font-weight: 700;
  color: var(--app-text);
}

.auth__sub {
  margin: 0;
  font-size: 13px;
  color: var(--app-text-3);
}

.auth__form {
  margin-top: 16px;
}

.auth__tip {
  margin: 12px 16px 0;
  font-size: 12px;
  color: #ed6a0c;
}

.auth__actions {
  margin: 20px 16px 0;
}

.auth__foot {
  margin-top: 20px;
  text-align: center;
  font-size: 13px;
  color: var(--app-text-3);
}

.auth__link {
  color: #1989fa;
  font-weight: 600;
}
</style>
