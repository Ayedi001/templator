import { useEffect, useMemo, useState } from 'react';
import { Mail, Search, Users } from 'lucide-react';
import { useSite } from '../../components/dashboard/SiteLayout';
import { EmptyState, PageHeader } from '../../components/UI';
import { useToast } from '../../context/ToastContext';
import { formatMoney, get } from '../../lib/api';
import type { Customer } from '../../lib/types';

export function SiteCustomers() {
  const { details } = useSite();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    get<{ customers: Customer[] }>(`/sites/${details.site.id}/customers`)
      .then((data) => setCustomers(data.customers))
      .catch((err) => toast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [details.site.id]);

  const filtered = useMemo(() => customers.filter((customer) => !search || `${customer.name} ${customer.email}`.toLowerCase().includes(search.toLowerCase())), [customers, search]);
  const totalSpent = customers.reduce((sum, c) => sum + c.total_spent_cents, 0);
  const totalOrders = customers.reduce((sum, c) => sum + c.orders_count, 0);

  return (
    <>
      <PageHeader eyebrow="Relationships" title="Customers" description="Everyone who has ordered from or enquired through your website. Your customer data is isolated to this website." />
      <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="metric-card"><div className="metric-label">Customers</div><div className="metric-value">{customers.length}</div><div className="metric-foot">In this workspace</div></div>
        <div className="metric-card"><div className="metric-label">Lifetime value</div><div className="metric-value">{formatMoney(totalSpent)}</div><div className="metric-foot">Across all customers</div></div>
        <div className="metric-card"><div className="metric-label">Orders placed</div><div className="metric-value">{totalOrders}</div><div className="metric-foot">Repeat and first-time</div></div>
      </div>
      <div className="toolbar">
        <div />
        <label className="search-box"><Search size={14} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customers…" /></label>
      </div>
      <div className="panel">
        {loading ? <div style={{ padding: 26 }} className="skeleton" /> : filtered.length === 0 ? (
          <EmptyState icon={<Users size={22} />} title={customers.length ? 'No customers match.' : 'No customers yet.'} description={customers.length ? 'Try a different search.' : 'Customers are added automatically when someone orders or enquires through your published website.'} />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Customer</th><th>Phone</th><th>Orders</th><th>Total spent</th><th>First seen</th><th></th></tr></thead>
              <tbody>
                {filtered.map((customer) => (
                  <tr key={customer.id}>
                    <td><div className="order-customer"><span className="avatar" style={{ background: 'var(--ink)' }}>{customer.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}</span><div><b>{customer.name}</b><span>{customer.email}</span></div></div></td>
                    <td><span className="text-xs">{customer.phone || '—'}</span></td>
                    <td><span className="text-xs">{customer.orders_count}</span></td>
                    <td><span className="order-total">{formatMoney(customer.total_spent_cents)}</span></td>
                    <td><span className="text-xs">{new Date(customer.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span></td>
                    <td><a className="icon-btn" href={`mailto:${customer.email}`} aria-label={`Email ${customer.name}`}><Mail size={13} /></a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
