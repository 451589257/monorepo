import { useRequest } from 'alova/client';
import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { register as registerApi } from '@/api/auth';
import { setAuth } from '@/stores/auth';

const USERNAME_RE = /^[a-zA-Z0-9_]+$/;

function RegisterView() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const validation = useMemo<string | null>(() => {
    const u = username.trim();
    if (u.length < 3 || u.length > 32) return '用户名长度需在 3 ~ 32 位';
    if (!USERNAME_RE.test(u)) return '用户名只能包含字母、数字、下划线';
    if (password.length < 6 || password.length > 64) return '密码长度需在 6 ~ 64 位';
    if (password !== confirmPassword) return '两次输入的密码不一致';
    if (nickname && nickname.length > 32) return '昵称长度最多 32 位';
    return null;
  }, [username, password, confirmPassword, nickname]);

  const canSubmit = username && password && confirmPassword && !validation;

  const { loading, send } = useRequest(
    () =>
      registerApi({
        username: username.trim(),
        password,
        nickname: nickname.trim() || undefined,
      }),
    { immediate: false },
  );

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
      void navigate('/todos', { replace: true });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '注册失败');
    }
  }

  return (
    <section className="w-full max-w-sm rounded-3xl border border-slate-200/80 bg-white/90 p-7 shadow-[0_20px_50px_-20px_rgba(15,23,42,0.25)] backdrop-blur dark:border-white/10 dark:bg-slate-900/60">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">注册</h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-white/50">创建账号开始使用。</p>
      </header>

      <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
        <label className="block">
          <span className="text-xs font-medium text-slate-600 dark:text-white/70">用户名</span>
          <input
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="3 ~ 32 位，字母/数字/下划线"
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-600 dark:text-white/70">
            昵称（选填）
          </span>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="可空，最长 32 位"
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-600 dark:text-white/70">密码</span>
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="6 ~ 64 位"
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-600 dark:text-white/70">确认密码</span>
          <input
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="再输一次"
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40"
          />
        </label>

        {validation && <p className="text-xs text-amber-600 dark:text-amber-300">{validation}</p>}
        {errorMsg && <p className="text-xs text-rose-600 dark:text-rose-400">⚠ {errorMsg}</p>}

        <button
          type="submit"
          disabled={!canSubmit || loading}
          className="w-full rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-sky-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-sky-500"
        >
          {loading ? '注册中…' : '注册并登录'}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-slate-500 dark:text-white/50">
        已经有账号？
        <Link
          to="/login"
          className="ml-1 font-medium text-sky-600 hover:text-sky-700 dark:text-sky-300 dark:hover:text-sky-200"
        >
          去登录
        </Link>
      </p>
    </section>
  );
}

export default RegisterView;
