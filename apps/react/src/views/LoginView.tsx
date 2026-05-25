import { useRequest } from 'alova/client';
import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { login as loginApi } from '@/api/auth';
import { setAuth } from '@/stores/auth';

function LoginView() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirect = new URLSearchParams(location.search).get('redirect') || '/todos';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { loading, send } = useRequest(() => loginApi({ username: username.trim(), password }), {
    immediate: false,
  });

  const canSubmit = username.trim() && password;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit || loading) return;
    setErrorMsg('');
    try {
      const result = await send();
      setAuth({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      });
      void navigate(redirect, { replace: true });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '登录失败');
    }
  }
  return (
    <section className="w-full max-w-sm rounded-3xl border border-slate-200/80 bg-white/90 p-7 shadow-[0_20px_50px_-20px_rgba(15,23,42,0.25)] backdrop-blur dark:border-white/10 dark:bg-slate-900/60">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">登录</h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-white/50">欢迎回来，请输入账号继续。</p>
      </header>

      <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
        <label className="block">
          <span className="text-xs font-medium text-slate-600 dark:text-white/70">用户名</span>
          <input
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="请输入用户名"
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40 dark:focus:border-sky-400 dark:focus:ring-sky-400/20"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-600 dark:text-white/70">密码</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="请输入密码"
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40 dark:focus:border-sky-400 dark:focus:ring-sky-400/20"
          />
        </label>

        {errorMsg && <p className="text-xs text-rose-600 dark:text-rose-400">⚠ {errorMsg}</p>}

        <button
          type="submit"
          disabled={!canSubmit || loading}
          className="w-full rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-sky-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-sky-500"
        >
          {loading ? '登录中…' : '登录'}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-slate-500 dark:text-white/50">
        还没有账号？
        <Link
          to="/register"
          className="ml-1 font-medium text-sky-600 hover:text-sky-700 dark:text-sky-300 dark:hover:text-sky-200"
        >
          去注册
        </Link>
      </p>
    </section>
  );
}

export default LoginView;
