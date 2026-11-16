import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, KeyRound, LayoutDashboard, LogOut, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { Logo } from '../../components/Brand';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { initials, patch } from '../../lib/api';

export function AccountPage() {
  const { user, sites, setUser, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changing, setChanging] = useState(false);

  if (!user) return null;

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const data = await patch<{ user: any }>('/auth/me', { name, email });
      setUser(data.user);
      toast('Profile updated.');
    } catch (err: any) { toast(err.message, 'error'); } finally { setSaving(false); }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setChanging(true);
    try {
      await patch('/auth/me/password', { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      toast('Password changed.');
    } catch (err: any) { toast(err.message, 'error'); } finally { setChanging(false); }
  }

  return (
    <div className="account-shell">
      <header className="home-header">
        <Logo />
        <div className="home-header-right">
          <Link className="btn btn-outline btn-sm" to="/dashboard"><ArrowLeft size={13} /> Dashboard</Link>
          <button className="icon-btn" onClick={() => { logout(); navigate('/'); }} aria-label="Log out"><LogOut size={15} /></button>
        </div>
      </header>
      <main className="account-content">
        <div className="onboarding-title" style={{ marginBottom: 26 }}>
          <div className="eyebrow">Your account</div>
          <h1>Account settings</h1>
          <p>Manage your profile, security and the websites attached to your Nexora workspace.</p>
        </div>
        <div className="account-grid">
          <nav className="account-nav">
            <a href="#profile"><UserRound size={14} /> Profile</a>
            <a href="#security"><KeyRound size={14} /> Security</a>
            <a href="#workspace"><LayoutDashboard size={14} /> Workspace</a>
            {user.role === 'admin' && <Link to="/admin"><ShieldCheck size={14} /> Platform admin</Link>}
          </nav>
          <div>
            <section className="section-card" id="profile">
              <div className="flex-between gap-16 mb-16">
                <div><h2>Your profile</h2><p style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 4 }}>This is how you appear across the platform.</p></div>
                <span className="avatar lg" style={{ background: user.avatarColor }}>{initials(user.name)}</span>
              </div>
              <form onSubmit={saveProfile} className="form-grid">
                <div className="field-row">
                  <div className="field"><label>Full name</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} required /></div>
                  <div className="field"><label>Email address</label><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
                </div>
                <div className="flex-center gap-8" style={{ justifyContent: 'flex-end' }}><button className="btn btn-accent btn-sm" disabled={saving}>{saving ? <span className="spinner" /> : 'Save profile'}</button></div>
              </form>
            </section>

            <section className="section-card" id="security">
              <h2>Security</h2>
              <p>Use at least 8 characters. You will stay signed in on this device.</p>
              <form onSubmit={changePassword} className="form-grid">
                <div className="field-row">
                  <div className="field"><label>Current password</label><input className="input" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required /></div>
                  <div className="field"><label>New password</label><input className="input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={8} required /></div>
                </div>
                <button className="btn btn-outline btn-sm" style={{ width: 'fit-content' }} disabled={changing}>{changing ? <span className="spinner dark" /> : 'Change password'}</button>
              </form>
              <div className="divider" style={{ margin: '20px 0' }} />
              <div className="flex-center gap-10"><ShieldCheck size={18} style={{ color: '#2f7a42' }} /><div><b style={{ fontSize: 11 }}>Two-factor authentication</b><p className="field-hint">Available on Growth and Scale plans. Contact support to enable it.</p></div></div>
            </section>

            <section className="section-card" id="workspace">
              <h2>Your workspace</h2>
              <p>{sites.length} website{sites.length === 1 ? '' : 's'} on this account.</p>
              <div className="customer-list">
                {sites.map((site) => (
                  <div className="customer-row" key={site.id}>
                    <span className="avatar" style={{ background: 'var(--ink)' }}>{site.name.charAt(0)}</span>
                    <div className="customer-copy"><b>{site.name}</b><span>{site.slug}.nexora.studio · {site.plan} plan</span></div>
                    <span className={`badge ${site.status}`}>{site.status}</span>
                    <Link className="icon-btn" to={`/dashboard/${site.id}`} aria-label={`Open ${site.name}`}><LayoutDashboard size={13} /></Link>
                  </div>
                ))}
                {sites.length === 0 && <p className="muted text-xs">No websites yet. <Link className="text-link" to="/onboarding">Create one.</Link></p>}
              </div>
              <div className="divider" style={{ margin: '18px 0' }} />
              <div className="flex-center gap-8 text-xs muted"><Mail size={13} /> Signed in as {user.email} <span>·</span> Account role: {user.role}</div>
            </section>
            <p className="text-xs muted text-center" style={{ marginTop: 8 }}><Check size={11} style={{ display: 'inline', verticalAlign: -1 }} /> Your data is isolated to your account at the application and database query level.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
