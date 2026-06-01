import { createHashRouter, Navigate } from 'react-router-dom';

import TodoApp from '@/components/TodoApp';
import Layout from '@/router/Layout';
import RequireAuth from '@/router/RequireAuth';
import HomeView from '@/views/HomeView';
import LoginView from '@/views/LoginView';
import ProfileView from '@/views/ProfileView';
import RegisterView from '@/views/RegisterView';
import SettingsView from '@/views/SettingsView';
import TodoDetailView from '@/views/TodoDetailView';

export const router = createHashRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/home" replace /> },
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
        path: 'home',
        element: (
          <RequireAuth>
            <HomeView />
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
        path: 'todos/:id',
        element: (
          <RequireAuth>
            <TodoDetailView />
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
      {
        path: 'settings',
        element: (
          <RequireAuth>
            <SettingsView />
          </RequireAuth>
        ),
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
