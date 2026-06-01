import { useRequest } from 'alova/client';
import {
  ActionSheet,
  Button,
  Dialog,
  Empty,
  Input,
  List,
  NavBar,
  Skeleton,
  Tag,
  TextArea,
  Toast,
} from 'antd-mobile';
import type { Action } from 'antd-mobile/es/components/action-sheet';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  deleteTodo,
  listTodos,
  updateTodo,
  updateTodoStatus,
  type Todo,
  type TodoStatus,
} from '@/api/todo';

const STATUS_META: Record<TodoStatus, { label: string; color: string }> = {
  PENDING: { label: '待办', color: 'primary' },
  ACTIVE: { label: '进行中', color: 'warning' },
  DONE: { label: '已完成', color: 'success' },
};

const STATUS_ACTIONS: { text: string; key: TodoStatus }[] = [
  { text: '待办', key: 'PENDING' },
  { text: '进行中', key: 'ACTIVE' },
  { text: '已完成', key: 'DONE' },
];

function formatTime(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function TodoDetailView() {
  const navigate = useNavigate();
  const params = useParams();
  const id = Number(params.id);

  const [todo, setTodo] = useState<Todo | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusVisible, setStatusVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

  // 无 get-by-id 接口：用 list 拉取后按 id 兜底查找
  const { send: fetchList } = useRequest(() => listTodos({ pageNum: 1, pageSize: 1000 }), {
    immediate: false,
  });

  async function load() {
    setLoading(true);
    try {
      const data = await fetchList();
      const found = data.list.find((t) => t.id === id) ?? null;
      setTodo(found);
      if (!found) Toast.show('待办不存在或已删除');
    } catch (err) {
      Toast.show({ icon: 'fail', content: err instanceof Error ? err.message : '加载失败' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const { send: sendStatus } = useRequest((next: TodoStatus) => updateTodoStatus(id, next), {
    immediate: false,
  });

  async function onSelectStatus(action: Action) {
    const next = action.key as TodoStatus;
    setStatusVisible(false);
    if (!todo || next === todo.status) return;
    try {
      const updated = await sendStatus(next);
      setTodo(updated);
      Toast.show({ icon: 'success', content: '状态已更新' });
    } catch (err) {
      Toast.show({ icon: 'fail', content: err instanceof Error ? err.message : '更新失败' });
    }
  }

  function openEdit() {
    if (!todo) return;
    setEditTitle(todo.title);
    setEditDesc(todo.description ?? '');
    setEditVisible(true);
  }

  const { send: sendUpdate } = useRequest(
    (body: { title: string; description?: string }) => updateTodo(id, body),
    { immediate: false },
  );

  async function onSaveEdit() {
    const title = editTitle.trim();
    if (!title) {
      Toast.show('标题不能为空');
      return;
    }
    try {
      const updated = await sendUpdate({ title, description: editDesc.trim() || undefined });
      setTodo(updated);
      setEditVisible(false);
      Toast.show({ icon: 'success', content: '已保存' });
    } catch (err) {
      Toast.show({ icon: 'fail', content: err instanceof Error ? err.message : '保存失败' });
    }
  }

  const { send: sendDelete } = useRequest(() => deleteTodo(id), { immediate: false });

  function onDelete() {
    void Dialog.confirm({
      title: '删除待办',
      content: '确认删除这条待办吗？',
      confirmText: '删除',
      cancelText: '取消',
      onConfirm: async () => {
        try {
          await sendDelete();
          Toast.show({ icon: 'success', content: '已删除' });
          void navigate(-1);
        } catch (err) {
          Toast.show({ icon: 'fail', content: err instanceof Error ? err.message : '删除失败' });
        }
      },
    });
  }

  const statusMeta = todo ? STATUS_META[todo.status] : null;

  return (
    <div className="detail">
      <NavBar onBack={() => void navigate(-1)}>待办详情</NavBar>

      {loading ? (
        <div className="detail-skeleton">
          <Skeleton.Title animated />
          <Skeleton.Paragraph lineCount={3} animated />
        </div>
      ) : todo ? (
        <>
          <div className="detail-card">
            <div className="detail-head">
              <h2 className={`detail-title ${todo.status === 'DONE' ? 'detail-title--done' : ''}`}>
                {todo.title}
              </h2>
              {statusMeta && (
                <Tag color={statusMeta.color} round>
                  {statusMeta.label}
                </Tag>
              )}
            </div>
            <p className="detail-desc">{todo.description || '暂无描述'}</p>
          </div>

          <List header="信息">
            <List.Item extra={`#${todo.id}`}>编号</List.Item>
            <List.Item extra={formatTime(todo.createTime)}>创建时间</List.Item>
            <List.Item extra={formatTime(todo.updateTime)}>更新时间</List.Item>
          </List>

          <List header="操作">
            <List.Item extra={statusMeta?.label} clickable onClick={() => setStatusVisible(true)}>
              修改状态
            </List.Item>
            <List.Item clickable onClick={openEdit}>
              编辑内容
            </List.Item>
          </List>

          <div className="detail-actions">
            <Button block color="danger" fill="outline" onClick={onDelete}>
              删除待办
            </Button>
          </div>
        </>
      ) : (
        <Empty description="待办不存在或已删除" />
      )}

      <ActionSheet
        visible={statusVisible}
        actions={STATUS_ACTIONS}
        cancelText="取消"
        extra="修改状态"
        onAction={(action) => void onSelectStatus(action)}
        onClose={() => setStatusVisible(false)}
      />

      <Dialog
        visible={editVisible}
        title="编辑待办"
        content={
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Input placeholder="标题" value={editTitle} maxLength={100} onChange={setEditTitle} />
            <TextArea
              placeholder="补充说明（选填）"
              value={editDesc}
              rows={3}
              maxLength={200}
              showCount
              onChange={setEditDesc}
            />
          </div>
        }
        closeOnAction
        actions={[
          [
            { key: 'cancel', text: '取消' },
            { key: 'confirm', text: '保存', bold: true, disabled: !editTitle.trim() },
          ],
        ]}
        onAction={(action) => {
          if (action.key === 'confirm') {
            void onSaveEdit();
          } else {
            setEditVisible(false);
          }
        }}
        onClose={() => setEditVisible(false)}
      />
    </div>
  );
}

export default TodoDetailView;
