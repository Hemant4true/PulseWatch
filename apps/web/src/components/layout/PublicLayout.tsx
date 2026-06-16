import { Outlet } from 'react-router-dom';
import { Activity, Moon, Sun } from 'lucide-react';
import { useTheme } from '../ThemeProvider';

export function PublicLayout() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="h-16 flex items-center justify-between px-6 lg:px-12 shrink-0">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-lg tracking-tight">PulseWatch</span>
        </div>
        <button 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-md hover:bg-accent"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="h-16 flex items-center justify-center border-t border-border mt-12 shrink-0">
        <p className="text-sm text-muted-foreground flex items-center">
          Powered by <Activity className="w-4 h-4 mx-1.5 text-primary" /> PulseWatch
        </p>
      </footer>
    </div>
  );
}
