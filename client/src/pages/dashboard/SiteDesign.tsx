import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDown, ArrowUp, Check, ChevronDown, Eye, Image as ImageIcon, Layers,
  Loader2, Monitor, Palette as PaletteIcon, PenTool, Plus, RotateCcw,
  Save, Smartphone, Sparkles, Tablet, Type, X,
} from 'lucide-react';
import { useSite } from '../../components/dashboard/SiteLayout';
import { ImagePicker } from '../../components/dashboard/ImagePicker';
import { SiteRenderer } from '../../components/SiteRenderer';
import { useToast } from '../../context/ToastContext';
import { get, patch, post } from '../../lib/api';
import type { Category, Content, Item, Theme } from '../../lib/types';

const FONTS = [
  { label: 'Instrument Serif', value: "'Instrument Serif', Georgia, serif" },
  { label: 'Playfair Display', value: "'Playfair Display', Georgia, serif" },
  { label: 'Fraunces', value: "'Fraunces', Georgia, serif" },
  { label: 'Cormorant Garamond', value: "'Cormorant Garamond', Georgia, serif" },
  { label: 'DM Sans', value: "'DM Sans', system-ui, sans-serif" },
  { label: 'Space Grotesk', value: "'Space Grotesk', system-ui, sans-serif" },
  { label: 'Sora', value: "'Sora', system-ui, sans-serif" },
  { label: 'Manrope', value: "'Manrope', system-ui, sans-serif" },
  { label: 'Plus Jakarta Sans', value: "'Plus Jakarta Sans', system-ui, sans-serif" },
  { label: 'Bricolage Grotesque', value: "'Bricolage Grotesque', system-ui, sans-serif" },
  { label: 'Syne', value: "'Syne', system-ui, sans-serif" },
  { label: 'Archivo', value: "'Archivo', system-ui, sans-serif" },
  { label: 'IBM Plex Mono', value: "'IBM Plex Mono', ui-monospace, monospace" },
];

const PRESETS = [
  { name: 'Warm editorial', palette: { primary: '#2d1a12', secondary: '#c46a3a', accent: '#c46a3a', bg: '#fbf4e8', surface: '#fffaf2', text: '#2d1a12', muted: '#826e5f', line: '#e6d8c5' } },
  { name: 'Modern minimal', palette: { primary: '#151515', secondary: '#8b8b80', accent: '#ff5c35', bg: '#f7f7f5', surface: '#ffffff', text: '#151515', muted: '#6f6f69', line: '#e2e2de' } },
  { name: 'Coastal calm', palette: { primary: '#0f4f5c', secondary: '#78a6a1', accent: '#d9a760', bg: '#f2f7f5', surface: '#ffffff', text: '#153a40', muted: '#638187', line: '#d6e5e2' } },
  { name: 'Ink & lime', palette: { primary: '#c8ff3d', secondary: '#f4f6ec', accent: '#c8ff3d', bg: '#0b0b0a', surface: '#181816', text: '#f4f6ec', muted: '#9ca092', line: '#2b2d26' } },
  { name: 'Luxe earth', palette: { primary: '#c9a867', secondary: '#e9d9b8', accent: '#c9a867', bg: '#0d0b09', surface: '#17130f', text: '#f4ead7', muted: '#a89a83', line: '#322b23' } },
  { name: 'Botanical', palette: { primary: '#3d5744', secondary: '#b07d6a', accent: '#b07d6a', bg: '#f4f3e9', surface: '#fbfaf3', text: '#2d3a2f', muted: '#788174', line: '#dcdccb' } },
  { name: 'Playful sun', palette: { primary: '#14539a', secondary: '#f5b82e', accent: '#ee6b4d', bg: '#fff9e9', surface: '#ffffff', text: '#17324f', muted: '#6c7f91', line: '#eee0bf' } },
  { name: 'Tech trust', palette: { primary: '#3d7eff', secondary: '#8af5d1', accent: '#8af5d1', bg: '#080b12', surface: '#0f1520', text: '#eaf1ff', muted: '#8695ad', line: '#1c2638' } },
];

const SECTION_LABELS: Record<string, string> = {
  marquee: 'Announcement ticker', featured: 'Featured collection', about: 'Our story',
  gallery: 'Image gallery', testimonials: 'Testimonials', cta: 'Call to action',
};

