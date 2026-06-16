import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { 
  Activity, 
  Bell, 
  Shield, 
  BarChart2, 
  Globe, 
  Users, 
  Check, 
  X, 
  Terminal,
  Zap
} from 'lucide-react';
import { Button } from '../components/ui/button';

export default function Landing() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return <div className="min-h-screen bg-background"></div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground/80 font-sans selection:bg-primary/30">
      
      {/* 1. PublicNavbar */}
      <nav className="sticky top-0 z-50 border-b border-brand-white/20/50 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-2">
                <img src="/logo.svg" alt="PulseWatch Logo" className="h-6 w-auto" />
                <span className="text-xl font-bold text-foreground">PulseWatch</span>
              </Link>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <a href="#features" className="hover:text-foreground transition-colors">Features</a>
                <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
                <Link to="/status/demo" className="hover:text-foreground transition-colors">Status</Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login" className="hidden sm:block text-sm font-medium hover:text-foreground transition-colors">Log In</Link>
              <Link to="/register">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-4 py-2">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main>
        {/* 2. Hero Section */}
        <section className="relative pt-24 pb-32 overflow-hidden">
          {/* Subtle gradient background */}
          <div className="absolute top-0 left-1/2 w-full -translate-x-1/2 h-full z-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/20 blur-[120px] rounded-full"></div>
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="text-5xl md:text-7xl font-bold text-foreground tracking-tight leading-tight mb-6">
                  From thousands of pings to <span className="text-foreground">one clear signal.</span>
                </h1>
                <p className="text-xl text-foreground/80 mb-8 max-w-lg">
                  Production-grade uptime monitoring that filters the noise. Get instant alerts before your users notice downtime, not after.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link to="/register">
                    <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-lg px-8 h-14">
                      Start Monitoring Free
                    </Button>
                  </Link>
                  <a href="#how-it-works">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto border-brand-white/30 text-foreground/90 hover:bg-primary/10 hover:text-foreground rounded-lg text-lg px-8 h-14">
                      See How It Works
                    </Button>
                  </a>
                </div>
              </div>

              {/* Fake Terminal Mockup */}
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl blur opacity-20"></div>
                <div className="relative bg-background/50 border border-brand-white/20 rounded-xl overflow-hidden shadow-2xl">
                  <div className="flex items-center px-4 py-3 border-b border-brand-white/20 bg-background/50/50">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                    </div>
                    <div className="mx-auto flex items-center text-xs text-foreground0 font-mono">
                      <Terminal className="w-3 h-3 mr-2" /> pulsewatch-agent ~ prod
                    </div>
                  </div>
                  <div className="p-6 font-mono text-sm leading-relaxed text-foreground/90">
                    <div className="flex gap-4">
                      <span className="text-foreground0">10:42:01</span>
                      <span className="text-foreground">INFO</span>
                      <span>Pinging api.production.com...</span>
                    </div>
                    <div className="flex gap-4">
                      <span className="text-foreground0">10:42:01</span>
                      <span className="text-green-400">UP</span>
                      <span>HTTP 200 OK (42ms)</span>
                    </div>
                    <div className="flex gap-4 mt-2">
                      <span className="text-foreground0">10:42:05</span>
                      <span className="text-foreground">INFO</span>
                      <span>Pinging auth-service.internal...</span>
                    </div>
                    <div className="flex gap-4">
                      <span className="text-foreground0">10:42:10</span>
                      <span className="text-red-400">DOWN</span>
                      <span>HTTP 502 Bad Gateway (timeout)</span>
                    </div>
                    <div className="flex gap-4 mt-2">
                      <span className="text-foreground0">10:42:10</span>
                      <span className="text-yellow-400">ALERT</span>
                      <span>Triggering Slack Webhook...</span>
                    </div>
                    <div className="flex gap-4">
                      <span className="text-foreground0">10:42:11</span>
                      <span className="text-yellow-400">ALERT</span>
                      <span>Sending SMS to on-call engineer...</span>
                    </div>
                    <div className="flex gap-4 mt-2 animate-pulse">
                      <span className="text-foreground0">10:42:15</span>
                      <span className="text-foreground">INFO</span>
                      <span>Waiting for next cycle <span className="opacity-50">...</span></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Social Proof */}
        <section className="border-y border-brand-white/20/50 bg-background/50/30 py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm font-medium text-foreground0 uppercase tracking-widest mb-6">
              Trusted by developers at
            </p>
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
              {['Acme Corp', 'Devly', 'Stackr', 'Forge', 'Nimbus'].map((company) => (
                <div key={company} className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-foreground" />
                  <span className="text-xl font-bold text-foreground/90">{company}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. Features Grid */}
        <section id="features" className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Your competitive advantage <span className="text-foreground">starts here</span></h2>
              <p className="text-xl text-foreground/80">Everything you need to monitor, manage, and communicate incidents effectively.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { icon: Activity, title: 'Real-time Feed Alerts', desc: 'Get notified via Email, Slack, or SMS the second your endpoints go down.' },
                { icon: BarChart2, title: 'Advanced Analytics', desc: 'Track response times globally and export PDF/CSV reports for your stakeholders.' },
                { icon: Shield, title: 'Smart SSL Tracking', desc: 'Never let a certificate expire again. We warn you 30, 14, and 7 days before expiration.' },
                { icon: Globe, title: 'Public Status Pages', desc: 'Keep your customers informed with beautiful, real-time public status pages.' },
                { icon: Users, title: 'Team Workspaces', desc: 'Invite your whole engineering team with Role-Based Access Control (RBAC).' },
                { icon: Bell, title: 'Incident Management', desc: 'Create, update, and resolve incidents with automated timelines and post-mortems.' }
              ].map((f, i) => (
                <div key={i} className="bg-background/50 border border-brand-white/20 p-8 rounded-xl hover:border-brand-white/50/50 transition-colors">
                  <div className="w-12 h-12 bg-primary/10 flex items-center justify-center rounded-lg mb-6">
                    <f.icon className="w-6 h-6 text-foreground" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{f.title}</h3>
                  <p className="text-foreground/80 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. Problem/Solution */}
        <section className="py-24 bg-background/50/30 border-y border-brand-white/20/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-foreground font-medium tracking-wider uppercase text-sm">The Result</span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2 mb-4">Same outage, different story</h2>
              <p className="text-xl text-foreground/80">Stop finding out about downtime from angry customers on Twitter.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Old Method */}
              <div className="bg-background/50 border border-brand-white/20 rounded-xl p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-red-500/50"></div>
                <h3 className="text-2xl font-bold text-foreground mb-6">Old Method</h3>
                <ul className="space-y-4">
                  {[
                    'Users complain on Twitter before you know',
                    'Scrambling to find which microservice failed',
                    'Manually updating status pages',
                    'Surprise SSL certificate expirations',
                    'No historical uptime data for SLAs'
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="mt-1 bg-red-500/10 p-1 rounded-md shrink-0">
                        <X className="w-4 h-4 text-red-400" />
                      </div>
                      <span className="text-foreground/90">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* PulseWatch Method */}
              <div className="bg-background/50 border border-brand-white/50/30 rounded-xl p-8 relative overflow-hidden shadow-[0_0_40px_-15px_rgba(99,102,241,0.2)]">
                <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
                <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <img src="/logo.svg" alt="PulseWatch Logo" className="w-6 h-auto" /> PulseWatch Method
                </h3>
                <ul className="space-y-4">
                  {[
                    'Instant alerts via Slack/SMS before users notice',
                    'Exact endpoint and status code identified instantly',
                    'Automated Real-time Public Status Pages',
                    'Proactive 30-day SSL expiration warnings',
                    'Exportable PDF reports for SLA compliance'
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="mt-1 bg-green-500/10 p-1 rounded-md shrink-0">
                        <Check className="w-4 h-4 text-green-400" />
                      </div>
                      <span className="text-foreground/90">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 6. How It Works */}
        <section id="how-it-works" className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-foreground font-medium tracking-wider uppercase text-sm">Setup</span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2 mb-4">Up and running in seconds</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { step: '1', title: 'Add your URL', desc: 'Paste your website, API endpoint, or hostname. We support GET, POST, PUT, and more.' },
                { step: '2', title: 'We monitor 24/7', desc: 'Our distributed agents ping your endpoints every minute to ensure global availability.' },
                { step: '3', title: 'Get alerted instantly', desc: 'If something breaks, we notify your team immediately so you can fix it fast.' }
              ].map((s) => (
                <div key={s.step} className="bg-background/50 border border-brand-white/20 p-8 rounded-xl text-center relative group hover:border-brand-white/50/50 transition-all">
                  <div className="text-7xl font-black text-foreground/20/50 group-hover:text-foreground/20 transition-colors absolute top-4 right-6 pointer-events-none">{s.step}</div>
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10 border border-brand-white/30 text-2xl font-bold text-foreground">
                    {s.step}
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3 relative z-10">{s.title}</h3>
                  <p className="text-foreground/80 relative z-10">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 7. Metrics Bar */}
        <section className="bg-background py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-indigo-500/50">
              <div className="text-center px-4">
                <div className="text-4xl md:text-5xl font-black text-white mb-2">99.9%</div>
                <div className="text-foreground/80 font-medium">Uptime tracked</div>
              </div>
              <div className="text-center px-4">
                <div className="text-4xl md:text-5xl font-black text-white mb-2">&lt;60s</div>
                <div className="text-foreground/80 font-medium">Alert delivery</div>
              </div>
              <div className="text-center px-4">
                <div className="text-4xl md:text-5xl font-black text-white mb-2">3 types</div>
                <div className="text-foreground/80 font-medium">Website, API, SSL</div>
              </div>
              <div className="text-center px-4">
                <div className="text-4xl md:text-5xl font-black text-white mb-2">Free</div>
                <div className="text-foreground/80 font-medium">No credit card needed</div>
              </div>
            </div>
          </div>
        </section>

        {/* 8. Final CTA */}
        <section className="py-32">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-background/50 border border-brand-white/20 rounded-2xl p-12 text-center relative overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/20 blur-[100px] rounded-full pointer-events-none"></div>
              <div className="relative z-10">
                <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">Ready to take control of your uptime?</h2>
                <p className="text-xl text-foreground/80 mb-8 max-w-2xl mx-auto">Join developers and engineering teams who rely on PulseWatch for production-grade monitoring.</p>
                <Link to="/register">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-lg px-10 h-14">
                    Start Monitoring Free
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 9. Footer */}
      <footer className="border-t border-brand-white/20/50 bg-background py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <img src="/logo.svg" alt="PulseWatch Logo" className="h-6 w-auto" />
              <span className="text-xl font-bold text-foreground">PulseWatch</span>
            </div>
            <p className="text-foreground0">© 2026 PulseWatch Inc. All rights reserved.</p>
            <div className="flex gap-6">
              <Link to="/status/demo" className="text-foreground/80 hover:text-foreground transition-colors">Status</Link>
              <a href="#" className="text-foreground/80 hover:text-foreground transition-colors">Docs</a>
              <a href="https://github.com/yourusername/pulsewatch" target="_blank" rel="noreferrer" className="text-foreground/80 hover:text-foreground transition-colors">GitHub</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
