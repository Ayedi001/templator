import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Check, CheckCircle2, Copy, ExternalLink, Globe2,
  LayoutTemplate, Loader2, Rocket, Search, Sparkles, Wand2,
} from 'lucide-react';
import { Logo } from '../components/Brand';
import { CategoryIcon } from '../components/CategoryIcon';
import { TemplateMockup } from '../components/TemplateMockup';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { get, post } from '../lib/api';
import type { SiteDetails, Template, TemplateCategory } from '../lib/types';

interface AnalysisResult {
  analysis: {
    summary: string;
    audience: string;
    tone: string;
    positioning: string;
    sections: { title: string; reason: string; priority: string }[];
    features: string[];
    keywords: string[];
    recommendation: string;
  };
  recommendations: {
    recommendations: { id: string; name: string; style: string; reason: string; score: number; image: string; layout: string; palette: any; fonts: any }[];
    paletteAdvice: string;
    layoutAdvice: string;
  };
  agents: { id: string; name: string }[];
}

export function Onboarding() {
  const { user, sites, refresh } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const preselectedId = params.get('template');

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedId, setSelectedId] = useState(preselectedId || '');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [slug, setSlug] = useState('');
  const [slugStatus, setSlugStatus] = useState<{ available?: boolean; suggestion?: string; checking?: boolean }>({});
  const [showAll, setShowAll] = useState(false);
  const [allCategory, setAllCategory] = useState('all');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [createdSite, setCreatedSite] = useState<SiteDetails | null>(null);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    get<{ categories: TemplateCategory[] }>('/templates/categories').then((data) => setCategories(data.categories)).catch(() => undefined);
    get<{ templates: Template[] }>('/templates').then((data) => {
      setTemplates(data.templates);
      if (preselectedId) {
        const found = data.templates.find((t) => t.id === preselectedId);
        if (found) setCategory(found.category);
      }
    }).catch(() => undefined);
  }, [preselectedId]);

  useEffect(() => {
    if (!name) return;
    if (slug) return;
    setSlug(name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48));
  }, [name]);

  useEffect(() => {
    if (!slug || step !== 3) return;
    setSlugStatus((s) => ({ ...s, checking: true }));
    const timer = setTimeout(() => {
      get<{ available: boolean; suggestion: string }>(`/sites/slug-availability?slug=${encodeURIComponent(slug)}`)
        .then((data) => setSlugStatus({ available: data.available, suggestion: data.suggestion, checking: false }))
        .catch(() => setSlugStatus({ checking: false }));
    }, 350);
    return () => clearTimeout(timer);
  }, [slug, step]);

  const selectedTemplate = useMemo(() => templates.find((t) => t.id === selectedId) || null, [templates, selectedId]);
  const filteredAll = useMemo(() => templates.filter((t) => allCategory === 'all' || t.category === allCategory), [templates, allCategory]);

  async function analyze() {
    if (!name.trim() || !category) {
      setError('Add your business name and choose a category first.');
      return;
    }
    setAnalyzing(true);
    setError('');
    try {
      const data = await post<AnalysisResult>('/ai/analyze', { name, category, description });
      setAnalysis(data);
      if (!selectedId && data.recommendations.recommendations[0]) setSelectedId(data.recommendations.recommendations[0].id);
      setStep(2);
      window.scrollTo(0, 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  }

  function goStepThree() {
    if (!selectedId) {
      setError('Choose a design to continue.');
      return;
    }
    setError('');
    setStep(3);
    window.scrollTo(0, 0);
  }

  async function createWebsite(publishImmediately = false) {
    if (!selectedTemplate) return;
    setBusy(true);
    setError('');
    try {
      const data = await post<SiteDetails>('/sites', {
        name,
        category,
        templateId: selectedTemplate.id,
        description,
        slug: slugStatus.available === false && slugStatus.suggestion ? slugStatus.suggestion : slug,
      });
      if (publishImmediately) {
        const published = await post<SiteDetails & { publicUrl: string }>(`/sites/${data.site.id}/publish`);
        setCreatedSite(published);
      } else {
        setCreatedSite(data);
      }
      await refresh();
      setStep(4);
      toast('Your website is ready.');
      window.scrollTo(0, 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function publishNow() {
    if (!createdSite) return;
    setPublishing(true);
    try {
      const data = await post<SiteDetails>(`/sites/${createdSite.site.id}/publish`);
      setCreatedSite(data);
      toast('Website published.');
    } catch (err: any) {
      toast(err.message, 'error');
    } finally {
      setPublishing(false);
    }
  }

  const backTarget = sites.length ? '/dashboard' : '/login';

  return (
    <div className="onboarding-page">
      <header className="onboarding-top">
        <Logo />
        <div className="flex-center gap-16">
          <div className="onboarding-progress" aria-label={`Step ${step} of 4`}>
            {[1, 2, 3, 4].map((n) => <span key={n} className={n < step ? 'done' : n === step ? 'active' : ''} />)}
          </div>
          <span className="onboarding-step-count">0{step} / 04</span>
        </div>
        <Link to={backTarget} className="onboarding-back"><ArrowLeft size={13} /> {sites.length ? 'Dashboard' : 'Back'}</Link>
      </header>

      <main className="onboarding-main">
        {step === 1 && (
          <>
            <div className="onboarding-title">
              <div className="eyebrow">Let's get to know your business</div>
              <h1>Tell us what you do.<br />We'll do the heavy lifting.</h1>
              <p>A few details help our agents shape the site around your customers. You can change everything later.</p>
            </div>
            <div className="onboarding-grid">
              <div className="onboarding-card">
                <div className="form-grid">
                  <div className="field">
                    <label htmlFor="biz-name">Business name</label>
                    <input id="biz-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Atelier Noir" maxLength={100} />
                  </div>
                  <div className="field">
                    <label htmlFor="biz-cat">What kind of business is it?</label>
                    <div className="category-choice-grid" style={{ marginTop: 4 }}>
                      {categories.map((cat) => (
                        <button type="button" key={cat.id} className={`category-choice ${category === cat.id ? 'active' : ''}`} onClick={() => setCategory(cat.id)}>
                          <CategoryIcon name={cat.icon} size={17} />
                          <span>{cat.name}</span>
                          <small>{cat.count} designs</small>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="field">
                    <label htmlFor="biz-desc">Describe your business <span className="field-hint">Optional</span></label>
                    <textarea id="biz-desc" className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What do you offer, who do you serve, and what makes you different? A couple of sentences is plenty." maxLength={500} />
                  </div>
                  {error && <div className="form-error">{error}</div>}
                </div>
                <div className="onboarding-actions">
                  <span className="field-hint">Takes about 2 minutes</span>
                  <div className="onboarding-actions-right">
                    <button className="btn btn-accent" onClick={analyze} disabled={analyzing || !name || !category}>
                      {analyzing ? <><Loader2 size={15} className="spin" /> Analysing your business…</> : <><Wand2 size={15} /> Continue with AI</>}
                    </button>
                  </div>
                </div>
              </div>
              <div className="analysis-panel">
                <div className="eyebrow">Your AI team</div>
                <h3>A website strategy, before a single pixel.</h3>
                <p>The Business Analysis Agent studies your description and industry, recommends the right sections and functionality, then works with the Template Recommendation Agent to shortlist designs that fit.</p>
                <div className="analysis-list">
                  <div><Check size={13} /><span>Required pages and homepage sections</span></div>
                  <div><Check size={13} /><span>Your likely audience, tone and positioning</span></div>
                  <div><Check size={13} /><span>Three design recommendations with rationale</span></div>
                  <div><Check size={13} /><span>Relevant commerce, booking and content features</span></div>
                </div>
                <div className="agent-running"><i /><span>Orchestrator standing by · only relevant agents will run</span></div>
                {analyzing && (
                  <div className="mt-16" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div className="skeleton" style={{ height: 12, width: '85%' }} />
                    <div className="skeleton" style={{ height: 12, width: '70%' }} />
                    <div className="skeleton" style={{ height: 12, width: '60%' }} />
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="onboarding-title">
              <div className="eyebrow">Design recommendations</div>
              <h1>A starting point,<br />chosen for you.</h1>
              <p>{analysis?.analysis.summary || 'Our recommendation is based on your industry, audience and positioning. Preview any design in full before choosing.'}</p>
            </div>
            <div className="onboarding-grid">
              <div>
                {selectedTemplate && (
                  <div className="template-selected-card" style={{ marginBottom: 14 }}>
                    <TemplateMockup template={selectedTemplate} />
                    <div className="template-selected-info">
                      <div className="flex-between">
                        <div><b>{selectedTemplate.name}</b><p>{selectedTemplate.style} · {selectedTemplate.categoryName}</p></div>
                        <span className="current-template-pill"><Check size={9} /> Selected</span>
                      </div>
                    </div>
                  </div>
                )}
                <div className="onboarding-card" style={{ padding: 18 }}>
                  <div className="recommendation-list">
                    {(analysis?.recommendations.recommendations || []).map((rec) => {
                      const full = templates.find((t) => t.id === rec.id);
                      return (
                        <button type="button" className={`recommendation ${selectedId === rec.id ? 'active' : ''}`} key={rec.id} onClick={() => setSelectedId(rec.id)}>
                          <div className="recommendation-preview">{full && <TemplateMockup template={full} showChrome={false} />}</div>
                          <div className="recommendation-copy">
                            <b>{rec.name} {selectedId === rec.id && <Check size={11} />}</b>
                            <p>{rec.reason}</p>
                          </div>
                          <span className="recommendation-score">{rec.score}% fit</span>
                        </button>
                      );
                    })}
                  </div>
                  <button className="text-link mt-16" style={{ fontSize: 10 }} onClick={() => setShowAll(!showAll)}>
                    <LayoutTemplate size={12} /> {showAll ? 'Hide full library' : `Browse all ${templates.length || 64} templates`}
                  </button>
                </div>
                {showAll && (
                  <div className="onboarding-card mt-16" style={{ padding: 16 }}>
                    <div className="flex-center gap-6 flex-wrap mb-16">
                      <button className={`chip ${allCategory === 'all' ? 'active' : ''}`} style={{ minHeight: 29, fontSize: 10 }} onClick={() => setAllCategory('all')}>All</button>
                      {categories.map((cat) => <button key={cat.id} className={`chip ${allCategory === cat.id ? 'active' : ''}`} style={{ minHeight: 29, fontSize: 10 }} onClick={() => setAllCategory(cat.id)}>{cat.name}</button>)}
                    </div>
                    <div className="recommendation-list" style={{ maxHeight: 460, overflowY: 'auto', paddingRight: 4 }}>
                      {filteredAll.map((tpl) => (
                        <button type="button" className={`recommendation ${selectedId === tpl.id ? 'active' : ''}`} key={tpl.id} onClick={() => { setSelectedId(tpl.id); }}>
                          <div className="recommendation-preview"><TemplateMockup template={tpl} showChrome={false} /></div>
                          <div className="recommendation-copy"><b>{tpl.name}</b><p>{tpl.style} · {tpl.categoryName}</p></div>
                          {selectedId === tpl.id && <Check size={13} />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="analysis-panel">
                <div className="eyebrow">Business analysis</div>
                <h3>{analysis?.analysis.positioning || name}</h3>
                <p>{analysis?.analysis.audience}</p>
                <div style={{ marginTop: 16 }}>
                  <div className="label" style={{ marginBottom: 8 }}>Recommended sections</div>
                  <div className="analysis-list">
                    {analysis?.analysis.sections.slice(0, 5).map((section) => (
                      <div key={section.title}><Check size={13} /><span>{section.title}</span></div>
                    ))}
                  </div>
                </div>
                <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
                  <div className="label" style={{ marginBottom: 6 }}>Design direction</div>
                  <p style={{ fontSize: 10.5, color: 'var(--muted)' }}>{analysis?.recommendations.paletteAdvice}</p>
                </div>
                <div className="agent-running"><i /><span>Business Analysis + Template Recommendation</span></div>
              </div>
            </div>
            <div className="onboarding-actions" style={{ borderTop: 0, paddingTop: 0 }}>
              <button className="btn btn-ghost" onClick={() => setStep(1)}><ArrowLeft size={14} /> Back</button>
              <div className="onboarding-actions-right">
                {selectedTemplate && <Link className="btn btn-outline" to={`/templates/${selectedTemplate.id}`} target="_blank">Full preview <ExternalLink size={13} /></Link>}
                <button className="btn btn-accent" onClick={goStepThree} disabled={!selectedId}>Continue <ArrowRight size={15} /></button>
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="onboarding-title">
              <div className="eyebrow">One last detail</div>
              <h1>Choose your<br />web address.</h1>
              <p>Your website gets a live address the moment you publish. Custom domains can be connected later on Growth and Scale plans.</p>
            </div>
            <div className="onboarding-card">
              <div className="step-website-options">
                <div className="form-grid">
                  <div className="field">
                    <label htmlFor="site-slug">Website address</label>
                    <div style={{ display: 'flex', alignItems: 'stretch' }}>
                      <input id="site-slug" className="input" style={{ borderRadius: '12px 0 0 12px', fontFamily: 'var(--font-mono)', fontSize: 12 }} value={slug} onChange={(e) => { setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')); setSlugStatus({}); }} />
                      <span style={{ display: 'flex', alignItems: 'center', padding: '0 13px', border: '1px solid var(--line-strong)', borderLeft: 0, borderRadius: '0 12px 12px 0', background: 'var(--paper)', fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--muted)', whiteSpace: 'nowrap' }}>.nexora.studio</span>
                    </div>
                    <div className="field-hint" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      {slugStatus.checking ? <><Loader2 size={11} className="spin" /> Checking availability…</> : slugStatus.available === true ? <span style={{ color: '#2f7a42' }}><CheckCircle2 size={11} /> Available</span> : slugStatus.available === false ? <span style={{ color: '#9a3a28' }}>Taken — try {slugStatus.suggestion}</span> : 'Use letters, numbers and hyphens.'}
                    </div>
                  </div>
                  <div className="field">
                    <label htmlFor="site-desc">Website description <span className="field-hint">For search engines</span></label>
                    <textarea id="site-desc" className="textarea" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} />
                  </div>
                  <div className="publish-card">
                    <div><h3><Sparkles size={13} /> Draft or published?</h3><p>You can create the site as a draft and publish when everything is ready.</p></div>
                    <span className={`badge ${createdSite?.site.status === 'published' ? 'published' : 'draft'}`}>Draft</span>
                  </div>
                  {error && <div className="form-error">{error}</div>}
                </div>
                <div>
                  {selectedTemplate && (
                    <div className="template-selected-card">
                      <TemplateMockup template={selectedTemplate} />
                      <div className="template-selected-info"><b>{selectedTemplate.name}</b><p>{selectedTemplate.style}</p></div>
                    </div>
                  )}
                  <div className="launch-summary">
                    <div><Check size={13} /> Responsive across every device</div>
                    <div><Check size={13} /> AI-written starter content included</div>
                    <div><Check size={13} /> Products and categories pre-populated</div>
                    <div><Check size={13} /> Isolated workspace and secure data</div>
                  </div>
                </div>
              </div>
              <div className="onboarding-actions">
                <button className="btn btn-ghost" onClick={() => setStep(2)}><ArrowLeft size={14} /> Back</button>
                <div className="onboarding-actions-right">
                  <button className="btn btn-outline" onClick={() => createWebsite(false)} disabled={busy || !slug}>{busy ? <span className="spinner dark" /> : 'Save as draft'}</button>
                  <button className="btn btn-accent" onClick={() => createWebsite(true)} disabled={busy || !slug}>{busy ? <span className="spinner" /> : <><Rocket size={14} /> Create & publish</>}</button>
                </div>
              </div>
            </div>
          </>
        )}

        {step === 4 && createdSite && (
          <div className="onboarding-card">
            <div className="onboarding-success">
              <div className="onboarding-success-icon"><Check size={30} /></div>
              <div className="eyebrow" style={{ justifyContent: 'center' }}>Nicely done</div>
              <h2>{createdSite.site.name} is ready.</h2>
              <p>{createdSite.site.status === 'published' ? 'Your website is live and accepting visitors. Here is your address — share it with the world.' : 'Your website has been created as a draft. Preview it, make it yours, and publish when you are ready.'}</p>
              <div className="onboarding-url"><Globe2 size={13} /> {createdSite.site.slug}.nexora.studio <button style={{ border: 0, background: 'transparent', display: 'grid', placeItems: 'center', padding: 0 }} onClick={() => { navigator.clipboard?.writeText(`${createdSite.site.slug}.nexora.studio`); toast('Address copied.'); }}><Copy size={12} /></button></div>
              <div className="flex-center gap-10" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
                {createdSite.site.status === 'published' ? (
                  <a className="btn btn-outline" href={`/site/${createdSite.site.slug}`} target="_blank" rel="noreferrer">View live site <ExternalLink size={14} /></a>
                ) : (
                  <button className="btn btn-outline" onClick={publishNow} disabled={publishing}>{publishing ? <span className="spinner dark" /> : <><Rocket size={14} /> Publish now</>}</button>
                )}
                <Link className="btn btn-accent" to={`/dashboard/${createdSite.site.id}`}>Open my dashboard <ArrowRight size={15} /></Link>
              </div>
              <p style={{ fontSize: 10, color: 'var(--muted)', marginTop: 18 }}>Your workspace is private to you. Products, customers and settings are isolated from every other business on Nexora.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
