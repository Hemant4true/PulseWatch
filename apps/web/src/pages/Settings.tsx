import { useEffect, useState } from 'react';
import { Save, Check, Link as LinkIcon, ExternalLink, Mail, UserPlus, Trash2 } from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';

interface StatusPageConfig {
  title: string;
  isPublic: boolean;
  slug: string;
}

interface TeamMember {
  id: string; // WorkspaceMember id
  user: { id: string; name: string; email: string; avatarUrl: string | null };
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  joinedAt: string;
}

interface Invite {
  id: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  expiresAt: string;
  createdAt: string;
}

export default function Settings() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'general' | 'team'>('general');

  // General Status Page config
  const [config, setConfig] = useState<StatusPageConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  // Team state
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviteError, setInviteError] = useState('');

  useEffect(() => {
    // Load config
    api.get('/status-pages').then(res => {
      if (res.data.success) {
        setConfig({
          title: res.data.data.title,
          isPublic: res.data.data.isPublic,
          slug: res.data.data.slug
        });
      }
    });
    
    fetchTeam();
  }, []);

  const fetchTeam = () => {
    api.get('/team/members').then(res => {
      if (res.data.success) {
        setMembers(res.data.data.members);
        setInvites(res.data.data.invites);
      }
    });
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    setIsSaving(true);
    try {
      await api.put('/status-pages', config);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save config');
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = () => {
    if (!config?.slug) return;
    const url = `${window.location.origin}/status/${config.slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviting(true);
    setInviteSuccess('');
    setInviteError('');
    try {
      const res = await api.post('/team/invites', { email: inviteEmail, role: inviteRole });
      if (res.data.success) {
        setInviteSuccess('Invite sent successfully!');
        setInviteEmail('');
        fetchTeam();
      }
    } catch (err: any) {
      setInviteError(err.response?.data?.message || 'Failed to send invite');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRevokeInvite = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this invite?')) return;
    try {
      await api.delete(`/team/invites/${id}`);
      fetchTeam();
    } catch (error) {
      alert('Failed to revoke invite');
    }
  };

  const handleRemoveMember = async (id: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    try {
      await api.delete(`/team/members/${id}`);
      fetchTeam();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleUpdateRole = async (id: string, newRole: string) => {
    try {
      await api.patch(`/team/members/${id}/role`, { role: newRole });
      fetchTeam();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update role');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-500 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Workspace Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">Manage your public status page and team members.</p>
      </div>

      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-max">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'general' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          General
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'team' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Team & Members
        </button>
      </div>

      {activeTab === 'general' && (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border bg-muted/30">
            <h2 className="text-xl font-semibold text-foreground">Public Status Page</h2>
            <p className="text-sm text-muted-foreground mt-1">Configure how your status page appears to your users.</p>
          </div>
          
          <div className="p-6">
            {config ? (
              <form onSubmit={handleSaveConfig} className="space-y-6">
                
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center p-4 bg-primary/5 border border-primary/20 rounded-lg mb-6">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground flex items-center">
                      <LinkIcon className="w-4 h-4 mr-2 text-primary" />
                      Your Public URL
                    </p>
                    <a href={`/status/${config.slug}`} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline mt-1 block font-mono">
                      {window.location.origin}/status/{config.slug}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={copyToClipboard}
                      className="px-3 py-1.5 bg-background border border-border rounded-md text-sm font-medium hover:bg-muted transition-colors"
                    >
                      {copied ? 'Copied!' : 'Copy Link'}
                    </button>
                    <a
                      href={`/status/${config.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                      title="Open in new tab"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </a>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="title" className="text-sm font-medium text-foreground">Page Title</label>
                  <input
                    id="title"
                    type="text"
                    value={config.title}
                    onChange={(e) => setConfig({ ...config, title: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                    placeholder="e.g. Acme Corp Status"
                    required
                  />
                  <p className="text-xs text-muted-foreground">The title displayed at the top of your public status page.</p>
                </div>

                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <label className="text-sm font-medium text-foreground">Visibility</label>
                    <p className="text-xs text-muted-foreground mt-0.5">Allow anyone on the internet to view your status page.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={config.isPublic}
                      onChange={(e) => setConfig({ ...config, isPublic: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="pt-4 border-t border-border flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center px-4 py-2 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    ) : saved ? (
                      <Check className="w-4 h-4 mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {saved ? 'Saved' : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex justify-center p-8">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'team' && (
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Invite Member</h2>
            <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label className="text-sm font-medium text-foreground mb-1 block">Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                  placeholder="colleague@example.com"
                  required
                />
              </div>
              <div className="w-full sm:w-48">
                <label className="text-sm font-medium text-foreground mb-1 block">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option value="ADMIN">Admin</option>
                  <option value="MEMBER">Member</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={isInviting}
                className="flex items-center justify-center h-10 px-4 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors w-full sm:w-auto"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                {isInviting ? 'Sending...' : 'Send Invite'}
              </button>
            </form>
            {inviteSuccess && <p className="text-sm text-green-500 mt-2">{inviteSuccess}</p>}
            {inviteError && <p className="text-sm text-red-500 mt-2">{inviteError}</p>}
          </div>

          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border bg-muted/30">
              <h2 className="text-xl font-semibold text-foreground">Active Members</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-3 font-medium">User</th>
                    <th className="px-6 py-3 font-medium">Role</th>
                    <th className="px-6 py-3 font-medium">Joined</th>
                    <th className="px-6 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map(member => (
                    <tr key={member.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {member.user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{member.user.name}</p>
                            <p className="text-xs text-muted-foreground">{member.user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={member.role}
                          onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                          disabled={member.role === 'OWNER' || member.user.id === user?.id}
                          className="h-8 px-2 rounded-md border border-input bg-background text-xs focus:ring-2 focus:ring-primary focus:outline-none disabled:opacity-50"
                        >
                          <option value="OWNER">Owner</option>
                          <option value="ADMIN">Admin</option>
                          <option value="MEMBER">Member</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(member.joinedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          disabled={member.role === 'OWNER' || member.user.id === user?.id}
                          className="text-red-500 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed p-1 transition-colors"
                          title="Remove Member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {invites.length > 0 && (
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden mt-6">
              <div className="p-6 border-b border-border bg-muted/30">
                <h2 className="text-xl font-semibold text-foreground">Pending Invites</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-6 py-3 font-medium">Email</th>
                      <th className="px-6 py-3 font-medium">Role</th>
                      <th className="px-6 py-3 font-medium">Expires</th>
                      <th className="px-6 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invites.map(invite => (
                      <tr key={invite.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-4 flex items-center">
                          <Mail className="w-4 h-4 text-muted-foreground mr-2" />
                          <span className="font-medium text-foreground">{invite.email}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-full font-medium">
                            {invite.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {new Date(invite.expiresAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleRevokeInvite(invite.id)}
                            className="text-red-500 hover:text-red-600 font-medium text-xs transition-colors"
                          >
                            Revoke
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
