import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';

import { useAuth } from '@/stores/useAuth';

interface Props {
  children: ReactNode;
  /** true 时表示该路由仅未登录可见(登录/注册页),已登录会被重定向到主页 */
  guestOnly?: boolean;
}

function RequireAuth({ children, guestOnly = false }: Props) {
  const { accessToken } = useAuth();
  const location = useLocation();

  if (guestOnly && accessToken) {
    return <Navigate to="/todos" replace />;
  }
  if (!guestOnly && !accessToken) {
    const redirect = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?redirect=${encodeURIComponent(redirect)}`} replace />;
  }
  return <>{children}</>;
}

export default RequireAuth;
