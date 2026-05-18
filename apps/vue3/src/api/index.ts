import { createAlova } from 'alova';
import adapterFetch from 'alova/fetch';
import VueHook from 'alova/vue';

interface ApiEnvelope<T = unknown> {
  code: number;
  data: T;
  msg: string;
  success: boolean;
}

export const alovaInstance = createAlova({
  baseURL: '/api',
  statesHook: VueHook,
  requestAdapter: adapterFetch(),
  cacheFor: null,
  beforeRequest(method) {
    method.config.headers = {
      'Content-Type': 'application/json',
      ...method.config.headers,
    };
  },
  responded: {
    onSuccess: async (response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const payload = (await response.json()) as ApiEnvelope;
      if (!payload.success) {
        throw new Error(payload.msg || '请求失败');
      }
      return payload.data;
    },
    onError: (error) => {
      throw error;
    },
  },
});
