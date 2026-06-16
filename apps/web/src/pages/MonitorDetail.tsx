import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, CheckCircle2, XCircle, AlertCircle, Clock, Activity } from 'lucide-react';
import api from '../lib/api';

interface MonitorCheck {
  id: string;
  status: string;
  responseTime: number;
  statusCode: number;
  checkedAt: string;
}

interface Incident {
  id: string;
  status: string;
  startedAt: string;
  resolvedAt: string | null;
}

interface MonitorDetailData {
  id: string;
  name: string;
  url: string;
  type: string;
  isActive: boolean;
  checks: MonitorCheck[];
  incidents: Incident[];
}

export default function MonitorDetail() {
  const { id } = useParams<{ id: string }>();
  const [monitor, setMonitor] = useState<MonitorDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMonitor = async () => {
      try {
        const res = await api.get(`/monitors/${id}`);
        if (res.data.success) {
          setMonitor(res.data.data);
        }
      } catch (e) {}
      setIsLoading(false);
    };
    fetchMonitor();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!monitor) return <div className="text-destructive">Monitor not found.</div>;

  const currentStatus = monitor.checks[0]?.status || 'UNKNOWN';

  // Prepare chart data (reverse to show chronological left-to-right)
  const chartData = [...monitor.checks].reverse().map(c => ({
    time: new Date(c.checkedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    responseTime: c.responseTime
  }));

  const StatusBadge = ({ status }: { status: string }) => {
    if (status === 'UP') return <span className="flex items-center font-medium text-green-500"><CheckCircle2 className="w-5 h-5 mr-1.5"/> UP</span>;
    if (status === 'DOWN') return <span className="flex items-center font-medium text-destructive"><XCircle className="w-5 h-5 mr-1.5"/> DOWN</span>;
    return <span className="flex items-center font-medium text-muted-foreground"><AlertCircle className="w-5 h-5 mr-1.5"/> UNKNOWN</span>;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link to="/monitors" className="p-2 border border-border rounded-md hover:bg-accent text-muted-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-foreground">{monitor.name}</h1>
            <span className="px-2 py-0.5 bg-secondary text-secondary-foreground text-xs font-medium rounded-full">{monitor.type}</span>
          </div>
          <a href={monitor.url} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline mt-1 block">
            {monitor.url}
          </a>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Current Status</p>
          <div className="mt-2 text-2xl"><StatusBadge status={monitor.isActive ? currentStatus : 'PAUSED'} /></div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Response Time (Last)</p>
          <div className="mt-2 text-2xl font-bold text-foreground flex items-center">
            <Clock className="w-6 h-6 mr-2 text-muted-foreground" />
            {monitor.checks[0]?.responseTime ? `${monitor.checks[0].responseTime}ms` : '-'}
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Checks Recorded</p>
          <div className="mt-2 text-2xl font-bold text-foreground flex items-center">
            <Activity className="w-6 h-6 mr-2 text-muted-foreground" />
            {monitor.checks.length} (recent)
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-card border border-border rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-foreground mb-6">Response Time (Last 50 checks)</h2>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}ms`} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Line 
                type="monotone" 
                dataKey="responseTime" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Check History */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border bg-muted/30">
            <h2 className="text-lg font-semibold text-foreground">Recent Checks</h2>
          </div>
          <div className="overflow-y-auto max-h-[400px]">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border sticky top-0">
                <tr>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Response</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {monitor.checks.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No checks recorded yet.</td></tr>
                ) : (
                  monitor.checks.map(c => (
                    <tr key={c.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground">{new Date(c.checkedAt).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.status === 'UP' ? 'bg-green-500/10 text-green-500' : 'bg-destructive/10 text-destructive'}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-muted-foreground">{c.statusCode}</td>
                      <td className="px-4 py-3 font-mono text-muted-foreground">{c.responseTime}ms</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Incidents */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border bg-muted/30">
            <h2 className="text-lg font-semibold text-foreground">Recent Incidents</h2>
          </div>
          <div className="p-4 space-y-4 overflow-y-auto max-h-[400px]">
            {monitor.incidents.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No incidents reported.</p>
            ) : (
              monitor.incidents.map(inc => (
                <div key={inc.id} className="border border-border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${inc.status === 'RESOLVED' ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'}`}>
                      {inc.status}
                    </span>
                    <span className="text-xs text-muted-foreground">{new Date(inc.startedAt).toLocaleString()}</span>
                  </div>
                  {inc.resolvedAt && (
                    <p className="text-xs text-muted-foreground mt-2">Resolved: {new Date(inc.resolvedAt).toLocaleString()}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
