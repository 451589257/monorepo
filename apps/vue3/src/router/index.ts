import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router';

import { isLoggedIn } from '@/stores/auth';

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/home' },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { public: true },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/RegisterView.vue'),
    meta: { public: true },
  },
  {
    path: '/home',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: { tab: true },
  },
  {
    path: '/todos',
    name: 'todos',
    component: () => import('@/components/TodoApp.vue'),
    meta: { tab: true },
  },
  {
    path: '/todos/:id',
    name: 'todo-detail',
    component: () => import('@/views/TodoDetailView.vue'),
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/views/ProfileView.vue'),
    meta: { tab: true },
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/views/SettingsView.vue'),
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

router.beforeEach((to) => {
  const loggedIn = isLoggedIn();
  if (to.meta.public) {
    // 已登录用户访问登录/注册 → 直接跳到首页
    if (loggedIn && (to.name === 'login' || to.name === 'register')) {
      return { name: 'home' };
    }
    return true;
  }
  if (!loggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }
  return true;
});
