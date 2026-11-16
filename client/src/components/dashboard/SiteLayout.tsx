import { createContext, useContext, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowUpRight, BarChart3, BookOpen, Bot, ChevronDown, CreditCard,
  ExternalLink, FileText, Globe2, HelpCircle, Image as ImageIcon, Inbox,
  LayoutDashboard, LayoutTemplate, LogOut, Menu, Package, PenTool, Plus,
  Rocket, Search, Settings, ShoppingBag, Sparkles, Users, X,
} from 'lucide-react';
import { Logo } from '../../components/Brand';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { get, post, initials } from '../../lib/api';
import type { SiteDetails } from '../../lib/types';

const CATEGORY_CONFIG: Record<string, { itemLabel: string; itemSingular: string; commerce: boolean; ordersLabel: string }> = {
  ecommerce: { itemLabel: 'Products', itemSingular: 'product', commerce: true, ordersLabel: 'Orders' },
  fashion: { itemLabel: 'Collection', itemSingular: 'piece', commerce: true, ordersLabel: 'Orders' },
  technology: { itemLabel: 'Products', itemSingular: 'product', commerce: true, ordersLabel: 'Orders' },
  automotive: { itemLabel: 'Inventory', itemSingular: 'vehicle', commerce: true, ordersLabel: 'Orders' },
  food: { itemLabel: 'Menu', itemSingular: 'menu item', commerce: false, ordersLabel: 'Orders' },
  'health-beauty': { itemLabel: 'Treatments', itemSingular: 'treatment', commerce: false, ordersLabel: 'Bookings' },
  services: { itemLabel: 'Services', itemSingular: 'service', commerce: false, ordersLabel: 'Bookings' },
  corporate: { itemLabel: 'Expertise', itemSingular: 'expertise area', commerce: false, ordersLabel: 'Engagements' },
  media: { itemLabel: 'Stories', itemSingular: 'story', commerce: false, ordersLabel: 'Orders' },
  portfolio: { itemLabel: 'Projects', itemSingular: 'project', commerce: false, ordersLabel: 'Enquiries' },
  'real-estate': { itemLabel: 'Properties', itemSingular: 'property', commerce: false, ordersLabel: 'Viewings' },
  hospitality: { itemLabel: 'Rooms', itemSingular: 'room', commerce: false, ordersLabel: 'Bookings' },
  education: { itemLabel: 'Programs', itemSingular: 'program', commerce: false, ordersLabel: 'Applications' },
};

interface SiteContextValue {
  details: SiteDetails;
  reload: () => Promise<void>;
  setDetails: (details: SiteDetails) => void;
  config: { itemLabel: string; itemSingular: string; commerce: boolean; ordersLabel: string };
}

const SiteContext = createContext<SiteContextValue | null>(null);

export function useSite() {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error('useSite must be used inside SiteLayout');
  return ctx;
}

