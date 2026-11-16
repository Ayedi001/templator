import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight, ArrowUpRight, CalendarDays, Check, ChevronDown, Clock3, Facebook,
  Instagram, Linkedin, Mail, MapPin, Minus, Phone, Plus, Send, ShoppingBag,
  Star, Twitter, X,
} from 'lucide-react';
import type { Category, Content, Item, PublicSitePayload } from '../lib/types';
import { formatMoney } from '../lib/api';
import { categoryMeta } from '../lib/preview';

interface Props {
  payload: PublicSitePayload;
  live?: boolean;
  preview?: boolean;
}

type Vertical = 'products' | 'menu' | 'services' | 'articles' | 'projects' | 'properties' | 'rooms' | 'courses';

const VERTICALS: Record<string, Vertical> = {
  ecommerce: 'products', fashion: 'products', technology: 'products', automotive: 'products',
  food: 'menu', 'health-beauty': 'services', services: 'services', corporate: 'services',
  media: 'articles', portfolio: 'projects', 'real-estate': 'properties', hospitality: 'rooms', education: 'courses',
};

const COMMERCE = new Set(['ecommerce', 'fashion', 'technology', 'automotive']);

const SECTION_LABELS: Record<Vertical, string> = {
  products: 'Products', menu: 'Menu', services: 'Services', articles: 'Stories',
  projects: 'Work', properties: 'Properties', rooms: 'Rooms', courses: 'Programs',
};

const MARQUEE_WORDS: Record<Vertical, string[]> = {
  products: ['Considered design', 'Made to last', 'Free returns'],
  menu: ['Seasonal ingredients', 'Made fresh daily', 'Walk-ins welcome'],
  services: ['Expert care', 'Transparent pricing', 'Book online'],
  articles: ['Independent voices', 'Long reads', 'New issue'],
  projects: ['Selected work', 'Strategy & craft', 'Open for commissions'],
  properties: ['Exceptional homes', 'Local expertise', 'Private viewings'],
  rooms: ['Thoughtful stays', 'Best direct rate', 'A sense of place'],
  courses: ['Learn by doing', 'Expert-led', 'Small cohorts'],
};

