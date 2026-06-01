import { Dialog, List, NavBar, Switch, Toast } from 'antd-mobile';
import { useNavigate } from 'react-router-dom';

import { setTheme } from '@/stores/theme';
import { useTheme } from '@/stores/useTheme';
import { clearSearchHistory } from '@/utils/searchHistory';

function SettingsView() {
  const navigate = useNavigate();
  const theme = useTheme();

  function onToggleDark(checked: boolean) {
    setTheme(checked ? 'dark' : 'light');
  }

  function onClearCache() {
    void Dialog.confirm({
      title: '清除本地缓存',
      content: '将清空搜索历史等本地数据，登录状态不受影响。',
      confirmText: '清除',
      cancelText: '取消',
      onConfirm: () => {
        clearSearchHistory();
        Toast.show({ icon: 'success', content: '已清除' });
      },
    });
  }

  return (
    <div className="settings">
      <NavBar onBack={() => void navigate(-1)}>设置</NavBar>

      <List header="外观">
        <List.Item extra={<Switch checked={theme === 'dark'} onChange={onToggleDark} />}>
          深色模式
        </List.Item>
      </List>

      <List header="数据">
        <List.Item clickable onClick={onClearCache}>
          清除本地缓存
        </List.Item>
      </List>

      <List header="关于">
        <List.Item extra="React H5 Demo">应用</List.Item>
        <List.Item extra="antd-mobile 5">UI 框架</List.Item>
        <List.Item extra="1.0.0">版本</List.Item>
      </List>
    </div>
  );
}

export default SettingsView;
