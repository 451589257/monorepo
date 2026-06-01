import { useSyncExternalStore } from 'react';

import { getThemeSnapshot, subscribeTheme } from '@/stores/theme';

export function useTheme() {
  return useSyncExternalStore(subscribeTheme, getThemeSnapshot, getThemeSnapshot);
}
