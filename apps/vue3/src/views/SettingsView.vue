<script setup lang="ts">
import { showConfirmDialog, showToast } from 'vant';
import { computed } from 'vue';
import { useRouter } from 'vue-router';

import { setTheme, themeState } from '@/stores/theme';
import { clearSearchHistory } from '@/utils/searchHistory';

const router = useRouter();

const darkMode = computed({
  get: () => themeState.mode === 'dark',
  set: (val: boolean) => setTheme(val ? 'dark' : 'light'),
});

async function onClearCache() {
  try {
    await showConfirmDialog({
      title: '清除本地缓存',
      message: '将清空搜索历史等本地数据，登录状态不受影响。',
      confirmButtonText: '清除',
    });
  } catch {
    return;
  }
  clearSearchHistory();
  showToast('已清除');
}
</script>

<template>
  <div class="settings">
    <van-nav-bar title="设置" left-arrow fixed placeholder @click-left="router.back()" />

    <van-cell-group inset title="外观">
      <van-cell title="深色模式" center>
        <template #value>
          <van-switch v-model="darkMode" size="22" />
        </template>
      </van-cell>
    </van-cell-group>

    <van-cell-group inset title="数据" class="settings__group">
      <van-cell title="清除本地缓存" icon="delete-o" is-link @click="onClearCache" />
    </van-cell-group>

    <van-cell-group inset title="关于" class="settings__group">
      <van-cell title="应用" value="Vue3 H5 Demo" />
      <van-cell title="UI 框架" value="Vant 4" />
      <van-cell title="版本" value="1.0.0" />
    </van-cell-group>
  </div>
</template>

<style scoped>
.settings {
  min-height: 100vh;
  background: var(--app-page-bg);
}

.settings__group {
  margin-top: 12px;
}
</style>
