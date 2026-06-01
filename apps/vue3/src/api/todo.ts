import { alovaInstance } from '@/api';

export type TodoStatus = 'PENDING' | 'ACTIVE' | 'DONE';

export interface Todo {
  id: number;
  title: string;
  description: string | null;
  status: TodoStatus;
  createTime: string;
  updateTime: string;
}

export interface ListResponse<T> {
  list: T[];
  total: number;
  pageNum?: number;
  pageSize?: number;
}

export interface ListTodoParams {
  pageNum?: number;
  pageSize?: number;
  title?: string;
  status?: TodoStatus;
  updateTime?: string;
}

export const listTodos = (params: ListTodoParams = {}) => {
  const { pageNum = 1, pageSize = 100, ...body } = params;
  return alovaInstance.Post<ListResponse<Todo>>('/todo/list', body, {
    params: { pageNum, pageSize },
  });
};

export const createTodo = (body: { title: string; description?: string }) =>
  alovaInstance.Post<Todo>('/todo/create', body);

export const updateTodo = (id: number, body: { title?: string; description?: string }) =>
  alovaInstance.Post<Todo>(`/todo/update/${id}`, body);

export const updateTodoStatus = (id: number, status: TodoStatus) =>
  alovaInstance.Post<Todo>(`/todo/updateStatus/${id}`, { status });

export const deleteTodo = (id: number) => alovaInstance.Post<Todo>(`/todo/delete/${id}`);
