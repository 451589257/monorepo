import { Outlet, useLocation } from 'react-router-dom';

import AppTabBar from '@/components/AppTabBar';

// 仅主标签页展示底部导航；登录/注册/详情/设置等页面隐藏
const TAB_PATHS = ['/home', '/todos', '/profile'];

function Layout() {
  const location = useLocation();
  const showTabBar = TAB_PATHS.includes(location.pathname);

  return (
    <div className="app-shell">
      <div className="app-shell__content">
        <Outlet />
      </div>
      {showTabBar && (
        <div className="app-shell__tabbar">
          <AppTabBar />
        </div>
      )}
    </div>
  );
}

export default Layout;
