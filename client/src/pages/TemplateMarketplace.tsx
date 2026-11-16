import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Search, SlidersHorizontal, Sparkles } from 'lucide-react';
import { MarketingFooter, MarketingNav } from '../components/marketing/MarketingNav';
import { TemplateCard } from '../components/marketing/TemplateCard';
import { get } from '../lib/api';
import type { Template, TemplateCategory } from '../lib/types';

export function TemplateMarketplace() {
  const [params, setParams] = useSearchParams();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [search, setSearch] = useState(params.get('search') || '');
  const [loading, setLoading] = useState(true);
  const activeCategory = params.get('category') || 'all';

  useEffect(() => {
    Promise.all([
      get<{ templates: Template[] }>('/templates'),
      get<{ categories: TemplateCategory[] }>('/templates/categories'),
    ]).then(([templatesData, categoryData]) => {
      setTemplates(templatesData.templates);
      setCategories(categoryData.categories);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return templates.filter((template) => {
      const matchesCategory = activeCategory === 'all' || template.category === activeCategory;
      const matchesSearch = !query || [template.name, template.style, template.description, template.categoryName, ...template.tags].join(' ').toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [templates, activeCategory, search]);

  function setCategory(category: string) {
    const next = new URLSearchParams(params);
    if (category === 'all') next.delete('category');
    else next.set('category', category);
    setParams(next, { replace: true });
  }

  const activeCat = categories.find((c) => c.id === activeCategory);
  const totalTemplates = templates.length || 64;

  return (
    <div className="landing">
      <MarketingNav />
      <main className="templates-page">
        <div className="container">
          <header className="templates-hero">
            <div className="eyebrow" style={{ justifyContent: 'center' }}>The template collection</div>
            <h1>Find the design your business <em style={{ fontStyle: 'italic', color: 'var(--accent-dark)' }}>already deserves.</em></h1>
            <p>{totalTemplates} original templates across 13 industries. Every one is responsive, editable and built to look like it was made just for you.</p>
          </header>

          <div className="marketplace-toolbar">
            <div className="marketplace-filters">
              <button className={`chip ${activeCategory === 'all' ? 'active' : ''}`} onClick={() => setCategory('all')}>All templates <span className="chip-count">{templates.length}</span></button>
              {categories.map((category) => (
                <button key={category.id} className={`chip ${activeCategory === category.id ? 'active' : ''}`} onClick={() => setCategory(category.id)}>
                  {category.name} <span className="chip-count">{category.count}</span>
                </button>
              ))}
            </div>
            <label className="marketplace-search">
              <Search size={15} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search styles, industries…" aria-label="Search templates" />
            </label>
          </div>

          <div className="marketplace-count">
            <span>
              <SlidersHorizontal size={12} style={{ display: 'inline', marginRight: 5, verticalAlign: -2 }} />
              {loading ? 'Loading collection…' : `${filtered.length} template${filtered.length === 1 ? '' : 's'}${activeCat ? ` in ${activeCat.name}` : ''}`}
            </span>
            <span>{activeCat?.blurb || 'Every design responsive · Preview before you choose'}</span>
          </div>

          {loading ? (
            <div className="marketplace-grid">
              {[...Array(6)].map((_, i) => <div className="skeleton" key={i} style={{ aspectRatio: '4/3.7', borderRadius: 18 }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="template-empty">
              <Sparkles size={26} style={{ margin: '0 auto 16px', color: 'var(--accent)' }} />
              <h3>No designs match that yet.</h3>
              <p>Try a different category or a broader search.</p>
              <button className="btn btn-outline mt-16" onClick={() => { setSearch(''); setCategory('all'); }}>Reset filters</button>
            </div>
          ) : (
            <div className="marketplace-grid">
              {filtered.map((template) => <TemplateCard key={template.id} template={template} featuredLabel />)}
            </div>
          )}

          <div className="cta-band" style={{ marginBottom: 80 }}>
            <div className="eyebrow" style={{ justifyContent: 'center', color: 'rgba(255,255,255,.7)' }}>Can't choose?</div>
            <h2 style={{ marginTop: 14 }}>Let the AI find your fit.</h2>
            <p>Tell us about your business and the Template Recommendation Agent will shortlist three designs with a reason for each.</p>
            <Link className="btn btn-light btn-lg" to="/register">Start with AI <ArrowRight size={16} /></Link>
          </div>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
