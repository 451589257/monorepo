<script setup lang="ts">
import { computed } from 'vue';
import { RouterView, useRoute } from 'vue-router';

import AppTabBar from '@/components/AppTabBar.vue';
import { themeState } from '@/stores/theme';

const route = useRoute();

// 仅主标签页展示底部导航；登录/注册/详情/设置等页面隐藏
const showTabBar = computed(() => route.meta.tab === true);
const vantTheme = computed(() => (themeState.mode === 'dark' ? 'dark' : 'light'));
</script>

<template>
  <van-config-provider :theme="vantTheme" class="app-shell">
    <RouterView v-slot="{ Component }">
      <component :is="Component" />
    </RouterView>
    <AppTabBar v-if="showTabBar" />
  </van-config-provider>
</template>

<style scoped>
.app-shell {
  position: relative;
  margin: 0 auto;
  width: 100%;
  max-width: 480px;
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--app-bg);
}
</style>
