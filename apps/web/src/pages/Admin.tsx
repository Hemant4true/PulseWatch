import { useEffect, useState } from 'react';
import { Users, LayoutDashboard, Activity, Server, AlertTriangle, ShieldBan, ShieldCheck } from 'lucide-react';
import api from '../lib/api';

interface PlatformStats {
  totalUsers: number;
  totalWorkspaces: number;
  totalMonitors: number;
  totalChecks: number;
  openIncidents: number;
  resolvedIncidents: number;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  isSuspended: boolean;
  createdAt: string;
  workspaceCount: number;
}

interface WorkspaceData {
  id: string;
  name: string;
  slug: string;
  owner: { id: string; name: string; email: string };
  createdAt: string;
  monitorCount: number;
  memberCount: number;
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'workspaces'>('overview');
  
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [workspaces, setWorkspaces] = useState<WorkspaceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      if (res.data.success) setStats(res.data.data);
    } catch (e) {
      console.error('Failed to fetch admin stats');
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      if (res.data.success) setUsers(res.data.data.users);
    } catch (e) {
      console.error('Failed to fetch admin users');
    }
  };

  const fetchWorkspaces = async () => {
    try {
      const res = await api.get('/admin/workspaces');
      if (res.data.success) setWorkspaces(res.data.data.workspaces);
    } catch (e) {
      console.error('Failed to fetch admin workspaces');
    }
  };

  useEffect(() => {
    setIsLoading(true);
    if (activeTab === 'overview') fetchStats();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'workspaces') fetchWorkspaces();
    setIsLoading(false);
  }, [activeTab]);

  const handleToggleSuspend = async (userId: string) => {
    if (!confirm('Are you sure you want to toggle the suspension status for this user?')) return;
    try {
      await api.patch(`/admin/users/${userId}/suspend`);
      fetchUsers(); // Refresh the list
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update user status');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Platform Overview</h1>
        <p className="text-muted-foreground mt-1 text-sm">Global administrative controls and platform health metrics.</p>
      </div>

      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-max">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center ${activeTab === 'overview' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Activity className="w-4 h-4 mr-2" />
          Overview
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center ${activeTab === 'users' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Users className="w-4 h-4 mr-2" />
          Users
        </button>
        <button
          onClick={() => setActiveTab('workspaces')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center ${activeTab === 'workspaces' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <LayoutDashboard className="w-4 h-4 mr-2" />
          Workspaces
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {activeTab === 'overview' && stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                    <h3 className="text-3xl font-bold text-foreground mt-2">{stats.totalUsers}</h3>
                  </div>
                  <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500">
                    <Users className="w-6 h-6" />
                  </div>
                </div>
              </div>
              
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Workspaces</p>
                    <h3 className="text-3xl font-bold text-foreground mt-2">{stats.totalWorkspaces}</h3>
                  </div>
                  <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center text-purple-500">
                    <LayoutDashboard className="w-6 h-6" />
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Monitors</p>
                    <h3 className="text-3xl font-bold text-foreground mt-2">{stats.totalMonitors}</h3>
                  </div>
                  <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center text-green-500">
                    <Server className="w-6 h-6" />
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Checks Executed (All-Time)</p>
                    <h3 className="text-3xl font-bold text-foreground mt-2">{stats.totalChecks.toLocaleString()}</h3>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <Activity className="w-6 h-6" />
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-6 shadow-sm lg:col-span-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Incidents</p>
                    <div className="flex items-center gap-6 mt-2">
                      <div>
                        <h3 className="text-3xl font-bold text-red-500">{stats.openIncidents}</h3>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1 font-medium">Currently Open</p>
                      </div>
                      <div className="h-10 w-px bg-border"></div>
                      <div>
                        <h3 className="text-3xl font-bold text-green-500">{stats.resolvedIncidents}</h3>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1 font-medium">Resolved</p>
                      </div>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-6 py-3 font-medium">User</th>
                      <th className="px-6 py-3 font-medium">Role</th>
                      <th className="px-6 py-3 font-medium">Workspaces</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                      <th className="px-6 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className={`border-b border-border last:border-0 hover:bg-muted/20 transition-colors ${u.isSuspended ? 'bg-red-500/5' : ''}`}>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-foreground">{u.name}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">Joined: {new Date(u.createdAt).toLocaleDateString()}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${u.role === 'SUPERADMIN' ? 'bg-purple-500/10 text-purple-500' : 'bg-secondary text-secondary-foreground'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {u.workspaceCount} owned
                        </td>
                        <td className="px-6 py-4">
                          {u.isSuspended ? (
                            <span className="flex items-center text-red-500 text-xs font-medium">
                              <ShieldBan className="w-3 h-3 mr-1" /> Suspended
                            </span>
                          ) : (
                            <span className="flex items-center text-green-500 text-xs font-medium">
                              <ShieldCheck className="w-3 h-3 mr-1" /> Active
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleToggleSuspend(u.id)}
                            disabled={u.role === 'SUPERADMIN'}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                              u.isSuspended 
                                ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20' 
                                : 'bg-red-500/10 text-red-600 hover:bg-red-500/20'
                            }`}
                          >
                            {u.isSuspended ? 'Unsuspend' : 'Suspend'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'workspaces' && (
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-6 py-3 font-medium">Workspace</th>
                      <th className="px-6 py-3 font-medium">Owner</th>
                      <th className="px-6 py-3 font-medium">Monitors</th>
                      <th className="px-6 py-3 font-medium">Members</th>
                      <th className="px-6 py-3 font-medium">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workspaces.map(w => (
                      <tr key={w.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-medium text-foreground">{w.name}</p>
                          <p className="text-xs text-muted-foreground">/{w.slug}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-foreground text-xs">{w.owner.name}</p>
                          <p className="text-[10px] text-muted-foreground">{w.owner.email}</p>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {w.monitorCount}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {w.memberCount}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground text-xs">
                          {new Date(w.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
}
