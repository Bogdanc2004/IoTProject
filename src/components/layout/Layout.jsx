import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(prev => !prev)}
      />
      <main className={`main-content ${collapsed ? 'main-content--collapsed' : ''}`}>
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
