import { useRequest } from 'alova/client';
import { Button, Grid, NavBar, ProgressBar, Skeleton, Toast } from 'antd-mobile';
import {
  AddCircleOutline,
  SetOutline,
  TeamOutline,
  UnorderedListOutline,
  UserContactOutline,
} from 'antd-mobile-icons';
import { useMemo, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

import { listTodos, type ListResponse, type Todo, type TodoStatus } from '@/api/todo';
import { useAuth } from '@/stores/useAuth';

interface Shortcut {
  label: string;
  icon: ReactNode;
  path: string;
  color: string;
}

const SHORTCUTS: Shortcut[] = [
  { label: '我的待办', icon: <UnorderedListOutline />, path: '/todos', color: '#1677ff' },
  { label: '新建待办', icon: <AddCircleOutline />, path: '/todos?create=1', color: '#07c160' },
  { label: '个人中心', icon: <UserContactOutline />, path: '/profile', color: '#ff8f1f' },
  { label: '设置', icon: <SetOutline />, path: '/settings', color: '#7232dd' },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 6) return '夜深了';
  if (h < 12) return '早上好';
  if (h < 14) return '中午好';
  if (h < 18) return '下午好';
  return '晚上好';
}

function HomeView() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const username = user?.nickname || user?.username || '访客';

  // 一次性拉取较大页，前端聚合各状态数量（不新增后端接口）
  const { data, loading, send } = useRequest(() => listTodos({ pageNum: 1, pageSize: 1000 }), {
    immediate: true,
    initialData: { list: [], total: 0 } as ListResponse<Todo>,
  });

  const counts = useMemo(() => {
    const list = data?.list ?? [];
    const base: Record<TodoStatus, number> = { PENDING: 0, ACTIVE: 0, DONE: 0 };
    for (const todo of list) base[todo.status] += 1;
    return base;
  }, [data]);

  const total = data?.total ?? 0;
  const doneRate = total ? Math.round((counts.DONE / total) * 100) : 0;

  const stats = [
    { label: '全部', value: total, color: '#1677ff' },
    { label: '进行中', value: counts.ACTIVE, color: '#ff8f1f' },
    { label: '已完成', value: counts.DONE, color: '#07c160' },
  ];

  const denom = total || 1;
  const distribution = [
    {
      label: '待办',
      value: counts.PENDING,
      color: '#1677ff',
      percent: (counts.PENDING / denom) * 100,
    },
    {
      label: '进行中',
      value: counts.ACTIVE,
      color: '#ff8f1f',
      percent: (counts.ACTIVE / denom) * 100,
    },
    { label: '已完成', value: counts.DONE, color: '#07c160', percent: (counts.DONE / denom) * 100 },
  ];

  async function onRefresh() {
    await send();
    Toast.show({ icon: 'success', content: '已刷新' });
  }

  return (
    <div className="page page--home">
      <NavBar back={null}>首页</NavBar>

      <div className="page-body">
        <div className="hero">
          <div className="hero__avatar">
            <TeamOutline />
          </div>
          <div>
            <p className="hero__hi">
              {greeting()}，{username} 👋
            </p>
            <p className="hero__sub">今天也要元气满满地完成待办哦</p>
          </div>
        </div>

        {loading ? (
          <>
            <div className="card-skeleton">
              <Skeleton.Title animated />
              <Skeleton.Paragraph lineCount={2} animated />
            </div>
            <div className="card-skeleton">
              <Skeleton.Title animated />
              <Skeleton.Paragraph lineCount={3} animated />
            </div>
          </>
        ) : (
          <>
            <div className="stats">
              {stats.map((item) => (
                <div className="stats__item" key={item.label}>
                  <span className="stats__value" style={{ color: item.color }}>
                    {item.value}
                  </span>
                  <span className="stats__label">{item.label}</span>
                </div>
              ))}
            </div>

            <div className="card">
              <div className="card__head">
                <span>完成进度</span>
                <span className="card__rate">{doneRate}%</span>
              </div>
              <ProgressBar percent={doneRate} style={{ '--fill-color': '#07c160' }} />
              <p className="card__hint">
                共 {total} 条待办，已完成 {counts.DONE} 条，加油 💪
              </p>
            </div>

            <div className="card">
              <div className="card__head">
                <span>状态分布</span>
              </div>
              {total === 0 ? (
                <div className="dist__empty">暂无数据</div>
              ) : (
                <div className="dist">
                  {distribution.map((item) => (
                    <div className="dist__row" key={item.label}>
                      <span className="dist__label">{item.label}</span>
                      <div className="dist__track">
                        <div
                          className="dist__bar"
                          style={{ width: `${item.percent}%`, background: item.color }}
                        />
                      </div>
                      <span className="dist__value">{item.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        <div className="panel">
          <p className="panel__title">快捷入口</p>
          <Grid columns={4} gap={8}>
            {SHORTCUTS.map((item) => (
              <Grid.Item key={item.label} onClick={() => void navigate(item.path)}>
                <div className="shortcut">
                  <span className="shortcut__icon" style={{ background: item.color }}>
                    {item.icon}
                  </span>
                  <span className="shortcut__label">{item.label}</span>
                </div>
              </Grid.Item>
            ))}
          </Grid>
        </div>

        <div className="home-refresh">
          <Button block fill="outline" color="primary" loading={loading} onClick={onRefresh}>
            刷新数据
          </Button>
        </div>
      </div>
    </div>
  );
}

export default HomeView;
