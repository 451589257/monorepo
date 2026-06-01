import { useRequest } from 'alova/client';
import {
  Checkbox,
  Dialog,
  Empty,
  InfiniteScroll,
  Input,
  List,
  NavBar,
  PullToRefresh,
  SearchBar,
  Skeleton,
  SwipeAction,
  Tabs,
  Tag,
  Toast,
} from 'antd-mobile';
import { AddOutline, DeleteOutline } from 'antd-mobile-icons';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import {
  createTodo,
  deleteTodo,
  listTodos,
  updateTodoStatus,
  type Todo,
  type TodoStatus,
} from '@/api/todo';
import { addSearchHistory, clearSearchHistory, getSearchHistory } from '@/utils/searchHistory';

type StatusFilter = '' | TodoStatus;

const PAGE_SIZE = 10;

const STATUS_TABS: { label: string; value: StatusFilter }[] = [
  { label: '全部', value: '' },
  { label: '待办', value: 'PENDING' },
  { label: '进行中', value: 'ACTIVE' },
  { label: '已完成', value: 'DONE' },
];

const STATUS_BADGE: Record<TodoStatus, { label: string; color: string }> = {
  PENDING: { label: '待办', color: 'primary' },
  ACTIVE: { label: '进行中', color: 'warning' },
  DONE: { label: '已完成', color: 'success' },
};

const isDone = (status: TodoStatus) => status === 'DONE';

