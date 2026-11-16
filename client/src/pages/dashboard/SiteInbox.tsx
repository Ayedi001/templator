import { useEffect, useMemo, useState } from 'react';
import { Archive, Inbox, Mail, MailOpen, MessageSquare, Phone, Reply, Search } from 'lucide-react';
import { useSite } from '../../components/dashboard/SiteLayout';
import { Modal } from '../../components/Modal';
import { EmptyState, PageHeader, StatusBadge } from '../../components/UI';
import { useToast } from '../../context/ToastContext';
import { get, patch, timeAgo } from '../../lib/api';
import type { Inquiry } from '../../lib/types';

export function SiteInbox() {
  const { details } = useSite();
  const { toast } = useToast();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Inquiry | null>(null);

  async function load() {
    try {
      const data = await get<{ inquiries: Inquiry[] }>(`/sites/${details.site.id}/inquiries`);
      setInquiries(data.inquiries);
    } catch (err: any) { toast(err.message, 'error'); } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [details.site.id]);

  const filtered = useMemo(() => inquiries.filter((inquiry) => {
    const matchesFilter = filter === 'all' || inquiry.status === filter;
    const matchesSearch = !search || `${inquiry.name} ${inquiry.email} ${inquiry.message}`.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  }), [inquiries, filter, search]);

  async function setStatus(inquiry: Inquiry, status: string) {
    try {
      await patch(`/sites/${details.site.id}/inquiries/${inquiry.id}`, { status });
      setInquiries((prev) => prev.map((i) => i.id === inquiry.id ? { ...i, status } : i));
      if (selected?.id === inquiry.id) setSelected({ ...selected, status });
      toast(`Marked ${status}.`);
    } catch (err: any) { toast(err.message, 'error'); }
  }

  function openInquiry(inquiry: Inquiry) {
    setSelected(inquiry);
    if (inquiry.status === 'new') setStatus(inquiry, 'read');
  }

  return (
    <>
      <PageHeader eyebrow="Communication" title="Inbox" description="Enquiries, bookings and newsletter signups from your published website all land here." />
      <div className="toolbar">
        <div className="filter-tabs">
          {['all', 'new', 'read', 'replied', 'archived'].map((status) => (
            <button key={status} className={filter === status ? 'active' : ''} onClick={() => setFilter(status)}>
              {status.charAt(0).toUpperCase() + status.slice(1)} <span className="filter-count">{status === 'all' ? inquiries.length : inquiries.filter((i) => i.status === status).length}</span>
            </button>
          ))}
        </div>
        <label className="search-box"><Search size={14} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search messages…" /></label>
      </div>
      {loading ? <div className="panel" style={{ padding: 30 }}><div className="skeleton" style={{ height: 50 }} /></div> : filtered.length === 0 ? (
        <div className="panel"><EmptyState icon={<Inbox size={22} />} title={inquiries.length ? 'Nothing matches.' : 'Your inbox is quiet.'} description={inquiries.length ? 'Try another status or search.' : 'When a visitor uses your contact or booking form, their message appears here.'} /></div>
      ) : (
        <div className="inbox-list">
          {filtered.map((inquiry) => (
            <article className={`inbox-item ${inquiry.status === 'new' ? 'unread' : ''}`} key={inquiry.id} onClick={() => openInquiry(inquiry)} style={{ cursor: 'pointer' }}>
              <span className="avatar" style={{ background: inquiry.status === 'new' ? 'var(--accent)' : 'var(--ink)' }}>{inquiry.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}</span>
              <div className="inbox-copy">
                <div className="inbox-copy-head">
                  <b>{inquiry.name}</b>
                  <span>{inquiry.email}</span>
                  <span>·</span>
                  <span className="inbox-type">{inquiry.type}</span>
                  <span style={{ marginLeft: 'auto' }}>{timeAgo(inquiry.created_at)}</span>
                </div>
                <p>{inquiry.message || 'Newsletter signup.'}</p>
              </div>
              <div className="inbox-actions">
                <span className={`badge ${inquiry.status}`}>{inquiry.status}</span>
                <a className="icon-btn" href={`mailto:${inquiry.email}`} onClick={(e) => e.stopPropagation()} aria-label="Reply by email"><Reply size={13} /></a>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.name || 'Message'} subtitle={selected ? `${selected.email}${selected.phone ? ` · ${selected.phone}` : ''}` : ''} size="wide"
        footer={<>
          <button className="btn btn-ghost" onClick={() => selected && setStatus(selected, 'archived')}><Archive size={13} /> Archive</button>
          <a className="btn btn-outline" href={`mailto:${selected?.email}?subject=Re: your enquiry`} onClick={() => selected && setStatus(selected, 'replied')}><Mail size={13} /> Reply by email</a>
          <button className="btn btn-accent" onClick={() => selected && setStatus(selected, 'replied')}><MailOpen size={13} /> Mark replied</button>
        </>}
      >
        {selected && (
          <div>
            <div className="flex-center gap-8 mb-16"><span className="inbox-type">{selected.type}</span><StatusBadge status={selected.status} /><span className="text-xs muted">{new Date(selected.created_at.replace(' ', 'T')).toLocaleString('en-US')}</span></div>
            <div className="order-info-card"><h4>Message</h4><p style={{ whiteSpace: 'pre-line' }}>{selected.message || 'This visitor asked to join your newsletter.'}</p></div>
            <div className="order-info-card"><h4>Contact</h4><p><Mail size={12} style={{ display: 'inline', marginRight: 5 }} />{selected.email}<br /><Phone size={12} style={{ display: 'inline', marginRight: 5 }} />{selected.phone || 'Not provided'}</p></div>
          </div>
        )}
      </Modal>
    </>
  );
}
