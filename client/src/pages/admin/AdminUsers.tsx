import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ban, CheckCircle2, Mail, Search, ShieldCheck, Users } from 'lucide-react';
import { ConfirmDialog } from '../../components/Modal';
import { StatusBadge } from '../../components/UI';
import { useToast } from '../../context/ToastContext';
import { formatMoney, get, patch, timeAgo } from '../../lib/api';

interface AdminUser {
  id: string; name: string; email: string; role: string; status: string;
  avatarColor: string; createdAt: string; sitesCount: number; publishedCount: number; gmvCents: number;
}

export function AdminUsers() {
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [target, setTarget] = useState<AdminUser | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const data = await get<{ users: AdminUser[] }>('/admin/users');
      setUsers(data.users);
    } catch (err: any) { toast(err.message, 'error'); }
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => users.filter((u) => {
    const matchesSearch = !search || `${u.name} ${u.email}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = status === 'all' || u.status === status;
    return matchesSearch && matchesStatus;
  }), [users, search, status]);

  async function toggleStatus() {
    if (!target) return;
    setBusy(true);
    try {
      const next = target.status === 'suspended' ? 'active' : 'suspended';
      await patch(`/admin/users/${target.id}`, { status: next });
      setUsers((prev) => prev.map((u) => u.id === target.id ? { ...u, status: next } : u));
      toast(next === 'suspended' ? `${target.name} suspended.` : `${target.name} reactivated.`);
      setTarget(null);
    } catch (err: any) { toast(err.message, 'error'); } finally { setBusy(false); }
  }

  return (
    <>
      <div className="admin-page-head">
        <div><div className="eyebrow">Tenants</div><h1>Businesses</h1><p>Every owner account on the platform. Suspension blocks sign-in immediately.</p></div>
        <div className="flex-center gap-8"><span className="badge">{users.length} accounts</span></div>
      </div>
      <div className="admin-metric-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <div className="admin-metric"><span><Users size={11} /> Total</span><b>{users.length}</b><small>Including admin</small></div>
        <div className="admin-metric"><span><CheckCircle2 size={11} /> Active</span><b>{users.filter((u) => u.status === 'active').length}</b><small>Can sign in</small></div>
        <div className="admin-metric"><span><Ban size={11} /> Suspended</span><b>{users.filter((u) => u.status === 'suspended').length}</b><small>Blocked</small></div>
        <div className="admin-metric"><span><ShieldCheck size={11} /> Published sites</span><b>{users.reduce((sum, u) => sum + u.publishedCount, 0)}</b><small>Across tenants</small></div>
      </div>
      <div className="admin-table-toolbar">
        <div className="filter-tabs">
          {['all', 'active', 'suspended'].map((s) => <button key={s} className={status === s ? 'active' : ''} onClick={() => setStatus(s)}>{s[0].toUpperCase() + s.slice(1)}</button>)}
        </div>
        <label className="search-box"><Search size={14} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search businesses…" /></label>
      </div>
      <div className="admin-panel">
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Business owner</th><th>Role</th><th>Websites</th><th>Published</th><th>GMV</th><th>Status</th><th>Joined</th><th></th></tr></thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id}>
                  <td><div className="order-customer"><span className="avatar" style={{ background: user.avatarColor }}>{user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}</span><div><b>{user.name}</b><span>{user.email}</span></div></div></td>
                  <td><span className="badge">{user.role}</span></td>
                  <td><span className="text-xs">{user.sitesCount}</span></td>
                  <td><span className="text-xs">{user.publishedCount}</span></td>
                  <td><span className="order-total">{formatMoney(user.gmvCents)}</span></td>
                  <td><StatusBadge status={user.status} /></td>
                  <td><span className="text-xs">{timeAgo(user.createdAt)}</span></td>
                  <td>
                    <div className="flex-center gap-4">
                      <Link className="icon-btn" to={`/admin/sites?search=${encodeURIComponent(user.email)}`} aria-label="View websites"><GlobeSmall /></Link>
                      {user.role !== 'admin' && <a className="icon-btn" href={`mailto:${user.email}`} aria-label="Email"><Mail size={12} /></a>}
                      {user.role !== 'admin' && (
                        <button className={`icon-btn ${user.status === 'suspended' ? '' : 'danger'}`} onClick={() => setTarget(user)} aria-label={user.status === 'suspended' ? 'Reactivate' : 'Suspend'}>{user.status === 'suspended' ? <CheckCircle2 size={13} /> : <Ban size={13} />}</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={8} className="table-empty">No businesses match that search.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <ConfirmDialog open={Boolean(target)} onClose={() => setTarget(null)} onConfirm={toggleStatus} title={target?.status === 'suspended' ? `Reactivate ${target?.name}?` : `Suspend ${target?.name}?`} confirmLabel={target?.status === 'suspended' ? 'Reactivate account' : 'Suspend account'} danger={target?.status !== 'suspended'} busy={busy}>
        {target?.status === 'suspended' ? 'The owner will be able to sign in and access their workspace again.' : 'The owner will be signed out and blocked from signing in. Their published websites will remain live unless you suspend them separately.'}
      </ConfirmDialog>
    </>
  );
}

function GlobeSmall() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" /></svg>;
}
