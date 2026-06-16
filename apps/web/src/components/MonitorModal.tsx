import React, { useState } from 'react';
import { X, Play, Save, CheckCircle, XCircle } from 'lucide-react';
import api from '../lib/api';

interface MonitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function MonitorModal({ isOpen, onClose, onSaved }: MonitorModalProps) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState('WEBSITE');
  const [method, setMethod] = useState('GET');
  const [interval, setInterval] = useState(5);

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ status: string, code: number, time: number } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleTest = async () => {
    if (!url) return;
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await api.post('/monitors/test', { url, method });
      if (res.data.success) {
        setTestResult(res.data.data);
      }
    } catch (error) {
      setTestResult({ status: 'ERROR', code: 0, time: 0 });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.post('/monitors', { name, url, type, method, interval: Number(interval) });
      onSaved();
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card w-full max-w-lg rounded-xl shadow-lg border border-border flex flex-col max-h-[90vh]">
        
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Add New Monitor</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <form id="monitor-form" onSubmit={handleSave} className="space-y-4">
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Monitor Type</label>
              <select 
                value={type} onChange={e => setType(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="WEBSITE">Website (HTTP/S)</option>
                <option value="API">API</option>
                <option value="SSL">SSL Certificate</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Friendly Name</label>
              <input 
                required value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g. Production Web Server"
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">URL to Monitor</label>
              <div className="flex gap-2">
                <select 
                  value={method} onChange={e => setMethod(e.target.value)}
                  className="w-24 h-10 px-3 rounded-md border border-input bg-background text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="HEAD">HEAD</option>
                </select>
                <input 
                  required type="url" value={url} onChange={e => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="flex-1 h-10 px-3 rounded-md border border-input bg-background text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Check Interval (minutes)</label>
              <input 
                type="number" min="1" max="60" value={interval} onChange={e => setInterval(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

          </form>

          {/* Test Connection Section */}
          <div className="mt-6 p-4 bg-muted rounded-lg border border-border">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">Test Connection</p>
              <button 
                type="button"
                onClick={handleTest}
                disabled={!url || isTesting}
                className="flex items-center text-sm px-3 py-1.5 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md disabled:opacity-50"
              >
                {isTesting ? <div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin"></div> : <Play className="w-4 h-4 mr-2" />}
                {isTesting ? 'Testing...' : 'Run Test'}
              </button>
            </div>
            
            {testResult && (
              <div className="mt-4 flex items-center space-x-4 text-sm">
                {testResult.status === 'UP' ? (
                  <div className="flex items-center text-green-500"><CheckCircle className="w-4 h-4 mr-1" /> Success</div>
                ) : (
                  <div className="flex items-center text-destructive"><XCircle className="w-4 h-4 mr-1" /> Failed</div>
                )}
                {testResult.code > 0 && <span className="text-muted-foreground">HTTP {testResult.code}</span>}
                {testResult.time > 0 && <span className="text-muted-foreground">{testResult.time}ms</span>}
              </div>
            )}
          </div>

        </div>

        <div className="p-6 border-t border-border flex justify-end gap-3 bg-muted/50 rounded-b-xl">
          <button 
            type="button" onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-md hover:bg-accent"
          >
            Cancel
          </button>
          <button 
            type="submit" form="monitor-form" disabled={isSaving}
            className="flex items-center px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Monitor'}
          </button>
        </div>

      </div>
    </div>
  );
}
