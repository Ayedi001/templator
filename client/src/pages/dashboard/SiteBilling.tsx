import { useEffect, useState } from 'react';
import { Check, CreditCard, Download, Sparkles, TriangleAlert } from 'lucide-react';
import { useSite } from '../../components/dashboard/SiteLayout';
import { ConfirmDialog } from '../../components/Modal';
import { PageHeader } from '../../components/UI';
import { useToast } from '../../context/ToastContext';
import { get, patch, post } from '../../lib/api';
import type { Plan, Subscription } from '../../lib/types';

interface BillingData {
  subscription: Subscription;
  plans: Plan[];
  usage: { items: number; itemLimit: number; aiUsed: number; aiLimit: number; storageMb: number; storageLimitMb: number; domains: number };
}

export function SiteBilling() {
  const { details, reload } = useSite();
  const { toast } = useToast();
  const [data, setData] = useState<BillingData | null>(null);
  const [selected, setSelected] = useState<Plan | null>(null);
  const [changing, setChanging] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  async function load() {
    try {
      const result = await get<BillingData>(`/billing/${details.site.id}/billing`);
      setData(result);
    } catch (err: any) { toast(err.message, 'error'); }
  }

  useEffect(() => { load(); }, [details.site.id]);

  async function changePlan() {
    if (!selected) return;
    setChanging(true);
    try {
      await patch(`/billing/${details.site.id}/plan`, { plan: selected.id });
      await load();
      await reload();
      toast(`You are now on the ${selected.name} plan.`);
      setSelected(null);
    } catch (err: any) { toast(err.message, 'error'); } finally { setChanging(false); }
  }

  async function cancel() {
    setCancelling(true);
    try {
      await post(`/billing/${details.site.id}/cancel`);
      await load();
      await reload();
      toast('Subscription cancelled. Your website stays available until the end of the period.');
      setCancelOpen(false);
    } catch (err: any) { toast(err.message, 'error'); } finally { setCancelling(false); }
  }

  if (!data) return <div className="page-loader"><span className="spinner dark lg" /><p>Loading your plan…</p></div>;
  const sub = data.subscription;
  const aiPct = Math.min(100, Math.round((data.usage.aiUsed / Math.max(data.usage.aiLimit, 1)) * 100));
  const itemPct = Math.min(100, Math.round((data.usage.items / Math.max(data.usage.itemLimit, 1)) * 100));
  const storagePct = Math.min(100, Math.round((data.usage.storageMb / Math.max(data.usage.storageLimitMb, 1)) * 100));

  return (
    <>
      <PageHeader eyebrow="Subscription" title="Billing & plan" description="Your plan controls websites, catalogue size, AI actions and custom domains. Change it any time." />
      <section className="panel" style={{ marginBottom: 16 }}>
        <div className="panel-head">
          <div>
            <h3 style={{ fontFamily: 'var(--font-label)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)' }}>Current plan</h3>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, marginTop: 5 }}><span className="display" style={{ fontSize: 33 }}>{sub.plan.charAt(0).toUpperCase() + sub.plan.slice(1)}</span><span className="badge active">{sub.status}</span></div>
            <p className="text-xs muted mt-4">Renews {sub.renews_at ? new Date(sub.renews_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'} · This website's workspace</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-outline btn-sm" onClick={() => { navigator.clipboard?.writeText(`NX-${sub.id.slice(-6).toUpperCase()}`); toast('Invoice reference copied.'); }}><Download size={12} /> Latest invoice</button>
            {sub.status !== 'cancelled' && <button className="btn btn-ghost btn-sm" onClick={() => setCancelOpen(true)}>Cancel plan</button>}
          </div>
        </div>
        <div className="panel-body">
          <div className="usage-bars">
            <div><div className="usage-bar-head"><span>Catalogue items</span><b>{data.usage.items} / {data.usage.itemLimit}</b></div><div className="usage-bar"><i style={{ width: `${itemPct}%` }} className={itemPct > 85 ? 'warn' : ''} /></div></div>
            <div><div className="usage-bar-head"><span>AI actions used</span><b>{data.usage.aiUsed} / {data.usage.aiLimit}</b></div><div className="usage-bar"><i style={{ width: `${aiPct}%` }} className={aiPct > 85 ? 'warn' : ''} /></div></div>
            <div><div className="usage-bar-head"><span>Media storage</span><b>{data.usage.storageMb} MB / {data.usage.storageLimitMb} MB</b></div><div className="usage-bar"><i style={{ width: `${storagePct}%` }} /></div></div>
          </div>
        </div>
      </section>

      <div className="dash-section-title"><h2>Available plans</h2><span className="text-xs muted">Billed monthly · cancel any time</span></div>
      <div className="plan-grid">
        {data.plans.map((plan) => {
          const current = plan.id === sub.plan;
          return (
            <article className={`plan-card ${current ? 'current' : ''}`} key={plan.id}>
              {current && <span className="plan-current-badge">Current</span>}
              <h3>{plan.name}</h3>
              <div className="plan-price">${plan.price}<span> / month</span></div>
              <ul>
                {(plan.features || []).map((feature) => <li key={feature}><Check size={12} />{feature}</li>)}
              </ul>
              <button className={`btn btn-sm ${current ? 'btn-outline' : 'btn-accent'}`} disabled={current} onClick={() => setSelected(plan)}>{current ? 'Your current plan' : `Switch to ${plan.name}`}</button>
            </article>
          );
        })}
      </div>
      <div className="panel mt-24">
        <div className="panel-head"><h3>Plan notes</h3><CreditCard size={14} style={{ color: 'var(--muted)' }} /></div>
        <div className="panel-body" style={{ display: 'grid', gap: 12 }}>
          <div className="flex-center gap-8 text-xs muted"><Sparkles size={13} /> AI actions reset on the first of each month and do not roll over.</div>
          <div className="flex-center gap-8 text-xs muted"><Check size={13} /> Changes apply immediately. This demo does not process real payments.</div>
          <div className="flex-center gap-8 text-xs muted"><TriangleAlert size={13} /> Downgrading may require reducing catalogue items above the new limit.</div>
        </div>
      </div>

      <ConfirmDialog open={Boolean(selected)} onClose={() => setSelected(null)} onConfirm={changePlan} title={`Switch to ${selected?.name}?`} confirmLabel={`Confirm ${selected?.name}`} busy={changing}>
        Your new limits take effect immediately: <b>{selected?.productLimit.toLocaleString()} catalogue items</b>, <b>{selected?.aiLimit.toLocaleString()} AI actions / month</b>, {selected?.sites} website{selected?.sites === 1 ? '' : 's'} and {selected?.customDomain ? 'custom domains' : 'no custom domains'}. This demo simulates billing.
      </ConfirmDialog>

      <ConfirmDialog open={cancelOpen} onClose={() => setCancelOpen(false)} onConfirm={cancel} title="Cancel this plan?" confirmLabel="Cancel subscription" danger busy={cancelling}>
        Your workspace becomes read-only for publishing at the end of the current period. Content is preserved. You can reactivate at any time.
      </ConfirmDialog>
    </>
  );
}
