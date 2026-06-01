import { useRequest } from 'alova/client';
import { Button, Form, Input, NavBar, Toast } from 'antd-mobile';
import { Link, useNavigate } from 'react-router-dom';

import { register as registerApi, encryptUserPassword } from '@/api/auth';
import { setAuth } from '@/stores/auth';

const USERNAME_RE = /^[a-zA-Z0-9_]+$/;

interface RegisterForm {
  username: string;
  nickname?: string;
  password: string;
  confirmPassword: string;
}

function validate(values: RegisterForm): string | null {
  const u = values.username.trim();
  if (u.length < 3 || u.length > 32) return '用户名长度需在 3 ~ 32 位';
  if (!USERNAME_RE.test(u)) return '用户名只能包含字母、数字、下划线';
  if (values.password.length < 6 || values.password.length > 64) return '密码长度需在 6 ~ 64 位';
  if (values.password !== values.confirmPassword) return '两次输入的密码不一致';
  if (values.nickname && values.nickname.length > 32) return '昵称长度最多 32 位';
  return null;
}

function RegisterView() {
  const navigate = useNavigate();

  const { loading, send } = useRequest(
    (body: { username: string; password: string; nickname?: string }) => registerApi(body),
    { immediate: false },
  );

  async function onFinish(values: RegisterForm) {
    if (loading) return;
    const error = validate(values);
    if (error) {
      Toast.show({ content: error });
      return;
    }
    try {
      const encryptedPassword = await encryptUserPassword(values.password);
      const result = await send({
        username: values.username.trim(),
        password: encryptedPassword,
        nickname: values.nickname?.trim() || undefined,
      });
      setAuth({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      });
      void navigate('/home', { replace: true });
    } catch (err) {
      Toast.show({ icon: 'fail', content: err instanceof Error ? err.message : '注册失败' });
    }
  }

  return (
    <div className="page page--auth">
      <NavBar onBack={() => void navigate(-1)}>注册</NavBar>

      <div className="auth-hero">
        <div className="auth-hero__logo">✨</div>
        <h1 className="auth-hero__title">创建账号</h1>
        <p className="auth-hero__sub">注册后即可开始使用</p>
      </div>

      <Form
        layout="horizontal"
        onFinish={(values: RegisterForm) => void onFinish(values)}
        footer={
          <Button block type="submit" color="primary" loading={loading} loadingText="注册中">
            注册并登录
          </Button>
        }
      >
        <Form.Item
          name="username"
          label="用户名"
          rules={[{ required: true, message: '请输入用户名' }]}
        >
          <Input placeholder="3 ~ 32 位，字母/数字/下划线" autoComplete="username" clearable />
        </Form.Item>
        <Form.Item name="nickname" label="昵称">
          <Input placeholder="选填，最长 32 位" clearable />
        </Form.Item>
        <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
          <Input type="password" placeholder="6 ~ 64 位" autoComplete="new-password" clearable />
        </Form.Item>
        <Form.Item
          name="confirmPassword"
          label="确认密码"
          rules={[{ required: true, message: '请再次输入密码' }]}
        >
          <Input
            type="password"
            placeholder="再输入一次密码"
            autoComplete="new-password"
            clearable
          />
        </Form.Item>
      </Form>

      <p className="auth-foot">
        已经有账号？
        <Link className="auth-link" to="/login">
          去登录
        </Link>
      </p>
    </div>
  );
}

export default RegisterView;