export function SiteLayout() {
  const { siteId } = useParams();
  const { user, sites, logout, refresh } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [details, setDetailsState] = useState<SiteDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const config = CATEGORY_CONFIG[details?.site.category || ''] || CATEGORY_CONFIG.ecommerce;

  async function load() {
    if (!siteId) return;
    try {
      const data = await get<SiteDetails>(`/sites/${siteId}`);
      setDetailsState(data);
      setError('');
      document.title = `${data.site.name} · Nexora Studio`;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { setLoading(true); load(); }, [siteId]);
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  async function publish() {
    if (!details) return;
    setPublishing(true);
    try {
      const data = await post<SiteDetails & { publicUrl: string }>(`/sites/${details.site.id}/publish`);
      setDetailsState(data);
      await refresh();
      toast('Your website is live.');
    } catch (err: any) {
      toast(err.message, 'error');
    } finally {
      setPublishing(false);
    }
  }

  const navGroups = [
    {
      label: 'Workspace',
      links: [
        { to: '', label: 'Overview', icon: LayoutDashboard, end: true },
        { to: 'items', label: config.itemLabel, icon: Package },
        ...(config.commerce ? [{ to: 'orders', label: config.ordersLabel, icon: ShoppingBag }] : []),
        { to: 'customers', label: 'Customers', icon: Users },
        { to: 'inbox', label: 'Inbox', icon: Inbox },
        { to: 'media', label: 'Media library', icon: ImageIcon },
      ],
    },
    {
      label: 'Website',
      links: [
        { to: 'design', label: 'Design studio', icon: PenTool },
        { to: 'templates', label: 'Templates', icon: LayoutTemplate },
        { to: 'seo', label: 'SEO', icon: Search },
        { to: 'settings', label: 'Settings', icon: Settings },
      ],
    },
    {
      label: 'Growth',
      links: [
        { to: 'ai', label: 'AI Studio', icon: Bot, accent: true },
        { to: 'billing', label: 'Billing & plan', icon: CreditCard },
      ],
    },
  ];

  if (loading) return <div className="page-loader" style={{ minHeight: '100vh' }}><span className="spinner dark lg" /><p>Opening your workspace…</p></div>;
  if (error || !details || !user) {
    return (
      <div className="page-loader" style={{ minHeight: '100vh' }}>
        <div className="empty-state">
          <h3>We couldn't open that website.</h3>
          <p>{error || 'Please choose a website from your dashboard.'}</p>
          <Link className="btn btn-outline mt-16" to="/dashboard">Back to dashboard</Link>
        </div>
      </div>
    );
  }

  const page = navGroups.flatMap((g) => g.links).find((link) => {
    if (link.to === '') return location.pathname === `/dashboard/${siteId}`;
    return location.pathname.endsWith(`/${link.to}`);
  });

  return (
    <SiteContext.Provider value={{ details, reload: load, setDetails: setDetailsState, config }}>
      <div className="dash-app">
        {sidebarOpen && <div className="sidebar-scrim" onClick={() => setSidebarOpen(false)} />}
        <aside className={`dash-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="side-brand">
            <Logo />
            <button className="side-close" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar"><X size={18} /></button>
          </div>
          <div className="site-switcher">
            <button className="site-switcher-btn" onClick={() => setSwitcherOpen(!switcherOpen)}>
              <span className="site-switcher-avatar">{details.site.name.charAt(0)}</span>
              <span className="site-switcher-copy">
                <b>{details.site.name}</b>
                <small><i className={details.site.status === 'published' ? 'published' : ''} />{details.site.status === 'published' ? 'Published' : 'Draft'} · {details.subscription?.plan || 'starter'}</small>
              </span>
              <ChevronDown size={13} style={{ color: 'var(--muted)' }} />
            </button>
            {switcherOpen && (
              <div className="site-switcher-menu">
                {sites.map((site) => (
                  <Link key={site.id} to={`/dashboard/${site.id}`} className={site.id === details.site.id ? 'active-site' : ''} onClick={() => setSwitcherOpen(false)}>
                    <span className="avatar sm" style={{ background: 'var(--ink)' }}>{site.name.charAt(0)}</span>
                    <span style={{ flex: 1, minWidth: 0 }}><span className="truncate" style={{ display: 'block' }}>{site.name}</span></span>
                    {site.status === 'published' && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#4b9b57' }} />}
                  </Link>
                ))}
                <Link to="/dashboard" onClick={() => setSwitcherOpen(false)}><LayoutDashboard size={13} /> All websites</Link>
                <Link className="new-site" to="/onboarding"><Plus size={13} /> Create a new website</Link>
              </div>
            )}
          </div>

          <nav className="side-nav">
            {navGroups.map((group) => (
              <div key={group.label}>
                <div className="side-section-label">{group.label}</div>
                {group.links.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to ? `/dashboard/${siteId}/${link.to}` : `/dashboard/${siteId}`}
                    end={link.to === ''}
                    className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}
                  >
                    <link.icon size={16} />
                    {link.label}
                    {'accent' in link && link.accent && <Sparkles size={12} className="ai-spark" />}
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>

          <div className="side-footer">
            <div className="side-user">
              <span className="avatar" style={{ background: user.avatarColor }}>{initials(user.name)}</span>
              <div className="side-user-copy"><b>{user.name}</b><small>{user.email}</small></div>
              <button className="side-logout" onClick={() => { logout(); navigate('/'); }} aria-label="Log out"><LogOut size={14} /></button>
            </div>
          </div>
        </aside>

        <div className="dash-main">
          <header className="dash-topbar">
            <div className="topbar-left">
              <button className="topbar-burger" onClick={() => setSidebarOpen(true)} aria-label="Open menu"><Menu size={17} /></button>
              <div className="topbar-crumb">
                <Link to="/dashboard">Websites</Link>
                <span>/</span>
                <b>{details.site.name}</b>
                <span>/</span>
                <span>{page?.label || 'Overview'}</span>
              </div>
              <span className={`badge ${details.site.status}`}>{details.site.status}</span>
            </div>
            <div className="topbar-actions">
              <Link className="topbar-help" to={`/dashboard/${siteId}/ai`}><HelpCircle size={15} /><span>Ask AI</span></Link>
              <div className="topbar-divider" />
              <Link className="btn btn-outline btn-sm topbar-publish" to={`/preview/${details.site.id}`}><ExternalLink size={12} /> Preview</Link>
              {details.site.status === 'published' ? (
                <a className="btn btn-sm topbar-publish" href={`/site/${details.site.slug}`} target="_blank" rel="noreferrer">View live <ArrowUpRight size={13} /></a>
              ) : (
                <button className="btn btn-accent btn-sm topbar-publish" onClick={publish} disabled={publishing}>{publishing ? <span className="spinner" /> : <><Rocket size={12} /> Publish</>}</button>
              )}
              <div className="topbar-divider" />
              <Link to="/dashboard/account" className="topbar-account">
                <span className="avatar" style={{ background: user.avatarColor }}>{initials(user.name)}</span>
              </Link>
            </div>
          </header>
          <main className="dash-content">
            <Outlet context={{ details, reload: load, setDetails: setDetailsState, config } satisfies SiteContextValue} />
          </main>
        </div>
      </div>
    </SiteContext.Provider>
  );
}