function luminance(hex = '#ffffff') {
  const value = hex.replace('#', '');
  if (value.length !== 6) return 1;
  const channels = [0, 2, 4].map((i) => {
    const c = parseInt(value.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function renderHeadline(headline: string, highlight?: string) {
  if (highlight && headline.includes(highlight)) {
    const index = headline.indexOf(highlight);
    return (
      <>
        {headline.slice(0, index)}
        <em>{highlight}</em>
        {headline.slice(index + highlight.length)}
      </>
    );
  }
  return headline;
}

function useScrollOffset(threshold = 20) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > threshold);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, [threshold]);
  return scrolled;
}

export function SiteRenderer({ payload, live = false, preview = false }: Props) {
  const { site, template, items, categories } = payload;
  const theme = site.theme;
  const palette = theme.palette;
  const content: Content = site.content;
  const vertical = VERTICALS[site.category] || 'products';
  const meta = categoryMeta(template);
  const navItems = useMemo(() => content.navLinks?.length ? content.navLinks : [
    { label: 'Home', href: '#top' },
    { label: 'Our story', href: '#about' },
    { label: SECTION_LABELS[vertical], href: '#items' },
    { label: 'Contact', href: '#contact' },
  ], [vertical, content.navLinks]);
  const scrolled = useScrollOffset();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [itemModal, setItemModal] = useState<Item | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [cart, setCart] = useState<{ item: Item; qty: number; options: Record<string, string> }[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartStep, setCartStep] = useState<'cart' | 'checkout' | 'success'>('cart');
  const [checkout, setCheckout] = useState({ name: '', email: '', phone: '', note: '' });
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [inquiry, setInquiry] = useState<{ open: boolean; type: 'contact' | 'booking' | 'newsletter'; subject?: string }>({ open: false, type: 'contact' });
  const [inquiryForm, setInquiryForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [inquiryBusy, setInquiryBusy] = useState(false);
  const [inquiryDone, setInquiryDone] = useState(false);
  const [inquiryError, setInquiryError] = useState('');
  const tracked = useRef(false);

  const isCommerce = COMMERCE.has(site.category) && template.commerce !== false;
  const currency = site.settings.business?.currency || 'USD';
  const visibleItems = activeCategory === 'all' ? items : items.filter((i) => i.category_id === activeCategory);
  const cartCount = cart.reduce((sum, line) => sum + line.qty, 0);
  const cartSubtotal = cart.reduce((sum, line) => sum + line.item.price_cents * line.qty, 0);
  const cartShipping = cart.some((line) => line.item.kind === 'product') && cartSubtotal < 15000 ? 900 : 0;
  const cartTotal = cartSubtotal + cartShipping;
  const useCart = isCommerce;
  const p = palette;
  const buttonText = luminance(p.primary) > 0.45 ? p.text : '#ffffff';
  const accentText = luminance(p.accent) > 0.55 ? '#171411' : '#ffffff';
  const bgLuminance = luminance(p.bg);
  const darkTheme = bgLuminance < 0.28;

  const rootStyle = {
    '--s-primary': p.primary,
    '--s-secondary': p.secondary,
    '--s-accent': p.accent,
    '--s-bg': p.bg,
    '--s-surface': p.surface,
    '--s-text': p.text,
    '--s-muted': p.muted,
    '--s-line': p.line,
    '--s-radius': theme.radius || '14px',
    '--s-heading': theme.fonts.heading,
    '--s-body': theme.fonts.body,
    '--s-on-primary': buttonText,
    '--s-on-accent': accentText,
    '--s-image-overlay': bgLuminance < 0.2 ? 'rgba(0,0,0,.55)' : 'rgba(255,255,255,.2)',
    '--s-footer-bg': darkTheme ? p.surface : p.text,
    '--s-footer-fg': darkTheme ? p.text : p.bg,
  } as React.CSSProperties;

  useEffect(() => {
    if (!live || preview || tracked.current || !site.slug) return;
    tracked.current = true;
    fetch(`/api/public/sites/${site.slug}/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: window.location.pathname, referrer: document.referrer }),
    }).catch(() => undefined);
  }, [live, preview, site.slug]);

  useEffect(() => {
    if (!cartOpen && !itemModal && !inquiry.open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setCartOpen(false); setItemModal(null); setInquiry((v) => ({ ...v, open: false }));
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [cartOpen, itemModal, inquiry.open]);

  useEffect(() => {
    if (preview) return;
    const previous = document.body.style.background;
    document.body.style.background = p.bg;
    return () => { document.body.style.background = previous; };
  }, [p.bg, preview]);

  function scrollTo(id: string) {
    setMenuOpen(false);
    if (preview) {
      document.querySelector(`.site-preview-scroll ${id}`)?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  function openInquiry(type: 'contact' | 'booking' | 'newsletter', subject?: string) {
    if (type === 'newsletter') {
      setInquiry({ open: true, type, subject });
      setInquiryForm({ name: '', email: '', phone: '', message: 'Please add me to the newsletter.' });
    } else {
      setInquiry({ open: true, type, subject });
      setInquiryForm({ name: '', email: '', phone: '', message: subject ? `I'm interested in ${subject}.` : '' });
    }
    setInquiryDone(false);
    setInquiryError('');
  }

  async function submitInquiry(e: React.FormEvent, forcedType?: string) {
    e.preventDefault();
    setInquiryBusy(true);
    setInquiryError('');
    if (!inquiryForm.name || !inquiryForm.email) {
      setInquiryError('Please add your name and email.');
      setInquiryBusy(false);
      return;
    }
    if (preview) {
      setInquiryDone(true);
      setInquiryBusy(false);
      return;
    }
    try {
      const response = await fetch(`/api/public/sites/${site.slug}/inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...inquiryForm, type: forcedType || inquiry.type }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Something went wrong');
      setInquiryDone(true);
    } catch (error: any) {
      setInquiryError(error.message);
    } finally {
      setInquiryBusy(false);
    }
  }

  function lineKey(line: { item: Item; options: Record<string, string> }) {
    return `${line.item.id}::${JSON.stringify(line.options)}`;
  }

  function openItem(item: Item) {
    const defaults: Record<string, string> = {};
    for (const variation of item.metadata?.variations || []) {
      if (variation?.name && variation.options?.[0]) defaults[variation.name] = variation.options[0];
    }
    setSelectedOptions(defaults);
    setItemModal(item);
  }

  function addToCart(item: Item, options: Record<string, string> = {}) {
    if (item.kind === 'product' && item.stock <= 0) return;
    setCart((prev) => {
      const existing = prev.find((line) => lineKey(line) === lineKey({ item, options }));
      if (existing) {
        if (item.kind === 'product' && existing.qty >= item.stock) return prev;
        return prev.map((line) => lineKey(line) === lineKey({ item, options }) ? { ...line, qty: Math.min(line.qty + 1, item.kind === 'product' ? item.stock : line.qty + 1) } : line);
      }
      return [...prev, { item, qty: 1, options }];
    });
    setItemModal(null);
    setCartOpen(true);
    setCartStep('cart');
  }

  function changeQty(key: string, delta: number) {
    setCart((prev) => prev
      .map((line) => {
        if (lineKey(line) !== key) return line;
        const max = line.item.kind === 'product' ? line.item.stock : 99;
        return { ...line, qty: Math.max(0, Math.min(max, line.qty + delta)) };
      })
      .filter((line) => line.qty > 0));
  }

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    setCheckoutError('');
    if (!checkout.name || !checkout.email) {
      setCheckoutError('Please add your name and email.');
      return;
    }
    setCheckoutBusy(true);
    if (preview) {
      setOrderNumber('PREVIEW-01');
      setCartStep('success');
      setCheckoutBusy(false);
      return;
    }
    try {
      const response = await fetch(`/api/public/sites/${site.slug}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: { name: checkout.name, email: checkout.email, phone: checkout.phone },
          items: cart.map((line) => ({ id: line.item.id, quantity: line.qty, options: line.options })),
          note: checkout.note,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not place the order');
      setOrderNumber(data.order.number);
      setCart([]);
      setCartStep('success');
    } catch (error: any) {
      setCheckoutError(error.message);
    } finally {
      setCheckoutBusy(false);
    }
  }

  function itemAction(item: Item) {
    if (useCart) addToCart(item);
    else openInquiry(vertical === 'articles' ? 'contact' : 'booking', item.name);
  }

  function priceLabel(item: Item) {
    if (vertical === 'articles') return item.metadata?.readTime || 'Read';
    if (!item.price_cents) {
      return ['services', 'projects', 'properties', 'rooms', 'courses', 'corporate'].includes(site.category) ? 'Enquire' : 'Free';
    }
    const formatted = formatMoney(item.price_cents, currency);
    return `${formatted}${item.metadata?.suffix || ''}`;
  }

  const sectionOrder = (content.sections?.length ? content.sections : ['marquee', 'featured', 'about', 'gallery', 'testimonials', 'cta'])
    .filter((s) => !['contact'].includes(s));

  const logo = theme.logoUrl ? <img src={theme.logoUrl} alt={site.name} className="site-logo-img" /> : <span>{theme.logoText || site.name}</span>;

  return (
    <div className={`site-root site-layout-${theme.layout || 'classic'} site-hero-${theme.hero || 'split'} site-nav-${theme.nav || 'classic'} site-cards-${theme.card || 'cover'} site-vertical-${vertical}${preview ? ' site-is-preview' : ''}`} style={rootStyle} id="top">
      {content.announcement && (
        <div className="site-announcement">
          <span>{content.announcement}</span>
          <button onClick={() => scrollTo('#items')}>Explore <ArrowRight size={12} /></button>
        </div>
      )}

      <header className={`site-header${scrolled ? ' scrolled' : ''}`}>
        <div className="site-container site-nav-inner">
          <button className="site-mobile-toggle" onClick={() => setMenuOpen(true)} aria-label="Open menu"><span /><span /></button>
          <a className="site-logo" href="#top" onClick={(e) => { e.preventDefault(); scrollTo('#top'); }}>{logo}</a>
          <nav className="site-nav-links">
            {navItems.map((link) => (
              <a key={link.label} href={link.href} onClick={(e) => { if (!preview) return; e.preventDefault(); scrollTo(link.href); }}>{link.label}</a>
            ))}
          </nav>
          <div className="site-nav-actions">
            {useCart && (
              <button className="site-cart-btn" onClick={() => { setCartOpen(true); setCartStep('cart'); }} aria-label="Open cart">
                <ShoppingBag size={17} />
                {cartCount > 0 && <span>{cartCount}</span>}
              </button>
            )}
            <button className="site-btn site-btn-primary site-nav-cta" onClick={() => useCart ? scrollTo('#items') : openInquiry('booking')}>
              {useCart ? 'Shop now' : meta.cta}
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="site-mobile-menu">
          <div className="site-mobile-menu-head">
            <span className="site-logo">{logo}</span>
            <button className="site-icon-btn" onClick={() => setMenuOpen(false)}><X size={20} /></button>
          </div>
          <nav>
            {navItems.map((link) => (
              <a key={link.label} href={link.href} onClick={(e) => { e.preventDefault(); scrollTo(link.href); }}>{link.label}<ArrowUpRight size={18} /></a>
            ))}
          </nav>
          <button className="site-btn site-btn-primary site-btn-block" onClick={() => { setMenuOpen(false); useCart ? scrollTo('#items') : openInquiry('booking'); }}>{useCart ? 'Shop the collection' : meta.cta}</button>
        </div>
      )}

      <main>
        <section className={`site-hero site-hero--${theme.hero || 'split'}`} id="hero">
          <div className="site-container site-hero-inner">
            <div className="site-hero-copy">
              <div className="site-eyebrow"><span />{content.hero.eyebrow}</div>
              <h1>{renderHeadline(content.hero.headline, content.hero.highlight)}</h1>
              <p>{content.hero.subheadline}</p>
              <div className="site-hero-actions">
                <button className="site-btn site-btn-primary site-btn-lg" onClick={() => (content.hero.primaryCta.toLowerCase().includes('book') || content.hero.primaryCta.toLowerCase().includes('reserve') ? openInquiry('booking') : scrollTo('#items'))}>
                  {content.hero.primaryCta} <ArrowRight size={16} />
                </button>
                <button className="site-btn site-btn-ghost site-btn-lg" onClick={() => scrollTo('#about')}>{content.hero.secondaryCta} <span className="site-arrow-circle"><ArrowUpRight size={13} /></span></button>
              </div>
              {content.stats && content.stats.length > 0 && (
                <div className="site-hero-stats">
                  {content.stats.slice(0, 3).map((stat) => (
                    <div key={stat.label}><strong>{stat.value}</strong><span>{stat.label}</span></div>
                  ))}
                </div>
              )}
            </div>
            <div className="site-hero-visual">
              <div className="site-hero-image">
                <img src={content.hero.image || template.image} alt={`${site.name} — ${content.hero.eyebrow}`} />
              </div>
              {theme.hero === 'bento' && <span className="site-hero-tile" />}
              {theme.hero === 'editorial' && (
                <div className="site-hero-caption"><span>{content.hero.eyebrow}</span><span>↓</span></div>
              )}
              <span className="site-hero-roundel" aria-hidden="true">
                <svg viewBox="0 0 100 100"><defs><path id="circlePath" d="M 50,50 m -35,0 a 35,35 0 1,1 70,0 a 35,35 0 1,1 -70,0" /></defs><text><textPath href="#circlePath">MADE WITH CARE · {site.name.toUpperCase()} · </textPath></text></svg>
                <ArrowUpRight size={16} />
              </span>
            </div>
          </div>
          <div className="site-hero-scroll"><span>Scroll to explore</span><i /></div>
        </section>

        {sectionOrder.map((section) => {
          if (section === 'marquee') {
            return (
              <div className="site-marquee" key={section}>
                <div className="site-marquee-track">
                  {[...MARQUEE_WORDS[vertical], ...MARQUEE_WORDS[vertical], ...MARQUEE_WORDS[vertical], ...MARQUEE_WORDS[vertical]].map((word, i) => (
                    <span key={i}>{word}<i>✦</i></span>
                  ))}
                </div>
              </div>
            );
          }
          if (section === 'featured' || section === 'items') {
            return (
              <section className="site-section site-items-section" id="items" key={section}>
                <div className="site-container">
                  <div className="site-section-head">
                    <div>
                      <div className="site-eyebrow"><span />{vertical === 'articles' ? 'From the journal' : 'Featured selection'}</div>
                      <h2>{meta.itemHeading}</h2>
                    </div>
                    {categories.length > 1 && (
                      <div className="site-filter-chips">
                        <button className={activeCategory === 'all' ? 'active' : ''} onClick={() => setActiveCategory('all')}>All</button>
                        {categories.map((category: Category) => (
                          <button key={category.id} className={activeCategory === category.id ? 'active' : ''} onClick={() => setActiveCategory(category.id)}>{category.name}</button>
                        ))}
                      </div>
                    )}
                  </div>
                  {visibleItems.length === 0 ? (
                    <div className="site-empty">New {SECTION_LABELS[vertical].toLowerCase()} are coming soon.</div>
                  ) : (
                    <div className="site-items-grid">
                      {visibleItems.map((item, index) => {
                        const soldOut = useCart && item.kind === 'product' && item.stock <= 0;
                        return (
                        <article className="site-item-card" key={item.id} style={{ animationDelay: `${index * 40}ms` }}>
                          <button className="site-item-image" onClick={() => openItem(item)} aria-label={`View ${item.name}`}>
                            <img src={item.images[0] || template.image} alt={item.name} loading="lazy" />
                            {soldOut ? <span className="site-item-tag sold-out">Sold out</span> : item.metadata?.tag && <span className="site-item-tag">{item.metadata.tag}</span>}
                            <span className="site-item-hover">{soldOut ? 'Sold out' : `${meta.itemAction} `}{!soldOut && <ArrowUpRight size={14} />}</span>
                          </button>
                          <div className="site-item-info">
                            <div className="site-item-title-row">
                              <h3>{item.name}</h3>
                              <span>{priceLabel(item)}</span>
                            </div>
                            <p>{item.description}</p>
                            {vertical === 'articles' && (
                              <div className="site-item-byline">{item.metadata?.author || 'Editorial'} · {item.metadata?.readTime || '5 min read'}</div>
                            )}
                            {vertical === 'properties' && item.metadata?.meta && <div className="site-item-byline">{item.metadata.meta}</div>}
                            {vertical === 'rooms' && item.metadata?.meta && <div className="site-item-byline">{item.metadata.meta}</div>}
                            <button className="site-item-action" onClick={() => openItem(item)} disabled={soldOut}>
                              {soldOut ? 'Sold out' : meta.itemAction} {!soldOut && <ArrowRight size={13} />}
                            </button>
                          </div>
                        </article>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>
            );
          }
          if (section === 'about') {
            return (
              <section className="site-section site-about" id="about" key={section}>
                <div className="site-container site-about-grid">
                  <div className="site-about-media">
                    <img src={content.about.image || template.image2} alt={`${site.name} story`} loading="lazy" />
                    {content.stats?.[0] && <div className="site-about-badge"><strong>{content.stats[0].value}</strong><span>{content.stats[0].label}</span></div>}
                  </div>
                  <div className="site-about-copy">
                    <div className="site-eyebrow"><span />Our story</div>
                    <h2>{content.about.title}</h2>
                    <p>{content.about.body}</p>
                    <div className="site-features">
                      {content.about.features?.map((feature, i) => (
                        <div className="site-feature" key={feature.title}>
                          <span>{String(i + 1).padStart(2, '0')}</span>
                          <div><h4>{feature.title}</h4><p>{feature.body}</p></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            );
          }
          if (section === 'gallery' && content.gallery?.length) {
            return (
              <section className="site-section site-gallery-section" id="gallery" key={section}>
                <div className="site-container">
                  <div className="site-gallery-head"><span className="site-eyebrow"><span />In the wild</span><h2>Details, up close.</h2></div>
                  <div className="site-gallery">
                    {content.gallery.slice(0, 3).map((image, i) => <figure key={`${image}-${i}`}><img src={image} alt={`${site.name} gallery ${i + 1}`} loading="lazy" /></figure>)}
                  </div>
                </div>
              </section>
            );
          }
          if (section === 'testimonials' && content.testimonials?.length) {
            return (
              <section className="site-section site-testimonials" key={section}>
                <div className="site-container">
                  <div className="site-section-head">
                    <div><div className="site-eyebrow"><span />Kind words</div><h2>What people say.</h2></div>
                  </div>
                  <div className="site-testimonial-grid">
                    {content.testimonials.slice(0, 2).map((review) => (
                      <blockquote key={review.name}>
                        <div className="site-stars">{[...Array(5)].map((_, i) => <Star key={i} size={13} fill="currentColor" />)}</div>
                        <p>“{review.quote}”</p>
                        <footer><span>{review.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}</span><div><strong>{review.name}</strong><small>{review.role}</small></div></footer>
                      </blockquote>
                    ))}
                  </div>
                </div>
              </section>
            );
          }
          if (section === 'cta') {
            return (
              <section className="site-section site-cta-band-section" key={section}>
                <div className="site-container">
                  <div className="site-cta-band">
                    <div><div className="site-eyebrow"><span />{content.hero.eyebrow}</div><h2>{vertical === 'articles' ? 'Never miss an issue.' : vertical === 'properties' ? 'Find your next chapter.' : 'Let’s make something good.'}</h2><p>{content.hero.subheadline}</p></div>
                    <button className="site-btn site-btn-accent site-btn-lg" onClick={() => openInquiry(vertical === 'articles' ? 'newsletter' : 'booking')}>{vertical === 'articles' ? 'Subscribe' : meta.cta} <ArrowRight size={16} /></button>
                  </div>
                </div>
              </section>
            );
          }
          return null;
        })}

        <section className="site-section site-contact" id="contact">
          <div className="site-container site-contact-grid">
            <div className="site-contact-copy">
              <div className="site-eyebrow"><span />Say hello</div>
              <h2>{content.contact.title}</h2>
              <p>{content.contact.body}</p>
              <div className="site-contact-details">
                <div><MapPin size={17} /><span>{content.contact.address}</span></div>
                <div><Phone size={17} /><a href={`tel:${content.contact.phone}`}>{content.contact.phone}</a></div>
                <div><Mail size={17} /><a href={`mailto:${content.contact.email}`}>{content.contact.email}</a></div>
                <div><Clock3 size={17} /><span>{content.contact.hours?.map((h) => `${h.day}: ${h.time}`).join(' · ')}</span></div>
              </div>
              <div className="site-socials">
                {site.settings.social?.instagram && <a href={site.settings.social.instagram} target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={17} /></a>}
                {site.settings.social?.facebook && <a href={site.settings.social.facebook} target="_blank" rel="noreferrer" aria-label="Facebook"><Facebook size={17} /></a>}
                {site.settings.social?.x && <a href={site.settings.social.x} target="_blank" rel="noreferrer" aria-label="X"><Twitter size={17} /></a>}
                {site.settings.social?.linkedin && <a href={site.settings.social.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn"><Linkedin size={17} /></a>}
              </div>
            </div>
            <div className="site-contact-form-card">
              <h3>Send a message</h3>
              <form onSubmit={(e) => submitInquiry(e, 'contact')} className="site-form">
                <div className="site-form-row">
                  <label><span>Your name</span><input value={inquiryForm.name} onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })} placeholder="Jane Smith" /></label>
                  <label><span>Email address</span><input type="email" value={inquiryForm.email} onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })} placeholder="jane@example.com" /></label>
                </div>
                <label><span>How can we help?</span><textarea rows={4} value={inquiryForm.message} onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })} placeholder="Tell us a little about what you have in mind..." /></label>
                {inquiryError && <div className="site-form-error">{inquiryError}</div>}
                {inquiryDone
                  ? <div className="site-form-success"><Check size={16} /> Thanks — we’ll be in touch shortly.</div>
                  : <button className="site-btn site-btn-primary" type="submit" disabled={inquiryBusy}>{inquiryBusy ? <span className="site-spinner" /> : <><Send size={15} /> Send message</>}</button>}
              </form>
            </div>
          </div>
          <div className="site-container">
            <div className="site-map" aria-label="Map location"><div className="site-map-grid" /><div className="site-map-pin"><MapPin size={18} /><span>{content.contact.address}</span></div></div>
          </div>
        </section>

        <section className="site-newsletter">
          <div className="site-container site-newsletter-inner">
            <div><div className="site-eyebrow"><span />Keep in touch</div><h2>{content.newsletter?.title || 'Stay in the loop'}</h2><p>{content.newsletter?.body}</p></div>
            <form onSubmit={(e) => { e.preventDefault(); openInquiry('newsletter'); }} className="site-newsletter-form">
              <input type="email" placeholder="Your email address" aria-label="Email address" required />
              <button className="site-btn site-btn-primary" type="submit">{content.newsletter?.button || 'Subscribe'} <ArrowRight size={14} /></button>
            </form>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="site-container">
          <div className="site-footer-top">
            <div className="site-footer-brand">
              <span className="site-footer-logo">{logo}</span>
              <p>{content.footer.tagline}</p>
              <div className="site-socials">
                {site.settings.social?.instagram && <a href={site.settings.social.instagram} aria-label="Instagram"><Instagram size={16} /></a>}
                {site.settings.social?.facebook && <a href={site.settings.social.facebook} aria-label="Facebook"><Facebook size={16} /></a>}
                {site.settings.social?.x && <a href={site.settings.social.x} aria-label="X"><Twitter size={16} /></a>}
                {site.settings.social?.linkedin && <a href={site.settings.social.linkedin} aria-label="LinkedIn"><Linkedin size={16} /></a>}
              </div>
            </div>
            <div className="site-footer-cols">
              <div><h4>Explore</h4>{navItems.map((link) => <a key={link.label} href={link.href} onClick={(e) => { e.preventDefault(); scrollTo(link.href); }}>{link.label}</a>)}</div>
              <div><h4>Visit</h4><span>{content.contact.address}</span><a href={`tel:${content.contact.phone}`}>{content.contact.phone}</a><a href={`mailto:${content.contact.email}`}>{content.contact.email}</a></div>
              <div><h4>Open</h4>{content.contact.hours?.map((h) => <span key={h.day}>{h.day} · {h.time}</span>)}</div>
            </div>
          </div>
          <div className="site-footer-bottom">
            <span>{content.footer.copyright}</span>
            <span className="site-footer-legal">Privacy · Terms</span>
          </div>
        </div>
      </footer>

      {live && site.settings.publishing?.showBadge !== false && (
        <a className="site-made-badge" href="/" target="_blank" rel="noreferrer"><span className="site-made-dot" /> Made with Nexora</a>
      )}

      {/* Item detail / story */}
      {itemModal && (
        <div className="site-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setItemModal(null); }}>
          <div className={`site-modal site-item-modal${vertical === 'articles' ? ' is-article' : ''}`}>
            <button className="site-modal-close" onClick={() => setItemModal(null)} aria-label="Close"><X size={19} /></button>
            <div className="site-item-modal-media"><img src={itemModal.images[0] || template.image} alt={itemModal.name} /></div>
            <div className="site-item-modal-copy">
              <span className="site-item-category">{itemModal.metadata?.tag || itemModal.metadata?.author || meta.label}</span>
              <h2>{itemModal.name}</h2>
              {vertical === 'articles' && <div className="site-item-byline">{itemModal.metadata?.author} · {itemModal.metadata?.readTime}</div>}
              <p>{itemModal.description}</p>
              {itemModal.metadata?.meta && <p className="site-item-spec">{itemModal.metadata.meta}</p>}
              {vertical !== 'articles' && <div className="site-item-modal-price">{priceLabel(itemModal)}</div>}
              {Array.isArray(itemModal.metadata?.variations) && itemModal.metadata.variations.length > 0 && (
                <div className="site-variants">
                  {itemModal.metadata.variations.map((variation: any) => (
                    <div className="site-variant-group" key={variation.name}>
                      <span>{variation.name}</span>
                      <div>
                        {variation.options?.map((option: string) => (
                          <button
                            type="button"
                            key={option}
                            className={selectedOptions[variation.name] === option ? 'active' : ''}
                            onClick={() => setSelectedOptions((prev) => ({ ...prev, [variation.name]: option }))}
                          >{option}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="site-item-modal-actions">
                {useCart ? (
                  itemModal.kind === 'product' && itemModal.stock <= 0 ? (
                    <button className="site-btn site-btn-primary" disabled>Sold out</button>
                  ) : (
                    <button className="site-btn site-btn-primary" onClick={() => addToCart(itemModal, selectedOptions)}><ShoppingBag size={15} /> Add to bag</button>
                  )
                ) : (
                  <button className="site-btn site-btn-primary" onClick={() => { const current = itemModal; setItemModal(null); openInquiry(vertical === 'articles' ? 'contact' : 'booking', current.name); }}>
                    <CalendarDays size={15} /> {meta.itemAction}
                  </button>
                )}
                {itemModal.metadata?.duration && <span className="site-item-duration"><Clock3 size={14} /> {itemModal.metadata.duration}</span>}
              </div>
              <div className="site-item-trust"><span><Check size={13} /> Personal service</span><span><Check size={13} /> Secure checkout</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Inquiry modal */}
      {inquiry.open && (
        <div className="site-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setInquiry((v) => ({ ...v, open: false })); }}>
          <div className="site-modal site-inquiry-modal">
            <button className="site-modal-close" onClick={() => setInquiry((v) => ({ ...v, open: false }))} aria-label="Close"><X size={19} /></button>
            {inquiryDone ? (
              <div className="site-inquiry-done">
                <span><Check size={26} /></span>
                <h2>Thank you.</h2>
                <p>{preview ? 'This is a preview of the enquiry experience. Live websites deliver this message to the owner’s inbox.' : 'Your message is on its way. We will be in touch shortly.'}</p>
                <button className="site-btn site-btn-primary" onClick={() => setInquiry((v) => ({ ...v, open: false }))}>Close</button>
              </div>
            ) : (
              <>
                <span className="site-item-category">{inquiry.type === 'newsletter' ? 'Newsletter' : inquiry.type === 'booking' ? 'Enquiry' : 'Get in touch'}</span>
                <h2>{inquiry.type === 'newsletter' ? 'A little good mail.' : inquiry.type === 'booking' ? `Let’s arrange your ${vertical === 'rooms' ? 'stay' : vertical === 'menu' ? 'table' : 'visit'}.` : 'Say hello.'}</h2>
                <p className="site-modal-lead">{inquiry.subject ? `Enquiring about ${inquiry.subject}.` : 'Leave your details and we’ll get back to you within one working day.'}</p>
                <form className="site-form" onSubmit={submitInquiry}>
                  <div className="site-form-row">
                    <label><span>Your name</span><input value={inquiryForm.name} onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })} required placeholder="Jane Smith" /></label>
                    <label><span>Email</span><input type="email" value={inquiryForm.email} onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })} required placeholder="jane@example.com" /></label>
                  </div>
                  {inquiry.type !== 'newsletter' && <label><span>Phone (optional)</span><input value={inquiryForm.phone} onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })} placeholder="+44 7700 900000" /></label>}
                  <label><span>Message</span><textarea rows={4} value={inquiryForm.message} onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })} /></label>
                  {inquiryError && <div className="site-form-error">{inquiryError}</div>}
                  <button className="site-btn site-btn-primary site-btn-block" type="submit" disabled={inquiryBusy}>{inquiryBusy ? <span className="site-spinner" /> : inquiry.type === 'newsletter' ? 'Subscribe' : 'Send enquiry'}</button>
                </form>
                <p className="site-modal-fineprint">By submitting, you agree to be contacted about your enquiry. No spam, ever.</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Cart drawer */}
      {cartOpen && (
        <>
          <div className="site-drawer-backdrop" onClick={() => setCartOpen(false)} />
          <aside className="site-cart-drawer" aria-label="Shopping bag">
            <div className="site-cart-head">
              <h2>{cartStep === 'success' ? 'Order confirmed' : cartStep === 'checkout' ? 'Checkout' : 'Your bag'}</h2>
              <button className="site-icon-btn" onClick={() => setCartOpen(false)} aria-label="Close cart"><X size={19} /></button>
            </div>
            {cartStep === 'success' ? (
              <div className="site-cart-success">
                <span><Check size={24} /></span>
                <h3>Thank you{checkout.name ? `, ${checkout.name.split(' ')[0]}` : ''}.</h3>
                <p>{preview ? 'This is a preview checkout. Orders on live websites arrive instantly in the owner dashboard.' : `Your order ${orderNumber} has been received. A confirmation is on its way to ${checkout.email}.`}</p>
                <button className="site-btn site-btn-primary" onClick={() => setCartOpen(false)}>Continue exploring</button>
              </div>
            ) : cart.length === 0 ? (
              <div className="site-cart-empty">
                <ShoppingBag size={28} />
                <p>Your bag is empty.</p>
                <button className="site-btn site-btn-primary" onClick={() => { setCartOpen(false); scrollTo('#items'); }}>Explore the collection</button>
              </div>
            ) : cartStep === 'cart' ? (
              <>
                <div className="site-cart-items">
                  {cart.map((line) => (
                    <div className="site-cart-line" key={lineKey(line)}>
                      <img src={line.item.images[0] || template.image} alt={line.item.name} />
                      <div className="site-cart-line-copy">
                        <h4>{line.item.name}</h4>
                        {Object.entries(line.options).length > 0 && <small>{Object.entries(line.options).map(([name, value]) => `${name}: ${value}`).join(' · ')}</small>}
                        <span>{formatMoney(line.item.price_cents, currency)}</span>
                        <div className="site-qty">
                          <button onClick={() => changeQty(lineKey(line), -1)} aria-label="Decrease quantity"><Minus size={12} /></button>
                          <span>{line.qty}</span>
                          <button onClick={() => changeQty(lineKey(line), 1)} aria-label="Increase quantity"><Plus size={12} /></button>
                        </div>
                      </div>
                      <div className="site-cart-line-total">{formatMoney(line.item.price_cents * line.qty, currency)}</div>
                    </div>
                  ))}
                </div>
                <div className="site-cart-foot">
                  <div><span>Subtotal</span><strong>{formatMoney(cartSubtotal, currency)}</strong></div>
                  {cartShipping > 0 && <div className="site-cart-shipping"><span>Shipping</span><span>{formatMoney(cartShipping, currency)}</span></div>}
                  <p>{cartShipping > 0 ? 'Shipping added at checkout.' : 'Free shipping applied.'}</p>
                  <button className="site-btn site-btn-primary site-btn-block" onClick={() => setCartStep('checkout')}>Continue to checkout <ArrowRight size={15} /></button>
                  <span className="site-cart-secure"><Check size={12} /> Secure checkout · Easy returns</span>
                </div>
              </>
            ) : (
              <form className="site-cart-checkout" onSubmit={placeOrder}>
                <div className="site-checkout-summary">
                  {cart.map((line) => <div key={lineKey(line)}><span>{line.qty} × {line.item.name}{Object.keys(line.options).length ? ` (${Object.values(line.options).join(', ')})` : ''}</span><span>{formatMoney(line.item.price_cents * line.qty, currency)}</span></div>)}
                  <div><span>Shipping</span><span>{cartShipping ? formatMoney(cartShipping, currency) : 'Free'}</span></div>
                  <div className="site-checkout-total"><span>Total</span><span>{formatMoney(cartTotal, currency)}</span></div>
                </div>
                <label><span>Full name</span><input value={checkout.name} onChange={(e) => setCheckout({ ...checkout, name: e.target.value })} required placeholder="Jane Smith" /></label>
                <label><span>Email</span><input type="email" value={checkout.email} onChange={(e) => setCheckout({ ...checkout, email: e.target.value })} required placeholder="jane@example.com" /></label>
                <label><span>Phone (optional)</span><input value={checkout.phone} onChange={(e) => setCheckout({ ...checkout, phone: e.target.value })} placeholder="+44 7700 900000" /></label>
                <label><span>Order note (optional)</span><textarea rows={3} value={checkout.note} onChange={(e) => setCheckout({ ...checkout, note: e.target.value })} placeholder="Anything we should know?" /></label>
                {checkoutError && <div className="site-form-error">{checkoutError}</div>}
                <div className="site-checkout-pay"><span>Pay on delivery</span><span className="site-pay-badge">Demo checkout</span></div>
                <button className="site-btn site-btn-primary site-btn-block" type="submit" disabled={checkoutBusy}>{checkoutBusy ? <span className="site-spinner" /> : <>Place order · {formatMoney(cartTotal, currency)}</>}</button>
                <button type="button" className="site-checkout-back" onClick={() => setCartStep('cart')}>← Back to bag</button>
              </form>
            )}
          </aside>
        </>
      )}
    </div>
  );
}
