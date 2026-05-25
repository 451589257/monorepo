<script setup lang="ts">
import { RouterView } from 'vue-router';

import AppNav from '@/components/AppNav.vue';
</script>

<template>
  <AppNav />
  <main class="flex w-full justify-center px-4 pb-10">
    <RouterView />
  </main>
</template>
