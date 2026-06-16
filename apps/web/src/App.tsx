import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './components/layout/DashboardLayout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Landing from './pages/Landing';
import Monitors from './pages/Monitors';
import MonitorDetail from './pages/MonitorDetail';
import Incidents from './pages/Incidents';
import IncidentDetail from './pages/IncidentDetail';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import PublicStatus from './pages/PublicStatus';
import AcceptInvite from './pages/AcceptInvite';
import Admin from './pages/Admin';
import { PublicLayout } from './components/layout/PublicLayout';
import { AdminLayout } from './components/layout/AdminLayout';

import { Toaster } from 'sonner';


import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  const { checkAuth, isLoading } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Toaster position="top-right" richColors />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/accept-invite" element={<AcceptInvite />} />
          
          {/* Auth required */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/monitors" element={<Monitors />} />
              <Route path="/monitors/:id" element={<MonitorDetail />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/incidents" element={<Incidents />} />
              <Route path="/incidents/:id" element={<IncidentDetail />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>

          {/* Public Pages */}
          <Route path="/" element={<Landing />} />
          
          <Route element={<PublicLayout />}>
            <Route path="/status/:slug" element={<PublicStatus />} />
          </Route>

          {/* Superadmin Panel */}
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<Admin />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
