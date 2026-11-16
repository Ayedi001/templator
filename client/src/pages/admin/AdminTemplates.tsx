import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Copy, Eye, Plus, Search, Sparkles, Trash2, Wand2 } from 'lucide-react';
import { TemplateMockup } from '../../components/TemplateMockup';
import { ConfirmDialog, Modal } from '../../components/Modal';
import { useToast } from '../../context/ToastContext';
import { del, get, patch, post } from '../../lib/api';
import type { Palette, Template, TemplateCategory } from '../../lib/types';

const PALETTES = [
  { name: 'Ink & cream', palette: { primary: '#171411', secondary: '#8b8276', accent: '#e8613a', bg: '#f5f1e8', surface: '#fffefa', text: '#171411', muted: '#7c746a', line: '#ded7ca' } },
  { name: 'Forest & brass', palette: { primary: '#224233', secondary: '#b99868', accent: '#b99868', bg: '#f6f3ed', surface: '#fffdf8', text: '#1d2a23', muted: '#738076', line: '#ddd8cd' } },
  { name: 'Cobalt & ice', palette: { primary: '#1a3cff', secondary: '#9fb4ff', accent: '#c8ff3d', bg: '#071033', surface: '#0d1a4d', text: '#f0f5ff', muted: '#93a4d9', line: '#1f326f' } },
  { name: 'Rose & clay', palette: { primary: '#9b4f3f', secondary: '#d6a38d', accent: '#d6a38d', bg: '#fbf1e8', surface: '#fff9f3', text: '#3d2922', muted: '#8c756a', line: '#edd9cb' } },
  { name: 'Ocean', palette: { primary: '#0d5c63', secondary: '#f4a259', accent: '#f4a259', bg: '#eef7f5', surface: '#fbfffd', text: '#123d3f', muted: '#678080', line: '#d4e7e2' } },
  { name: 'Violet studio', palette: { primary: '#4a2f8f', secondary: '#7c5cff', accent: '#ffb347', bg: '#f7f4ff', surface: '#ffffff', text: '#241844', muted: '#71688d', line: '#e6e0f5' } },
];

interface EditState {
  id?: string;
  name: string;
  style: string;
  description: string;
  category: string;
  enabled: boolean;
  featured: boolean;
  palette: Palette;
  baseTemplateId?: string;
  isNew?: boolean;
}

