import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, ArrowUpRight, Bot, CheckCircle2, Eye, FileText, Image as ImageIcon,
  Inbox, LayoutDashboard, Package, PenTool, Plus, Rocket, Search, Settings,
  ShoppingBag, Sparkles, TrendingUp, Users,
} from 'lucide-react';
import { useSite } from '../../components/dashboard/SiteLayout';
import { PageLoader, StatusBadge } from '../../components/UI';
import { formatDate, formatMoney, formatNumber, timeAgo } from '../../lib/api';
import type { Order } from '../../lib/types';
import { get } from '../../lib/api';

interface OverviewData {
  stats: {
    revenue: number; orders: number; paidOrders: number; pendingOrders: number;
    customers: number; items: number; newInquiries: number; aiUsed: number;
    visits: number; conversion: number;
  };
  recentOrders: Order[];
  activity: { id: string; action: string; detail: string; created_at: string }[];
  topItems: { id: string; name: string; images: string[]; price_cents: number; stock: number }[];
  chart: { date: string; label: string; revenue: number; orders: number; visits: number; inquiries: number }[];
  limits: any;
}

const ACTION_ICONS: Record<string, any> = {
  'site.created': LayoutDashboard,
  'site.published': Rocket,
  'site.unpublished': Globe,
  'item.created': Package,
  'item.updated': Package,
  'order.status_changed': ShoppingBag,
  'order.created': ShoppingBag,
  'template.applied': LayoutDashboard,
  'seo.updated': Search,
  'media.uploaded': ImageIcon,
  'design.updated': PenTool,
  'settings.updated': Settings,
  'billing.plan_changed': TrendingUp,
};

function Globe(props: any) { return <Rocket {...props} />; }

