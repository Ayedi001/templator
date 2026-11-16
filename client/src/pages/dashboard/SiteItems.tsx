import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  ArrowLeft, Check, ChevronDown, Copy, Edit3, LayoutGrid, Loader2,
  Package, Pencil, Plus, Search, Sparkles, Trash2, Wand2, X,
} from 'lucide-react';
import { useSite } from '../../components/dashboard/SiteLayout';
import { ImagePicker } from '../../components/dashboard/ImagePicker';
import { ConfirmDialog, Modal } from '../../components/Modal';
import { EmptyState, PageHeader, StatusBadge } from '../../components/UI';
import { useToast } from '../../context/ToastContext';
import { del, formatMoney, get, patch, post } from '../../lib/api';
import type { Category, Item } from '../../lib/types';

const KIND_BY_CATEGORY: Record<string, string> = {
  ecommerce: 'product', fashion: 'product', technology: 'product', automotive: 'vehicle',
  food: 'menu', 'health-beauty': 'service', services: 'service', corporate: 'service',
  media: 'article', portfolio: 'project', 'real-estate': 'property', hospitality: 'room', education: 'course',
};

const META_FIELDS: Record<string, { key: string; label: string; placeholder: string }[]> = {
  product: [{ key: 'tag', label: 'Badge', placeholder: 'New, Bestseller…' }, { key: 'suffix', label: 'Price suffix', placeholder: '/mo' }],
  vehicle: [{ key: 'meta', label: 'Vehicle details', placeholder: '2022 · 2,400 mi · Petrol' }, { key: 'tag', label: 'Badge', placeholder: 'Just arrived' }],
  menu: [{ key: 'tag', label: 'Badge', placeholder: 'House favourite' }, { key: 'duration', label: 'Serving note', placeholder: 'Serves 2' }],
  service: [{ key: 'duration', label: 'Duration', placeholder: '60 min' }, { key: 'tag', label: 'Badge', placeholder: 'Most booked' }, { key: 'suffix', label: 'Price suffix', placeholder: '/session' }],
  article: [{ key: 'author', label: 'Author', placeholder: 'Mara Lind' }, { key: 'readTime', label: 'Read time', placeholder: '8 min read' }, { key: 'tag', label: 'Section', placeholder: 'Design' }],
  project: [{ key: 'meta', label: 'Project details', placeholder: '2025 · Brand identity' }, { key: 'tag', label: 'Badge', placeholder: 'Featured' }],
  property: [{ key: 'meta', label: 'Property details', placeholder: '4 bed · 3 bath · 3,200 sq ft' }, { key: 'tag', label: 'Badge', placeholder: 'New listing' }],
  room: [{ key: 'meta', label: 'Room details', placeholder: 'King bed · 26 m² · Courtyard' }, { key: 'suffix', label: 'Price suffix', placeholder: '/night' }],
  course: [{ key: 'meta', label: 'Program details', placeholder: '8 weeks · Live · Beginner' }, { key: 'duration', label: 'Duration', placeholder: '8 weeks' }],
};

const EMPTY_FORM = {
  name: '', description: '', price: '0', compareAt: '', categoryId: '', stock: '0',
  status: 'active', images: [''] as string[], featured: false,
  metadata: {} as Record<string, string>,
  variations: [] as { name: string; options: string }[],
};

