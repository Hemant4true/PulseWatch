import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Send, CheckCircle } from 'lucide-react';
import api from '../lib/api';

interface IncidentUpdate {
  timestamp: string;
  message: string;
  status: string;
}

interface IncidentDetailData {
  id: string;
  title: string;
  status: string;
  startedAt: string;
  resolvedAt: string | null;
  updates: IncidentUpdate[];
  monitor: {
    id: string;
    name: string;
    url: string;
    type: string;
  };
}

const statusColors: Record<string, string> = {
  INVESTIGATING: 'bg-red-500/10 text-red-500 border-red-500/20',
  IDENTIFIED: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  MONITORING: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  RESOLVED: 'bg-green-500/10 text-green-500 border-green-500/20',
};

export default function IncidentDetail() {
  const { id } = useParams<{ id: string }>();
  const [incident, setIncident] = useState<IncidentDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [newStatus, setNewStatus] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchIncident = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/incidents/${id}`);
      if (res.data.success) {
        setIncident(res.data.data);
        setNewStatus(res.data.data.status);
      }
    } catch (e) {}
    setIsLoading(false);
  };

  useEffect(() => {
    fetchIncident();
  }, [id]);

  const handleUpdate = async (e?: React.FormEvent, directStatus?: string) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    try {
      const payloadStatus = directStatus || newStatus;
      const payloadMessage = newMessage || `Status updated to ${payloadStatus}.`;
      await api.patch(`/incidents/${id}`, { status: payloadStatus, message: payloadMessage });
      setNewMessage('');
      await fetchIncident();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!incident) return <div className="text-destructive">Incident not found.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Link to="/incidents" className="p-2 border border-border rounded-md hover:bg-accent text-muted-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{incident.title}</h1>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`px-2.5 py-0.5 text-xs font-bold border rounded-full uppercase ${statusColors[incident.status] || ''}`}>
                {incident.status}
              </span>
              <span className="text-sm text-muted-foreground">
                started {new Date(incident.startedAt).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
        {incident.status !== 'RESOLVED' && (
          <button 
            onClick={() => handleUpdate(undefined, 'RESOLVED')}
            disabled={isSubmitting}
            className="flex items-center px-4 py-2 bg-green-500/10 text-green-500 font-medium rounded-md hover:bg-green-500/20 transition-colors"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Mark Resolved
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Main Column: Timeline & Update Form */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Update Form */}
          <div className="bg-card border border-border rounded-xl shadow-sm p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Post an Update</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="flex gap-4">
                <select 
                  value={newStatus} 
                  onChange={e => setNewStatus(e.target.value)}
                  className="w-40 h-10 px-3 rounded-md border border-input bg-background text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option value="INVESTIGATING">Investigating</option>
                  <option value="IDENTIFIED">Identified</option>
                  <option value="MONITORING">Monitoring</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
              </div>
              <textarea 
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="What is the latest status?"
                className="w-full h-24 p-3 rounded-md border border-input bg-background text-sm focus:ring-2 focus:ring-primary focus:outline-none resize-none"
                required
              />
              <div className="flex justify-end">
                <button 
                  type="submit" 
                  disabled={isSubmitting || !newMessage.trim()}
                  className="flex items-center px-4 py-2 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Post Update
                </button>
              </div>
            </form>
          </div>

          {/* Timeline Feed */}
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/30">
              <h2 className="text-sm font-semibold text-foreground">Incident Timeline</h2>
            </div>
            <div className="p-6">
              <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                
                {/* Render Updates in Reverse (Newest Top, but the prompt says chronological newest at bottom like a chat? Let's do newest at bottom by not reversing) */}
                {incident.updates.map((update, idx) => (
                  <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    
                    {/* Icon */}
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-card shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${statusColors[update.status]?.split(' ')[0] || 'bg-muted'}`}>
                       <div className={`w-2.5 h-2.5 rounded-full ${statusColors[update.status]?.split(' ')[1] || 'bg-muted-foreground'}`}></div>
                    </div>
                    
                    {/* Card */}
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-border bg-background shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-bold uppercase ${statusColors[update.status]?.split(' ')[1] || 'text-muted-foreground'}`}>{update.status}</span>
                        <time className="text-xs text-muted-foreground font-mono">{new Date(update.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</time>
                      </div>
                      <p className="text-sm text-foreground mt-2 whitespace-pre-wrap leading-relaxed">{update.message}</p>
                      <div className="text-xs text-muted-foreground mt-2">{new Date(update.timestamp).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl shadow-sm p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Affected Monitor</h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Name</p>
                <Link to={`/monitors/${incident.monitor?.id}`} className="text-sm font-medium text-primary hover:underline">
                  {incident.monitor?.name}
                </Link>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Type</p>
                <p className="text-sm text-foreground">{incident.monitor?.type}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">URL</p>
                <a href={incident.monitor?.url} target="_blank" rel="noreferrer" className="text-sm text-foreground hover:text-primary transition-colors truncate block">
                  {incident.monitor?.url}
                </a>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