export function SiteOverview() {
  const { details, config } = useSite();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<'7' | '14'>('14');

  useEffect(() => {
    get<OverviewData>(`/sites/${details.site.id}/overview`)
      .then(setData)
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [details.site.id]);

  const chart = useMemo(() => {
    if (!data) return [];
    return range === '7' ? data.chart.slice(-7) : data.chart;
  }, [data, range]);

  if (loading || !data) return <PageLoader label="Loading your numbers" />;

  const { site, template } = details;
  const useRevenue = config.commerce;
  const metricMax = Math.max(...data.chart.map((d) => (useRevenue ? d.revenue : d.visits)), 1);
  const values = chart.map((d) => (useRevenue ? d.revenue : d.visits));
  const max = Math.max(...values, 1);
  const width = 620;
  const height = 190;
  const points = values.map((value, i) => {
    const x = (i / Math.max(values.length - 1, 1)) * width;
    const y = height - 20 - (value / max) * (height - 40);
    return [x, y];
  });
  const line = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const area = `${line} L${width} ${height} L0 ${height} Z`;

  const metrics = useRevenue ? [
    { label: 'Revenue', value: formatMoney(data.stats.revenue), foot: `${data.stats.paidOrders} paid orders`, icon: TrendingUp },
    { label: 'Orders', value: formatNumber(data.stats.orders), foot: `${data.stats.pendingOrders} need attention`, icon: ShoppingBag },
    { label: 'Visitors · 30d', value: formatNumber(data.stats.visits), foot: `Across all pages`, icon: Eye },
    { label: 'Conversion', value: `${data.stats.conversion}%`, foot: 'Visitors → orders', icon: Users },
  ] : [
    { label: 'New enquiries', value: formatNumber(data.stats.newInquiries), foot: 'Waiting in your inbox', icon: Inbox },
    { label: 'Visitors · 30d', value: formatNumber(data.stats.visits), foot: 'Across all pages', icon: Eye },
    { label: config.itemLabel, value: formatNumber(data.stats.items), foot: 'Published and draft', icon: Package },
    { label: 'Customers', value: formatNumber(data.stats.customers), foot: 'In your workspace', icon: Users },
  ];

  const checklist = [
    { label: 'Add your business details', done: Boolean(site.description && site.settings.business?.email), to: 'settings' },
    { label: `Add your first ${config.itemSingular}`, done: data.stats.items > 0, to: 'items' },
    { label: 'Customise the design', done: Boolean(site.content?.hero?.headline), to: 'design' },
    { label: 'Complete your SEO settings', done: Boolean(site.settings.seo?.description), to: 'seo' },
    { label: 'Publish your website', done: site.status === 'published', to: 'settings' },
  ];
  const pendingChecklist = checklist.filter((item) => !item.done);

  return (
    <>
      <div className="dash-page-head">
        <div>
          <div className="eyebrow">Overview</div>
          <h1>Good to see you.</h1>
          <p>Here is how {site.name} is doing. Your workspace is private to this website.</p>
        </div>
        <div className="dash-page-actions">
          <Link className="btn btn-outline btn-sm" to={`/dashboard/${site.id}/design`}><PenTool size={13} /> Design studio</Link>
          <Link className="btn btn-sm" to={`/dashboard/${site.id}/ai`}><Sparkles size={13} /> Ask AI</Link>
        </div>
      </div>

      <section className="site-welcome">
        <div className="site-welcome-copy">
          <div className="eyebrow">{site.status === 'published' ? 'Your website is live' : 'Your website is ready to launch'}</div>
          <h2>{site.name}</h2>
          <p>{site.description || template?.description}</p>
          <div className="site-welcome-actions">
            {site.status === 'published' ? (
              <a className="btn btn-sm btn-light" href={`/site/${site.slug}`} target="_blank" rel="noreferrer">Visit live site <ArrowUpRight size={13} /></a>
            ) : (
              <Link className="btn btn-sm btn-light" to={`/preview/${site.id}`}>Preview website <ArrowRight size={13} /></Link>
            )}
            <Link className="btn btn-sm btn-outline" to={`/dashboard/${site.id}/design`}>Edit design</Link>
            <Link className="btn btn-sm btn-outline" to={`/dashboard/${site.id}/ai`}>Open AI Studio</Link>
          </div>
        </div>
        <div className="site-welcome-meta">
          <div><strong>{data.stats.visits}</strong><span>Visitors / 30d</span></div>
          <div><strong>{data.stats.items}</strong><span>{config.itemLabel}</span></div>
          <div><strong>{details.subscription?.ai_used || 0}</strong><span>AI actions</span></div>
        </div>
      </section>

      <div className="metric-grid">
        {metrics.map((metric) => (
          <div className="metric-card" key={metric.label}>
            <div className="metric-label"><span>{metric.label}</span><metric.icon size={14} /></div>
            <div className="metric-value">{metric.value}</div>
            <div className="metric-foot">{metric.foot}</div>
          </div>
        ))}
      </div>

      <div className="overview-grid">
        <section className="chart-panel">
          <div className="chart-panel-head">
            <div><h3>{useRevenue ? 'Revenue overview' : 'Website traffic'}</h3><p>{useRevenue ? 'Paid orders, net of refunds' : 'Page views across your website'}</p></div>
            <div className="segmented">
              <button className={range === '7' ? 'active' : ''} onClick={() => setRange('7')}>7d</button>
              <button className={range === '14' ? 'active' : ''} onClick={() => setRange('14')}>14d</button>
            </div>
          </div>
          <div className="chart-area">
            <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
              <defs>
                <linearGradient id="overviewFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={useRevenue ? '#e8613a' : '#2f5bff'} stopOpacity=".18" />
                  <stop offset="100%" stopColor={useRevenue ? '#e8613a' : '#2f5bff'} stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0, 1, 2, 3].map((i) => <line key={i} x1="0" x2={width} y1={20 + i * 45} y2={20 + i * 45} stroke="rgba(23,20,17,.07)" strokeDasharray="3 4" />)}
              <path d={area} fill="url(#overviewFill)" />
              <path d={line} fill="none" stroke={useRevenue ? '#e8613a' : '#2f5bff'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              {points.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.7" fill="#fff" stroke={useRevenue ? '#e8613a' : '#2f5bff'} strokeWidth="1.7" />)}
            </svg>
          </div>
          <div className="chart-tooltip-note">
            {chart.map((day, i) => (i % 2 === 0 || i === chart.length - 1) ? <span key={day.date}>{day.label} {new Date(day.date).getDate()}</span> : <span key={day.date} />)}
          </div>
        </section>

        <section className="activity-panel">
          <div className="dash-section-title"><h2 style={{ fontSize: 12.5 }}>Recent activity</h2><Link to={`/dashboard/${site.id}/inbox`}>View all <ArrowUpRight size={12} /></Link></div>
          <div className="activity-list">
            {data.activity.slice(0, 6).map((item) => {
              const Icon = ACTION_ICONS[item.action] || FileText;
              return (
                <div className="activity-item" key={item.id}>
                  <span className="activity-icon"><Icon size={13} /></span>
                  <div><p>{item.detail}</p><span>{timeAgo(item.created_at)}</span></div>
                </div>
              );
            })}
            {data.activity.length === 0 && <p className="muted text-xs">Your activity will appear here as you build.</p>}
          </div>
        </section>
      </div>

      <div className="overview-lower">
        <section className="panel">
          <div className="panel-mini-head"><h3>{config.commerce ? 'Recent orders' : 'Recent enquiries'}</h3><Link to={config.commerce ? `/dashboard/${site.id}/orders` : `/dashboard/${site.id}/inbox`}>View all <ArrowRight size={12} /></Link></div>
          <div className="table-wrap">
            {config.commerce ? (
              <table className="data-table">
                <thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead>
                <tbody>
                  {data.recentOrders.slice(0, 5).map((order) => (
                    <tr key={order.id}>
                      <td><span className="order-number">{order.number}</span><div className="text-xs muted">{formatDate(order.created_at)}</div></td>
                      <td><div className="order-customer"><span className="avatar sm" style={{ background: 'var(--ink)' }}>{order.customer_name.split(' ').map((n) => n[0]).join('').slice(0, 2)}</span><div><b>{order.customer_name}</b><span>{order.customer_email}</span></div></div></td>
                      <td><span className="order-total">{formatMoney(order.total_cents)}</span></td>
                      <td><StatusBadge status={order.status} /></td>
                    </tr>
                  ))}
                  {data.recentOrders.length === 0 && <tr><td colSpan={4} className="table-empty">No orders yet. Share your site to get the first one.</td></tr>}
                </tbody>
              </table>
            ) : (
              <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {data.stats.newInquiries > 0 ? (
                  <>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}><span className="activity-icon"><Inbox size={14} /></span><div><p style={{ fontSize: 12 }}><b>{data.stats.newInquiries} new {data.stats.newInquiries === 1 ? 'enquiry' : 'enquiries'}</b> waiting for a reply.</p><Link className="text-link mt-8" style={{ fontSize: 10 }} to={`/dashboard/${site.id}/inbox`}>Open inbox <ArrowRight size={12} /></Link></div></div>
                    <div className="divider" />
                  </>
                ) : (
                  <p className="muted text-xs">Enquiries and bookings from your website will appear in your inbox.</p>
                )}
                <Link className="btn btn-outline btn-sm" to={`/dashboard/${site.id}/inbox`}><Inbox size={13} /> Open inbox</Link>
              </div>
            )}
          </div>
        </section>

        <section className="panel">
          <div className="panel-mini-head"><h3>Quick actions</h3><Sparkles size={13} style={{ color: 'var(--accent-dark)' }} /></div>
          <div className="quick-actions">
            <Link className="quick-action" to={`/dashboard/${site.id}/items`}><Plus size={14} /> Add {config.itemSingular}</Link>
            <Link className="quick-action" to={`/dashboard/${site.id}/design`}><PenTool size={14} /> Edit design</Link>
            {config.commerce ? <Link className="quick-action" to={`/dashboard/${site.id}/orders`}><ShoppingBag size={14} /> Manage orders</Link> : <Link className="quick-action" to={`/dashboard/${site.id}/inbox`}><Inbox size={14} /> Check inbox</Link>}
            <Link className="quick-action" to={`/dashboard/${site.id}/ai`}><Bot size={14} /> Ask the agents</Link>
            <Link className="quick-action" to={`/dashboard/${site.id}/seo`}><Search size={14} /> Run SEO audit</Link>
            <Link className="quick-action" to={`/dashboard/${site.id}/settings`}><Settings size={14} /> Website settings</Link>
          </div>
        </section>
      </div>

      {pendingChecklist.length > 0 && (
        <section className="panel mt-24">
          <div className="panel-mini-head"><h3>Finish setting up {site.name}</h3><span className="text-xs muted">{checklist.length - pendingChecklist.length}/{checklist.length} complete</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 0 }}>
            {checklist.map((item) => (
              <Link key={item.label} to={`/dashboard/${site.id}/${item.to}`} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '16px 20px', borderRight: '1px solid var(--line)', borderTop: '1px solid var(--line)' }}>
                {item.done ? <CheckCircle2 size={15} style={{ color: '#3a8b4a', flex: 'none' }} /> : <span style={{ width: 15, height: 15, border: '1px solid var(--line-strong)', borderRadius: '50%', flex: 'none' }} />}
                <span style={{ fontSize: 10.5, color: item.done ? 'var(--muted)' : 'var(--ink-soft)', textDecoration: item.done ? 'line-through' : 'none' }}>{item.label}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
