<script setup lang="ts">
import { useRequest } from 'alova/client';
import { showToast } from 'vant';
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { login as loginApi, encryptUserPassword } from '@/api/auth';
import { setAuth } from '@/stores/auth';

const router = useRouter();
const route = useRoute();

const username = ref('');
const password = ref('');

const canSubmit = computed(() => username.value.trim() && password.value);

const { loading, send } = useRequest(
  (encryptedPassword: string) =>
    loginApi({ username: username.value.trim(), password: encryptedPassword }),
  { immediate: false },
);

async function onSubmit() {
  if (!canSubmit.value || loading.value) return;
  try {
    const encryptedPassword = await encryptUserPassword(password.value);
    const result = await send(encryptedPassword);
    setAuth({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    });
    const redirect = (route.query.redirect as string | undefined) || '/home';
    router.push(redirect);
  } catch (err) {
    showToast(err instanceof Error ? err.message : '登录失败');
  }
}
</script>

<template>
  <div class="auth">
    <van-nav-bar title="登录" fixed placeholder />

    <div class="auth__hero">
      <div class="auth__logo">🌿</div>
      <h1 class="auth__title">欢迎回来</h1>
      <p class="auth__sub">登录后继续管理你的待办</p>
    </div>

    <van-form class="auth__form" @submit="onSubmit">
      <van-cell-group inset>
        <van-field
          v-model="username"
          name="username"
          label="用户名"
          placeholder="请输入用户名"
          autocomplete="username"
          clearable
          :rules="[{ required: true, message: '请输入用户名' }]"
        />
        <van-field
          v-model="password"
          type="password"
          name="password"
          label="密码"
          placeholder="请输入密码"
          autocomplete="current-password"
          :rules="[{ required: true, message: '请输入密码' }]"
        />
      </van-cell-group>

      <div class="auth__actions">
        <van-button
          round
          block
          type="primary"
          native-type="submit"
          :loading="loading"
          loading-text="登录中…"
          :disabled="!canSubmit"
        >
          登录
        </van-button>
      </div>
    </van-form>

    <p class="auth__foot">
      还没有账号？
      <RouterLink class="auth__link" to="/register">去注册</RouterLink>
    </p>
  </div>
</template>

<style scoped>
.auth {
  min-height: 100vh;
  background: var(--app-page-bg);
}

.auth__hero {
  padding: 32px 16px 8px;
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

.auth__actions {
  margin: 24px 16px 0;
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
