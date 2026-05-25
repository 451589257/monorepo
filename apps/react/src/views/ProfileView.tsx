import { useRequest } from 'alova/client';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getMe, logout as logoutApi } from '@/api/auth';
import { clearAuth, getRefreshToken, setUser } from '@/stores/auth';
import { useAuth } from '@/stores/useAuth';

function formatTime(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function ProfileView() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [errorMsg, setErrorMsg] = useState('');

  const { loading, send: refresh } = useRequest(() => getMe(), { immediate: false });

  async function loadProfile() {
    setErrorMsg('');
    try {
      const u = await refresh();
      setUser(u);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '加载失败');
    }
  }

  useEffect(() => {
    void loadProfile();
    // 仅挂载时主动刷一次,后续点"刷新"按钮再触发
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onLogout() {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await logoutApi(refreshToken);
      } catch {
        // 登出失败也清本地态
      }
    }
    clearAuth();
    void navigate('/login', { replace: true });
  }
  return (
    <section className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white/90 p-7 shadow-[0_20px_50px_-20px_rgba(15,23,42,0.25)] backdrop-blur dark:border-white/10 dark:bg-slate-900/60">
      <header className="mb-6 flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-xl dark:bg-sky-500/15">
          👤
        </span>
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">个人中心</h1>
          <p className="text-xs text-slate-500 dark:text-white/50">查看并管理你的账号</p>
        </div>
      </header>

      {loading ? (
        <p className="text-sm text-slate-400 dark:text-white/40">加载中…</p>
      ) : errorMsg ? (
        <p className="text-sm text-rose-600 dark:text-rose-400">⚠ {errorMsg}</p>
      ) : user ? (
        <dl className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-sm dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center justify-between">
            <dt className="text-slate-500 dark:text-white/50">用户 ID</dt>
            <dd className="font-medium text-slate-800 dark:text-white/90">#{user.id}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-slate-500 dark:text-white/50">用户名</dt>
            <dd className="font-medium text-slate-800 dark:text-white/90">{user.username}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-slate-500 dark:text-white/50">昵称</dt>
            <dd className="font-medium text-slate-800 dark:text-white/90">
              {user.nickname || '—'}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-slate-500 dark:text-white/50">注册时间</dt>
            <dd className="font-medium text-slate-800 dark:text-white/90">
              {formatTime(user.createTime)}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-slate-500 dark:text-white/50">最近更新</dt>
            <dd className="font-medium text-slate-800 dark:text-white/90">
              {formatTime(user.updateTime)}
            </dd>
          </div>
        </dl>
      ) : null}

      <div className="mt-6 flex items-center justify-between gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={() => void loadProfile()}
          className="rounded-xl border border-slate-200 px-4 py-2 text-xs text-slate-600 transition hover:border-sky-400 hover:text-sky-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-white/70 dark:hover:border-sky-400/60 dark:hover:text-sky-300"
        >
          刷新
        </button>
        <button
          type="button"
          onClick={() => void onLogout()}
          className="rounded-xl bg-rose-500 px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-rose-600 active:scale-[0.99]"
        >
          登出当前会话
        </button>
      </div>
    </section>
  );
}

export default ProfileView;
