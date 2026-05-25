import { createHashRouter, Navigate } from 'react-router-dom';

import TodoApp from '@/components/TodoApp';
import Layout from '@/router/Layout';
import RequireAuth from '@/router/RequireAuth';
import LoginView from '@/views/LoginView';
import ProfileView from '@/views/ProfileView';
import RegisterView from '@/views/RegisterView';

export const router = createHashRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/todos" replace /> },
      {
        path: 'login',
        element: (
          <RequireAuth guestOnly>
            <LoginView />
          </RequireAuth>
        ),
      },
      {
        path: 'register',
        element: (
          <RequireAuth guestOnly>
            <RegisterView />
          </RequireAuth>
        ),
      },
      {
        path: 'todos',
        element: (
          <RequireAuth>
            <TodoApp />
          </RequireAuth>
        ),
      },
      {
        path: 'profile',
        element: (
          <RequireAuth>
            <ProfileView />
          </RequireAuth>
        ),
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
