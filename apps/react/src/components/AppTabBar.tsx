import { TabBar } from 'antd-mobile';
import { AppOutline, UnorderedListOutline, UserOutline } from 'antd-mobile-icons';
import { useLocation, useNavigate } from 'react-router-dom';

const TABS = [
  { key: '/home', title: '首页', icon: <AppOutline /> },
  { key: '/todos', title: '待办', icon: <UnorderedListOutline /> },
  { key: '/profile', title: '我的', icon: <UserOutline /> },
];

function AppTabBar() {
  const navigate = useNavigate();
  const location = useLocation();

  // 取当前路径首段匹配 tab，避免带 query 时无法高亮
  const active = TABS.find((t) => location.pathname.startsWith(t.key))?.key ?? '/home';

  return (
    <TabBar
      activeKey={active}
      onChange={(key) => void navigate(key)}
      className="app-tabbar"
      safeArea
    >
      {TABS.map((tab) => (
        <TabBar.Item key={tab.key} icon={tab.icon} title={tab.title} />
      ))}
    </TabBar>
  );
}

export default AppTabBar;