const SECTION_OPTIONS = ['marquee', 'featured', 'about', 'gallery', 'testimonials', 'cta'];
const LAYOUTS = ['editorial', 'split', 'centered', 'bento', 'brutalist', 'minimal', 'immersive', 'classic', 'grid', 'organic'];
const HEROES = ['split', 'full', 'editorial', 'centered', 'bento', 'type'];
const NAVS = ['classic', 'center', 'minimal', 'pill', 'split'];
const CARDS = ['cover', 'rounded', 'bordered', 'minimal', 'overlap'];

type Tab = 'brand' | 'colors' | 'type' | 'sections' | 'content';

export function SiteDesign() {
  const { details, setDetails } = useSite();
  const { toast } = useToast();
  const [theme, setTheme] = useState<Theme>(details.site.theme);
  const [content, setContent] = useState<Content>(details.site.content);
  const [tab, setTab] = useState<Tab>('brand');
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [openGroup, setOpenGroup] = useState<string>('identity');

  useEffect(() => {
    setTheme(details.site.theme);
    setContent(details.site.content);
    setDirty(false);
  }, [details.site.id]);

  useEffect(() => {
    Promise.all([
      get<{ items: Item[] }>(`/sites/${details.site.id}/items?status=active`),
      get<{ categories: Category[] }>(`/sites/${details.site.id}/categories`),
    ]).then(([itemData, catData]) => { setItems(itemData.items); setCategories(catData.categories); }).catch(() => undefined);
  }, [details.site.id]);

  function updateTheme(patchTheme: Partial<Theme>) {
    setTheme((prev) => ({ ...prev, ...patchTheme }));
    setDirty(true);
  }
  function updatePalette(key: string, value: string) {
    setTheme((prev) => ({ ...prev, palette: { ...prev.palette, [key]: value } }));
    setDirty(true);
  }
  function updateContent(patchContent: Partial<Content>) {
    setContent((prev) => ({ ...prev, ...patchContent }));
    setDirty(true);
  }
  function updateNested(section: 'hero' | 'about' | 'contact' | 'footer' | 'newsletter', key: string, value: any) {
    setContent((prev) => ({ ...prev, [section]: { ...(prev as any)[section], [key]: value } }));
    setDirty(true);
  }
  function updateFeature(index: number, key: 'title' | 'body', value: string) {
    setContent((prev) => ({
      ...prev,
      about: { ...prev.about, features: prev.about.features.map((f, i) => i === index ? { ...f, [key]: value } : f) },
    }));
    setDirty(true);
  }
  function moveSection(index: number, direction: -1 | 1) {
    const sections = [...content.sections];
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;
    [sections[index], sections[target]] = [sections[target], sections[index]];
    updateContent({ sections });
  }
  function toggleSection(section: string) {
    const sections = content.sections.includes(section)
      ? content.sections.filter((s) => s !== section)
      : [...content.sections, section];
    updateContent({ sections });
  }
  function resetTemplate() {
    const template = details.template;
    if (!template) return;
    setTheme({
      palette: template.palette,
      fonts: template.fonts,
      layout: template.layout,
      hero: template.hero,
      nav: template.nav,
      card: template.card,
      radius: template.radius,
      logoText: theme.logoText || details.site.name,
      logoUrl: theme.logoUrl || '',
      mode: template.palette.bg.startsWith('#0') ? 'dark' : 'light',
    });
    setDirty(true);
    toast('Template colours and type restored. Save to apply.');
  }

  async function save() {
    setSaving(true);
    try {
      const data = await patch<{ site: any }>(`/sites/${details.site.id}/design`, { theme, content });
      setDetails({ ...details, ...data, site: data.site });
      setDirty(false);
      toast('Design saved. Your live website is updated.');
    } catch (err: any) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function saveAndPublish() {
    setPublishing(true);
    try {
      await patch(`/sites/${details.site.id}/design`, { theme, content });
      const data = await post(`/sites/${details.site.id}/publish`);
      setDetails({ ...details, ...(data as any) });
      setDirty(false);
      toast('Design saved and website published.');
    } catch (err: any) { toast(err.message, 'error'); } finally { setPublishing(false); }
  }

  const payload = useMemo(() => ({
    site: { ...details.site, theme, content },
    template: details.template,
    items,
    categories,
    owner: '',
    reviews: content.testimonials || [],
  }), [details, theme, content, items, categories]);

  function Group({ title, id, children }: { title: string; id: string; children: React.ReactNode }) {
    const open = openGroup === id;
    return (
      <div className="design-group">
        <button className="design-collapse-head" onClick={() => setOpenGroup(open ? '' : id)}>
          <h3>{title}</h3><ChevronDown size={14} className={open ? '' : 'collapsed'} />
        </button>
        {open && children}
      </div>
    );
  }

  const navLinks = content.navLinks || [
    { label: 'Home', href: '#top' },
    { label: 'Our story', href: '#about' },
    { label: 'Collection', href: '#items' },
    { label: 'Contact', href: '#contact' },
  ];

  return (
    <>
      <div className="dash-page-head" style={{ marginBottom: 18 }}>
        <div>
          <div className="eyebrow">Visual builder</div>
          <h1>Design studio</h1>
          <p>Every change updates the live preview. Save when it feels right — nothing goes public until you publish.</p>
        </div>
        <div className="dash-page-actions">
          <Link className="btn btn-outline btn-sm" to={`/preview/${details.site.id}`}><Eye size={13} /> Full preview</Link>
          <Link className="btn btn-outline btn-sm" to={`/dashboard/${details.site.id}/ai`}><Sparkles size={13} /> AI design help</Link>
          <button className="btn btn-accent btn-sm" onClick={save} disabled={saving || !dirty}>{saving ? <span className="spinner" /> : <><Save size={13} /> Save changes</>}</button>
        </div>
      </div>

      <div className="design-shell">
        <div className="design-controls">
          <div className="design-tabs">
            {[['brand', 'Brand', PenTool], ['colors', 'Colours', PaletteIcon], ['type', 'Type', Type], ['sections', 'Sections', Layers], ['content', 'Content', ImageIcon]].map(([id, label, Icon]: any) => (
              <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}><Icon size={12} style={{ marginRight: 4, verticalAlign: -2 }} />{label}</button>
            ))}
          </div>
          <div className="design-controls-body">
            {tab === 'brand' && (
              <>
                <Group title="Identity" id="identity">
                  <div className="design-field"><label>Logo text</label><input className="input" value={theme.logoText || ''} onChange={(e) => updateTheme({ logoText: e.target.value })} placeholder={details.site.name} /></div>
                  <ImagePicker siteId={details.site.id} value={theme.logoUrl} onChange={(url) => updateTheme({ logoUrl: url })} label="Logo image (overrides text)" />
                  <div className="design-field"><label>Announcement bar</label><input className="input" value={content.announcement || ''} onChange={(e) => updateContent({ announcement: e.target.value })} placeholder="Free delivery this week" /></div>
                </Group>
                <Group title="Layout & navigation" id="layout">
                  <div className="design-field"><label>Page layout</label><select className="select" value={theme.layout} onChange={(e) => updateTheme({ layout: e.target.value })}>{LAYOUTS.map((layout) => <option key={layout} value={layout}>{layout[0].toUpperCase() + layout.slice(1)}</option>)}</select></div>
                  <div className="design-field"><label>Hero style</label><select className="select" value={theme.hero} onChange={(e) => updateTheme({ hero: e.target.value })}>{HEROES.map((hero) => <option key={hero} value={hero}>{hero[0].toUpperCase() + hero.slice(1)}</option>)}</select></div>
                  <div className="design-field"><label>Navigation style</label><select className="select" value={theme.nav} onChange={(e) => updateTheme({ nav: e.target.value })}>{NAVS.map((nav) => <option key={nav} value={nav}>{nav[0].toUpperCase() + nav.slice(1)}</option>)}</select></div>
                  <div className="design-field"><label>Product card style</label><select className="select" value={theme.card} onChange={(e) => updateTheme({ card: e.target.value })}>{CARDS.map((card) => <option key={card} value={card}>{card[0].toUpperCase() + card.slice(1)}</option>)}</select></div>
                </Group>
                <Group title="Navigation menu" id="nav">
                  {navLinks.map((link, i) => (
                    <div className="design-field" key={`${link.href}-${i}`}><label>{['First', 'Second', 'Third', 'Fourth'][i]} link · {link.href}</label><input className="input" value={link.label} onChange={(e) => updateContent({ navLinks: navLinks.map((l, idx) => idx === i ? { ...l, label: e.target.value } : l) })} /></div>
                  ))}
                </Group>
                <button className="text-link" style={{ fontSize: 10 }} onClick={resetTemplate}><RotateCcw size={12} /> Restore this template's design</button>
              </>
            )}

            {tab === 'colors' && (
              <>
                <div className="design-group-title"><h3>Palette presets</h3></div>
                <div className="design-color-presets">
                  {PRESETS.map((preset) => (
                    <button key={preset.name} title={preset.name} style={{ background: `conic-gradient(${preset.palette.primary} 0 25%, ${preset.palette.bg} 25% 50%, ${preset.palette.accent} 50% 75%, ${preset.palette.surface} 75% 100%)` }} onClick={() => { updateTheme({ palette: preset.palette, mode: preset.palette.bg.startsWith('#0') ? 'dark' : 'light' }); toast(`${preset.name} palette applied.`); }} />
                  ))}
                </div>
                <div className="design-group">
                  <div className="design-group-title"><h3>Brand colours</h3><span>Click to edit</span></div>
                  <div className="color-grid">
                    {Object.entries(theme.palette).map(([key, value]) => (
                      <div className="color-field" key={key}>
                        <input type="color" value={value} onChange={(e) => updatePalette(key, e.target.value)} aria-label={key} />
                        <div style={{ flex: 1, minWidth: 0 }}><label style={{ display: 'block', fontSize: 8.5, textTransform: 'capitalize' }}>{key}</label><span>{value}</span></div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="design-group">
                  <div className="design-group-title"><h3>Readability</h3></div>
                  <p className="field-hint">Body text should sit at 4.5:1 contrast or better. The AI Design Assistant can suggest accessible palettes.</p>
                  <Link className="btn btn-outline btn-sm mt-12" to={`/dashboard/${details.site.id}/ai?tab=design`}><Sparkles size={12} /> Ask for a palette</Link>
                </div>
              </>
            )}

            {tab === 'type' && (
              <>
                <div className="design-field"><label>Heading typeface</label><select className="select" value={theme.fonts.heading} onChange={(e) => updateTheme({ fonts: { ...theme.fonts, heading: e.target.value } })}>{FONTS.map((font) => <option key={font.label} value={font.value}>{font.label}</option>)}</select></div>
                <div className="font-preview" style={{ fontFamily: theme.fonts.heading }}>The details make the difference.</div>
                <div className="design-field"><label>Body typeface</label><select className="select" value={theme.fonts.body} onChange={(e) => updateTheme({ fonts: { ...theme.fonts, body: e.target.value } })}>{FONTS.map((font) => <option key={font.label} value={font.value}>{font.label}</option>)}</select></div>
                <div className="font-preview" style={{ fontFamily: theme.fonts.body, fontSize: 14 }}>Good design is as little design as possible. Every detail should earn its place.</div>
                <div className="design-group">
                  <div className="design-group-title"><h3>Corner radius</h3><span>{(theme.radius || '14px').replace('px', '')} px</span></div>
                  <div className="radius-row">
                    <input type="range" min="0" max="40" step="1" value={parseInt(theme.radius || '14', 10)} onChange={(e) => updateTheme({ radius: `${e.target.value}px` })} />
                    <span>{parseInt(theme.radius || '14', 10)}px</span>
                  </div>
                </div>
                <div className="design-field"><label>Color mode</label><select className="select" value={theme.mode || 'light'} onChange={(e) => updateTheme({ mode: e.target.value })}><option value="light">Light</option><option value="dark">Dark</option></select></div>
              </>
            )}

            {tab === 'sections' && (
              <>
                <div className="design-group-title"><h3>Homepage sections</h3><span>Reorder or hide</span></div>
                <div className="section-toggle-list">
                  {content.sections.map((section, index) => (
                    <div className="section-toggle" key={section}>
                      <ArrowUp size={12} style={{ cursor: 'pointer', opacity: index === 0 ? .25 : 1 }} onClick={() => moveSection(index, -1)} />
                      <ArrowDown size={12} style={{ cursor: 'pointer', opacity: index === content.sections.length - 1 ? .25 : 1 }} onClick={() => moveSection(index, 1)} />
                      <span>{SECTION_LABELS[section] || section}</span>
                      <button className="toggle on" onClick={() => toggleSection(section)} aria-label={`Hide ${section}`} />
                    </div>
                  ))}
                </div>
                {SECTION_OPTIONS.filter((s) => !content.sections.includes(s)).length > 0 && (
                  <>
                    <div className="design-group-title mt-24"><h3>Add a section</h3></div>
                    <div className="section-toggle-list">
                      {SECTION_OPTIONS.filter((s) => !content.sections.includes(s)).map((section) => (
                        <div className="section-toggle" key={section}><span style={{ opacity: .6 }}>{SECTION_LABELS[section] || section}</span><button className="icon-btn sm" onClick={() => toggleSection(section)}><Plus size={11} /></button></div>
                      ))}
                    </div>
                  </>
                )}
                <p className="field-hint mt-16">The hero, contact and newsletter sections are always included. Every section is fully responsive.</p>
              </>
            )}

            {tab === 'content' && (
              <>
                <Group title="Hero" id="hero">
                  <div className="design-field"><label>Eyebrow</label><input className="input" value={content.hero.eyebrow} onChange={(e) => updateNested('hero', 'eyebrow', e.target.value)} /></div>
                  <div className="design-field"><label>Headline</label><textarea className="textarea" style={{ minHeight: 60 }} value={content.hero.headline} onChange={(e) => updateNested('hero', 'headline', e.target.value)} /></div>
                  <div className="design-field"><label>Highlighted words</label><input className="input" value={content.hero.highlight || ''} onChange={(e) => updateNested('hero', 'highlight', e.target.value)} /><span className="field-hint">Must match a phrase inside the headline.</span></div>
                  <div className="design-field"><label>Subheadline</label><textarea className="textarea" style={{ minHeight: 70 }} value={content.hero.subheadline} onChange={(e) => updateNested('hero', 'subheadline', e.target.value)} /></div>
                  <div className="field-row" style={{ gap: 8 }}><div className="design-field"><label>Primary button</label><input className="input" value={content.hero.primaryCta} onChange={(e) => updateNested('hero', 'primaryCta', e.target.value)} /></div><div className="design-field"><label>Secondary button</label><input className="input" value={content.hero.secondaryCta} onChange={(e) => updateNested('hero', 'secondaryCta', e.target.value)} /></div></div>
                  <ImagePicker siteId={details.site.id} value={content.hero.image} onChange={(url) => updateNested('hero', 'image', url)} label="Hero image" />
                </Group>
                <Group title="Our story" id="about">
                  <div className="design-field"><label>Title</label><input className="input" value={content.about.title} onChange={(e) => updateNested('about', 'title', e.target.value)} /></div>
                  <div className="design-field"><label>Body</label><textarea className="textarea" style={{ minHeight: 110 }} value={content.about.body} onChange={(e) => updateNested('about', 'body', e.target.value)} /></div>
                  <ImagePicker siteId={details.site.id} value={content.about.image} onChange={(url) => updateNested('about', 'image', url)} label="Story image" />
                  {content.about.features.map((feature, i) => (
                    <div key={i} style={{ borderTop: '1px solid var(--line)', paddingTop: 10, marginTop: 4 }}>
                      <div className="design-field"><label>Feature {i + 1} title</label><input className="input" value={feature.title} onChange={(e) => updateFeature(i, 'title', e.target.value)} /></div>
                      <div className="design-field"><label>Feature {i + 1} description</label><input className="input" value={feature.body} onChange={(e) => updateFeature(i, 'body', e.target.value)} /></div>
                    </div>
                  ))}
                </Group>
                <Group title="Contact" id="contact">
                  <div className="design-field"><label>Title</label><input className="input" value={content.contact.title} onChange={(e) => updateNested('contact', 'title', e.target.value)} /></div>
                  <div className="design-field"><label>Intro</label><input className="input" value={content.contact.body} onChange={(e) => updateNested('contact', 'body', e.target.value)} /></div>
                  <div className="design-field"><label>Address</label><input className="input" value={content.contact.address} onChange={(e) => updateNested('contact', 'address', e.target.value)} /></div>
                  <div className="field-row" style={{ gap: 8 }}><div className="design-field"><label>Phone</label><input className="input" value={content.contact.phone} onChange={(e) => updateNested('contact', 'phone', e.target.value)} /></div><div className="design-field"><label>Email</label><input className="input" value={content.contact.email} onChange={(e) => updateNested('contact', 'email', e.target.value)} /></div></div>
                  <div className="design-field"><label>Opening hours</label>
                    {content.contact.hours.map((hour, i) => (
                      <div className="field-row" style={{ gap: 6, marginBottom: 6 }} key={i}>
                        <input className="input" value={hour.day} onChange={(e) => updateNested('contact', 'hours', content.contact.hours.map((h, idx) => idx === i ? { ...h, day: e.target.value } : h))} placeholder="Day" />
                        <input className="input" value={hour.time} onChange={(e) => updateNested('contact', 'hours', content.contact.hours.map((h, idx) => idx === i ? { ...h, time: e.target.value } : h))} placeholder="Hours" />
                      </div>
                    ))}
                  </div>
                </Group>
                <Group title="Testimonials & footer" id="extras">
                  {(content.testimonials || []).slice(0, 2).map((review, i) => (
                    <div key={i} style={{ borderTop: '1px solid var(--line)', paddingTop: 10, marginTop: 4 }}>
                      <div className="design-field"><label>Quote {i + 1}</label><textarea className="textarea" style={{ minHeight: 60 }} value={review.quote} onChange={(e) => updateContent({ testimonials: content.testimonials!.map((r, idx) => idx === i ? { ...r, quote: e.target.value } : r) })} /></div>
                      <div className="design-field"><label>Name</label><input className="input" value={review.name} onChange={(e) => updateContent({ testimonials: content.testimonials!.map((r, idx) => idx === i ? { ...r, name: e.target.value } : r) })} /></div>
                    </div>
                  ))}
                  <div className="design-field"><label>Footer tagline</label><textarea className="textarea" style={{ minHeight: 60 }} value={content.footer.tagline} onChange={(e) => updateNested('footer', 'tagline', e.target.value)} /></div>
                </Group>
              </>
            )}
          </div>
          <div className="design-savebar">
            <span>{dirty ? 'Unsaved changes' : 'All changes saved'}</span>
            <button className="btn btn-sm btn-accent" onClick={save} disabled={saving || !dirty}>{saving ? <span className="spinner" /> : <><Save size={12} /> Save</>}</button>
          </div>
        </div>

        <div className="design-preview-wrap">
          <div className="design-preview-toolbar">
            <div className="design-preview-toolbar-left"><i /> Live preview <span style={{ color: 'var(--muted-2)' }}>·</span> {details.site.slug}.nexora.studio {dirty && <span className="badge draft" style={{ fontSize: 8 }}>Unsaved</span>}</div>
            <div className="design-device-toggle">
              <button className={device === 'desktop' ? 'active' : ''} onClick={() => setDevice('desktop')} aria-label="Desktop"><Monitor size={13} /></button>
              <button className={device === 'tablet' ? 'active' : ''} onClick={() => setDevice('tablet')} aria-label="Tablet"><Tablet size={13} /></button>
              <button className={device === 'mobile' ? 'active' : ''} onClick={() => setDevice('mobile')} aria-label="Mobile"><Smartphone size={13} /></button>
            </div>
          </div>
          <div className="design-preview-scroll">
            <div className={`design-preview-frame ${device !== 'desktop' ? device : ''}`}>
              <div className="design-preview-chrome"><i /><i /><i /><span>{details.site.slug}.nexora.studio</span></div>
              <SiteRenderer payload={payload as any} preview />
            </div>
            <p className="design-note">The preview is fully interactive. Device widths use the same responsive rules as your live site.</p>
          </div>
          <div className="flex-between mt-12">
            <span className="text-xs muted">Last saved {details.site.updatedAt ? new Date(details.site.updatedAt.includes('T') ? details.site.updatedAt : `${details.site.updatedAt.replace(' ', 'T')}Z`).toLocaleString() : '—'}</span>
            <div className="flex-center gap-6">
              <button className="btn btn-outline btn-sm" onClick={save} disabled={saving || !dirty}>Save draft</button>
              <button className="btn btn-sm" onClick={saveAndPublish} disabled={publishing}>{publishing ? <span className="spinner" /> : <><Check size={12} /> Save & publish</>}</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
