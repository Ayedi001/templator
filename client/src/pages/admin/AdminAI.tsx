import { useEffect, useState } from 'react';
import { Bot, Check, Cpu, Save, Server, Sparkles, Zap } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { get, patch } from '../../lib/api';

interface AIData {
  agents: { id: string; name: string; description: string; capabilities: string[]; status: string; enabled: boolean }[];
  usageByAgent: { agent: string; calls: number; chars: number }[];
  monthlyCalls: number;
  provider: { enabled: boolean; configured: boolean; provider: string; model: string; mode: string };
  plans: { id: string; name: string; aiLimit: number; activeSites: number; monthlyCalls: number }[];
  settings: any;
}

export function AdminAI() {
  const { toast } = useToast();
  const [data, setData] = useState<AIData | null>(null);
  const [disabled, setDisabled] = useState<string[]>([]);
  const [limits, setLimits] = useState<Record<string, number>>({ starter: 50, growth: 500, scale: 2500 });
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const result = await get<AIData>('/admin/ai');
      setData(result);
      setDisabled(result.agents.filter((a) => !a.enabled).map((a) => a.id));
      setLimits(Object.fromEntries(result.plans.map((p) => [p.id, p.aiLimit])));
    } catch (err: any) { toast(err.message, 'error'); }
  }
  useEffect(() => { load(); }, []);

  function toggleAgent(id: string) {
    setDisabled((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  async function save() {
    setSaving(true);
    try {
      await patch('/admin/ai', {
        disabledAgents: disabled,
        planLimits: { starter: Number(limits.starter), growth: Number(limits.growth), scale: Number(limits.scale) },
      });
      await load();
      toast('AI configuration saved.');
    } catch (err: any) { toast(err.message, 'error'); } finally { setSaving(false); }
  }

  if (!data) return <div className="page-loader"><span className="spinner dark lg" /><p>Checking agent health…</p></div>;

  const maxCalls = Math.max(...data.usageByAgent.map((a) => a.calls), 1);

  return (
    <>
      <div className="admin-page-head">
        <div><div className="eyebrow">Intelligence</div><h1>AI agents</h1><p>Every agent is independent and can be disabled without affecting the rest of the platform.</p></div>
        <button className="btn btn-accent btn-sm" onClick={save} disabled={saving}>{saving ? <span className="spinner" /> : <><Save size={13} /> Save configuration</>}</button>
      </div>
      <div className="admin-metric-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <div className="admin-metric"><span><Bot size={11} /> Active agents</span><b>{data.agents.filter((a) => a.enabled).length} / {data.agents.length}</b><small>Independently managed</small></div>
        <div className="admin-metric"><span><Zap size={11} /> AI calls this month</span><b>{data.monthlyCalls}</b><small>All tenants</small></div>
        <div className="admin-metric"><span><Cpu size={11} /> Provider</span><b style={{ fontSize: 19, marginTop: 10 }}>{data.provider.configured ? 'Hybrid' : 'Local'}</b><small>{data.provider.model}</small></div>
        <div className="admin-metric"><span><Server size={11} /> Mode</span><b style={{ fontSize: 19, marginTop: 10, textTransform: 'capitalize' }}>{data.provider.mode}</b><small>{data.provider.configured ? 'External API configured' : 'Deterministic local fallback'}</small></div>
      </div>
      <div className="admin-ai-layout">
        <div>
          <section className="admin-panel" style={{ marginBottom: 12 }}>
            <div className="admin-panel-head"><h3>Agent registry</h3><span className="text-xs muted">Disable an agent to remove it from orchestration and direct workflows</span></div>
            <div className="admin-panel-body">
              {data.agents.map((agent) => (
                <div className="admin-agent-card" key={agent.id}>
                  <span className="admin-agent-icon"><Bot size={15} /></span>
                  <div className="admin-agent-copy">
                    <b>{agent.name}</b>
                    <p>{agent.description}</p>
                    <div className="flex-center gap-4 flex-wrap mt-8">{agent.capabilities.slice(0, 3).map((cap) => <span className="badge" key={cap} style={{ fontSize: 7.5 }}>{cap}</span>)}</div>
                  </div>
                  <div className="flex-center gap-8">
                    <span className={`badge ${agent.enabled ? 'active' : 'suspended'}`}>{agent.enabled ? 'online' : 'disabled'}</span>
                    <button className={`toggle ${agent.enabled ? 'on' : ''}`} onClick={() => toggleAgent(agent.id)} aria-label={`Toggle ${agent.name}`} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="admin-panel">
            <div className="admin-panel-head"><h3>Usage by agent · all time</h3><span className="text-xs muted">Characters processed</span></div>
            <div className="admin-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {data.usageByAgent.map((row) => (
                <div key={row.agent}>
                  <div className="flex-between text-xs" style={{ marginBottom: 5 }}><span style={{ fontFamily: 'var(--font-label)' }}>{row.agent}</span><span className="muted">{row.calls} calls · {Math.round(row.chars / 1000)}k chars</span></div>
                  <div className="usage-bar"><i style={{ width: `${(row.calls / maxCalls) * 100}%`, background: 'var(--accent)' }} /></div>
                </div>
              ))}
              {data.usageByAgent.length === 0 && <p className="muted text-xs">No AI calls recorded yet.</p>}
            </div>
          </section>
        </div>

        <div>
          <section className="admin-ai-config" style={{ marginBottom: 12 }}>
            <h3>Provider</h3>
            <div className="admin-settings-row"><div><h4>Runtime mode</h4><p>Local agents always work. Add an AI_API_KEY to enable hybrid provider mode.</p></div><span className={`badge ${data.provider.configured ? 'active' : 'draft'}`}>{data.provider.mode}</span></div>
            <div className="admin-settings-row"><div><h4>Model</h4><p>{data.provider.provider}</p></div><span className="badge">{data.provider.model}</span></div>
            <div className="admin-settings-row" style={{ borderBottom: 0 }}><div><h4>API configuration</h4><p>Set AI_API_KEY, AI_BASE_URL and AI_MODEL in .env. Secrets are never exposed to the browser.</p></div></div>
          </section>
          <section className="admin-ai-config">
            <h3>Monthly action limits</h3>
            <p className="text-xs muted" style={{ marginBottom: 8 }}>Applied to every subscription on the plan, including existing accounts.</p>
            {['starter', 'growth', 'scale'].map((plan) => (
              <div className="admin-plan-limit" key={plan}>
                <div><span style={{ textTransform: 'capitalize', fontFamily: 'var(--font-label)', fontSize: 10.5 }}>{plan}</span><div className="text-xs muted">{data.plans.find((p) => p.id === plan)?.activeSites || 0} sites</div></div>
                <input className="input" type="number" min="0" value={limits[plan]} onChange={(e) => setLimits({ ...limits, [plan]: Number(e.target.value) })} />
              </div>
            ))}
            <button className="btn btn-accent btn-sm btn-block mt-16" onClick={save} disabled={saving}>{saving ? <span className="spinner" /> : <><Check size={12} /> Apply limits</>}</button>
          </section>
          <div className="admin-panel" style={{ marginTop: 12 }}>
            <div className="admin-panel-head"><h3><Sparkles size={12} /> Orchestration rules</h3></div>
            <div className="admin-panel-body text-xs muted" style={{ display: 'flex', flexDirection: 'column', gap: 9, lineHeight: 1.55 }}>
              <p>Only agents matched to the request intent are invoked. Disabled agents are excluded before execution.</p>
              <p>Every agent result is validated and composed by the orchestrator before it reaches a customer.</p>
              <p>Generated content is never auto-published — the owner must apply it.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
