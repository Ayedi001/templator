import { useEffect, useMemo, useState } from 'react';
import { CreditCard, Search, TrendingUp } from 'lucide-react';
import { StatusBadge } from '../../components/UI';
import { useToast } from '../../context/ToastContext';
import { formatDate, get, patch } from '../../lib/api';
import type { Plan } from '../../lib/types';

interface Sub {
  id: string; site_id: string; plan: string; status: string; ai_limit: number; ai_used: number;
  product_limit: number; renews_at?: string; created_at: string; site_name: string; slug: string;
  owner_name: string; owner_email: string; mrr: number;
}

export function AdminSubscriptions() {
  const { toast } = useToast();
  const [subs, setSubs] = useState<Sub[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');

  async function load() {
    try {
      const data = await get<{ subscriptions: Sub[]; plans: Plan[] }>('/admin/subscriptions');
      setSubs(data.subscriptions);
      setPlans(data.plans);
    } catch (err: any) { toast(err.message, 'error'); }
  }
  useEffect(() => { load(); }, []);

  async function update(sub: Sub, updates: { plan?: string; status?: string }) {
    try {
      await patch(`/admin/subscriptions/${sub.id}`, updates);
      await load();
      toast('Subscription updated.');
    } catch (err: any) { toast(err.message, 'error'); }
  }

  const filtered = useMemo(() => subs.filter((s) => {
    const matchesSearch = !search || `${s.site_name} ${s.owner_name} ${s.owner_email}`.toLowerCase().includes(search.toLowerCase());
    const matchesPlan = planFilter === 'all' || s.plan === planFilter;
    return matchesSearch && matchesPlan;
  }), [subs, search, planFilter]);

  const mrr = subs.filter((s) => ['active', 'trialing'].includes(s.status)).reduce((sum, s) => sum + s.mrr, 0);
  const active = subs.filter((s) => ['active', 'trialing'].includes(s.status)).length;

  return (
    <>
      <div className="admin-page-head">
        <div><div className="eyebrow">Revenue</div><h1>Subscriptions</h1><p>Plan assignment, account status and monthly recurring revenue across every tenant.</p></div>
        <span className="badge verified"><CreditCard size={10} /> Demo billing</span>
      </div>
      <div className="admin-metric-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <div className="admin-metric"><span><TrendingUp size={11} /> MRR</span><b>${mrr}</b><small>Active & trialing</small></div>
        <div className="admin-metric"><span><CreditCard size={11} /> Subscriptions</span><b>{subs.length}</b><small>{active} active</small></div>
        <div className="admin-metric"><span>Avg. plan value</span><b>${active ? Math.round(mrr / active) : 0}</b><small>Per active site</small></div>
        <div className="admin-metric"><span>Paused / cancelled</span><b>{subs.filter((s) => ['paused', 'cancelled'].includes(s.status)).length}</b><small>Not billing</small></div>
      </div>
      <div className="admin-table-toolbar">
        <div className="filter-tabs">
          <button className={planFilter === 'all' ? 'active' : ''} onClick={() => setPlanFilter('all')}>All plans</button>
          {plans.map((plan) => <button key={plan.id} className={planFilter === plan.id ? 'active' : ''} onClick={() => setPlanFilter(plan.id!)}>{plan.name}</button>)}
        </div>
        <label className="search-box"><Search size={14} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search subscriptions…" /></label>
      </div>
      <div className="admin-panel">
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Website</th><th>Owner</th><th>Plan</th><th>MRR</th><th>AI usage</th><th>Status</th><th>Renews</th></tr></thead>
            <tbody>
              {filtered.map((sub) => (
                <tr key={sub.id}>
                  <td><div><b style={{ fontSize: 11.5, fontWeight: 500 }}>{sub.site_name}</b><span className="text-xs muted" style={{ display: 'block' }}>{sub.slug}.nexora.studio</span></div></td>
                  <td><div><b style={{ fontSize: 11, fontWeight: 500 }}>{sub.owner_name}</b><span className="text-xs muted" style={{ display: 'block' }}>{sub.owner_email}</span></div></td>
                  <td><select className="status-select" value={sub.plan} onChange={(e) => update(sub, { plan: e.target.value })}>{['starter', 'growth', 'scale'].map((p) => <option key={p} value={p}>{p}</option>)}</select></td>
                  <td><span className="order-total">${sub.mrr}</span></td>
                  <td><span className="text-xs">{sub.ai_used} / {sub.ai_limit}</span></td>
                  <td><select className="status-select" value={sub.status} onChange={(e) => update(sub, { status: e.target.value })}>{['active', 'trialing', 'paused', 'cancelled'].map((s) => <option key={s} value={s}>{s}</option>)}</select></td>
                  <td><span className="text-xs">{formatDate(sub.renews_at)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
