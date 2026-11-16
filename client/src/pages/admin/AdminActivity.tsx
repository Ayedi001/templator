import { useEffect, useMemo, useState } from 'react';
import {
  Activity, Bot, CreditCard, FileText, Globe2, Image as ImageIcon, Inbox,
  LayoutTemplate, PenTool, Rocket, Search, Settings as SettingsIcon, ShoppingBag, UserPlus,
} from 'lucide-react';
import { get, timeAgo } from '../../lib/api';

interface ActivityRow {
  id: string; action: string; detail: string; created_at: string;
  user_name?: string; user_email?: string; site_name?: string;
}

const ICONS: Record<string, any> = {
  'site.created': Globe2, 'site.published': Rocket, 'site.unpublished': Globe2,
  'template.applied': LayoutTemplate, 'design.updated': PenTool, 'seo.updated': Search,
  'media.uploaded': ImageIcon, 'item.created': LayoutTemplate, 'item.updated': LayoutTemplate,
  'order.created': ShoppingBag, 'order.status_changed': ShoppingBag,
  'user.registered': UserPlus, 'billing.plan_changed': CreditCard,
  'admin.user_updated': UserPlus, 'settings.updated': SettingsIcon,
};

export function AdminActivity() {
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');

  useEffect(() => {
    get<{ activity: ActivityRow[] }>('/admin/activity?limit=120').then((data) => setActivity(data.activity)).catch(() => undefined);
  }, []);

  const filtered = useMemo(() => activity.filter((row) => {
    const matchesSearch = !search || `${row.action} ${row.detail} ${row.user_name || ''} ${row.site_name || ''}`.toLowerCase().includes(search.toLowerCase());
    const matchesType = type === 'all' || row.action.startsWith(type);
    return matchesSearch && matchesType;
  }), [activity, search, type]);

  return (
    <>
      <div className="admin-page-head">
        <div><div className="eyebrow">Audit trail</div><h1>Activity log</h1><p>Every meaningful action across the platform. User, tenant and system events are captured with timestamps.</p></div>
        <span className="badge"><Activity size={10} /> {activity.length} recent events</span>
      </div>
      <div className="admin-table-toolbar">
        <div className="filter-tabs">
          {[['all', 'All activity'], ['site', 'Websites'], ['item', 'Catalogue'], ['order', 'Orders'], ['user', 'Accounts'], ['admin', 'Admin']].map(([value, label]) => (
            <button key={value} className={type === value ? 'active' : ''} onClick={() => setType(value)}>{label}</button>
          ))}
        </div>
        <label className="search-box"><Search size={14} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search activity…" /></label>
      </div>
      <div className="admin-panel">
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Event</th><th>User</th><th>Website</th><th>When</th></tr></thead>
            <tbody>
              {filtered.map((row) => {
                const Icon = ICONS[row.action] || FileText;
                return (
                  <tr key={row.id}>
                    <td><div className="order-customer"><span className="admin-activity-icon" style={{ width: 29, height: 29 }}><Icon size={12} /></span><div><b style={{ fontSize: 11.5, fontWeight: 500 }}>{row.detail}</b><span>{row.action}</span></div></div></td>
                    <td><span className="text-xs">{row.user_name || 'System'}</span>{row.user_email && <span className="text-xs muted" style={{ display: 'block' }}>{row.user_email}</span>}</td>
                    <td><span className="text-xs">{row.site_name || '—'}</span></td>
                    <td><span className="text-xs">{timeAgo(row.created_at)}</span></td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={4} className="table-empty">No activity matches those filters.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
