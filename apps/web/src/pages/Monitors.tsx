import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Pause, Play, Trash2, CheckCircle2, XCircle, AlertCircle, Activity } from 'lucide-react';
import api from '../lib/api';
import { MonitorModal } from '../components/MonitorModal';
import { cn } from '../lib/utils';
import { Skeleton } from '../components/ui/skeleton';
import { EmptyState } from '../components/EmptyState';

interface Monitor {
  id: string;
  name: string;
  url: string;
  type: string;
  isActive: boolean;
  currentStatus: string;
  responseTime: number | null;
}

export default function Monitors() {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchMonitors = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/monitors');
      if (res.data.success) {
        setMonitors(res.data.data);
      }
    } catch (e) {}
    setIsLoading(false);
  };

  useEffect(() => {
    fetchMonitors();
  }, []);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(monitors.map(m => m.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleBulkAction = async (action: 'pause' | 'resume' | 'delete') => {
    if (selectedIds.size === 0) return;
    try {
      await api.post('/monitors/bulk', { ids: Array.from(selectedIds), action });
      fetchMonitors();
      setSelectedIds(new Set());
    } catch (e) {}
  };

  const StatusBadge = ({ status }: { status: string }) => {
    if (status === 'UP') return <span className="flex items-center text-xs font-medium text-green-500 bg-green-500/10 px-2 py-1 rounded-full"><CheckCircle2 className="w-3 h-3 mr-1"/> UP</span>;
    if (status === 'DOWN') return <span className="flex items-center text-xs font-medium text-destructive bg-destructive/10 px-2 py-1 rounded-full"><XCircle className="w-3 h-3 mr-1"/> DOWN</span>;
    return <span className="flex items-center text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full"><AlertCircle className="w-3 h-3 mr-1"/> UNKNOWN</span>;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Monitors</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage and track all your endpoints in one place.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-4 py-2 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Monitor
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              placeholder="Search monitors..."
              className="w-full h-9 pl-9 pr-4 text-sm rounded-md border border-input bg-background focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          {selectedIds.size > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground mr-2">{selectedIds.size} selected</span>
              <button onClick={() => handleBulkAction('resume')} className="p-1.5 text-muted-foreground hover:text-green-500 bg-background border border-border rounded-md hover:bg-accent"><Play className="w-4 h-4" /></button>
              <button onClick={() => handleBulkAction('pause')} className="p-1.5 text-muted-foreground hover:text-amber-500 bg-background border border-border rounded-md hover:bg-accent"><Pause className="w-4 h-4" /></button>
              <button onClick={() => handleBulkAction('delete')} className="p-1.5 text-muted-foreground hover:text-destructive bg-background border border-border rounded-md hover:bg-accent"><Trash2 className="w-4 h-4" /></button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 w-10">
                  <input type="checkbox" onChange={handleSelectAll} checked={monitors.length > 0 && selectedIds.size === monitors.length} className="rounded border-input text-primary focus:ring-primary" />
                </th>
                <th className="px-6 py-3">Monitor</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Response</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="px-6 py-4"><Skeleton className="h-4 w-4" /></td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-5 w-32 mb-2" />
                      <Skeleton className="h-3 w-48" />
                    </td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-12" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-10" /></td>
                  </tr>
                ))
              ) : monitors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12">
                    <EmptyState 
                      icon={Activity} 
                      title="No Monitors" 
                      description="You haven't added any monitors yet. Add one to start tracking your endpoints." 
                      actionLabel="Add Monitor"
                      onAction={() => setIsModalOpen(true)}
                    />
                  </td>
                </tr>
              ) : (
                monitors.map((monitor) => (
                  <tr key={monitor.id} className={cn("hover:bg-muted/50 transition-colors", !monitor.isActive && "opacity-50")}>
                    <td className="px-6 py-4">
                      <input type="checkbox" checked={selectedIds.has(monitor.id)} onChange={() => handleSelect(monitor.id)} className="rounded border-input text-primary focus:ring-primary" />
                    </td>
                    <td className="px-6 py-4">
                      <Link to={`/monitors/${monitor.id}`} className="font-medium text-foreground hover:text-primary transition-colors">
                        {monitor.name}
                      </Link>
                      <div className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">{monitor.url}</div>
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={monitor.isActive ? monitor.currentStatus : 'PAUSED'} /></td>
                    <td className="px-6 py-4 text-muted-foreground">{monitor.type}</td>
                    <td className="px-6 py-4 text-muted-foreground">{monitor.responseTime ? `${monitor.responseTime}ms` : '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <MonitorModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSaved={fetchMonitors} />
    </div>
  );
}
