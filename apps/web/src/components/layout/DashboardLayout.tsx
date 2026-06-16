import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';
import { useState, useEffect } from 'react';
import api from '../../lib/api';

export function DashboardLayout() {
  const [workspaceName, setWorkspaceName] = useState('Loading...');

  // Simple fetch just to get workspace name for navbar
  // Actual stats will be fetched by Dashboard page
  useEffect(() => {
    api.get('/dashboard/stats').then(res => {
      if (res.data?.success) {
        setWorkspaceName(res.data.data.workspaceName);
      }
    }).catch(() => setWorkspaceName('Workspace'));
  }, []);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNavbar workspaceName={workspaceName} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
