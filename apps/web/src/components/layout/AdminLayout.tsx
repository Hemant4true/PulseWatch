import { Outlet, Navigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Activity, ArrowLeft } from 'lucide-react';

export const AdminLayout = () => {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Redirect to dashboard if not superadmin (don't show a 403 error, just quietly redirect)
  if (!user || user.role !== 'SUPERADMIN') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-foreground">
      <header className="h-16 border-b border-border bg-card flex items-center px-6 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 flex items-center justify-center">
            <img src="/logo.svg" alt="PulseWatch Admin Logo" className="w-8 h-auto" />
          </div>
          <span className="font-bold text-lg tracking-tight text-foreground">PulseWatch <span className="text-red-500">Admin</span></span>
        </div>
        
        <div className="ml-auto">
          <Link
            to="/"
            className="flex items-center px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 rounded-md transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to App
          </Link>
        </div>
      </header>
      
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
