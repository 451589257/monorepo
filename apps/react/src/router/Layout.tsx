import { Outlet } from 'react-router-dom';

import AppNav from '@/components/AppNav';

function Layout() {
  return (
    <>
      <AppNav />
      <main className="flex w-full justify-center px-4 pb-10">
        <Outlet />
      </main>
    </>
  );
}

export default Layout;
