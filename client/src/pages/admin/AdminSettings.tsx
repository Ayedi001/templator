import { useEffect, useState } from 'react';
import { Bot, Check, Database, Globe2, KeyRound, Mail, Save, Server, ShieldCheck, Sparkles } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { get, patch } from '../../lib/api';

interface SettingsData {
  settings: Record<string, any>;
  provider: { enabled: boolean; configured: boolean; provider: string; model: string; mode: string };
}

export function AdminSettings() {
  const { toast } = useToast();
  const [data, setData] = useState<SettingsData | null>(null);
  const [settings, setSettings] = useState<Record<string, any>>({
    'platform.name': 'Nexora Studio',
    'platform.tagline': 'Beautiful websites, intelligently made.',
    'support.email': 'support@nexora.studio',
    'ai.autoPublish': false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    get<SettingsData>('/admin/settings').then((result) => {
      setData(result);
      setSettings((prev) => ({ ...prev, ...result.settings }));
    }).catch(() => undefined);
  }, []);

  async function save() {
    setSaving(true);
    try {
      await patch('/admin/settings', { settings: {
        'platform.name': settings['platform.name'],
        'platform.tagline': settings['platform.tagline'],
        'support.email': settings['support.email'],
        'ai.autoPublish': Boolean(settings['ai.autoPublish']),
      } });
      toast('Platform settings saved.');
    } catch (err: any) { toast(err.message, 'error'); } finally { setSaving(false); }
  }

  return (
    <>
      <div className="admin-page-head">
        <div><div className="eyebrow">Configuration</div><h1>Platform settings</h1><p>Public identity, support contact and the environment powering Nexora Studio.</p></div>
        <button className="btn btn-accent btn-sm" onClick={save} disabled={saving}>{saving ? <span className="spinner" /> : <><Save size={13} /> Save settings</>}</button>
      </div>
      <div className="admin-grid">
        <section className="admin-panel">
          <div className="admin-panel-head"><h3><Globe2 size={13} /> Platform identity</h3></div>
          <div className="admin-panel-body">
            <div className="admin-settings-row"><div><h4>Platform name</h4><p>Used in page titles, emails and invoice headers.</p></div><input className="input" value={settings['platform.name'] || ''} onChange={(e) => setSettings({ ...settings, 'platform.name': e.target.value })} /></div>
            <div className="admin-settings-row"><div><h4>Tagline</h4><p>A short line describing the product.</p></div><input className="input" value={settings['platform.tagline'] || ''} onChange={(e) => setSettings({ ...settings, 'platform.tagline': e.target.value })} /></div>
            <div className="admin-settings-row" style={{ borderBottom: 0 }}><div><h4>Support email</h4><p>Shown to owners when they need help.</p></div><input className="input" type="email" value={settings['support.email'] || ''} onChange={(e) => setSettings({ ...settings, 'support.email': e.target.value })} /></div>
          </div>
        </section>
        <section className="admin-panel">
          <div className="admin-panel-head"><h3><Server size={13} /> Environment</h3><span className="badge active">Healthy</span></div>
          <div className="admin-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="domain-card"><span className="domain-icon"><Database size={14} /></span><div className="domain-copy"><b>SQLite · WAL mode</b><span>Foreign keys on · tenant-scoped queries</span></div><span className="badge active">Connected</span></div>
            <div className="domain-card"><span className="domain-icon"><Bot size={14} /></span><div className="domain-copy"><b>{data?.provider.provider || 'Nexora local'}</b><span>{data?.provider.model || 'nexora-local-v1'}</span></div><span className={`badge ${data?.provider.configured ? 'active' : 'draft'}`}>{data?.provider.mode || 'local'}</span></div>
            <div className="domain-card"><span className="domain-icon"><ShieldCheck size={14} /></span><div className="domain-copy"><b>Authentication</b><span>JWT bearer · bcrypt password hashing</span></div><span className="badge active">Secured</span></div>
          </div>
        </section>
      </div>

      <div className="admin-grid" style={{ marginTop: 12 }}>
        <section className="admin-panel">
          <div className="admin-panel-head"><h3><Sparkles size={13} /> AI publishing policy</h3></div>
          <div className="admin-panel-body">
            <div className="toggle-row"><div><h4>Allow AI to auto-publish changes</h4><p>When off, every AI suggestion must be explicitly applied by the owner. Recommended.</p></div><button className={`toggle ${settings['ai.autoPublish'] ? 'on' : ''}`} onClick={() => setSettings({ ...settings, 'ai.autoPublish': !settings['ai.autoPublish'] })} aria-label="Toggle auto publish" /></div>
            <div className="divider" />
            <div className="flex-center gap-8 text-xs muted" style={{ marginTop: 14 }}><Check size={13} style={{ color: '#2f7a42' }} /> Generated content is validated by the orchestrator before it is shown.</div>
            <div className="flex-center gap-8 text-xs muted mt-8"><Mail size={13} /> Support contact: {settings['support.email']}</div>
          </div>
        </section>
        <section className="admin-panel">
          <div className="admin-panel-head"><h3><KeyRound size={13} /> API & secrets</h3></div>
          <div className="admin-panel-body text-xs muted" style={{ display: 'flex', flexDirection: 'column', gap: 10, lineHeight: 1.55 }}>
            <p>AI provider credentials live only in server environment variables — never in the browser bundle or database.</p>
            <div className="domain-copy" style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 8, padding: 12 }}><b style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5 }}>AI_API_KEY=••••••••</b><span style={{ marginTop: 5 }}>Optional. Without it, every agent uses deterministic local intelligence.</span></div>
            <p>Configure AI_BASE_URL, AI_MODEL, JWT_SECRET and DATABASE_PATH in your <code style={{ fontFamily: 'var(--font-mono)' }}>.env</code> file before production.</p>
          </div>
        </section>
      </div>
    </>
  );
}
