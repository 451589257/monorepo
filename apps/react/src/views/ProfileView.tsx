import { useRequest } from 'alova/client';
import { Button, Dialog, List, NavBar, Toast } from 'antd-mobile';
import { UserOutline } from 'antd-mobile-icons';
import { useEffect } from 'react';
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
  const displayName = user?.nickname || user?.username || '未登录';

  const { loading, send: refresh } = useRequest(() => getMe(), { immediate: false });

  async function loadProfile() {
    try {
      const u = await refresh();
      setUser(u);
    } catch (err) {
      Toast.show({ icon: 'fail', content: err instanceof Error ? err.message : '加载失败' });
    }
  }

  useEffect(() => {
    void loadProfile();
    // 仅挂载时主动刷一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function doLogout() {
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

  function onLogout() {
    void Dialog.confirm({
      title: '退出登录',
      content: '确认退出当前账号吗？',
      confirmText: '退出',
      cancelText: '取消',
      onConfirm: () => void doLogout(),
    });
  }

  return (
    <div className="page">
      <NavBar back={null}>我的</NavBar>

      <div className="profile-hero">
        <div className="profile-hero__avatar">
          <UserOutline />
        </div>
        <div>
          <p className="profile-hero__name">{displayName}</p>
          {user && <p className="profile-hero__id">ID #{user.id}</p>}
        </div>
      </div>

      <List header="账号信息">
        <List.Item extra={user?.username || '—'}>用户名</List.Item>
        <List.Item extra={user?.nickname || '—'}>昵称</List.Item>
        <List.Item extra={formatTime(user?.createTime)}>注册时间</List.Item>
        <List.Item extra={formatTime(user?.updateTime)}>最近更新</List.Item>
      </List>

      <List header="操作">
        <List.Item clickable onClick={() => void loadProfile()}>
          {loading ? '刷新中…' : '刷新资料'}
        </List.Item>
        <List.Item clickable onClick={() => void navigate('/todos')}>
          待办列表
        </List.Item>
        <List.Item clickable onClick={() => void navigate('/settings')}>
          设置
        </List.Item>
      </List>

      <div className="profile-logout">
        <Button block color="danger" onClick={onLogout}>
          退出登录
        </Button>
      </div>
    </div>
  );
}

export default ProfileView;
