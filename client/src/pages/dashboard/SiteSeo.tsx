import { useEffect, useState } from 'react';
import { AlertTriangle, Check, ExternalLink, Globe2, Loader2, Search, Sparkles, Wand2 } from 'lucide-react';
import { useSite } from '../../components/dashboard/SiteLayout';
import { PageHeader } from '../../components/UI';
import { useToast } from '../../context/ToastContext';
import { get, patch, post } from '../../lib/api';

interface Audit {
  score: number;
  grade: string;
  title: string;
  description: string;
  keywords: string[];
  issues: { severity: string; title: string; detail: string; fix: string }[];
  quickWins: string[];
  suggestions: string[];
  structuredData: any;
  socialPreview: any;
}

export function SiteSeo() {
  const { details, reload } = useSite();
  const { toast } = useToast();
  const [audit, setAudit] = useState<Audit | null>(null);
  const [running, setRunning] = useState(false);
  const [seo, setSeo] = useState({
    title: details.site.settings.seo?.title || '',
    description: details.site.settings.seo?.description || '',
    keywords: (details.site.settings.seo?.keywords || []).join(', '),
    indexable: details.site.settings.seo?.indexable !== false,
  });
  const [saving, setSaving] = useState(false);

  async function runAudit(quiet = false) {
    setRunning(true);
    try {
      const data = await post<{ result: Audit }>('/ai/seo', { siteId: details.site.id });
      setAudit(data.result);
      setSeo({ title: data.result.title, description: data.result.description, keywords: data.result.keywords.join(', '), indexable: seo.indexable });
      if (!quiet) toast('SEO audit complete.');
    } catch (err: any) {
      if (!quiet) toast(err.message, 'error');
    } finally { setRunning(false); }
  }

  useEffect(() => { runAudit(true); }, [details.site.id]);

  async function save() {
    setSaving(true);
    try {
      await patch(`/sites/${details.site.id}/settings`, {
        settings: { seo: { title: seo.title, description: seo.description, keywords: seo.keywords.split(',').map((k) => k.trim()).filter(Boolean), indexable: seo.indexable } },
      });
      await reload();
      toast('SEO settings saved.');
    } catch (err: any) { toast(err.message, 'error'); } finally { setSaving(false); }
  }

  const scoreColor = audit ? audit.score >= 75 ? '#3a8b4a' : audit.score >= 55 ? '#c58a26' : '#b64a35' : '#e2ddd3';
  const publicUrl = `${details.site.slug}.nexora.studio`;

  return (
    <>
      <PageHeader
        eyebrow="Visibility"
        title="SEO"
        description="Search metadata, content health and prioritised improvements. The SEO Agent reads your actual pages and catalogue."
        actions={<>
          <button className="btn btn-outline btn-sm" onClick={() => runAudit()} disabled={running}>{running ? <Loader2 size={13} className="spin" /> : <Sparkles size={13} />} {running ? 'Auditing…' : 'Run audit'}</button>
          <button className="btn btn-accent btn-sm" onClick={save} disabled={saving}>{saving ? <span className="spinner" /> : 'Save SEO settings'}</button>
        </>}
      />
      <div className="seo-grid">
        <aside className="seo-score-card">
          <div className="seo-ring" style={{ background: `conic-gradient(${scoreColor} ${audit?.score || 0}%, #eee9e0 0)` }}>
            <div className="seo-ring-value">{running && !audit ? '—' : audit?.score ?? '—'}<small>/100</small></div>
          </div>
          <div className="seo-score-label">{audit?.grade || 'Not audited yet'}</div>
          <p>{audit ? `${audit.issues.length} improvement${audit.issues.length === 1 ? '' : 's'} found. Focus on the high-priority items first.` : 'Run the audit to see how your website performs in search.'}</p>
          <div className="seo-breakdown">
            <div><span>Title length</span><b>{seo.title.length} / 60</b></div>
            <div><span>Meta description</span><b>{seo.description.length} / 158</b></div>
            <div><span>Indexable</span><b>{seo.indexable ? 'Yes' : 'No'}</b></div>
            <div><span>Published</span><b>{details.site.status === 'published' ? 'Yes' : 'Draft'}</b></div>
          </div>
          <button className="btn btn-outline btn-sm btn-block mt-16" onClick={() => runAudit()} disabled={running}>{running ? <span className="spinner dark" /> : <><Wand2 size={12} /> Re-audit</>}</button>
        </aside>

        <div className="seo-main">
          <section className="seo-field-card">
            <h3><Search size={14} /> Search appearance</h3>
            <div className="seo-preview-google">
              <div className="seo-preview-url">https://{publicUrl}</div>
              <div className="seo-preview-title">{seo.title || 'Your page title'}</div>
              <div className="seo-preview-desc">{seo.description || 'Your meta description will appear here.'}</div>
            </div>
            <div className="form-grid">
              <div className="field">
                <label>Page title <span className="field-hint">{seo.title.length}/60</span></label>
                <input className="input" value={seo.title} onChange={(e) => setSeo({ ...seo, title: e.target.value })} maxLength={70} />
              </div>
              <div className="field">
                <label>Meta description <span className="field-hint">{seo.description.length}/158</span></label>
                <textarea className="textarea" rows={3} value={seo.description} onChange={(e) => setSeo({ ...seo, description: e.target.value })} maxLength={180} />
              </div>
              <div className="field">
                <label>Target keywords <span className="field-hint">Comma separated</span></label>
                <input className="input" value={seo.keywords} onChange={(e) => setSeo({ ...seo, keywords: e.target.value })} placeholder="fashion, sustainable clothing, london" />
              </div>
              <div className="toggle-row">
                <div><h4>Allow search engines to index this site</h4><p>Turn off while the website is still being built. Remember to re-enable before launch.</p></div>
                <button className={`toggle ${seo.indexable ? 'on' : ''}`} onClick={() => setSeo({ ...seo, indexable: !seo.indexable })} aria-label="Toggle indexable" />
              </div>
            </div>
            <div className="flex-center gap-8 mt-16">
              <button className="btn btn-outline btn-sm" onClick={() => { if (audit) setSeo({ ...seo, title: audit.title, description: audit.description, keywords: audit.keywords.join(', ') }); }} disabled={!audit}><Sparkles size={12} /> Use AI suggestions</button>
              <button className="btn btn-sm" onClick={save} disabled={saving}>{saving ? <span className="spinner" /> : 'Save'}</button>
            </div>
          </section>

          <section className="seo-field-card">
            <h3><AlertTriangle size={14} /> Improvements</h3>
            {running && !audit ? <div className="ai-thinking"><span className="spinner dark" /> Reading your website…</div> : audit?.issues.length ? (
              <div className="seo-issues">
                {audit.issues.map((issue, i) => (
                  <div className="seo-issue" key={i}>
                    <span className={`seo-issue-icon ${issue.severity}`}><AlertTriangle size={12} /></span>
                    <div style={{ flex: 1 }}>
                      <b>{issue.title} <span className={`badge ${issue.severity === 'high' ? 'cancelled' : issue.severity === 'medium' ? 'draft' : 'processing'}`} style={{ marginLeft: 5 }}>{issue.severity}</span></b>
                      <p>{issue.detail}</p>
                      <p style={{ color: 'var(--ink-soft)' }}><b>Fix:</b> {issue.fix}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : audit ? (
              <div className="flex-center gap-8" style={{ color: '#2f7a42', fontSize: 11 }}><Check size={14} /> No major issues found. Keep publishing useful content.</div>
            ) : <p className="muted text-xs">Run an audit to see prioritised recommendations.</p>}
          </section>

          <div className="overview-lower">
            <section className="seo-field-card">
              <h3><Sparkles size={14} /> SEO Agent suggestions</h3>
              <div className="seo-issues">
                {(audit?.suggestions || []).map((suggestion) => (
                  <div className="seo-issue" key={suggestion}><span className="seo-issue-icon low"><Check size={12} /></span><div><p style={{ fontSize: 10.5, color: 'var(--ink-soft)' }}>{suggestion}</p></div></div>
                ))}
                {!audit && <p className="muted text-xs">Suggestions appear after the first audit.</p>}
              </div>
            </section>
            <section className="seo-field-card">
              <h3><Globe2 size={14} /> Keywords in use</h3>
              <div className="seo-keyword-list">
                {seo.keywords.split(',').map((keyword) => keyword.trim()).filter(Boolean).map((keyword) => <span key={keyword}>{keyword}</span>)}
                {!seo.keywords && <p className="muted text-xs">No keywords added yet.</p>}
              </div>
              <div className="divider" style={{ margin: '16px 0' }} />
              <h3 style={{ marginBottom: 8 }}>Structured data</h3>
              <p className="field-hint">LocalBusiness and Organization schema is generated automatically for every page.</p>
              <a className="text-link mt-12" style={{ fontSize: 10 }} href={`/site/${details.site.slug}`} target="_blank" rel="noreferrer">Open live website <ExternalLink size={11} /></a>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
