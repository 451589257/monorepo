import { Link, NavLink, useNavigate } from 'react-router-dom';

import { logout as logoutApi } from '@/api/auth';
import { clearAuth, getRefreshToken } from '@/stores/auth';
import { useAuth } from '@/stores/useAuth';

const linkBase =
  'rounded-lg px-3 py-1.5 text-slate-500 transition hover:bg-sky-50 hover:text-sky-700 dark:text-white/60 dark:hover:bg-sky-500/10 dark:hover:text-sky-300';
const linkActive = 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300';

function AppNav() {
  const navigate = useNavigate();
  const { user, accessToken } = useAuth();
  const loggedIn = Boolean(accessToken);
  const username = user?.nickname || user?.username || '';

  function onLogout() {
    const refresh = getRefreshToken();
    void doLogout(refresh);
  }

  async function doLogout(refresh: string | null) {
    if (refresh) {
      try {
        await logoutApi(refresh);
      } catch {
        // 登出失败也清本地态
      }
    }
    clearAuth();
    void navigate('/login', { replace: true });
  }

  return (
    <nav className="sticky top-0 z-10 mb-6 flex items-center justify-between border-b border-slate-200/70 bg-white/80 px-6 py-3 backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
      <Link
        to="/todos"
        className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-white"
      >
        <span className="text-lg" aria-hidden>
          ⚛
        </span>
        <span>React Demo</span>
      </Link>
      <div className="flex items-center gap-2 text-sm">
        {loggedIn ? (
          <>
            <NavLink
              to="/todos"
              className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ''}`}
            >
              待办
            </NavLink>
            <NavLink
              to="/profile"
              className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ''}`}
            >
              个人中心
            </NavLink>
            <span className="ml-1 text-xs text-slate-500 dark:text-white/50">你好，{username}</span>
            <button
              type="button"
              onClick={onLogout}
              className="ml-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition hover:border-rose-300 hover:text-rose-600 dark:border-white/10 dark:text-white/70 dark:hover:border-rose-400/40 dark:hover:text-rose-300"
            >
              登出
            </button>
          </>
        ) : (
          <>
            <NavLink
              to="/login"
              className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ''}`}
            >
              登录
            </NavLink>
            <NavLink
              to="/register"
              className="rounded-lg bg-sky-500 px-3 py-1.5 text-white shadow-sm transition hover:bg-sky-600"
            >
              注册
            </NavLink>
          </>
        )}
      </div>
    </nav>
  );
}

export default AppNav;
