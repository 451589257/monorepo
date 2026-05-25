import { useSyncExternalStore } from 'react';

import { getAuthSnapshot, subscribeAuth } from '@/stores/auth';

export function useAuth() {
  return useSyncExternalStore(subscribeAuth, getAuthSnapshot, getAuthSnapshot);
}
