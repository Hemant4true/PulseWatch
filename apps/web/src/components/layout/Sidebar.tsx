import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Activity, AlertTriangle, Settings, ChevronLeft, ChevronRight, BarChart2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  const links = [
    { name: 'Dashboard', to: '/', icon: LayoutDashboard },
    { name: 'Monitors', to: '/monitors', icon: Activity },
    { name: 'Analytics', to: '/analytics', icon: BarChart2 },
    { name: 'Incidents', to: '/incidents', icon: AlertTriangle },
    { name: 'Settings', to: '/settings', icon: Settings },
  ];

  return (
    <aside className={cn(
      "bg-card border-r border-border transition-all duration-300 flex flex-col relative",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="h-16 flex items-center px-4 border-b border-border">
        <div className="w-8 h-8 flex items-center justify-center shrink-0">
          <img src="/logo.svg" alt="PulseWatch Logo" className="w-8 h-auto" />
        </div>
        {!collapsed && <span className="ml-3 font-semibold text-foreground text-lg tracking-tight">PulseWatch</span>}
      </div>

      <button 
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 bg-background border border-border rounded-full p-1 hover:bg-accent transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4 text-foreground" /> : <ChevronLeft className="w-4 h-4 text-foreground" />}
      </button>

      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => cn(
              "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
              isActive 
                ? "bg-primary/10 text-primary" 
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <link.icon className={cn("w-5 h-5 shrink-0", collapsed ? "mx-auto" : "mr-3")} />
            {!collapsed && <span>{link.name}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
