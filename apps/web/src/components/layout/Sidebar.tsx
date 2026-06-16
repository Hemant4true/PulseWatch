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
      "bg-brand-base text-white border-r border-brand-accent/30 transition-all duration-300 flex flex-col relative",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="h-16 flex items-center px-4 border-b border-brand-accent/30">
        <div className="w-8 h-8 flex items-center justify-center shrink-0">
          <img src="/logo.svg" alt="PulseWatch Logo" className="w-8 h-auto" />
        </div>
        {!collapsed && <span className="ml-3 font-semibold text-white text-lg tracking-tight">PulseWatch</span>}
      </div>

      <button 
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 bg-brand-surface border border-brand-accent rounded-full p-1 hover:bg-brand-highlight/20 transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4 text-white" /> : <ChevronLeft className="w-4 h-4 text-white" />}
      </button>

      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => cn(
              "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
              isActive 
                ? "bg-brand-surface text-brand-highlight" 
                : "text-white/70 hover:bg-brand-surface hover:text-white"
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
