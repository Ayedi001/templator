import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowUpRight, Check, Copy, ExternalLink, Globe2, Lock, Mail, MapPin,
  Phone, Plus, Rocket, Settings, ShieldCheck, Trash2, Unlink, Users,
} from 'lucide-react';
import { useSite } from '../../components/dashboard/SiteLayout';
import { ConfirmDialog } from '../../components/Modal';
import { PageHeader, StatusBadge } from '../../components/UI';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { del, get, patch, post } from '../../lib/api';
import type { Domain } from '../../lib/types';

type Tab = 'general' | 'publishing' | 'domains' | 'contact';

export function SiteSettings() {
  const { details, reload } = useSite();
  const { toast } = useToast();
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('general');
  const [general, setGeneral] = useState({ name: details.site.name, slug: details.site.slug, description: details.site.description });
  const [business, setBusiness] = useState({
    email: details.site.settings.business?.email || details.site.content.contact.email || '',
    phone: details.site.settings.business?.phone || details.site.content.contact.phone || '',
    address: details.site.settings.business?.address || details.site.content.contact.address || '',
    currency: details.site.settings.business?.currency || 'USD',
  });
  const [social, setSocial] = useState({
    instagram: details.site.settings.social?.instagram || '',
    facebook: details.site.settings.social?.facebook || '',
    x: details.site.settings.social?.x || '',
    linkedin: details.site.settings.social?.linkedin || '',
  });
  const [showBadge, setShowBadge] = useState(details.site.settings.publishing?.showBadge !== false);
  const [sitePassword, setSitePassword] = useState(details.site.settings.publishing?.password || '');
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [domains, setDomains] = useState<Domain[]>(details.domains);
  const [newDomain, setNewDomain] = useState('');
  const [addingDomain, setAddingDomain] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setGeneral({ name: details.site.name, slug: details.site.slug, description: details.site.description });
    setDomains(details.domains);
  }, [details.site.id, details.domains]);

  async function saveGeneral() {
    setSaving(true);
    try {
      await patch(`/sites/${details.site.id}`, general);
      await reload();
      await refresh();
      toast('Website details saved.');
    } catch (err: any) { toast(err.message, 'error'); } finally { setSaving(false); }
  }

  async function saveBusiness() {
    setSaving(true);
    try {
      await patch(`/sites/${details.site.id}/settings`, { settings: { business: { ...business, name: details.site.name }, social } });
      await reload();
      toast('Contact and social details saved.');
    } catch (err: any) { toast(err.message, 'error'); } finally { setSaving(false); }
  }

  async function savePublishing() {
    setSaving(true);
    try {
      await patch(`/sites/${details.site.id}/settings`, { settings: { publishing: { showBadge, password: sitePassword } } });
      await reload();
      toast('Publishing settings saved.');
    } catch (err: any) { toast(err.message, 'error'); } finally { setSaving(false); }
  }

  async function togglePublish() {
    setBusy(true);
    try {
      if (details.site.status === 'published') {
        await post(`/sites/${details.site.id}/unpublish`);
        toast('Website unpublished. Your content is safe.');
      } else {
        await post(`/sites/${details.site.id}/publish`);
        toast('Website published.');
      }
      await reload();
      await refresh();
    } catch (err: any) { toast(err.message, 'error'); } finally { setBusy(false); }
  }

  async function addDomain() {
    if (!newDomain.trim()) return;
    setAddingDomain(true);
    try {
      const data = await post<{ domains: Domain[] }>(`/sites/${details.site.id}/domains`, { domain: newDomain });
      setDomains(data.domains);
      setNewDomain('');
      await reload();
      toast('Domain added. Follow the DNS steps, then verify.');
    } catch (err: any) { toast(err.message, 'error'); } finally { setAddingDomain(false); }
  }

  async function verifyDomain(domain: Domain) {
    try {
      const data = await post<{ domains: Domain[] }>(`/sites/${details.site.id}/domains/${domain.id}/verify`, {});
      setDomains(data.domains);
      await reload();
      toast('Domain verified and SSL issued.');
    } catch (err: any) { toast(err.message, 'error'); }
  }

  async function removeDomain(domain: Domain) {
    try {
      const data = await del<{ domains: Domain[] }>(`/sites/${details.site.id}/domains/${domain.id}`);
      setDomains(data.domains);
      await reload();
      toast('Domain disconnected.');
    } catch (err: any) { toast(err.message, 'error'); }
  }

  async function deleteSite() {
    setDeleting(true);
    try {
      await del(`/sites/${details.site.id}`);
      await refresh();
      toast('Website deleted.');
      navigate('/dashboard');
    } catch (err: any) { toast(err.message, 'error'); setDeleting(false); }
  }

  const publicHost = details.site.customDomain || `${details.site.slug}.nexora.studio`;
  const planAllowsDomain = details.limits?.customDomain;

  return (
    <>
      <PageHeader eyebrow="Configuration" title="Website settings" description="Your address, publishing controls, connected domains and the details customers see." />
      <div className="settings-grid">
        <nav className="settings-nav">
          <button className={tab === 'general' ? 'active' : ''} onClick={() => setTab('general')}><Settings size={14} /> General</button>
          <button className={tab === 'publishing' ? 'active' : ''} onClick={() => setTab('publishing')}><Rocket size={14} /> Publishing</button>
          <button className={tab === 'domains' ? 'active' : ''} onClick={() => setTab('domains')}><Globe2 size={14} /> Domains</button>
          <button className={tab === 'contact' ? 'active' : ''} onClick={() => setTab('contact')}><Mail size={14} /> Contact & social</button>
        </nav>

        <div>
          {tab === 'general' && (
            <section className="settings-panel">
              <div className="settings-panel-head"><h2>General details</h2><p>The essentials that identify this website across your workspace.</p></div>
              <div className="settings-panel-body">
                <div className="field"><label>Website name</label><input className="input" value={general.name} onChange={(e) => setGeneral({ ...general, name: e.target.value })} /></div>
                <div className="field"><label>Web address</label>
                  <div style={{ display: 'flex' }}>
                    <input className="input" style={{ borderRadius: '12px 0 0 12px', fontFamily: 'var(--font-mono)', fontSize: 12 }} value={general.slug} onChange={(e) => setGeneral({ ...general, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} />
                    <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px', border: '1px solid var(--line-strong)', borderLeft: 0, borderRadius: '0 12px 12px 0', background: 'var(--paper)', fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>.nexora.studio</span>
                  </div>
                  <p className="field-hint">Changing this breaks existing links. Custom domains are not affected.</p>
                </div>
                <div className="field"><label>Description</label><textarea className="textarea" rows={3} value={general.description} onChange={(e) => setGeneral({ ...general, description: e.target.value })} /><p className="field-hint">Used in search results and template recommendations.</p></div>
                <div className="publish-card"><div><h3><LayersIcon /> Business category</h3><p>Category controls which dashboard features appear. Contact support to change it.</p></div><span className="badge">{details.site.category}</span></div>
              </div>
              <div className="settings-footer"><button className="btn btn-accent btn-sm" onClick={saveGeneral} disabled={saving}>{saving ? <span className="spinner" /> : 'Save changes'}</button></div>
            </section>
          )}

          {tab === 'publishing' && (
            <section className="settings-panel">
              <div className="settings-panel-head"><h2>Publishing</h2><p>Control whether your website is visible to the world.</p></div>
              <div className="settings-panel-body">
                <div className="publish-card">
                  <div><h3>{details.site.status === 'published' ? <><Check size={13} /> Your website is live</> : <><Rocket size={13} /> Your website is a draft</>}</h3><p>{details.site.status === 'published' ? 'Visitors can access the site at the address below.' : 'Only you can preview it until you publish.'}</p></div>
                  <StatusBadge status={details.site.status} />
                </div>
                <div className="field"><label>Public address</label><div className="publish-url-box"><Globe2 size={13} /><span style={{ flex: 1 }}>{publicHost}</span><button onClick={() => { navigator.clipboard?.writeText(publicHost); toast('Address copied.'); }} aria-label="Copy address"><Copy size={12} /></button>{details.site.status === 'published' && <a href={`/site/${details.site.slug}`} target="_blank" rel="noreferrer" aria-label="Open live site"><ExternalLink size={12} /></a>}</div></div>
                <div className="toggle-row"><div><h4>Show "Made with Nexora" badge</h4><p>A small, tasteful badge in the corner of your website.</p></div><button className={`toggle ${showBadge ? 'on' : ''}`} onClick={() => setShowBadge(!showBadge)} aria-label="Toggle badge" /></div>
                <div className="field"><label>Password protection <span className="field-hint">Optional</span></label><div style={{ position: 'relative' }}><Lock size={14} style={{ position: 'absolute', left: 13, top: 15, color: 'var(--muted)' }} /><input className="input" style={{ paddingLeft: 38 }} value={sitePassword} onChange={(e) => setSitePassword(e.target.value)} placeholder="Leave empty for a public website" /></div><p className="field-hint">Visitors will need this password before they can view the live site.</p></div>
              </div>
              <div className="settings-footer">
                <button className="btn btn-outline btn-sm" onClick={togglePublish} disabled={busy}>{busy ? <span className="spinner dark" /> : details.site.status === 'published' ? <><Unlink size={12} /> Unpublish</> : <><Rocket size={12} /> Publish website</>}</button>
                <button className="btn btn-accent btn-sm" onClick={savePublishing} disabled={saving}>{saving ? <span className="spinner" /> : 'Save settings'}</button>
              </div>
            </section>
          )}

          {tab === 'domains' && (
            <section className="settings-panel">
              <div className="settings-panel-head"><h2>Custom domains</h2><p>Connect a domain you already own. SSL is provisioned automatically.</p></div>
              <div className="settings-panel-body">
                {!planAllowsDomain && <div className="form-error">Custom domains are available on Growth and Scale plans. <Link to={`/dashboard/${details.site.id}/billing`} style={{ textDecoration: 'underline' }}>Upgrade your plan</Link> to connect one.</div>}
                {details.site.status !== 'published' && <div className="form-error" style={{ background: '#fbf0d8', borderColor: '#eeddae', color: '#88691a' }}>Publish your website before connecting a custom domain.</div>}
                <div className="field"><label>Default Nexora address</label><div className="domain-card"><span className="domain-icon"><Globe2 size={14} /></span><div className="domain-copy"><b>{details.site.slug}.nexora.studio</b><span>Always included with every plan</span></div><span className="badge verified"><Check size={9} /> Active</span></div></div>
                <div className="field"><label>Connected domains</label>
                  {domains.length === 0 && <p className="field-hint">No custom domains yet.</p>}
                  {domains.map((domain) => (
                    <div className="domain-card" key={domain.id} style={{ marginBottom: 7 }}>
                      <span className="domain-icon"><Globe2 size={14} /></span>
                      <div className="domain-copy"><b>{domain.domain}</b><span>{domain.status === 'verified' ? 'DNS verified · SSL active' : 'Waiting for DNS verification'}</span></div>
                      <StatusBadge status={domain.status} />
                      {domain.status !== 'verified' && <button className="btn btn-outline btn-sm" onClick={() => verifyDomain(domain)}><ShieldCheck size={11} /> Verify</button>}
                      <button className="icon-btn danger" onClick={() => removeDomain(domain)} aria-label="Remove domain"><Trash2 size={12} /></button>
                    </div>
                  ))}
                </div>
                {planAllowsDomain && (
                  <div className="field"><label>Add a custom domain</label>
                    <div className="category-add"><input className="input" value={newDomain} onChange={(e) => setNewDomain(e.target.value)} placeholder="yourbusiness.com" disabled={!planAllowsDomain} /><button className="btn btn-outline btn-sm" onClick={addDomain} disabled={addingDomain || !newDomain || !planAllowsDomain}>{addingDomain ? <span className="spinner dark" /> : <><Plus size={12} /> Add</>}</button></div>
                  </div>
                )}
                <div className="order-info-card"><h4>How DNS works</h4><p>Point an <b>A record</b> to <b>76.76.21.21</b> and a <b>CNAME</b> for <b>www</b> to <b>cname.nexora.studio</b>. Once propagated, press Verify. In this demo, verification is simulated instantly.</p></div>
              </div>
              <div className="settings-footer"><Link className="btn btn-outline btn-sm" to={`/dashboard/${details.site.id}/billing`}>Manage plan</Link></div>
            </section>
          )}

          {tab === 'contact' && (
            <section className="settings-panel">
              <div className="settings-panel-head"><h2>Contact & social</h2><p>Business details used in structured data, receipts and social links.</p></div>
              <div className="settings-panel-body">
                <div className="field"><label>Business email</label><input className="input" type="email" value={business.email} onChange={(e) => setBusiness({ ...business, email: e.target.value })} /></div>
                <div className="field-row">
                  <div className="field"><label>Phone</label><input className="input" value={business.phone} onChange={(e) => setBusiness({ ...business, phone: e.target.value })} /></div>
                  <div className="field"><label>Currency</label><select className="select" value={business.currency} onChange={(e) => setBusiness({ ...business, currency: e.target.value })}><option value="USD">USD — US Dollar</option><option value="EUR">EUR — Euro</option><option value="GBP">GBP — Pound Sterling</option><option value="CAD">CAD — Canadian Dollar</option><option value="AUD">AUD — Australian Dollar</option></select></div>
                </div>
                <div className="field"><label>Address</label><input className="input" value={business.address} onChange={(e) => setBusiness({ ...business, address: e.target.value })} /></div>
                <div className="divider" />
                <h3 style={{ fontFamily: 'var(--font-label)', fontSize: 12, fontWeight: 600 }}>Social profiles</h3>
                <div className="field-row">
                  <div className="field"><label>Instagram URL</label><input className="input" value={social.instagram} onChange={(e) => setSocial({ ...social, instagram: e.target.value })} placeholder="https://instagram.com/…" /></div>
                  <div className="field"><label>Facebook URL</label><input className="input" value={social.facebook} onChange={(e) => setSocial({ ...social, facebook: e.target.value })} placeholder="https://facebook.com/…" /></div>
                </div>
                <div className="field-row">
                  <div className="field"><label>X / Twitter URL</label><input className="input" value={social.x} onChange={(e) => setSocial({ ...social, x: e.target.value })} placeholder="https://x.com/…" /></div>
                  <div className="field"><label>LinkedIn URL</label><input className="input" value={social.linkedin} onChange={(e) => setSocial({ ...social, linkedin: e.target.value })} placeholder="https://linkedin.com/…" /></div>
                </div>
                <div className="divider" />
                <div className="danger-zone">
                  <h3>Delete this website</h3>
                  <p>Permanently removes the website, its catalogue, orders, customers, media and domains. Your account stays active. This cannot be undone.</p>
                  <button className="btn btn-danger btn-sm" onClick={() => setDeleteOpen(true)}><Trash2 size={12} /> Delete website</button>
                </div>
              </div>
              <div className="settings-footer"><button className="btn btn-accent btn-sm" onClick={saveBusiness} disabled={saving}>{saving ? <span className="spinner" /> : 'Save details'}</button></div>
            </section>
          )}
        </div>
      </div>

      <ConfirmDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={deleteSite} title={`Delete ${details.site.name}?`} confirmLabel="Delete website forever" danger busy={deleting}>
        This will permanently delete <b>{details.site.name}</b>, including {details.site.status === 'published' ? 'the live website, ' : ''}its products, orders, customers and media. This cannot be undone.
      </ConfirmDialog>
    </>
  );
}

function LayersIcon() {
  return <span style={{ display: 'inline-block', width: 12, height: 12, border: '1px solid var(--muted)', borderRadius: 2, marginRight: 5, verticalAlign: -1 }} />;
}
