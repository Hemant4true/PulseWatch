import { useEffect, useState, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, ServerCrash, Clock, Percent, AlertTriangle, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { useDashboardSSE } from '../hooks/useDashboardSSE';
import { Skeleton } from '../components/ui/skeleton';
import { EmptyState } from '../components/EmptyState';
import { Button } from '../components/ui/button';

interface DashboardStats {
  workspaceId: string;
  workspaceName: string;
  totalMonitors: number;
  downMonitors: number;
  openIncidents: number;
  avgResponseTime: number;
  uptimePercent: string;
  activityFeed: any[];
  recentAlerts: any[];
  uptimeTrend: any[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await api.get('/dashboard/stats');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard stats', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSSEEvent = useCallback((type: string, payload: any) => {
    if (type === 'monitor_status_changed') {
      setStats((prev) => {
        if (!prev) return prev;
        const diff = payload.newStatus === 'DOWN' ? 1 : -1;
        return { ...prev, downMonitors: Math.max(0, prev.downMonitors + diff) };
      });
    } else if (type === 'new_incident') {
      setStats((prev) => {
        if (!prev) return prev;
        const newLog = {
          id: Math.random().toString(),
          user: { name: 'System' },
          action: 'INCIDENT_CREATED',
          metadata: { title: payload.title },
          createdAt: new Date().toISOString()
        };
        return { 
          ...prev, 
          openIncidents: prev.openIncidents + 1,
          activityFeed: [newLog, ...prev.activityFeed].slice(0, 10)
        };
      });
    } else if (type === 'incident_resolved') {
      setStats((prev) => {
        if (!prev) return prev;
        return { ...prev, openIncidents: Math.max(0, prev.openIncidents - 1) };
      });
    }
  }, []);

  useDashboardSSE(stats?.workspaceId, handleSSEEvent);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <Skeleton className="h-10 w-48 mb-2" />
            <Skeleton className="h-5 w-72" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-[400px] rounded-xl" />
          <Skeleton className="h-[400px] rounded-xl" />
        </div>
      </div>
    );
  }

  if (!stats) return <div className="text-destructive">Failed to load data.</div>;

  if (stats.totalMonitors === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Overview</h1>
          <p className="text-muted-foreground mt-1 text-sm">Welcome to your new workspace.</p>
        </div>
        <EmptyState 
          icon={Activity} 
          title="No Monitors Yet" 
          description="Start monitoring your websites and APIs by creating your first monitor."
        />
        <div className="flex justify-center mt-4">
          <Button asChild size="lg">
            <Link to="/monitors" className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create Monitor
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Overview</h1>
          <p className="text-muted-foreground mt-1 text-sm">Monitor the health of your services in real-time.</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Total Monitors" value={stats.totalMonitors.toString()} icon={Activity} />
        <StatCard title="Down Now" value={stats.downMonitors.toString()} icon={ServerCrash} isDanger={stats.downMonitors > 0} />
        <StatCard title="Avg Response" value={`${stats.avgResponseTime}ms`} icon={Clock} />
        <StatCard title="Uptime" value={`${stats.uptimePercent}%`} icon={Percent} />
        <StatCard title="Open Incidents" value={stats.openIncidents.toString()} icon={AlertTriangle} isWarning={stats.openIncidents > 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-foreground mb-6">Uptime Trend (7 Days)</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.uptimeTrend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12} 
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { weekday: 'short' })}
                />
                <YAxis 
                  domain={['dataMin - 1', 100]} 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="uptime" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: 'hsl(var(--card))', strokeWidth: 2 }} 
                  activeDot={{ r: 6 }} 
                  animationDuration={1500}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-card border border-border rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Activity Feed</h2>
          <div className="space-y-4">
            {stats.activityFeed.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
            ) : (
              stats.activityFeed.map((log) => (
                <div key={log.id} className="flex gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0 text-secondary-foreground">
                    {log.user?.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="text-foreground"><span className="font-medium">{log.user?.name || 'System'}</span> {formatAction(log.action, log.metadata)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{new Date(log.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, isDanger, isWarning }: { title: string, value: string, icon: any, isDanger?: boolean, isWarning?: boolean }) {
  let colorClass = "text-muted-foreground";
  let bgClass = "bg-secondary";
  let valueClass = "text-foreground";

  if (isDanger) {
    colorClass = "text-destructive";
    bgClass = "bg-destructive/10";
    valueClass = "text-destructive";
  } else if (isWarning) {
    colorClass = "text-amber-500";
    bgClass = "bg-amber-500/10";
    valueClass = "text-amber-500";
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className={`p-2 rounded-lg ${bgClass}`}>
          <Icon className={`w-4 h-4 ${colorClass}`} />
        </div>
      </div>
      <h3 className={`text-3xl font-bold mt-2 ${valueClass}`}>{value}</h3>
    </div>
  );
}

function formatAction(action: string, metadata: any) {
  switch(action) {
    case 'WORKSPACE_CREATED': return `created workspace ${metadata?.name || ''}`;
    case 'MEMBER_JOINED': return `joined as ${metadata?.role || 'MEMBER'}`;
    case 'MONITOR_CREATED': return `created monitor ${metadata?.monitorName || ''}`;
    default: return action.toLowerCase().replace(/_/g, ' ');
  }
}
