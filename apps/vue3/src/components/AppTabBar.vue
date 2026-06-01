<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const TABS = [
  { name: 'home', path: '/home', label: '首页', icon: 'wap-home-o' },
  { name: 'todos', path: '/todos', label: '待办', icon: 'todo-list-o' },
  { name: 'profile', path: '/profile', label: '我的', icon: 'user-o' },
] as const;

const active = computed({
  get: () => (route.name as string) || 'home',
  set: (name: string) => {
    const tab = TABS.find((item) => item.name === name);
    if (tab && route.path !== tab.path) router.push(tab.path);
  },
});
</script>

<template>
  <van-tabbar v-model="active" route fixed placeholder safe-area-inset-bottom>
    <van-tabbar-item
      v-for="tab in TABS"
      :key="tab.name"
      :name="tab.name"
      :icon="tab.icon"
      :to="tab.path"
    >
      {{ tab.label }}
    </van-tabbar-item>
  </van-tabbar>
</template>
