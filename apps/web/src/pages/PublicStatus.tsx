import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Activity, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface StatusData {
  page: { title: string; slug: string };
  overallStatus: 'operational' | 'degraded' | 'outage';
  services: {
    id: string;
    name: string;
    type: string;
    url: string;
    status: string;
    uptime30d: number;
    responseTime: number;
  }[];
  incidents: {
    id: string;
    title: string;
    status: string;
    startedAt: string;
    monitor: { name: string } | null;
  }[];
  uptimeHistory: Record<string, { date: string; uptime: number }[]>;
}

const statusConfig = {
  operational: {
    color: 'bg-green-500',
    text: 'text-green-500',
    label: 'All Systems Operational',
    bg: 'bg-green-500/10 border-green-500/20'
  },
  degraded: {
    color: 'bg-yellow-500',
    text: 'text-yellow-500',
    label: 'Partial Outage / Degraded',
    bg: 'bg-yellow-500/10 border-yellow-500/20'
  },
  outage: {
    color: 'bg-red-500',
    text: 'text-red-500',
    label: 'Major Outage',
    bg: 'bg-red-500/10 border-red-500/20'
  }
};

export default function PublicStatus() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<StatusData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initial fetch
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/public/${slug}`)
      .then(res => res.json())
      .then(res => {
        if (res.success) setData(res.data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));

    // SSE connection
    const eventSource = new EventSource(`${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/public/sse/status/${slug}`);
    
    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.type === 'status_update') {
          setData(parsed.payload);
        }
      } catch (e) {}
    };

    return () => {
      eventSource.close();
    };
  }, [slug]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data) {
    if (slug === 'demo') {
      // Fallback demo data
      const demoData: StatusData = {
        page: { title: 'PulseWatch Status', slug: 'demo' },
        overallStatus: 'operational',
        services: [
          { id: '1', name: 'API Server (US East)', type: 'API', url: 'api.pulsewatch.com', status: 'UP', uptime30d: 99.99, responseTime: 45 },
          { id: '2', name: 'Authentication Service', type: 'Auth', url: 'auth.pulsewatch.com', status: 'UP', uptime30d: 99.95, responseTime: 120 },
          { id: '3', name: 'Web Dashboard', type: 'Website', url: 'app.pulsewatch.com', status: 'UP', uptime30d: 99.9, responseTime: 80 }
        ],
        incidents: [
          { id: 'i1', title: 'API Latency Spike', status: 'RESOLVED', startedAt: new Date(Date.now() - 86400000 * 2).toISOString(), monitor: { name: 'API Server (US East)' } }
        ],
        uptimeHistory: {
          '1': Array.from({length: 90}).map((_, i) => ({ date: new Date(Date.now() - (89-i)*86400000).toISOString().split('T')[0], uptime: i === 88 ? 98.5 : 100 })),
          '2': Array.from({length: 90}).map((_, i) => ({ date: new Date(Date.now() - (89-i)*86400000).toISOString().split('T')[0], uptime: 100 })),
          '3': Array.from({length: 90}).map((_, i) => ({ date: new Date(Date.now() - (89-i)*86400000).toISOString().split('T')[0], uptime: i === 45 ? 90.0 : 100 }))
        }
      };
      setData(demoData);
      return null; // Will re-render with data
    }

    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4 text-slate-900">
        <AlertTriangle className="w-16 h-16 text-slate-400 mb-4 opacity-50" />
        <h1 className="text-2xl font-bold">Status Page Not Found</h1>
        <p className="text-slate-500 mt-2">This status page does not exist or is private.</p>
      </div>
    );
  }

  const config = statusConfig[data.overallStatus];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-in fade-in duration-500">
      
      <div className="mb-10 text-center sm:text-left">
        <h1 className="text-3xl font-bold text-slate-900">{data.page.title}</h1>
      </div>

      {/* Status Banner */}
      <div className={`rounded-xl border p-6 flex items-center space-x-4 shadow-sm mb-12 ${config.bg}`}>
        <div className="relative flex h-6 w-6">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.color}`}></span>
          <span className={`relative inline-flex rounded-full h-6 w-6 ${config.color}`}></span>
        </div>
        <h2 className={`text-xl sm:text-2xl font-bold ${config.text}`}>{config.label}</h2>
      </div>

      {/* Services Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm mb-12 overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50">
          <h3 className="text-lg font-semibold text-slate-900">Services</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {data.services.map(service => (
            <div key={service.id} className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h4 className="text-lg font-medium text-slate-900">{service.name}</h4>
                  <div className="flex items-center space-x-3 text-sm text-slate-500 mt-1">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs">{service.type}</span>
                    <span className="flex items-center"><Activity className="w-3.5 h-3.5 mr-1" /> {service.uptime30d}% uptime</span>
                    <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1" /> {service.responseTime}ms avg</span>
                  </div>
                </div>
                <div>
                  {service.status === 'UP' ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-500/10 text-green-500 border border-green-500/20">
                      <CheckCircle className="w-4 h-4 mr-1.5" /> Operational
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-500/10 text-red-500 border border-red-500/20">
                      <AlertTriangle className="w-4 h-4 mr-1.5" /> Outage
                    </span>
                  )}
                </div>
              </div>

              {/* 90 Day Graph */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                  <span>90 days ago</span>
                  <span className="font-medium text-slate-700">{service.uptime30d}%</span>
                  <span>Today</span>
                </div>
                <div className="flex gap-[2px] h-8 items-end">
                  {data.uptimeHistory[service.id]?.map((day, idx) => {
                    let color = "bg-slate-200"; // No data
                    if (day.uptime >= 99) color = "bg-green-500";
                    else if (day.uptime >= 90) color = "bg-yellow-500";
                    else if (day.uptime >= 0) color = "bg-red-500";
                    
                    return (
                      <div 
                        key={idx} 
                        className={`flex-1 rounded-sm opacity-80 hover:opacity-100 transition-opacity cursor-pointer ${color}`}
                        style={{ height: day.uptime >= 0 ? `${Math.max(20, day.uptime)}%` : '20%' }}
                        title={`${day.date}: ${day.uptime >= 0 ? day.uptime.toFixed(1) + '%' : 'No Data'}`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Incidents */}
      {data.incidents.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50">
            <h3 className="text-lg font-semibold text-slate-900">Recent Incidents</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {data.incidents.map(incident => (
              <div key={incident.id} className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <h4 className="text-lg font-medium text-slate-900">{incident.title}</h4>
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border
                    ${incident.status === 'RESOLVED' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                      incident.status === 'INVESTIGATING' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                      'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}`}
                  >
                    {incident.status}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mb-1">
                  Affecting: <span className="font-medium text-slate-900">{incident.monitor?.name || 'Multiple Services'}</span>
                </p>
                <time className="text-xs text-slate-400">
                  {new Date(incident.startedAt).toLocaleString()}
                </time>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
