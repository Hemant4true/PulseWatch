import { Bell, ChevronDown, User } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export function TopNavbar({ workspaceName = 'Loading...' }: { workspaceName?: string }) {
  const { user, logout } = useAuthStore();

  return (
    <header className="h-16 bg-white border-b border-brand-accent/20 flex items-center justify-between px-6 shrink-0 text-brand-base">
      <div className="flex items-center">
        <button className="flex items-center text-sm font-medium text-brand-base hover:bg-brand-surface/10 px-3 py-1.5 rounded-md transition-colors">
          <div className="w-6 h-6 bg-brand-highlight/20 text-brand-base rounded flex items-center justify-center mr-2 font-bold text-xs">
            {workspaceName.charAt(0)}
          </div>
          {workspaceName}
          <ChevronDown className="w-4 h-4 ml-2 text-brand-surface" />
        </button>
      </div>

      <div className="flex items-center space-x-4">
        <button className="text-brand-surface hover:text-brand-base transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-destructive rounded-full"></span>
        </button>

        <div className="h-8 w-px bg-brand-accent/20"></div>

        <div className="flex items-center group relative">
          <button className="flex items-center space-x-2 text-sm font-medium text-brand-base hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-brand-highlight rounded-full flex items-center justify-center text-brand-base">
              <User className="w-4 h-4" />
            </div>
            <span>{user?.name}</span>
          </button>
          
          <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-brand-accent/20 rounded-md shadow-lg py-1 hidden group-hover:block z-50">
            <div className="px-4 py-2 border-b border-brand-accent/20">
              <p className="text-sm font-medium text-brand-base">{user?.name}</p>
              <p className="text-xs text-brand-surface truncate">{user?.email}</p>
            </div>
            <button 
              onClick={() => logout()}
              className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
