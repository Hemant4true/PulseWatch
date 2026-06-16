import { Bell, ChevronDown, User } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export function TopNavbar({ workspaceName = 'Loading...' }: { workspaceName?: string }) {
  const { user, logout } = useAuthStore();

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center">
        <button className="flex items-center text-sm font-medium text-foreground hover:bg-accent px-3 py-1.5 rounded-md transition-colors">
          <div className="w-6 h-6 bg-primary/20 text-primary rounded flex items-center justify-center mr-2 font-bold text-xs">
            {workspaceName.charAt(0)}
          </div>
          {workspaceName}
          <ChevronDown className="w-4 h-4 ml-2 text-muted-foreground" />
        </button>
      </div>

      <div className="flex items-center space-x-4">
        <button className="text-muted-foreground hover:text-foreground transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-destructive rounded-full"></span>
        </button>

        <div className="h-8 w-px bg-border"></div>

        <div className="flex items-center group relative">
          <button className="flex items-center space-x-2 text-sm font-medium text-foreground hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-secondary-foreground">
              <User className="w-4 h-4" />
            </div>
            <span>{user?.name}</span>
          </button>
          
          <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-md shadow-lg py-1 hidden group-hover:block z-50">
            <div className="px-4 py-2 border-b border-border">
              <p className="text-sm font-medium text-foreground">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
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
