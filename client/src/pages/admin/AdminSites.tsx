import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ExternalLink, Globe2, Search, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '../../components/Modal';
import { StatusBadge } from '../../components/UI';
import { useToast } from '../../context/ToastContext';
import { del, formatDate, get, patch } from '../../lib/api';

interface AdminSite {
  id: string; name: string; slug: string; status: string; category: string;
  templateId: string; ownerName: string; ownerEmail: string; plan: string;
  subscriptionStatus: string; itemsCount: number; ordersCount: number;
  customDomain?: string; createdAt: string; publishedAt?: string;
}

export function AdminSites() {
  const { toast } = useToast();
  const [params] = useSearchParams();
  const [sites, setSites] = useState<AdminSite[]>([]);
  const [search, setSearch] = useState(params.get('search') || '');
  const [status, setStatus] = useState('all');
  const [target, setTarget] = useState<AdminSite | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const data = await get<{ sites: AdminSite[] }>('/admin/sites');
      setSites(data.sites);
    } catch (err: any) { toast(err.message, 'error'); }
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => sites.filter((site) => {
    const matchesSearch = !search || `${site.name} ${site.slug} ${site.ownerName} ${site.ownerEmail}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = status === 'all' || site.status === status;
    return matchesSearch && matchesStatus;
  }), [sites, search, status]);

  async function setSiteStatus(site: AdminSite, next: string) {
    try {
      await patch(`/admin/sites/${site.id}`, { status: next });
      setSites((prev) => prev.map((s) => s.id === site.id ? { ...s, status: next } : s));
      toast(`${site.name} set to ${next}.`);
    } catch (err: any) { toast(err.message, 'error'); }
  }

  async function removeSite() {
    if (!target) return;
    setBusy(true);
    try {
      await del(`/admin/sites/${target.id}`);
      setSites((prev) => prev.filter((s) => s.id !== target.id));
      toast(`${target.name} deleted.`);
      setTarget(null);
    } catch (err: any) { toast(err.message, 'error'); } finally { setBusy(false); }
  }

  return (
    <>
      <div className="admin-page-head">
        <div><div className="eyebrow">Publishing</div><h1>Websites</h1><p>Moderate every tenant website. Suspending removes it from the public web without deleting data.</p></div>
      </div>
      <div className="admin-metric-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <div className="admin-metric"><span><Globe2 size={11} /> Total</span><b>{sites.length}</b><small>Across all tenants</small></div>
        <div className="admin-metric"><span>Live</span><b>{sites.filter((s) => s.status === 'published').length}</b><small>Publicly accessible</small></div>
        <div className="admin-metric"><span>Drafts</span><b>{sites.filter((s) => s.status === 'draft').length}</b><small>Private</small></div>
        <div className="admin-metric"><span>Suspended</span><b>{sites.filter((s) => s.status === 'suspended').length}</b><small>Hidden</small></div>
      </div>
      <div className="admin-table-toolbar">
        <div className="filter-tabs">
          {['all', 'published', 'draft', 'suspended'].map((s) => <button key={s} className={status === s ? 'active' : ''} onClick={() => setStatus(s)}>{s[0].toUpperCase() + s.slice(1)}</button>)}
        </div>
        <label className="search-box"><Search size={14} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search websites or owners…" /></label>
      </div>
      <div className="admin-panel">
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Website</th><th>Owner</th><th>Plan</th><th>Catalogue</th><th>Orders</th><th>Status</th><th>Published</th><th></th></tr></thead>
            <tbody>
              {filtered.map((site) => (
                <tr key={site.id}>
                  <td><div><b style={{ fontSize: 11.5, fontWeight: 500 }}>{site.name}</b><span className="text-xs muted" style={{ display: 'block' }}>{site.slug}{site.customDomain ? ` · ${site.customDomain}` : ''}</span></div></td>
                  <td><div><b style={{ fontSize: 11, fontWeight: 500 }}>{site.ownerName}</b><span className="text-xs muted" style={{ display: 'block' }}>{site.ownerEmail}</span></div></td>
                  <td><span className="badge">{site.plan}</span></td>
                  <td><span className="text-xs">{site.itemsCount}</span></td>
                  <td><span className="text-xs">{site.ordersCount}</span></td>
                  <td>
                    <select className="status-select" value={site.status} onChange={(e) => setSiteStatus(site, e.target.value)}>
                      <option value="published">published</option>
                      <option value="draft">draft</option>
                      <option value="suspended">suspended</option>
                    </select>
                  </td>
                  <td><span className="text-xs">{formatDate(site.publishedAt)}</span></td>
                  <td><div className="flex-center gap-4">
                    {site.status === 'published' && <a className="icon-btn" href={`/site/${site.slug}`} target="_blank" rel="noreferrer" aria-label="Open website"><ExternalLink size={12} /></a>}
                    <button className="icon-btn danger" onClick={() => setTarget(site)} aria-label="Delete website"><Trash2 size={12} /></button>
                  </div></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={8} className="table-empty">No websites match those filters.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <ConfirmDialog open={Boolean(target)} onClose={() => setTarget(null)} onConfirm={removeSite} title={`Delete ${target?.name}?`} confirmLabel="Delete permanently" danger busy={busy}>
        This removes the website, its catalogue, orders, customers, media and domains from the platform. This cannot be undone.
      </ConfirmDialog>
    </>
  );
}
