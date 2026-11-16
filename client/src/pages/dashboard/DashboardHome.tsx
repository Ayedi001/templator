import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, ArrowUpRight, Bot, ExternalLink, Globe2, LayoutDashboard,
  LayoutTemplate, LogOut, Plus, Settings, Sparkles,
} from 'lucide-react';
import { Logo } from '../../components/Brand';
import { TemplateMockup } from '../../components/TemplateMockup';
import { useAuth } from '../../context/AuthContext';
import { get, initials, timeAgo } from '../../lib/api';
import type { Template, SiteSummary } from '../../lib/types';

export function DashboardHome() {
  const { user, sites, logout } = useAuth();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);

  useEffect(() => {
    get<{ templates: Template[] }>('/templates').then((data) => setTemplates(data.templates)).catch(() => undefined);
  }, []);

  if (!user) return null;

  const totalItems = sites.reduce((sum, site) => sum + (site.counts?.items || 0), 0);
  const totalOrders = sites.reduce((sum, site) => sum + (site.counts?.orders || 0), 0);
  const published = sites.filter((s) => s.status === 'published').length;
  const templateMap = Object.fromEntries(templates.map((t) => [t.id, t]));

  return (
    <div className="home-page">
      <header className="home-header">
        <Logo />
        <div className="home-header-right">
          <Link className="btn btn-outline btn-sm" to="/templates"><LayoutTemplate size={13} /> Template library</Link>
          <Link to="/dashboard/account" className="topbar-account"><span className="avatar" style={{ background: user.avatarColor }}>{initials(user.name)}</span></Link>
          <button className="icon-btn" onClick={() => { logout(); navigate('/'); }} aria-label="Log out"><LogOut size={15} /></button>
        </div>
      </header>
      <main className="home-content">
        <div className="home-hero">
          <div>
            <div className="eyebrow">Your workspace</div>
            <h1 style={{ marginTop: 10 }}>Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, <em>{user.name.split(' ')[0]}.</em></h1>
            <p>Here is everything you are building. Pick a website to keep going, or start something new.</p>
            <div className="home-summary">
              <div><strong>{sites.length}</strong><span>Websites</span></div>
              <div><strong>{published}</strong><span>Published</span></div>
              <div><strong>{totalItems}</strong><span>Catalogue items</span></div>
              <div><strong>{totalOrders}</strong><span>Orders</span></div>
            </div>
          </div>
          <Link className="btn btn-accent btn-lg" to="/onboarding"><Plus size={16} /> Create a website</Link>
        </div>

        {sites.length === 0 ? (
          <div className="home-empty-cta">
            <span style={{ width: 54, height: 54, borderRadius: 15, background: 'var(--ink)', color: 'var(--lime)', display: 'grid', placeItems: 'center' }}><Sparkles size={24} /></span>
            <h2>Your first website starts here.</h2>
            <p>Tell us about your business, choose from {templates.length || 64} original designs, and let the AI agents prepare your content.</p>
            <Link className="btn btn-accent" to="/onboarding">Start the guided setup <ArrowRight size={15} /></Link>
          </div>
        ) : (
          <div className="websites-grid">
            {sites.map((site) => {
              const template = templateMap[site.templateId];
              return (
                <article className="website-card" key={site.id}>
                  <Link to={`/dashboard/${site.id}`} className="website-card-visual">
                    <span className={`website-card-status badge ${site.status}`}>{site.status === 'published' ? 'Live' : site.status}</span>
                    {template ? <TemplateMockup template={template} showChrome={false} /> : <div className="skeleton" style={{ aspectRatio: '4/3' }} />}
                  </Link>
                  <div className="website-card-body">
                    <div className="website-card-title">
                      <div><h3>{site.name}</h3><span>{site.slug}.nexora.studio</span></div>
                      <span className={`badge ${site.subscriptionStatus}`}>{site.plan}</span>
                    </div>
                    <div className="website-card-meta">
                      <span><b>{site.counts?.items ?? 0}</b> items</span>
                      <span><b>{site.counts?.orders ?? 0}</b> orders</span>
                      <span>Edited <b>{timeAgo(site.updatedAt)}</b></span>
                    </div>
                    <div className="website-card-actions">
                      <Link className="btn btn-sm btn-outline" to={`/dashboard/${site.id}`}><LayoutDashboard size={13} /> Dashboard</Link>
                      {site.status === 'published' ? (
                        <a className="btn btn-sm" href={`/site/${site.slug}`} target="_blank" rel="noreferrer"><ExternalLink size={13} /> View site</a>
                      ) : (
                        <Link className="btn btn-sm" to={`/preview/${site.id}`}>Preview <ArrowUpRight size={13} /></Link>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
            <Link to="/onboarding" className="website-card" style={{ minHeight: 360, display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,.5)', borderStyle: 'dashed' }}>
              <div className="text-center" style={{ padding: 30 }}>
                <span style={{ width: 44, height: 44, borderRadius: '50%', border: '1px solid var(--line-strong)', display: 'grid', placeItems: 'center', margin: '0 auto 14px' }}><Plus size={18} /></span>
                <h3 style={{ fontFamily: 'var(--font-label)', fontSize: 14, fontWeight: 600 }}>Start another website</h3>
                <p className="muted text-xs mt-4">Same account, completely separate workspace.</p>
              </div>
            </Link>
          </div>
        )}

        <div className="home-tools">
          <Link to={sites[0] ? `/dashboard/${sites[0].id}/ai` : '/onboarding'} className="home-tool">
            <span className="home-tool-icon"><Bot size={17} /></span>
            <div><h4>AI Studio</h4><p>Seven specialist agents for content, design and SEO.</p></div>
          </Link>
          <Link to="/templates" className="home-tool">
            <span className="home-tool-icon"><LayoutTemplate size={17} /></span>
            <div><h4>Explore {templates.length || 64} templates</h4><p>Find a design that matches the business you are building.</p></div>
          </Link>
          <Link to="/dashboard/account" className="home-tool">
            <span className="home-tool-icon"><Settings size={17} /></span>
            <div><h4>Account & preferences</h4><p>Update your details, password and workspace settings.</p></div>
          </Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 32, color: 'var(--muted)', fontSize: 10 }}>
          <Globe2 size={13} /> Websites publish to your unique Nexora address. Custom domains are available on Growth and Scale plans.
        </div>
      </main>
    </div>
  );
}
