import { useEffect, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';
import { toast } from 'sonner';

type SSEEventHandler = (type: string, payload: any) => void;

export function useDashboardSSE(workspaceId: string | undefined, onEvent: SSEEventHandler) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const reconnectAttemptRef = useRef(0);
  const { accessToken } = useAuthStore();

  useEffect(() => {
    if (!workspaceId || !accessToken) return;

    const connect = () => {
      const url = `${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/sse/dashboard?token=${accessToken}&workspaceId=${workspaceId}`;
      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'monitor_status_changed') {
            const isDown = data.payload.newStatus === 'DOWN';
            toast[isDown ? 'error' : 'success'](
              `Monitor ${data.payload.monitorName} is ${data.payload.newStatus}`,
              { description: `Status changed from ${data.payload.oldStatus}` }
            );
          } else if (data.type === 'new_incident') {
            toast.warning(`New Incident: ${data.payload.title}`, {
              description: `Monitor: ${data.payload.monitorName}`
            });
          } else if (data.type === 'incident_resolved') {
            toast.success(`Incident Resolved`, {
              description: `Monitor: ${data.payload.monitorName}`
            });
          } else if (data.type === 'new_alert') {
            toast.info(`Alert Sent`, {
              description: `Type: ${data.payload.alertType} for ${data.payload.monitorName}`
            });
          }

          onEvent(data.type, data.payload);
        } catch (err) {
          // Ignore parse errors (e.g. heartbeat)
        }
      };

      es.onopen = () => {
        reconnectAttemptRef.current = 0; // Reset backoff
      };

      es.onerror = () => {
        es.close();
        
        // Exponential backoff
        const attempt = reconnectAttemptRef.current;
        const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
        reconnectAttemptRef.current += 1;
        
        reconnectTimeoutRef.current = setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [workspaceId, accessToken, onEvent]);
}
