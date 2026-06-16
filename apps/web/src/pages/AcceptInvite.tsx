import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Mail, ShieldCheck, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAuthenticated = !!user;
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'idle'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid invite link. No token provided.');
    }
  }, [token]);

  const handleAccept = async () => {
    if (!isAuthenticated) {
      // User must log in first, but we want them to come back here.
      // Easiest is to redirect to login, but store the returnUrl in sessionStorage or just append to state.
      // For simplicity, we just navigate to login and they can click the email link again.
      navigate('/login?message=Please log in to accept your invitation');
      return;
    }

    setStatus('loading');
    try {
      const res = await api.post('/team/invites/accept', { token });
      if (res.data.success) {
        setStatus('success');
        setMessage(res.data.message);
        setTimeout(() => {
          navigate('/');
        }, 3000);
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Failed to accept invite');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-lg p-8 animate-in fade-in zoom-in duration-500">
        
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-6 mx-auto">
          {status === 'success' ? (
            <ShieldCheck className="w-6 h-6 text-green-500" />
          ) : status === 'error' ? (
            <AlertCircle className="w-6 h-6 text-red-500" />
          ) : (
            <Mail className="w-6 h-6 text-primary" />
          )}
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Workspace Invitation</h1>
          
          <div className="mt-4 text-muted-foreground text-sm space-y-4">
            {status === 'idle' && (
              <>
                <p>You've been invited to join a workspace on PulseWatch.</p>
                {isAuthenticated ? (
                  <p className="bg-muted p-3 rounded-md text-foreground">
                    You are logged in as <strong>{user?.email}</strong>.
                  </p>
                ) : (
                  <p className="bg-yellow-500/10 text-yellow-600 p-3 rounded-md">
                    You need to log in or create an account before accepting this invitation.
                  </p>
                )}
              </>
            )}

            {status === 'loading' && (
              <div className="flex flex-col items-center justify-center py-4">
                <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                <p>Accepting invitation...</p>
              </div>
            )}

            {status === 'success' && (
              <div className="bg-green-500/10 text-green-600 p-4 rounded-md">
                <p className="font-medium">{message}</p>
                <p className="text-xs mt-2">Redirecting to your dashboard...</p>
              </div>
            )}

            {status === 'error' && (
              <div className="bg-red-500/10 text-red-500 p-4 rounded-md">
                <p className="font-medium">{message}</p>
              </div>
            )}
          </div>
        </div>

        {status === 'idle' && (
          <div className="mt-8 flex flex-col gap-3">
            <button
              onClick={handleAccept}
              className="w-full flex items-center justify-center py-2.5 px-4 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors"
            >
              {isAuthenticated ? 'Accept Invitation' : 'Log in to Accept'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
            {!isAuthenticated && (
              <button
                onClick={() => navigate('/register')}
                className="w-full py-2.5 px-4 bg-background border border-border text-foreground font-medium rounded-md hover:bg-muted transition-colors"
              >
                Create an Account
              </button>
            )}
          </div>
        )}

        {status === 'error' && (
          <div className="mt-8">
            <button
              onClick={() => navigate('/')}
              className="w-full py-2.5 px-4 bg-background border border-border text-foreground font-medium rounded-md hover:bg-muted transition-colors"
            >
              Return to Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
