import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Check, LayoutTemplate, Search, Sparkles } from 'lucide-react';
import { useSite } from '../../components/dashboard/SiteLayout';
import { TemplateMockup } from '../../components/TemplateMockup';
import { Modal } from '../../components/Modal';
import { PageHeader } from '../../components/UI';
import { useToast } from '../../context/ToastContext';
import { get, patch, post } from '../../lib/api';
import type { Template, TemplateCategory } from '../../lib/types';

export function SiteTemplates() {
  const { details, reload } = useSite();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Template | null>(null);
  const [resetContent, setResetContent] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    get<{ templates: Template[] }>('/templates').then((data) => setTemplates(data.templates)).catch(() => undefined);
    get<{ categories: TemplateCategory[] }>('/templates/categories').then((data) => setCategories(data.categories)).catch(() => undefined);
  }, []);

  const filtered = useMemo(() => templates.filter((t) => {
    const matchesCat = category === 'all' || t.category === category;
    const matchesSearch = !search || `${t.name} ${t.style} ${t.categoryName} ${t.tags.join(' ')}`.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  }), [templates, category, search]);

  async function apply() {
    if (!selected) return;
    setApplying(true);
    try {
      await patch(`/sites/${details.site.id}/apply-template`, { templateId: selected.id, resetContent });
      await reload();
      toast(`${selected.name} applied. Your content is intact — check the live design.`);
      setSelected(null);
    } catch (err: any) { toast(err.message, 'error'); } finally { setApplying(false); }
  }

  return (
    <>
      <PageHeader
        eyebrow="Marketplace"
        title="Change your design"
        description="Preview a new template and apply it to this website. Your products, settings and content are kept unless you choose to start fresh."
        actions={<Link className="btn btn-outline btn-sm" to={`/dashboard/${details.site.id}/design`}>Open design studio <ArrowUpRight size={13} /></Link>}
      />
      <div className="toolbar">
        <div className="dash-marketplace-filters">
          <button className={`chip ${category === 'all' ? 'active' : ''}`} style={{ minHeight: 32, fontSize: 10.5 }} onClick={() => setCategory('all')}>All</button>
          {categories.map((cat) => <button key={cat.id} className={`chip ${category === cat.id ? 'active' : ''}`} style={{ minHeight: 32, fontSize: 10.5 }} onClick={() => setCategory(cat.id)}>{cat.name}</button>)}
        </div>
        <label className="search-box"><Search size={14} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search designs…" /></label>
      </div>
      <div className="dash-marketplace-grid">
        {filtered.map((template) => {
          const current = template.id === details.site.templateId;
          return (
            <article className="dash-template-card" key={template.id}>
              <div className="dash-template-preview"><TemplateMockup template={template} /></div>
              <div className="dash-template-body">
                <div className="dash-template-title">
                  <div><h3>{template.name}</h3><p>{template.style} · {template.categoryName}</p></div>
                  {current && <span className="current-template-pill"><Check size={8} /> Current</span>}
                </div>
                <div className="dash-template-actions">
                  <Link className="btn btn-outline btn-sm" to={`/templates/${template.id}`} target="_blank">Preview <ArrowUpRight size={11} /></Link>
                  <button className="btn btn-sm" disabled={current} onClick={() => { setSelected(template); setResetContent(false); }}>{current ? 'In use' : 'Apply'}</button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={`Apply ${selected?.name || 'template'}?`}
        subtitle="This changes the visual design of your website."
        footer={<>
          <button className="btn btn-ghost" onClick={() => setSelected(null)}>Cancel</button>
          <button className="btn btn-accent" onClick={apply} disabled={applying}>{applying ? <span className="spinner" /> : <><Sparkles size={13} /> Apply template</>}</button>
        </>}
      >
        {selected && (
          <>
            <div style={{ borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}><TemplateMockup template={selected} /></div>
            <p className="confirm-copy">Your products, customers, orders and content will be preserved. Colours, typography and layout switch to {selected.name}.</p>
            <label className="checkbox mt-16"><input type="checkbox" checked={resetContent} onChange={(e) => setResetContent(e.target.checked)} /> Replace my content with this template's demo content</label>
            {resetContent && <div className="form-error mt-12">This will overwrite your current headlines, story and contact copy. This cannot be undone.</div>}
          </>
        )}
      </Modal>
    </>
  );
}
