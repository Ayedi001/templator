import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity, BarChart3, Bot, Building2, CreditCard, Globe2, LayoutDashboard,
  LayoutTemplate, LogOut, Menu, Settings, Users,
} from 'lucide-react';
import { Logo } from '../../components/Brand';
import { useAuth } from '../../context/AuthContext';
import { initials } from '../../lib/api';

const NAV = [
  { to: '/admin', end: true, label: 'Overview', icon: LayoutDashboard },
  { to: '/admin/users', label: 'Businesses', icon: Users },
  { to: '/admin/sites', label: 'Websites', icon: Globe2 },
  { to: '/admin/templates', label: 'Templates', icon: LayoutTemplate },
  { to: '/admin/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { to: '/admin/ai', label: 'AI agents', icon: Bot },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/activity', label: 'Activity log', icon: Activity },
  { to: '/admin/settings', label: 'Platform settings', icon: Settings },
];

const TITLES: Record<string, { title: string; sub: string }> = {
  '/admin': { title: 'Platform overview', sub: 'The health of the entire Nexora platform.' },
  '/admin/users': { title: 'Businesses', sub: 'Every owner account, their sites and lifetime activity.' },
  '/admin/sites': { title: 'Websites', sub: 'Every published and draft website across all tenants.' },
  '/admin/templates': { title: 'Template library', sub: 'Manage, feature and extend the marketplace collection.' },
  '/admin/subscriptions': { title: 'Subscriptions', sub: 'Plan distribution, MRR and account status.' },
  '/admin/ai': { title: 'AI agents', sub: 'Agent availability, usage and plan allowances.' },
  '/admin/analytics': { title: 'Platform analytics', sub: 'Growth, revenue and template performance.' },
  '/admin/activity': { title: 'Activity log', sub: 'Everything happening across the platform.' },
  '/admin/settings': { title: 'Platform settings', sub: 'Account contact details and platform configuration.' },
};

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const title = TITLES[location.pathname] || TITLES['/admin'];

  useEffect(() => { setOpen(false); document.title = `${title.title} · Nexora Admin`; }, [location.pathname]);

  if (!user) return null;

  return (
    <div className="admin-shell">
      {open && <div className="sidebar-scrim" onClick={() => setOpen(false)} />}
      <aside className={`admin-sidebar ${open ? 'open' : ''}`}>
        <Logo light />
        <div className="admin-tag"><i /> Platform super admin</div>
        <nav className="admin-side-nav">
          <div className="admin-side-label">Manage</div>
          {NAV.slice(0, 5).map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}>
              <item.icon size={15} /> {item.label}
            </NavLink>
          ))}
          <div className="admin-side-label">Intelligence & insight</div>
          {NAV.slice(5, 8).map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}>
              <item.icon size={15} /> {item.label}
            </NavLink>
          ))}
          <div className="admin-side-label">Platform</div>
          <NavLink to="/admin/settings" className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}><Settings size={15} /> Settings</NavLink>
        </nav>
        <div className="admin-side-foot">
          <Link className="admin-link" to="/" style={{ marginBottom: 8 }}><Globe2 size={15} /> View public site</Link>
          <div className="side-user">
            <span className="avatar" style={{ background: '#e8613a' }}>{initials(user.name)}</span>
            <div className="side-user-copy"><b>{user.name}</b><small>{user.email}</small></div>
            <button className="side-logout" onClick={() => { logout(); navigate('/'); }} aria-label="Log out"><LogOut size={14} /></button>
          </div>
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <div className="flex-center gap-12">
            <button className="topbar-burger" onClick={() => setOpen(true)} aria-label="Open admin menu"><Menu size={17} /></button>
            <div><h1>{title.title}</h1><p>{title.sub}</p></div>
          </div>
          <div className="admin-topbar-actions">
            <span className="badge" style={{ background: '#e9f4e8', borderColor: '#c8e2c2', color: '#2c6432' }}><Building2 size={10} /> Platform live</span>
            <Link to="/dashboard/account" className="topbar-account"><span className="avatar" style={{ background: user.avatarColor }}>{initials(user.name)}</span></Link>
          </div>
        </header>
        <main className="admin-content"><Outlet /></main>
      </div>
    </div>
  );
}
