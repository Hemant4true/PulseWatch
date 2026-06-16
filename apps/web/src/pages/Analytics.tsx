import { useEffect, useState, useMemo } from 'react';
import { BarChart2, Download, FileText } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../lib/api';

interface MonitorStats {
  uptime: number;
  avgResponseTime: number;
  downEvents: number;
}

interface MonitorData {
  monitor: { id: string; name: string; url: string; type: string };
  stats24h: MonitorStats;
  stats7d: MonitorStats;
  stats30d: MonitorStats;
  chartData: { date: string; avgResponseTime: number; uptime: number }[];
}

export default function Analytics() {
  const [data, setData] = useState<MonitorData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedMonitorId, setSelectedMonitorId] = useState<string>('');
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('30d');

  useEffect(() => {
    api.get('/analytics/overview')
      .then(res => {
        if (res.data.success && res.data.data.length > 0) {
          setData(res.data.data);
          setSelectedMonitorId(res.data.data[0].monitor.id);
        }
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const activeData = useMemo(() => {
    return data.find(d => d.monitor.id === selectedMonitorId) || null;
  }, [data, selectedMonitorId]);

  const activeStats = useMemo(() => {
    if (!activeData) return null;
    if (timeRange === '24h') return activeData.stats24h;
    if (timeRange === '7d') return activeData.stats7d;
    return activeData.stats30d;
  }, [activeData, timeRange]);

  const activeChartData = useMemo(() => {
    if (!activeData) return [];
    let days = 30;
    if (timeRange === '24h') days = 1;
    if (timeRange === '7d') days = 7;
    
    // For 24h, the controller only returns daily points currently.
    // In a real app we'd get hourly points for 24h. We'll show the last 'days' entries.
    return activeData.chartData.slice(-Math.max(days, 1));
  }, [activeData, timeRange]);

  const handleExportCSV = () => {
    if (!selectedMonitorId) return;
    const from = new Date();
    if (timeRange === '24h') from.setDate(from.getDate() - 1);
    else if (timeRange === '7d') from.setDate(from.getDate() - 7);
    else from.setDate(from.getDate() - 30);

    const url = `${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/analytics/export/csv?monitorId=${selectedMonitorId}&from=${from.toISOString()}`;
    window.open(url, '_blank');
  };

  const handleExportPDF = () => {
    if (!selectedMonitorId) return;
    const url = `${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/analytics/export/pdf?monitorId=${selectedMonitorId}`;
    window.open(url, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <BarChart2 className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
        <h2 className="text-2xl font-bold">No Analytics Data</h2>
        <p className="text-muted-foreground mt-2 max-w-md">Add a monitor to start collecting analytics and reports.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Analytics & Reports</h1>
          <p className="text-muted-foreground mt-1 text-sm">Analyze uptime, response times, and export historical data.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleExportCSV}
            className="flex items-center px-3 py-2 bg-secondary text-secondary-foreground font-medium rounded-md hover:bg-secondary/80 transition-colors text-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            CSV
          </button>
          <button 
            onClick={handleExportPDF}
            className="flex items-center px-3 py-2 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors text-sm"
          >
            <FileText className="w-4 h-4 mr-2" />
            PDF Report
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-card border border-border p-4 rounded-xl shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex-1 w-full max-w-sm">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Monitor</label>
          <select 
            value={selectedMonitorId}
            onChange={(e) => setSelectedMonitorId(e.target.value)}
            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:ring-2 focus:ring-primary focus:outline-none"
          >
            {data.map(d => (
              <option key={d.monitor.id} value={d.monitor.id}>{d.monitor.name}</option>
            ))}
          </select>
        </div>

        <div className="w-full sm:w-auto">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Time Range</label>
          <div className="flex bg-muted p-1 rounded-lg">
            <button
              onClick={() => setTimeRange('24h')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${timeRange === '24h' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              24h
            </button>
            <button
              onClick={() => setTimeRange('7d')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${timeRange === '7d' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              7d
            </button>
            <button
              onClick={() => setTimeRange('30d')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${timeRange === '30d' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              30d
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      {activeStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card border border-border p-5 rounded-xl shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">Uptime</p>
            <p className={`text-3xl font-bold mt-1 ${activeStats.uptime < 99 ? 'text-red-500' : 'text-green-500'}`}>
              {activeStats.uptime}%
            </p>
          </div>
          <div className="bg-card border border-border p-5 rounded-xl shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">Avg Response Time</p>
            <p className="text-3xl font-bold mt-1 text-foreground">
              {activeStats.avgResponseTime}ms
            </p>
          </div>
          <div className="bg-card border border-border p-5 rounded-xl shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">Downtime Events</p>
            <p className="text-3xl font-bold mt-1 text-foreground">
              {activeStats.downEvents}
            </p>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Line Chart */}
        <div className="bg-card border border-border rounded-xl shadow-sm p-5">
          <h2 className="text-base font-semibold text-foreground mb-6">Response Time</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activeChartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(val) => `${val}ms`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Line type="monotone" dataKey="avgResponseTime" name="Response Time" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-card border border-border rounded-xl shadow-sm p-5">
          <h2 className="text-base font-semibold text-foreground mb-6">Uptime Trend</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activeChartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(val) => `${val}%`} />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--muted))' }}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Bar dataKey="uptime" name="Uptime" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