export function AdminTemplates() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [enabledFilter, setEnabledFilter] = useState('all');
  const [editing, setEditing] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Template | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    try {
      const [data, cats] = await Promise.all([
        get<{ templates: Template[] }>('/admin/templates'),
        get<{ categories: TemplateCategory[] }>('/templates/categories'),
      ]);
      setTemplates(data.templates);
      setCategories(cats.categories);
    } catch (err: any) { toast(err.message, 'error'); }
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => templates.filter((t) => {
    const matchesSearch = !search || `${t.name} ${t.style} ${t.categoryName}`.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'all' || t.category === category;
    const matchesEnabled = enabledFilter === 'all' || (enabledFilter === 'enabled' ? t.enabled : !t.enabled);
    return matchesSearch && matchesCategory && matchesEnabled;
  }), [templates, search, category, enabledFilter]);

  function openEdit(template: Template) {
    setEditing({
      id: template.id, name: template.name, style: template.style, description: template.description,
      category: template.category, enabled: template.enabled, featured: template.featured, palette: template.palette,
    });
  }

  function openCreate() {
    const base = templates[0];
    setEditing({
      name: '', style: base?.style || 'Original design', description: '',
      category: base?.category || 'ecommerce', enabled: true, featured: false,
      palette: base?.palette || PALETTES[0].palette, baseTemplateId: base?.id, isNew: true,
    });
  }

  async function save() {
    if (!editing) return;
    if (!editing.name.trim()) { toast('Give the template a name.', 'error'); return; }
    setSaving(true);
    try {
      if (editing.isNew) {
        await post('/admin/templates', {
          name: editing.name, baseTemplateId: editing.baseTemplateId, category: editing.category,
          style: editing.style, description: editing.description, palette: editing.palette,
        });
        toast('Template created and added to the marketplace.');
      } else {
        await patch(`/admin/templates/${editing.id}`, {
          name: editing.name, style: editing.style, description: editing.description,
          category: editing.category, enabled: editing.enabled, featured: editing.featured, palette: editing.palette,
        });
        toast('Template updated.');
      }
      setEditing(null);
      await load();
    } catch (err: any) { toast(err.message, 'error'); } finally { setSaving(false); }
  }

  async function toggle(template: Template, key: 'enabled' | 'featured') {
    try {
      await patch(`/admin/templates/${template.id}`, { [key]: !template[key] });
      setTemplates((prev) => prev.map((t) => t.id === template.id ? { ...t, [key]: !template[key] } : t));
      toast(`${template.name} ${!template[key] ? (key === 'enabled' ? 'published to marketplace' : 'featured') : (key === 'enabled' ? 'unpublished' : 'unfeatured')}.`);
    } catch (err: any) { toast(err.message, 'error'); }
  }

  async function remove() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const data = await del<{ message?: string; disabled: boolean }>(`/admin/templates/${deleteTarget.id}`);
      toast(data.message || 'Template deleted.');
      setDeleteTarget(null);
      await load();
    } catch (err: any) { toast(err.message, 'error'); } finally { setDeleting(false); }
  }

  return (
    <>
      <div className="admin-page-head">
        <div><div className="eyebrow">Marketplace</div><h1>Template library</h1><p>{templates.filter((t) => t.enabled).length} active designs · {templates.length} total. Create variations, feature designs and control availability.</p></div>
        <button className="btn btn-accent btn-sm" onClick={openCreate}><Plus size={13} /> Add template</button>
      </div>
      <div className="admin-table-toolbar">
        <div className="filter-tabs">
          <button className={category === 'all' ? 'active' : ''} onClick={() => setCategory('all')}>All categories</button>
          {categories.map((cat) => <button key={cat.id} className={category === cat.id ? 'active' : ''} onClick={() => setCategory(cat.id)}>{cat.name} <span className="filter-count">{templates.filter((t) => t.category === cat.id).length}</span></button>)}
        </div>
        <div className="flex-center gap-8">
          <div className="segmented">
            <button className={enabledFilter === 'all' ? 'active' : ''} onClick={() => setEnabledFilter('all')}>All</button>
            <button className={enabledFilter === 'enabled' ? 'active' : ''} onClick={() => setEnabledFilter('enabled')}>Enabled</button>
            <button className={enabledFilter === 'disabled' ? 'active' : ''} onClick={() => setEnabledFilter('disabled')}>Hidden</button>
          </div>
          <label className="search-box"><Search size={14} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search templates…" /></label>
        </div>
      </div>
      <div className="admin-template-grid">
        {filtered.map((template) => (
          <article className="admin-template-card" key={template.id} style={{ opacity: template.enabled ? 1 : .55 }}>
            <TemplateMockup template={template} />
            <div className="admin-template-body">
              <h3>{template.name} {template.featured && <Sparkles size={10} style={{ color: 'var(--accent)' }} />}<span>{template.uses} uses</span></h3>
              <p>{template.categoryName} · {template.layout}</p>
              <div className="flex-center gap-4 mt-8 flex-wrap">
                <span className={`badge ${template.enabled ? 'active' : 'archived'}`}>{template.enabled ? 'enabled' : 'hidden'}</span>
                {template.featured && <span className="badge draft">featured</span>}
              </div>
              <div className="admin-template-actions">
                <Link className="btn btn-outline btn-sm" to={`/templates/${template.id}`} target="_blank">Preview</Link>
                <button className="btn btn-outline btn-sm" onClick={() => openEdit(template)}>Edit</button>
                <button className="btn btn-outline btn-sm" onClick={() => toggle(template, 'enabled')} title={template.enabled ? 'Hide' : 'Enable'}>{template.enabled ? 'Hide' : 'Enable'}</button>
                <button className="icon-btn danger" style={{ width: 25, height: 25 }} onClick={() => setDeleteTarget(template)} aria-label="Delete template"><Trash2 size={11} /></button>
              </div>
            </div>
          </article>
        ))}
      </div>
      {filtered.length === 0 && <div className="admin-panel" style={{ padding: 50, textAlign: 'center', color: 'var(--muted)' }}>No templates match those filters.</div>}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?.isNew ? 'Create a template' : `Edit ${editing?.name}`}
        subtitle={editing?.isNew ? 'Start from an existing design system and give it a distinct identity.' : 'Changes are applied to the marketplace immediately.'}
        size="wide"
        footer={<><button className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button><button className="btn btn-accent" onClick={save} disabled={saving}>{saving ? <span className="spinner" /> : editing?.isNew ? 'Create template' : 'Save template'}</button></>}
      >
        {editing && (
          <div className="form-grid">
            <div className="field-row">
              <div className="field"><label>Template name</label><input className="input" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="e.g. Atelier Deux" /></div>
              <div className="field"><label>Category</label><select className="select" value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })}>{categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}</select></div>
            </div>
            <div className="field"><label>Style descriptor</label><input className="input" value={editing.style} onChange={(e) => setEditing({ ...editing, style: e.target.value })} placeholder="Editorial fashion house" /></div>
            <div className="field"><label>Description</label><textarea className="textarea" rows={2} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} placeholder="What makes this template distinctive?" /></div>
            {editing.isNew && (
              <div className="field"><label>Base design system</label><select className="select" value={editing.baseTemplateId} onChange={(e) => { const base = templates.find((t) => t.id === e.target.value); setEditing({ ...editing, baseTemplateId: e.target.value, category: base?.category || editing.category, palette: base?.palette || editing.palette }); }}>{templates.map((t) => <option key={t.id} value={t.id}>{t.name} · {t.categoryName}</option>)}</select><p className="field-hint">The new template inherits this layout, typography and demo content — then gets its own palette and identity.</p></div>
            )}
            <div className="field">
              <label>Palette</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                {PALETTES.map((preset) => (
                  <button type="button" key={preset.name} onClick={() => setEditing({ ...editing, palette: preset.palette })} style={{ border: `1px solid ${JSON.stringify(editing.palette) === JSON.stringify(preset.palette) ? 'var(--ink)' : 'var(--line)'}`, borderRadius: 8, padding: 6, background: 'var(--white)', textAlign: 'left' }}>
                    <div style={{ display: 'flex', height: 20, borderRadius: 4, overflow: 'hidden', marginBottom: 5 }}>{Object.values(preset.palette).slice(0, 6).map((color, i) => <i key={i} style={{ flex: 1, background: color as string }} />)}</div>
                    <span style={{ fontSize: 8.5, fontFamily: 'var(--font-label)' }}>{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>
            {!editing.isNew && (
              <>
                <div className="toggle-row"><div><h4>Available in marketplace</h4><p>Hidden templates are not shown to customers but existing sites keep working.</p></div><button className={`toggle ${editing.enabled ? 'on' : ''}`} onClick={() => setEditing({ ...editing, enabled: !editing.enabled })} /></div>
                <div className="toggle-row"><div><h4>Featured template</h4><p>Featured designs appear first on the landing page and marketplace.</p></div><button className={`toggle ${editing.featured ? 'on' : ''}`} onClick={() => setEditing({ ...editing, featured: !editing.featured })} /></div>
              </>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} onConfirm={remove} title={`Delete ${deleteTarget?.name}?`} confirmLabel="Delete template" danger busy={deleting}>
        If this template is used by any website it will be hidden from the marketplace instead of deleted, so existing sites keep working.
      </ConfirmDialog>
    </>
  );
}
