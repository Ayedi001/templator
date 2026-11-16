import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Info, Lock, Mail, Sparkles, UserRound } from 'lucide-react';
import { Logo } from '../components/Brand';
import { TemplateMockup } from '../components/TemplateMockup';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { get } from '../lib/api';
import type { Template } from '../lib/types';

function AuthVisual() {
  const [templates, setTemplates] = useState<Template[]>([]);
  useEffect(() => {
    get<{ templates: Template[] }>('/templates?featured=true').then((data) => setTemplates(data.templates.slice(0, 3))).catch(() => undefined);
  }, []);
  return (
    <div className="auth-visual">
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Logo light />
      </div>
      <div className="auth-visual-inner">
        <div className="eyebrow" style={{ color: 'rgba(245,241,232,.55)' }}>Beautiful websites, intelligently made</div>
        <h2>Your business deserves a <em>beautiful</em> home online.</h2>
        <p>Choose from 60+ original designs, make it yours in a live editor, and publish in one click. No code. No templates that look like templates.</p>
        {templates.length > 0 && (
          <div className="auth-mini-stack">
            {templates.map((template, i) => (
              <div key={template.id} style={{ zIndex: 2 - i }}><TemplateMockup template={template} className="landing-mini" /></div>
            ))}
          </div>
        )}
      </div>
      <div className="auth-quote">
        <span className="quote-avatar">CR</span>
        <div>
          <blockquote>“It looks like an agency built it — and I can change anything myself.”</blockquote>
          <div style={{ fontSize: 9.5, color: 'rgba(245,241,232,.4)', marginTop: 5 }}>Camille Roux · Atelier Noir</div>
        </div>
      </div>
    </div>
  );
}

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-page">
      <div className="auth-panel">
        <div className="auth-top"><Logo /></div>
        <div className="auth-form-wrap">{children}</div>
      </div>
      <AuthVisual />
    </div>
  );
}

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [params] = useSearchParams();

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await login(email, password);
      toast(`Welcome back, ${data.user.name.split(' ')[0]}.`);
      if (data.user.role === 'admin') navigate('/admin');
      else if (data.sites.length) navigate(params.get('next') || '/dashboard');
      else navigate(`/onboarding${params.get('template') ? `?template=${params.get('template')}` : ''}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function fillDemo() {
    setEmail('maya@nexora.studio');
    setPassword('Demo1234!');
    setError('');
  }

  return (
    <AuthShell>
      <div className="eyebrow">Welcome back</div>
      <h1>Good to see<br />you again.</h1>
      <p>Sign in to manage your websites, catalogue, orders and AI studio.</p>
      <form className="auth-form" onSubmit={submit}>
        {error && <div className="form-error">{error}</div>}
        <div className="field">
          <label htmlFor="login-email">Email address</label>
          <div style={{ position: 'relative' }}>
            <Mail size={15} style={{ position: 'absolute', left: 14, top: 15, color: 'var(--muted)' }} />
            <input id="login-email" className="input" style={{ paddingLeft: 40 }} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@business.com" autoComplete="email" required />
          </div>
        </div>
        <div className="field">
          <label htmlFor="login-password">Password</label>
          <div style={{ position: 'relative' }}>
            <Lock size={15} style={{ position: 'absolute', left: 14, top: 15, color: 'var(--muted)' }} />
            <input id="login-password" className="input" style={{ paddingLeft: 40, paddingRight: 42 }} type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" autoComplete="current-password" required />
            <button type="button" onClick={() => setShow(!show)} style={{ position: 'absolute', right: 10, top: 8, border: 0, background: 'transparent', padding: 6, color: 'var(--muted)' }} aria-label="Toggle password visibility">{show ? <EyeOff size={15} /> : <Eye size={15} />}</button>
          </div>
        </div>
        <button className="btn btn-accent btn-block btn-lg" type="submit" disabled={busy}>{busy ? <span className="spinner" /> : <>Sign in <ArrowRight size={15} /></>}</button>
        <div className="demo-login">
          <Info size={15} />
          <div style={{ flex: 1 }}>
            <b>Demo owner</b><br />
            maya@nexora.studio · Demo1234!
          </div>
          <button type="button" className="text-link" style={{ fontSize: 10 }} onClick={fillDemo}>Use demo</button>
        </div>
      </form>
      <div className="auth-switch">New to Nexora? <Link to={`/register${params.get('template') ? `?template=${params.get('template')}` : ''}`}>Create an account</Link></div>
      <div className="auth-legal">Platform admin? Sign in with the admin credentials provided in your environment.</div>
    </AuthShell>
  );
}

export function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [accepted, setAccepted] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!accepted) { setError('Please accept the terms to create an account.'); return; }
    setBusy(true);
    setError('');
    try {
      await register(name, email, password);
      toast('Your studio is ready. Let’s build your first website.');
      navigate(`/onboarding${params.get('template') ? `?template=${params.get('template')}` : ''}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell>
      <div className="eyebrow">Start free · No card needed</div>
      <h1>Build something<br />you're proud of.</h1>
      <p>Create your account and launch a professional website in an afternoon — not a quarter.</p>
      <form className="auth-form" onSubmit={submit}>
        {error && <div className="form-error">{error}</div>}
        <div className="field">
          <label htmlFor="register-name">Your name</label>
          <div style={{ position: 'relative' }}>
            <UserRound size={15} style={{ position: 'absolute', left: 14, top: 15, color: 'var(--muted)' }} />
            <input id="register-name" className="input" style={{ paddingLeft: 40 }} value={name} onChange={(e) => setName(e.target.value)} placeholder="Maya Laurent" autoComplete="name" required minLength={2} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="register-email">Work email</label>
          <div style={{ position: 'relative' }}>
            <Mail size={15} style={{ position: 'absolute', left: 14, top: 15, color: 'var(--muted)' }} />
            <input id="register-email" className="input" style={{ paddingLeft: 40 }} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@business.com" autoComplete="email" required />
          </div>
        </div>
        <div className="field">
          <label htmlFor="register-password">Password</label>
          <div style={{ position: 'relative' }}>
            <Lock size={15} style={{ position: 'absolute', left: 14, top: 15, color: 'var(--muted)' }} />
            <input id="register-password" className="input" style={{ paddingLeft: 40, paddingRight: 42 }} type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" required minLength={8} />
            <button type="button" onClick={() => setShow(!show)} style={{ position: 'absolute', right: 10, top: 8, border: 0, background: 'transparent', padding: 6, color: 'var(--muted)' }} aria-label="Toggle password visibility">{show ? <EyeOff size={15} /> : <Eye size={15} />}</button>
          </div>
        </div>
        <label className="checkbox"><input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} /> I agree to the Terms and Privacy Policy</label>
        <button className="btn btn-accent btn-block btn-lg" type="submit" disabled={busy}>{busy ? <span className="spinner" /> : <>Create my account <ArrowRight size={15} /></>}</button>
        <div className="demo-login"><Sparkles size={15} /> Your 14-day trial includes every template, the visual editor and 50 AI actions.</div>
      </form>
      <div className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></div>
    </AuthShell>
  );
}
