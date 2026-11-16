import type { Content, Item, PublicSitePayload, Site, Template } from './types';

export function previewPayload(template: Template): PublicSitePayload {
  const content: Content = {
    hero: {
      eyebrow: template.demo.eyebrow,
      headline: template.demo.headline,
      highlight: template.demo.highlight,
      subheadline: template.demo.subheadline,
      primaryCta: template.demo.primaryCta,
      secondaryCta: template.demo.secondaryCta,
      image: template.image,
      image2: template.image2,
    },
    about: {
      title: template.demo.aboutTitle,
      body: template.demo.aboutBody,
      image: template.image2,
      features: template.demo.features,
    },
    stats: template.demo.stats,
    gallery: template.demo.gallery,
    testimonials: template.demo.testimonials,
    sections: template.sections,
    contact: {
      title: 'Come and say hello.',
      body: 'We would love to hear from you. Drop us a line or visit in person.',
      address: '14 Market Street, London',
      phone: '+44 20 7946 0128',
      email: `hello@${template.id.replace(/-/g, '')}.com`,
      hours: [
        { day: 'Monday – Friday', time: '9:00 — 18:00' },
        { day: 'Saturday', time: '10:00 — 16:00' },
        { day: 'Sunday', time: 'Closed' },
      ],
    },
    footer: {
      tagline: template.demo.aboutBody.split('.')[0] + '.',
      copyright: `© ${new Date().getFullYear()} ${template.name}. All rights reserved.`,
    },
    announcement: template.demo.eyebrow,
    newsletter: {
      title: 'Stay in the loop',
      body: 'New arrivals, stories and occasional offers. No noise.',
      button: 'Subscribe',
    },
    meta: { title: `${template.name} — ${template.demo.eyebrow}`, description: template.demo.subheadline },
  };
  const categories = [...new Map(template.demo.items.map((demo) => [demo.category, demo.category])).keys()];
  const items: Item[] = template.demo.items.map((demo, index) => ({
    id: `preview-item-${index}`,
    site_id: 'preview',
    category_id: `preview-cat-${categories.indexOf(demo.category)}`,
    kind: 'product',
    name: demo.name,
    slug: demo.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    description: demo.description,
    price_cents: Math.round(Number(demo.price || 0) * 100),
    compare_at_cents: null,
    stock: 12,
    status: 'active',
    images: [template.image],
    metadata: {
      tag: demo.tag, duration: demo.duration, meta: demo.meta,
      author: demo.author, readTime: demo.readTime, suffix: demo.suffix,
    },
    featured: index === 0 ? 1 : 0,
    created_at: new Date().toISOString(),
  }));
  const site: Site = {
    id: 'preview',
    name: template.name,
    slug: template.id,
    description: template.description,
    category: template.category,
    templateId: template.id,
    status: 'draft',
    customDomain: null,
    publishedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    theme: {
      palette: template.palette,
      fonts: template.fonts,
      layout: template.layout,
      hero: template.hero,
      nav: template.nav,
      card: template.card,
      radius: template.radius,
      logoText: template.name,
      logoUrl: '',
      mode: 'light',
    },
    content,
    settings: {
      seo: { title: content.meta!.title, description: content.meta!.description, keywords: template.tags },
      business: { name: template.name, email: content.contact.email, phone: content.contact.phone, address: content.contact.address },
      publishing: { showBadge: true },
      social: {},
    },
  };
  return {
    site,
    template,
    items,
    categories: categories.map((name, index) => ({
      id: `preview-cat-${index}`,
      site_id: 'preview',
      kind: 'product',
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      sort_order: index,
    })),
    owner: 'Nexora Studio',
    reviews: template.demo.testimonials,
  };
}

export function categoryMeta(template: Template) {
  const map: Record<string, { label: string; itemHeading: string; cta: string; itemAction: string }> = {
    ecommerce: { label: 'Collection', itemHeading: 'The collection', cta: 'Shop now', itemAction: 'View product' },
    fashion: { label: 'Collection', itemHeading: 'The collection', cta: 'Shop now', itemAction: 'View product' },
    technology: { label: 'Products', itemHeading: 'Built for what is next', cta: 'Get started', itemAction: 'View product' },
    automotive: { label: 'Inventory', itemHeading: 'The inventory', cta: 'Book a test drive', itemAction: 'View vehicle' },
    food: { label: 'Menu', itemHeading: 'On the menu', cta: 'Reserve a table', itemAction: 'Order' },
    'health-beauty': { label: 'Treatments', itemHeading: 'Treatments & services', cta: 'Book an appointment', itemAction: 'Book' },
    services: { label: 'Services', itemHeading: 'What we offer', cta: 'Book an appointment', itemAction: 'Enquire' },
    corporate: { label: 'Expertise', itemHeading: 'How we can help', cta: 'Start a conversation', itemAction: 'Find out more' },
    media: { label: 'Stories', itemHeading: 'Latest stories', cta: 'Subscribe', itemAction: 'Read story' },
    portfolio: { label: 'Work', itemHeading: 'Selected work', cta: 'Start a project', itemAction: 'View project' },
    'real-estate': { label: 'Properties', itemHeading: 'Featured properties', cta: 'Book a viewing', itemAction: 'Enquire' },
    hospitality: { label: 'Stays', itemHeading: 'Rooms & suites', cta: 'Check availability', itemAction: 'Enquire' },
    education: { label: 'Programs', itemHeading: 'Our programs', cta: 'Apply now', itemAction: 'Apply' },
  };
  return map[template.category] || map.services;
}
