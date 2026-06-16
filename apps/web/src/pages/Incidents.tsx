import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, CheckCircle, Activity, ChevronRight } from 'lucide-react';
import api from '../lib/api';
import { Skeleton } from '../components/ui/skeleton';
import { EmptyState } from '../components/EmptyState';

interface Incident {
  id: string;
  monitor: { name: string };
  title: string;
  status: string;
  startedAt: string;
  duration: number;
}

const statusColors: Record<string, string> = {
  INVESTIGATING: 'bg-red-500/10 text-red-500 border-red-500/20',
  IDENTIFIED: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  MONITORING: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  RESOLVED: 'bg-green-500/10 text-green-500 border-green-500/20',
};

const formatDuration = (ms: number) => {
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}m`;
  return `${Math.floor(hrs / 24)}d ${hrs % 24}h`;
};

export default function Incidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const fetchIncidents = async () => {
      setIsLoading(true);
      try {
        const query = statusFilter ? `?status=${statusFilter}` : '';
        const res = await api.get(`/incidents${query}`);
        if (res.data.success) {
          setIncidents(res.data.data);
        }
      } catch (e) {}
      setIsLoading(false);
    };
    fetchIncidents();
  }, [statusFilter]);

  if (!isLoading && incidents.length === 0 && !statusFilter) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">All systems operational</h2>
        <p className="text-muted-foreground mt-2 max-w-md text-center">
          Incidents are automatically created when a monitor goes down, or you can create one manually for planned maintenance.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Incidents</h1>
          <p className="text-muted-foreground mt-1 text-sm">Track and manage ongoing outages and issues.</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30 gap-4 flex-wrap">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              placeholder="Search incidents..."
              className="w-full h-9 pl-9 pr-4 text-sm rounded-md border border-input bg-background focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 text-sm rounded-md border border-input bg-background focus:ring-2 focus:ring-primary focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="INVESTIGATING">Investigating</option>
              <option value="IDENTIFIED">Identified</option>
              <option value="MONITORING">Monitoring</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3">Incident</th>
                <th className="px-6 py-3">Monitor</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Started</th>
                <th className="px-6 py-3">Duration</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="px-6 py-4"><Skeleton className="h-5 w-48 mb-1" /><Skeleton className="h-3 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-24 rounded-full" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-5 rounded" /></td>
                  </tr>
                ))
              ) : incidents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12">
                    <EmptyState 
                      icon={Activity} 
                      title="No Incidents Found" 
                      description={statusFilter ? "There are no incidents matching your selected filters." : "All systems are operational. There are no ongoing incidents."} 
                    />
                  </td>
                </tr>
              ) : (
                incidents.map((incident) => (
                  <tr key={incident.id} className="hover:bg-muted/50 transition-colors group">
                    <td className="px-6 py-4">
                      <Link to={`/incidents/${incident.id}`} className="font-medium text-foreground hover:text-primary transition-colors line-clamp-1">
                        {incident.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-muted-foreground">
                        <Activity className="w-3.5 h-3.5 mr-1.5" />
                        {incident.monitor?.name || 'Unknown'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-medium border rounded-full ${statusColors[incident.status] || ''}`}>
                        {incident.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{new Date(incident.startedAt).toLocaleString()}</td>
                    <td className="px-6 py-4 text-muted-foreground font-mono text-xs">{formatDuration(incident.duration)}</td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/incidents/${incident.id}`} className="inline-flex items-center text-muted-foreground hover:text-foreground">
                        <span className="sr-only">View</span>
                        <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
