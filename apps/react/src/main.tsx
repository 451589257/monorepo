import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'antd-mobile/es/global';
import '@/index.css';
import '@/styles/h5.css';
import App from '@/App.tsx';
import { setupTheme } from '@/stores/theme';

setupTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
