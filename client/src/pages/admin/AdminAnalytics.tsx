import { useEffect, useState } from 'react';
import { BarChart3, Bot, Globe2, LayoutTemplate, TrendingUp } from 'lucide-react';
import { get, formatMoney } from '../../lib/api';

interface Analytics {
  websiteCategories: { category: string; n: number }[];
  templateUsage: { id: string; name: string; uses: number; category: string; featured: number; enabled: number }[];
  aiByAgent: { agent: string; n: number }[];
  siteRevenue: { name: string; slug: string; revenue: number; orders: number }[];
  signups: { date: string; users: number }[];
}

export function AdminAnalytics() {
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => { get<Analytics>('/admin/analytics').then(setData).catch(() => undefined); }, []);
  if (!data) return <div className="page-loader"><span className="spinner dark lg" /><p>Crunching the numbers…</p></div>;

  const maxCategory = Math.max(...data.websiteCategories.map((c) => c.n), 1);
  const maxTemplate = Math.max(...data.templateUsage.map((t) => t.uses), 1);
  const maxAi = Math.max(...data.aiByAgent.map((a) => a.n), 1);
  const totalUsers = data.signups.reduce((sum, d) => sum + d.users, 0);
  const revenueTotal = data.siteRevenue.reduce((sum, s) => sum + s.revenue, 0);
  const ordersTotal = data.siteRevenue.reduce((sum, s) => sum + s.orders, 0);
  const width = 700;
  const height = 200;
  const maxSignup = Math.max(...data.signups.map((s) => s.users), 1);
  const points = data.signups.map((d, i) => [(i / Math.max(data.signups.length - 1, 1)) * width, height - 20 - (d.users / maxSignup) * (height - 50)] as [number, number]);
  const path = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');

  return (
    <>
      <div className="admin-page-head">
        <div><div className="eyebrow">Insight</div><h1>Platform analytics</h1><p>Growth, revenue concentration and which designs are earning their place.</p></div>
      </div>
      <div className="admin-metric-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <div className="admin-metric"><span><TrendingUp size={11} /> New businesses · 30d</span><b>{totalUsers}</b><small>Signups across the platform</small></div>
        <div className="admin-metric"><span><Globe2 size={11} /> Sites by category</span><b>{data.websiteCategories.reduce((s, c) => s + c.n, 0)}</b><small>{data.websiteCategories.length} categories in use</small></div>
        <div className="admin-metric"><span><BarChart3 size={11} /> Tenant GMV</span><b>{formatMoney(revenueTotal)}</b><small>{ordersTotal} orders</small></div>
        <div className="admin-metric"><span><LayoutTemplate size={11} /> Most-used design</span><b style={{ fontSize: 17, marginTop: 10 }}>{data.templateUsage[0]?.name || '—'}</b><small>{data.templateUsage[0]?.uses || 0} websites</small></div>
      </div>
      <div className="admin-grid">
        <section className="admin-panel">
          <div className="admin-panel-head"><h3>New businesses · last 30 days</h3><span className="text-xs muted">Daily signups</span></div>
          <div className="admin-panel-body admin-chart">
            <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
              <defs><linearGradient id="analyticsFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2f5bff" stopOpacity=".18" /><stop offset="100%" stopColor="#2f5bff" stopOpacity="0" /></linearGradient></defs>
              {[0, 1, 2, 3].map((i) => <line key={i} x1="0" x2={width} y1={20 + i * 48} y2={20 + i * 48} stroke="rgba(23,20,17,.07)" strokeDasharray="3 4" />)}
              <path d={`${path} L${width} ${height} L0 ${height} Z`} fill="url(#analyticsFill)" />
              <path d={path} fill="none" stroke="#2f5bff" strokeWidth="2" />
            </svg>
            <div className="flex-between" style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--muted)' }}><span>{new Date(data.signups[0].date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span><span>{new Date(data.signups[data.signups.length - 1].date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span></div>
          </div>
        </section>
        <section className="admin-panel">
          <div className="admin-panel-head"><h3>Websites by industry</h3><span className="text-xs muted">Tenant distribution</span></div>
          <div className="admin-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.websiteCategories.map((cat) => (
              <div key={cat.category}>
                <div className="flex-between text-xs" style={{ marginBottom: 4 }}><span style={{ textTransform: 'capitalize', fontFamily: 'var(--font-label)' }}>{cat.category.replace(/-/g, ' ')}</span><span className="muted">{cat.n}</span></div>
                <div className="usage-bar"><i style={{ width: `${(cat.n / maxCategory) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="admin-grid">
        <section className="admin-panel">
          <div className="admin-panel-head"><h3>Template performance</h3><span className="text-xs muted">Lifetime builds</span></div>
          <div className="admin-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            {data.templateUsage.map((template) => (
              <div key={template.id}>
                <div className="flex-between text-xs" style={{ marginBottom: 4 }}><span style={{ fontFamily: 'var(--font-label)' }}>{template.name} {template.featured ? '· featured' : ''}</span><span className="muted">{template.uses} sites</span></div>
                <div className="usage-bar"><i style={{ width: `${(template.uses / maxTemplate) * 100}%`, background: template.featured ? 'var(--accent)' : 'var(--ink)' }} /></div>
              </div>
            ))}
          </div>
        </section>
        <section className="admin-panel">
          <div className="admin-panel-head"><h3><Bot size={12} /> AI usage by agent</h3><span className="text-xs muted">Last 30 days</span></div>
          <div className="admin-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            {data.aiByAgent.map((agent) => (
              <div key={agent.agent}>
                <div className="flex-between text-xs" style={{ marginBottom: 4 }}><span style={{ fontFamily: 'var(--font-label)' }}>{agent.agent}</span><span className="muted">{agent.n} calls</span></div>
                <div className="usage-bar"><i style={{ width: `${(agent.n / maxAi) * 100}%`, background: 'var(--accent)' }} /></div>
              </div>
            ))}
            {data.aiByAgent.length === 0 && <p className="muted text-xs">No agent usage yet.</p>}
          </div>
        </section>
      </div>

      <section className="admin-panel mt-12">
        <div className="admin-panel-head"><h3>Revenue by website</h3><span className="text-xs muted">Top tenants</span></div>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Website</th><th>Orders</th><th>Revenue</th><th>Share</th></tr></thead>
            <tbody>
              {data.siteRevenue.map((site) => (
                <tr key={site.slug}>
                  <td><b style={{ fontSize: 11.5, fontWeight: 500 }}>{site.name}</b><span className="text-xs muted" style={{ display: 'block' }}>{site.slug}.nexora.studio</span></td>
                  <td><span className="text-xs">{site.orders}</span></td>
                  <td><span className="order-total">{formatMoney(site.revenue)}</span></td>
                  <td><div className="usage-bar" style={{ width: 150 }}><i style={{ width: `${revenueTotal ? (site.revenue / revenueTotal) * 100 : 0}%` }} /></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