export function SiteItems() {
  const { details, config } = useSite();
  const { toast } = useToast();
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Item | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [confirmCategory, setConfirmCategory] = useState<string | null>(null);

  const kind = KIND_BY_CATEGORY[details.site.category] || 'product';
  const metaFields = META_FIELDS[kind] || META_FIELDS.product;
  const singular = config.itemSingular;

  async function load() {
    try {
      const [itemData, catData] = await Promise.all([
        get<{ items: Item[] }>(`/sites/${details.site.id}/items`),
        get<{ categories: Category[] }>(`/sites/${details.site.id}/categories`),
      ]);
      setItems(itemData.items);
      setCategories(catData.categories);
    } catch (err: any) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [details.site.id]);

  const filtered = useMemo(() => items.filter((item) => {
    const matchesSearch = !search || `${item.name} ${item.description}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || item.category_id === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  }), [items, search, statusFilter, categoryFilter]);

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, images: [''], metadata: {}, variations: [] });
    setError('');
    setFormOpen(true);
  }

  function openEdit(item: Item) {
    setEditing(item);
    const existingVariations = Array.isArray(item.metadata?.variations)
      ? item.metadata.variations.map((v: any) => ({ name: v.name || '', options: Array.isArray(v.options) ? v.options.join(', ') : String(v.options || '') }))
      : [];
    setForm({
      name: item.name,
      description: item.description,
      price: String(item.price_cents / 100),
      compareAt: item.compare_at_cents ? String(item.compare_at_cents / 100) : '',
      categoryId: item.category_id || '',
      stock: String(item.stock),
      status: item.status,
      images: item.images.length ? item.images : [''],
      featured: Boolean(item.featured),
      metadata: Object.fromEntries(Object.entries(item.metadata || {}).filter(([key]) => key !== 'variations').map(([k, v]) => [k, v == null ? '' : String(v)])),
      variations: existingVariations,
    });
    setError('');
    setFormOpen(true);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError('Add a name.'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: form.name,
        description: form.description,
        priceCents: Math.round(Number(form.price || 0) * 100),
        compareAtCents: form.compareAt ? Math.round(Number(form.compareAt) * 100) : null,
        categoryId: form.categoryId || null,
        kind,
        stock: Number(form.stock || 0),
        status: form.status,
        images: form.images.filter(Boolean),
        metadata: {
          ...form.metadata,
          variations: form.variations
            .map((variation) => ({ name: variation.name.trim(), options: variation.options.split(',').map((o) => o.trim()).filter(Boolean) }))
            .filter((variation) => variation.name && variation.options.length),
        },
        featured: form.featured,
      };
      if (editing) {
        await patch(`/sites/${details.site.id}/items/${editing.id}`, payload);
        toast(`${form.name} updated.`);
      } else {
        await post(`/sites/${details.site.id}/items`, payload);
        toast(`${form.name} added to your ${config.itemLabel.toLowerCase()}.`);
      }
      setFormOpen(false);
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await del(`/sites/${details.site.id}/items/${deleteTarget.id}`);
      toast(`${deleteTarget.name} deleted.`);
      setDeleteTarget(null);
      await load();
    } catch (err: any) {
      toast(err.message, 'error');
    } finally {
      setDeleting(false);
    }
  }

  async function generateDescription() {
    if (!form.name.trim()) { setError('Add a name first so the agent has something to work with.'); return; }
    setAiBusy(true);
    try {
      const categoryName = categories.find((c) => c.id === form.categoryId)?.name || '';
      const data = await post<{ result: { title: string; description: string } }>('/ai/product-copy', {
        name: form.name,
        category: categoryName || config.itemLabel,
        notes: form.description,
        priceCents: Math.round(Number(form.price || 0) * 100),
      });
      setForm((prev) => ({
        ...prev,
        name: data.result.title || prev.name,
        description: data.result.description || prev.description,
      }));
      toast('Product Content Agent wrote a new description.');
    } catch (err: any) {
      toast(err.message, 'error');
    } finally {
      setAiBusy(false);
    }
  }

  async function addCategory() {
    if (!newCategory.trim()) return;
    try {
      const data = await post<{ category: Category }>(`/sites/${details.site.id}/categories`, { name: newCategory, kind });
      setCategories((prev) => [...prev, data.category]);
      setNewCategory('');
      toast('Category added.');
    } catch (err: any) { toast(err.message, 'error'); }
  }

  async function saveCategory() {
    if (!editingCategory) return;
    try {
      const data = await patch<{ category: Category }>(`/sites/${details.site.id}/categories/${editingCategory.id}`, { name: categoryName });
      setCategories((prev) => prev.map((c) => c.id === data.category.id ? data.category : c));
      setEditingCategory(null);
      toast('Category renamed.');
    } catch (err: any) { toast(err.message, 'error'); }
  }

  async function removeCategory(id: string) {
    try {
      await del(`/sites/${details.site.id}/categories/${id}`);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setConfirmCategory(null);
      load();
      toast('Category removed. Items are now uncategorised.');
    } catch (err: any) { toast(err.message, 'error'); }
  }

  const usage = details.subscription ? `${items.length} of ${details.subscription.product_limit} used` : '';

  return (
    <>
      <PageHeader
        eyebrow={config.itemLabel}
        title={config.itemLabel}
        description={`Manage everything you offer. ${usage ? `${usage} on your ${details.subscription.plan} plan.` : ''}`}
        actions={<>
          <button className="btn btn-outline btn-sm" onClick={() => setCategoryOpen(true)}><LayoutGrid size={13} /> Categories</button>
          <button className="btn btn-sm btn-accent" onClick={openCreate}><Plus size={14} /> Add {singular.toLowerCase()}</button>
        </>}
      />

      <div className="toolbar">
        <div className="toolbar-left">
          <div className="filter-tabs">
            {['all', 'active', 'draft', 'archived'].map((status) => (
              <button key={status} className={statusFilter === status ? 'active' : ''} onClick={() => setStatusFilter(status)}>
                {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
          {categories.length > 0 && (
            <select className="select" style={{ width: 160, minHeight: 34, padding: '5px 32px 5px 11px', fontSize: 10.5 }} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="all">All categories</option>
              {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          )}
        </div>
        <label className="search-box">
          <Search size={14} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search ${config.itemLabel.toLowerCase()}…`} />
        </label>
      </div>

      {loading ? (
        <div className="catalogue-grid">{[...Array(4)].map((_, i) => <div className="skeleton" key={i} style={{ height: 280, borderRadius: 13 }} />)}</div>
      ) : filtered.length === 0 ? (
        <div className="panel"><EmptyState icon={<Package size={22} />} title={items.length ? 'Nothing matches those filters.' : `No ${config.itemLabel.toLowerCase()} yet.`} description={items.length ? 'Try a different search or status.' : `Add your first ${singular.toLowerCase()} so your published website has something to show.`} action={<button className="btn btn-accent btn-sm" onClick={openCreate}><Plus size={13} /> Add {singular.toLowerCase()}</button>} /></div>
      ) : (
        <div className="catalogue-grid">
          {filtered.map((item) => (
            <article className="catalogue-card" key={item.id}>
              <div className="catalogue-image">
                {item.images[0] ? <img src={item.images[0]} alt={item.name} loading="lazy" /> : <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: 'var(--muted)' }}><Package size={24} /></div>}
                <span className={`badge ${item.status}`}>{item.status}</span>
                {item.featured && <span className="badge" style={{ left: 'auto', right: 9, top: 9, background: 'var(--lime)', borderColor: 'var(--lime)' }}>Featured</span>}
              </div>
              <div className="catalogue-card-body">
                <h3>{item.name}</h3>
                <div className="catalogue-card-meta">
                  <span className="catalogue-price">{item.price_cents ? formatMoney(item.price_cents) : (kind === 'article' ? 'Read' : 'Free')}</span>
                  <span className="catalogue-cat">{categories.find((c) => c.id === item.category_id)?.name || 'Uncategorised'}</span>
                </div>
                <div className="catalogue-card-actions">
                  <button className="icon-btn" onClick={() => openEdit(item)} title="Edit"><Pencil size={13} /></button>
                  <button className="icon-btn" onClick={() => navigator.clipboard?.writeText(item.name)} title="Copy name"><Copy size={13} /></button>
                  <button className="icon-btn danger" onClick={() => setDeleteTarget(item)} title="Delete"><Trash2 size={13} /></button>
                  <button className="text-link" onClick={() => openEdit(item)}>Edit <ArrowLeft size={11} style={{ transform: 'rotate(180deg)' }} /></button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? `Edit ${singular.toLowerCase()}` : `Add ${singular.toLowerCase()}`}
        subtitle={`${config.itemLabel} · visible on your published website when active`}
        size="wide"
        footer={<><button className="btn btn-ghost" onClick={() => setFormOpen(false)}>Cancel</button><button className="btn btn-accent" form="item-form" type="submit" disabled={saving}>{saving ? <span className="spinner" /> : editing ? 'Save changes' : `Add ${singular.toLowerCase()}`}</button></>}
      >
        <form id="item-form" onSubmit={save} className="item-form-grid">
          {error && <div className="form-error">{error}</div>}
          <div className="field-row">
            <div className="field"><label>Name</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={kind === 'article' ? 'The story headline' : 'e.g. The Margaux Coat'} required /></div>
            <div className="field"><label>Category</label><select className="select" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}><option value="">Uncategorised</option>{categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}</select></div>
          </div>
          <div className="field">
            <div className="flex-between"><label>Description</label><button type="button" className="text-link" style={{ fontSize: 9.5 }} onClick={generateDescription} disabled={aiBusy}>{aiBusy ? <Loader2 size={11} className="spin" /> : <Sparkles size={11} />} {aiBusy ? 'Writing…' : 'Write with AI'}</button></div>
            <textarea className="textarea" rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe what makes it worth choosing. Specifics beat adjectives." />
          </div>
          <div className="field-row">
            <div className="field"><label>{kind === 'article' ? 'Price (optional)' : 'Price'} <span className="field-hint">USD</span></label><input className="input" type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
            <div className="field"><label>Compare-at price <span className="field-hint">Optional</span></label><input className="input" type="number" min="0" step="0.01" value={form.compareAt} onChange={(e) => setForm({ ...form, compareAt: e.target.value })} placeholder="Original price" /></div>
          </div>
          <div className="field-row">
            {['product', 'vehicle'].includes(kind) && <div className="field"><label>Stock</label><input className="input" type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>}
            <div className="field"><label>Status</label><select className="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="active">Active</option><option value="draft">Draft</option><option value="archived">Archived</option></select></div>
            <div className="field"><label>Featured</label><label className="checkbox" style={{ minHeight: 46 }}><input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Show first in your catalogue</label></div>
          </div>
          {metaFields.map((field) => (
            <div className="field" key={field.key}><label>{field.label}</label><input className="input" value={form.metadata[field.key] || ''} onChange={(e) => setForm({ ...form, metadata: { ...form.metadata, [field.key]: e.target.value } })} placeholder={field.placeholder} /></div>
          ))}
          {['product', 'vehicle'].includes(kind) && (
            <div className="field">
              <div className="flex-between"><label>Variations</label><button type="button" className="text-link" style={{ fontSize: 9.5 }} onClick={() => setForm({ ...form, variations: [...form.variations, { name: '', options: '' }] })}><Plus size={11} /> Add variation</button></div>
              <p className="field-hint">Add options customers can choose on the product page, like Size or Colour. Separate choices with commas.</p>
              {form.variations.map((variation, index) => (
                <div key={index} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 28px', gap: 6, marginTop: 6 }}>
                  <input className="input" value={variation.name} onChange={(e) => setForm({ ...form, variations: form.variations.map((v, i) => i === index ? { ...v, name: e.target.value } : v) })} placeholder="Size" />
                  <input className="input" value={variation.options} onChange={(e) => setForm({ ...form, variations: form.variations.map((v, i) => i === index ? { ...v, options: e.target.value } : v) })} placeholder="S, M, L, XL" />
                  <button type="button" className="icon-btn danger" onClick={() => setForm({ ...form, variations: form.variations.filter((_, i) => i !== index) })} aria-label="Remove variation"><Trash2 size={12} /></button>
                </div>
              ))}
            </div>
          )}
          <div className="divider" />
          <ImagePicker siteId={details.site.id} value={form.images[0]} onChange={(url) => setForm({ ...form, images: [url, form.images[1] || ''] })} label="Primary image" />
          <ImagePicker siteId={details.site.id} value={form.images[1]} onChange={(url) => setForm({ ...form, images: [form.images[0] || '', url] })} label="Second image (optional)" />
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={deleteItem}
        title={`Delete ${deleteTarget?.name || 'item'}?`}
        confirmLabel="Delete for good"
        danger
        busy={deleting}
      >
        This removes the {singular.toLowerCase()} from your catalogue and your published website. This cannot be undone.
      </ConfirmDialog>

      <Modal
        open={categoryOpen}
        onClose={() => { setCategoryOpen(false); setEditingCategory(null); }}
        title="Categories"
        subtitle={`Organise your ${config.itemLabel.toLowerCase()} so customers can browse.`}
        footer={<button className="btn" onClick={() => { setCategoryOpen(false); setEditingCategory(null); }}>Done</button>}
      >
        <div className="category-list">
          {categories.length === 0 && <p className="muted text-sm">No categories yet. Add your first below.</p>}
          {categories.map((cat) => (
            <div className="category-row" key={cat.id}>
              {editingCategory?.id === cat.id ? (
                <>
                  <input className="input" style={{ minHeight: 32, padding: '5px 8px', fontSize: 11 }} value={categoryName} onChange={(e) => setCategoryName(e.target.value)} autoFocus />
                  <button className="icon-btn" onClick={saveCategory}><Check size={12} /></button>
                  <button className="icon-btn" onClick={() => setEditingCategory(null)}><X size={12} /></button>
                </>
              ) : (
                <>
                  <span>{cat.name}</span><small>{cat.count ?? 0} items</small>
                  <button className="icon-btn" onClick={() => { setEditingCategory(cat); setCategoryName(cat.name); }}><Pencil size={11} /></button>
                  {confirmCategory === cat.id ? (
                    <button className="btn btn-danger btn-sm" style={{ minHeight: 24, fontSize: 8 }} onClick={() => removeCategory(cat.id)}>Delete?</button>
                  ) : (
                    <button className="icon-btn danger" onClick={() => setConfirmCategory(cat.id)}><Trash2 size={11} /></button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
        <div className="category-add">
          <input className="input" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="New category name" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCategory(); } }} />
          <button className="btn btn-outline btn-sm" onClick={addCategory} disabled={!newCategory.trim()}><Plus size={13} /> Add</button>
        </div>
      </Modal>
    </>
  );
}
