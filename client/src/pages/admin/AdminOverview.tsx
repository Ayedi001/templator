import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, ArrowUpRight, Bot, Building2, CreditCard, Globe2, LayoutTemplate,
  Plus, TrendingUp, Users, Zap,
} from 'lucide-react';
import { get, timeAgo } from '../../lib/api';
import { StatusBadge } from '../../components/UI';

interface Overview {
  counts: { users: number; admins: number; sites: number; published: number; drafts: number; templates: number; orders: number; gmv: number; aiCalls: number; inquiries: number; mrr: number };
  subscriptions: { plan: string; status: string; n: number }[];
  chart: { date: string; label: string; users: number; sites: number; orders: number }[];
  latestUsers: { id: string; name: string; email: string; role: string; status: string; sitesCount: number; createdAt: string }[];
  latestSites: { id: string; name: string; slug: string; status: string; category: string; created_at: string; owner_name: string; template_name: string }[];
  activity: { id: string; action: string; detail: string; created_at: string; user_name?: string; site_name?: string }[];
}

export function AdminOverview() {
  const [data, setData] = useState<Overview | null>(null);

  useEffect(() => {
    get<Overview>('/admin/overview').then(setData).catch(() => undefined);
  }, []);

  if (!data) return <div className="page-loader"><span className="spinner dark lg" /><p>Reading platform data…</p></div>;
  const { counts } = data;
  const planCounts = data.subscriptions.reduce((acc, row) => { acc[row.plan] = (acc[row.plan] || 0) + row.n; return acc; }, {} as Record<string, number>);
  const chartMax = Math.max(...data.chart.map((d) => Math.max(d.users * 8, d.orders * 4, 10)), 10);
  const width = 620;
  const height = 200;
  const points = data.chart.map((d, i) => [ (i / Math.max(data.chart.length - 1, 1)) * width, height - 20 - (d.users / chartMax) * (height - 50) ] as [number, number]);
  const path = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');

  return (
    <>
      <div className="admin-page-head">
        <div><div className="eyebrow">Super admin</div><h1>Platform overview</h1><p>All tenants, all websites, all activity — one calm control room.</p></div>
        <div className="flex-center gap-8">
          <Link className="btn btn-outline btn-sm" to="/admin/templates"><LayoutTemplate size={13} /> Template library</Link>
          <Link className="btn btn-sm" to="/admin/settings"><Plus size={13} /> Platform settings</Link>
        </div>
      </div>

      <div className="admin-metric-grid">
        <div className="admin-metric"><span><Users size={11} /> Business owners</span><b>{counts.users}</b><small>{counts.admins} platform admin</small></div>
        <div className="admin-metric"><span><Globe2 size={11} /> Websites</span><b>{counts.sites}</b><small>{counts.published} live · {counts.drafts} drafts</small></div>
        <div className="admin-metric"><span><CreditCard size={11} /> MRR</span><b>${counts.mrr.toLocaleString()}</b><small>Active & trialing</small></div>
        <div className="admin-metric"><span><Zap size={11} /> AI actions</span><b>{counts.aiCalls}</b><small>This month</small></div>
        <div className="admin-metric"><span><TrendingUp size={11} /> GMV tracked</span><b>${Math.round(counts.gmv / 100).toLocaleString()}</b><small>{counts.orders} orders</small></div>
      </div>

      <div className="admin-grid">
        <section className="admin-panel">
          <div className="admin-panel-head"><h3>Growth · last 14 days</h3><Link to="/admin/analytics">Full analytics <ArrowUpRight size={11} /></Link></div>
          <div className="admin-panel-body admin-chart">
            <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
              <defs><linearGradient id="adminFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e8613a" stopOpacity=".2" /><stop offset="100%" stopColor="#e8613a" stopOpacity="0" /></linearGradient></defs>
              {[0, 1, 2, 3].map((i) => <line key={i} x1="0" x2={width} y1={20 + i * 48} y2={20 + i * 48} stroke="rgba(23,20,17,.07)" strokeDasharray="3 4" />)}
              <path d={`${path} L${width} ${height} L0 ${height} Z`} fill="url(#adminFill)" />
              <path d={path} fill="none" stroke="#e8613a" strokeWidth="2" />
              {data.chart.map((d, i) => <rect key={d.date} x={(i / data.chart.length) * width + 9} y={height - 18 - (d.orders / chartMax) * 80} width="5" height={(d.orders / chartMax) * 80} rx="1" fill="rgba(23,20,17,.18)" />)}
              {points.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.3" fill="#fff" stroke="#e8613a" strokeWidth="1.5" />)}
            </svg>
            <div className="flex-between mt-8" style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--muted)' }}>
              {data.chart.filter((_, i) => i % 3 === 0 || i === data.chart.length - 1).map((d) => <span key={d.date}>{d.label}</span>)}
            </div>
            <div className="flex-center gap-16 mt-12 text-xs muted"><span className="flex-center gap-5"><i style={{ width: 14, height: 2, background: '#e8613a', display: 'inline-block' }} /> New businesses</span><span className="flex-center gap-5"><i style={{ width: 6, height: 10, background: 'rgba(23,20,17,.2)', display: 'inline-block' }} /> Orders</span></div>
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel-head"><h3>Latest activity</h3><Link to="/admin/activity">View log</Link></div>
          <div className="admin-panel-body">
            <div className="admin-activity">
              {data.activity.slice(0, 7).map((item) => (
                <div className="admin-activity-row" key={item.id}>
                  <span className="admin-activity-icon"><Activity size={11} /></span>
                  <div style={{ flex: 1 }}><p>{item.detail}</p><span>{item.user_name || 'System'} · {timeAgo(item.created_at)}</span></div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="admin-grid">
        <section className="admin-panel">
          <div className="admin-panel-head"><h3>Latest businesses</h3><Link to="/admin/users">All businesses</Link></div>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Business</th><th>Sites</th><th>Status</th><th>Joined</th></tr></thead>
              <tbody>
                {data.latestUsers.map((user) => (
                  <tr key={user.id}>
                    <td><div className="order-customer"><span className="avatar sm" style={{ background: 'var(--ink)' }}>{user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}</span><div><b>{user.name}</b><span>{user.email}</span></div></div></td>
                    <td><span className="text-xs">{user.sitesCount}</span></td>
                    <td><StatusBadge status={user.status} /></td>
                    <td><span className="text-xs">{timeAgo(user.createdAt)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel-head"><h3>Newest websites</h3><Link to="/admin/sites">All websites</Link></div>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Website</th><th>Owner</th><th>Status</th></tr></thead>
              <tbody>
                {data.latestSites.map((site) => (
                  <tr key={site.id}>
                    <td><div><b style={{ fontSize: 11.5, fontWeight: 500 }}>{site.name}</b><span className="text-xs muted" style={{ display: 'block' }}>{site.slug} · {site.template_name}</span></div></td>
                    <td><span className="text-xs">{site.owner_name}</span></td>
                    <td><StatusBadge status={site.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div className="admin-grid" style={{ marginTop: 12 }}>
        <section className="admin-panel">
          <div className="admin-panel-head"><h3>Plan distribution</h3><Link to="/admin/subscriptions">Manage</Link></div>
          <div className="admin-panel-body" style={{ display: 'flex', gap: 12 }}>
            {['starter', 'growth', 'scale'].map((plan) => (
              <div key={plan} style={{ flex: 1, padding: 14, border: '1px solid var(--line)', borderRadius: 10, background: 'var(--cream)' }}>
                <div className="label" style={{ fontSize: 8 }}>{plan}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, marginTop: 6 }}>{planCounts[plan] || 0}</div>
                <div className="text-xs muted">{plan === 'starter' ? '$19' : plan === 'growth' ? '$49' : '$99'} / month</div>
              </div>
            ))}
          </div>
        </section>
        <section className="admin-panel">
          <div className="admin-panel-head"><h3>Quick actions</h3><Bot size={13} style={{ color: 'var(--accent-dark)' }} /></div>
          <div className="admin-panel-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
            <Link className="quick-action" to="/admin/users"><Users size={13} /> Manage businesses</Link>
            <Link className="quick-action" to="/admin/sites"><Globe2 size={13} /> Review websites</Link>
            <Link className="quick-action" to="/admin/templates"><LayoutTemplate size={13} /> Add a template</Link>
            <Link className="quick-action" to="/admin/ai"><Bot size={13} /> AI configuration</Link>
          </div>
        </section>
      </div>
    </>
  );
}