function TodoApp() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [searchText, setSearchText] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [history, setHistory] = useState<string[]>(() => getSearchHistory());
  const [status, setStatus] = useState<StatusFilter>(() => {
    const s = searchParams.get('status');
    return s === 'PENDING' || s === 'ACTIVE' || s === 'DONE' ? s : '';
  });

  const [todos, setTodos] = useState<Todo[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [firstLoading, setFirstLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(() => searchParams.get('create') === '1');
  const [draftTitle, setDraftTitle] = useState('');
  const [draftDesc, setDraftDesc] = useState('');

  // 用 ref 跟踪分页，避免闭包过期
  const pageRef = useRef(1);

  const { send: fetchList } = useRequest(
    (page: number) =>
      listTodos({
        pageNum: page,
        pageSize: PAGE_SIZE,
        title: searchText || undefined,
        status: status || undefined,
      }),
    { immediate: false },
  );

  // InfiniteScroll 的加载回调：基于 ref 续页
  async function loadMore() {
    const page = pageRef.current;
    const data = await fetchList(page);
    setTodos((prev) => (page === 1 ? data.list : [...prev, ...data.list]));
    const loaded = (page - 1) * PAGE_SIZE + data.list.length;
    if (loaded >= data.total || data.list.length === 0) {
      setHasMore(false);
    } else {
      pageRef.current = page + 1;
    }
  }

  // 首屏与筛选/搜索变化时重置
  useEffect(() => {
    setFirstLoading(true);
    pageRef.current = 1;
    setHasMore(true);
    fetchList(1)
      .then((data) => {
        setTodos(data.list);
        const loaded = data.list.length;
        if (loaded >= data.total || data.list.length === 0) {
          setHasMore(false);
        } else {
          pageRef.current = 2;
        }
      })
      .catch((err: unknown) => {
        Toast.show({ icon: 'fail', content: err instanceof Error ? err.message : '加载失败' });
        setHasMore(false);
      })
      .finally(() => setFirstLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText, status]);

  async function onRefresh() {
    pageRef.current = 1;
    setHasMore(true);
    const data = await fetchList(1);
    setTodos(data.list);
    if (data.list.length >= data.total || data.list.length === 0) {
      setHasMore(false);
    } else {
      pageRef.current = 2;
    }
  }

  function onSearch(value: string) {
    const word = value.trim();
    if (word) setHistory(addSearchHistory(word));
    setSearchFocused(false);
    setSearchText(word);
  }

  function applyHistory(word: string) {
    setSearchText(word);
    setSearchFocused(false);
  }

  function onClearHistory() {
    setHistory(clearSearchHistory());
  }

  function selectStatus(next: StatusFilter) {
    if (status === next) return;
    setStatus(next);
  }

  const { loading: submitting, send: submitTodo } = useRequest(
    (body: { title: string; description?: string }) => createTodo(body),
    { immediate: false },
  );

  const { send: sendToggle } = useRequest(
    (id: number, next: TodoStatus) => updateTodoStatus(id, next),
    { immediate: false },
  );

  const { send: sendDelete } = useRequest((id: number) => deleteTodo(id), { immediate: false });

  const withError = async <T,>(action: () => Promise<T>): Promise<T | null> => {
    try {
      return await action();
    } catch (err) {
      Toast.show({ icon: 'fail', content: err instanceof Error ? err.message : '操作失败' });
      return null;
    }
  };

  async function addTodo() {
    const title = draftTitle.trim();
    if (!title || submitting) return;
    const created = await withError(() =>
      submitTodo({ title, description: draftDesc.trim() || undefined }),
    );
    if (created) {
      setDraftTitle('');
      setDraftDesc('');
      setShowCreate(false);
      Toast.show({ icon: 'success', content: '已添加' });
      void onRefresh();
    }
  }

  async function toggle(todo: Todo) {
    const next: TodoStatus = isDone(todo.status) ? 'PENDING' : 'DONE';
    const updated = await withError(() => sendToggle(todo.id, next));
    if (updated) {
      if (status && status !== updated.status) {
        void onRefresh();
      } else {
        setTodos((prev) => prev.map((t) => (t.id === todo.id ? updated : t)));
      }
    }
  }

  function remove(todo: Todo) {
    void Dialog.confirm({
      title: '删除待办',
      content: `确认删除「${todo.title}」吗？`,
      confirmText: '删除',
      cancelText: '取消',
      onConfirm: async () => {
        const ok = await withError(() => sendDelete(todo.id));
        if (ok !== null) {
          Toast.show({ icon: 'success', content: '已删除' });
          void onRefresh();
        }
      },
    });
  }

  const activeTab = STATUS_TABS.find((t) => t.value === status)?.value ?? '';

  useEffect(() => {
    setShowCreate(searchParams.get('create') === '1');
  }, [searchParams]);

  return (
    <div className="page">
      <NavBar back={null} right={<AddOutline fontSize={22} onClick={() => setShowCreate(true)} />}>
        待办
      </NavBar>

      <SearchBar
        value={searchText}
        placeholder="搜索标题"
        style={{ padding: '8px 12px' }}
        onChange={(v) => setSearchText(v)}
        onSearch={onSearch}
        onClear={() => onSearch('')}
        onFocus={() => setSearchFocused(true)}
      />

      {searchFocused && history.length > 0 && (
        <div className="search-history">
          <div className="search-history__head">
            <span>搜索历史</span>
            <DeleteOutline onClick={onClearHistory} />
          </div>
          <div className="search-history__tags">
            {history.map((word) => (
              <Tag
                key={word}
                color="primary"
                fill="outline"
                round
                onClick={() => applyHistory(word)}
                style={{ padding: '4px 10px' }}
              >
                {word}
              </Tag>
            ))}
          </div>
        </div>
      )}

      <Tabs activeKey={activeTab} onChange={(key) => selectStatus(key as StatusFilter)}>
        {STATUS_TABS.map((tab) => (
          <Tabs.Tab title={tab.label} key={tab.value} />
        ))}
      </Tabs>

      <div className="todo-body">
        {firstLoading ? (
          <>
            {Array.from({ length: 5 }).map((_, i) => (
              <div className="todo-skeleton" key={i}>
                <Skeleton.Title animated />
                <Skeleton.Paragraph lineCount={1} animated />
              </div>
            ))}
          </>
        ) : (
          <PullToRefresh onRefresh={onRefresh}>
            {todos.length === 0 && !hasMore ? (
              <Empty
                description={searchText || status ? '没有匹配的待办' : '还没有待办，点右上角添加吧'}
              />
            ) : (
              <List>
                {todos.map((todo) => (
                  <SwipeAction
                    key={todo.id}
                    rightActions={[
                      {
                        key: 'delete',
                        text: '删除',
                        color: 'danger',
                        onClick: () => remove(todo),
                      },
                    ]}
                  >
                    <List.Item
                      prefix={
                        <Checkbox
                          checked={isDone(todo.status)}
                          onChange={() => void toggle(todo)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      }
                      extra={
                        <Tag color={STATUS_BADGE[todo.status].color} round fill="outline">
                          {STATUS_BADGE[todo.status].label}
                        </Tag>
                      }
                      description={todo.description || undefined}
                      onClick={() => void navigate(`/todos/${todo.id}`)}
                      clickable
                    >
                      <span
                        className={`todo-title ${isDone(todo.status) ? 'todo-title--done' : ''}`}
                      >
                        {todo.title}
                      </span>
                    </List.Item>
                  </SwipeAction>
                ))}
              </List>
            )}
            <InfiniteScroll loadMore={loadMore} hasMore={hasMore} />
          </PullToRefresh>
        )}
      </div>

      <Dialog
        visible={showCreate}
        title="新建待办"
        content={
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Input
              placeholder="标题：今天打算完成什么？"
              value={draftTitle}
              maxLength={100}
              onChange={setDraftTitle}
            />
            <Input
              placeholder="描述（选填）"
              value={draftDesc}
              maxLength={200}
              onChange={setDraftDesc}
              onEnterPress={() => void addTodo()}
            />
          </div>
        }
        closeOnAction
        actions={[
          [
            { key: 'cancel', text: '取消' },
            { key: 'confirm', text: '添加', bold: true, disabled: !draftTitle.trim() },
          ],
        ]}
        onAction={(action) => {
          if (action.key === 'confirm') {
            void addTodo();
          } else {
            setShowCreate(false);
          }
        }}
        onClose={() => setShowCreate(false)}
      />
    </div>
  );
}

export default TodoApp;
