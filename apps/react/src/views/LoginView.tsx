import { useRequest } from 'alova/client';
import { Button, Form, Input, NavBar, Toast } from 'antd-mobile';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { login as loginApi, encryptUserPassword } from '@/api/auth';
import { setAuth } from '@/stores/auth';

interface LoginForm {
  username: string;
  password: string;
}

function LoginView() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirect = new URLSearchParams(location.search).get('redirect') || '/home';

  const { loading, send } = useRequest(
    (username: string, encryptedPassword: string) =>
      loginApi({ username, password: encryptedPassword }),
    { immediate: false },
  );

  async function onFinish(values: LoginForm) {
    if (loading) return;
    const username = values.username.trim();
    try {
      const encryptedPassword = await encryptUserPassword(values.password);
      const result = await send(username, encryptedPassword);
      setAuth({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      });
      void navigate(redirect, { replace: true });
    } catch (err) {
      Toast.show({ icon: 'fail', content: err instanceof Error ? err.message : '登录失败' });
    }
  }

  return (
    <div className="page page--auth">
      <NavBar back={null}>登录</NavBar>

      <div className="auth-hero">
        <div className="auth-hero__logo">🌿</div>
        <h1 className="auth-hero__title">欢迎回来</h1>
        <p className="auth-hero__sub">登录后继续管理你的待办</p>
      </div>

      <Form
        layout="horizontal"
        onFinish={(values: LoginForm) => void onFinish(values)}
        footer={
          <Button block type="submit" color="primary" loading={loading} loadingText="登录中">
            登录
          </Button>
        }
      >
        <Form.Item
          name="username"
          label="用户名"
          rules={[{ required: true, message: '请输入用户名' }]}
        >
          <Input placeholder="请输入用户名" autoComplete="username" clearable />
        </Form.Item>
        <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
          <Input
            type="password"
            placeholder="请输入密码"
            autoComplete="current-password"
            clearable
          />
        </Form.Item>
      </Form>

      <p className="auth-foot">
        还没有账号？
        <Link className="auth-link" to="/register">
          去注册
        </Link>
      </p>
    </div>
  );
}

export default LoginView;
