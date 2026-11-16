import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Check, ChevronRight, Eye, LayoutTemplate,
  Monitor, Smartphone, Sparkles, Tablet, Type,
} from 'lucide-react';
import { Logo } from '../components/Brand';
import { SiteRenderer } from '../components/SiteRenderer';
import { TemplateMockup } from '../components/TemplateMockup';
import { get } from '../lib/api';
import { previewPayload } from '../lib/preview';
import { useAuth } from '../context/AuthContext';
import type { Template } from '../lib/types';

export function TemplateDetail() {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const { user, sites } = useAuth();
  const [template, setTemplate] = useState<Template | null>(null);
  const [related, setRelated] = useState<Template[]>([]);
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    get<{ template: Template }>(`/templates/${templateId}`)
      .then((data) => {
        setTemplate(data.template);
        document.title = `${data.template.name} — ${data.template.style} · Nexora Studio`;
        return get<{ templates: Template[] }>(`/templates?category=${data.template.category}`);
      })
      .then((data) => setRelated(data.templates.filter((t) => t.id !== templateId).slice(0, 3)))
      .catch(() => setTemplate(null))
      .finally(() => setLoading(false));
    window.scrollTo(0, 0);
    return () => { document.title = 'Nexora Studio — Beautiful websites, intelligently made'; };
  }, [templateId]);

  const payload = useMemo(() => (template ? previewPayload(template) : null), [template]);

  function startWithTemplate() {
    if (!user) {
      navigate(`/register?template=${template?.id}`);
    } else {
      navigate(`/onboarding?template=${template?.id}`);
    }
  }

  if (loading) {
    return (
      <div className="template-detail">
        <div className="page-loader"><span className="spinner dark lg" /><p>Preparing the preview…</p></div>
      </div>
    );
  }

  if (!template || !payload) {
    return (
      <div className="template-detail">
        <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
          <h1 className="display" style={{ fontSize: 56 }}>Design not found.</h1>
          <Link to="/templates" className="btn mt-24">Back to the collection</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="template-detail">
      <div className="template-detail-bar">
        <div className="container template-detail-bar-inner">
          <Logo compact />
          <button className="icon-btn" onClick={() => navigate('/templates')} aria-label="Back to templates"><ArrowLeft size={16} /></button>
          <div className="template-detail-title">
            <h1>{template.name}</h1>
            <p>{template.style} · {template.categoryName}</p>
          </div>
          <div className="segmented" style={{ marginRight: 4 }}>
            <button className={device === 'desktop' ? 'active' : ''} onClick={() => setDevice('desktop')}><Monitor size={13} /></button>
            <button className={device === 'tablet' ? 'active' : ''} onClick={() => setDevice('tablet')}><Tablet size={13} /></button>
            <button className={device === 'mobile' ? 'active' : ''} onClick={() => setDevice('mobile')}><Smartphone size={13} /></button>
          </div>
          <button className="btn btn-accent btn-sm" onClick={startWithTemplate}>Use this template <ArrowRight size={14} /></button>
        </div>
      </div>

      <div className="container template-detail-layout">
        <div className={`preview-canvas device-${device}`}>
          <div className="preview-frame">
            <div className="preview-browserbar"><i /><i /><i /><span>{template.id}.nexora.site</span></div>
            <div className="detail-live-preview">
              <SiteRenderer payload={payload} preview />
            </div>
          </div>
          <div className="preview-device-toggle">
            <button className={`chip ${device === 'desktop' ? 'active' : ''}`} onClick={() => setDevice('desktop')}><Monitor size={12} /> Desktop</button>
            <button className={`chip ${device === 'tablet' ? 'active' : ''}`} onClick={() => setDevice('tablet')}><Tablet size={12} /> Tablet</button>
            <button className={`chip ${device === 'mobile' ? 'active' : ''}`} onClick={() => setDevice('mobile')}><Smartphone size={12} /> Mobile</button>
          </div>
          <div className="preview-mode-note">Interactive preview · Click products, open the bag, explore the whole design</div>
        </div>

        <aside className="template-detail-aside">
          <div className="detail-panel">
            <div className="flex-center gap-6 text-xs muted" style={{ marginBottom: 8 }}><Sparkles size={12} /> Curated template</div>
            <h2>{template.name}</h2>
            <div className="detail-style">{template.style}</div>
            <p>{template.description}</p>
            <div className="detail-swatches">
              {Object.entries(template.palette).slice(0, 6).map(([key, color]) => (
                <span key={key} title={`${key}: ${color}`} style={{ background: color }} />
              ))}
            </div>
            <div className="detail-specs">
              <div className="detail-spec"><span>Category</span><span>{template.categoryName}</span></div>
              <div className="detail-spec"><span>Layout</span><span style={{ textTransform: 'capitalize' }}>{template.layout}</span></div>
              <div className="detail-spec"><span>Typography</span><span>{template.fonts.heading.split(',')[0].replace(/'/g, '')}</span></div>
              <div className="detail-spec"><span>Cards</span><span style={{ textTransform: 'capitalize' }}>{template.card}</span></div>
              <div className="detail-spec"><span>Used by</span><span>{template.uses || 1} businesses</span></div>
            </div>
            <div className="detail-actions">
              <button className="btn btn-accent btn-block" onClick={startWithTemplate}>Use this template <ArrowRight size={15} /></button>
              {user && sites[0] && (
                <Link className="btn btn-outline btn-block" to={`/dashboard/${sites[0].id}/templates`}>Apply to an existing site</Link>
              )}
            </div>
            <div className="detail-note"><LayoutTemplate size={13} /> You can change every colour, font, image and section after choosing this design.</div>
            <div className="detail-tags">{template.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
          </div>

          <div className="detail-panel">
            <h3 style={{ fontFamily: 'var(--font-label)', fontSize: 12, fontWeight: 600, marginBottom: 12 }}>What's included</h3>
            <div className="detail-specs" style={{ margin: 0 }}>
              <div className="detail-spec"><span><Type size={12} /> Type system</span><span><Check size={13} /></span></div>
              <div className="detail-spec"><span><Sparkles size={12} /> Demo content</span><span><Check size={13} /></span></div>
              <div className="detail-spec"><span><Eye size={12} /> Responsive preview</span><span><Check size={13} /></span></div>
              <div className="detail-spec"><span><LayoutTemplate size={12} /> Reusable sections</span><span><Check size={13} /></span></div>
            </div>
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="section-topline">
              <div className="section-head"><div className="eyebrow">More in {template.categoryName}</div><h2 style={{ fontSize: 42 }}>You might also like.</h2></div>
              <Link to={`/templates?category=${template.category}`} className="text-link">See category <ChevronRight size={14} /></Link>
            </div>
            <div className="home-template-grid">
              {related.map((item) => (
                <Link to={`/templates/${item.id}`} key={item.id} aria-label={`Preview ${item.name}`}>
                  <TemplateMockup template={item} />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
