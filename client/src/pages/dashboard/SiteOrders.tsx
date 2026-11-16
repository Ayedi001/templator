import { useEffect, useMemo, useState } from 'react';
import { Download, Eye, PackageCheck, Search, ShoppingBag } from 'lucide-react';
import { useSite } from '../../components/dashboard/SiteLayout';
import { Modal } from '../../components/Modal';
import { EmptyState, PageHeader, StatusBadge } from '../../components/UI';
import { useToast } from '../../context/ToastContext';
import { formatDate, formatMoney, get, patch } from '../../lib/api';
import type { Order } from '../../lib/types';

const STATUSES = ['pending', 'processing', 'shipped', 'completed', 'cancelled', 'refunded'];

export function SiteOrders() {
  const { details } = useSite();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Order | null>(null);
  const [updating, setUpdating] = useState(false);

  async function load() {
    try {
      const data = await get<{ orders: Order[] }>(`/sites/${details.site.id}/orders`);
      setOrders(data.orders);
    } catch (err: any) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [details.site.id]);

  const filtered = useMemo(() => orders.filter((order) => {
    const matchesStatus = status === 'all' || order.status === status;
    const matchesSearch = !search || `${order.number} ${order.customer_name} ${order.customer_email}`.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  }), [orders, status, search]);

  const stats = useMemo(() => ({
    total: orders.filter((o) => !['cancelled', 'refunded'].includes(o.status)).reduce((sum, o) => sum + o.total_cents, 0),
    count: orders.length,
    pending: orders.filter((o) => ['pending', 'processing'].includes(o.status)).length,
  }), [orders]);

  async function updateStatus(order: Order, nextStatus: string) {
    setUpdating(true);
    try {
      const data = await patch<{ order: Order }>(`/sites/${details.site.id}/orders/${order.id}`, { status: nextStatus });
      setOrders((prev) => prev.map((o) => o.id === order.id ? data.order : o));
      if (selected?.id === order.id) setSelected(data.order);
      toast(`Order ${order.number} marked ${nextStatus}.`);
    } catch (err: any) {
      toast(err.message, 'error');
    } finally {
      setUpdating(false);
    }
  }

  function exportCsv() {
    const rows = [
      ['Order', 'Date', 'Customer', 'Email', 'Items', 'Total', 'Status', 'Payment'],
      ...filtered.map((o) => [o.number, formatDate(o.created_at), o.customer_name, o.customer_email, o.items.map((l) => `${l.quantity}x ${l.name}`).join(' | '), (o.total_cents / 100).toFixed(2), o.status, o.payment_status]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${details.site.slug}-orders.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast('Orders exported.');
  }

  return (
    <>
      <PageHeader
        eyebrow="Commerce"
        title="Orders"
        description="Every order placed on your published website. Update fulfilment status as you go."
        actions={<button className="btn btn-outline btn-sm" onClick={exportCsv} disabled={!orders.length}><Download size={13} /> Export CSV</button>}
      />

      <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="metric-card"><div className="metric-label">Net revenue</div><div className="metric-value">{formatMoney(stats.total)}</div><div className="metric-foot">Excluding cancelled and refunded</div></div>
        <div className="metric-card"><div className="metric-label">Orders</div><div className="metric-value">{stats.count}</div><div className="metric-foot">All time</div></div>
        <div className="metric-card"><div className="metric-label">Needs attention</div><div className="metric-value">{stats.pending}</div><div className="metric-foot">Pending or processing</div></div>
      </div>

      <div className="toolbar">
        <div className="filter-tabs">
          <button className={status === 'all' ? 'active' : ''} onClick={() => setStatus('all')}>All <span className="filter-count">{orders.length}</span></button>
          {STATUSES.map((s) => <button key={s} className={status === s ? 'active' : ''} onClick={() => setStatus(s)}>{s.charAt(0).toUpperCase() + s.slice(1)} <span className="filter-count">{orders.filter((o) => o.status === s).length}</span></button>)}
        </div>
        <label className="search-box"><Search size={14} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search orders…" /></label>
      </div>

      <div className="panel">
        {loading ? <div style={{ padding: 30 }}><div className="skeleton" style={{ height: 20, marginBottom: 10 }} /><div className="skeleton" style={{ height: 20, marginBottom: 10 }} /><div className="skeleton" style={{ height: 20 }} /></div> : filtered.length === 0 ? (
          <EmptyState icon={<ShoppingBag size={22} />} title={orders.length ? 'No orders match those filters.' : 'No orders yet.'} description={orders.length ? 'Try another status or search term.' : 'When a customer completes checkout on your live site, the order will appear here automatically.'} action={details.site.status !== 'published' ? <a className="btn btn-outline btn-sm" href={`/preview/${details.site.id}`}>Preview your storefront</a> : undefined} />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {filtered.map((order) => (
                  <tr key={order.id} onClick={() => setSelected(order)} style={{ cursor: 'pointer' }}>
                    <td><span className="order-number">{order.number}</span><div className="text-xs muted">{order.payment_status}</div></td>
                    <td><div className="order-customer"><span className="avatar sm" style={{ background: 'var(--ink)' }}>{order.customer_name.split(' ').map((n) => n[0]).join('').slice(0, 2)}</span><div><b>{order.customer_name}</b><span>{order.customer_email}</span></div></div></td>
                    <td><span className="text-xs">{formatDate(order.created_at)}</span></td>
                    <td><span className="order-items-count">{order.items.reduce((sum, line) => sum + line.quantity, 0)} item{order.items.reduce((sum, line) => sum + line.quantity, 0) === 1 ? '' : 's'}</span><div className="text-xs muted truncate" style={{ maxWidth: 160 }}>{order.items.map((l) => l.name).join(', ')}</div></td>
                    <td><span className="order-total">{formatMoney(order.total_cents)}</span></td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <select className="status-select" value={order.status} onChange={(e) => updateStatus(order, e.target.value)} disabled={updating} aria-label={`Status for order ${order.number}`}>
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td><button className="icon-btn" aria-label="View order" onClick={(e) => { e.stopPropagation(); setSelected(order); }}><Eye size={13} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? `Order ${selected.number}` : 'Order'}
        subtitle={selected ? `${formatDate(selected.created_at)} · ${selected.payment_status}` : ''}
        size="wide"
        footer={<>
          <button className="btn btn-ghost" onClick={() => setSelected(null)}>Close</button>
          {selected && selected.status !== 'completed' && selected.status !== 'cancelled' && (
            <button className="btn btn-accent" onClick={() => updateStatus(selected, selected.status === 'pending' ? 'processing' : selected.status === 'processing' ? 'shipped' : 'completed')} disabled={updating}>
              {updating ? <span className="spinner" /> : <><PackageCheck size={14} /> Mark {selected.status === 'pending' ? 'processing' : selected.status === 'processing' ? 'shipped' : 'completed'}</>}
            </button>
          )}
        </>}
      >
        {selected && (
          <div className="order-detail-grid">
            <div>
              <h3 style={{ fontFamily: 'var(--font-label)', fontSize: 12, fontWeight: 600, marginBottom: 12 }}>Items</h3>
              <div className="order-lines">
                {selected.items.map((line, i) => (
                  <div className="order-line" key={`${line.id}-${i}`}>
                    <div><b style={{ fontWeight: 500 }}>{line.name}</b>{line.options && Object.keys(line.options).length > 0 && <span style={{ display: 'block', fontSize: 10, color: 'var(--muted)' }}>{Object.entries(line.options).map(([name, value]) => `${name}: ${value}`).join(' · ')}</span>}<span style={{ display: 'block' }}>{line.quantity} × {formatMoney(line.price * 100)}</span></div>
                    <b>{formatMoney(line.price * 100 * line.quantity)}</b>
                  </div>
                ))}
              </div>
              <div className="order-summary-list">
                <div><span>Subtotal</span><span>{formatMoney(selected.subtotal_cents)}</span></div>
                <div><span>Shipping</span><span>{selected.shipping_cents ? formatMoney(selected.shipping_cents) : 'Free'}</span></div>
                <div className="total"><span>Total</span><span>{formatMoney(selected.total_cents)}</span></div>
              </div>
              {selected.note && <div className="order-info-card mt-16"><h4>Customer note</h4><p>{selected.note}</p></div>}
            </div>
            <div>
              <div className="order-info-card"><h4>Customer</h4><p><b>{selected.customer_name}</b><br />{selected.customer_email}</p></div>
              <div className="order-info-card"><h4>Status</h4><select className="select" style={{ minHeight: 36, fontSize: 11 }} value={selected.status} onChange={(e) => updateStatus(selected, e.target.value)}>{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
              <div className="order-info-card"><h4>Payment</h4><div className="flex-between"><StatusBadge status={selected.payment_status} /><span className="text-xs muted">Demo checkout</span></div></div>
              <div className="order-info-card"><h4>Need to reach them?</h4><a className="text-link" href={`mailto:${selected.customer_email}`}>Email {selected.customer_name.split(' ')[0]} <Eye size={12} /></a></div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
