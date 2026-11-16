import { db } from '../db.js';
import { id, slugify, uniqueSlug, parseJson } from '../lib/helpers.js';
import { defaultContent, defaultTheme, templateById, categoryById } from '../templates/catalog.js';
export const PLAN_LIMITS = {
  starter: { aiLimit: 50, productLimit: 25, storageLimitMb: 250, price: 19, name: 'Starter', sites: 1, customDomain: false },
  growth: { aiLimit: 500, productLimit: 250, storageLimitMb: 5000, price: 49, name: 'Growth', sites: 3, customDomain: true },
  scale: { aiLimit: 2500, productLimit: 100000, storageLimitMb: 25000, price: 99, name: 'Scale', sites: 10, customDomain: true },
};

export function verticalKind(categoryId) {
  const cat = categoryById(categoryId);
  const vertical = cat?.vertical || 'products';
  return {
    products: 'product', menu: 'menu', services: 'service', articles: 'article',
    projects: 'project', properties: 'property', rooms: 'room', courses: 'course',
  }[vertical] || 'product';
}

export function siteSlugTaken(slug, exceptId = null) {
  const row = exceptId
    ? db.prepare('SELECT id FROM sites WHERE slug = ? AND id != ?').get(slug, exceptId)
    : db.prepare('SELECT id FROM sites WHERE slug = ?').get(slug);
  return Boolean(row);
}

export function getTemplateById(templateId) {
  const row = db.prepare('SELECT * FROM templates WHERE id = ?').get(templateId);
  if (row) {
    const manifest = parseJson(row.manifest, null);
    if (manifest) return { ...manifest, enabled: Boolean(row.enabled) };
  }
  return templateById(templateId);
}

export function createSite({ ownerId, name, category, templateId, description = '', slug, status = 'draft' }) {
  const template = getTemplateById(templateId);
  if (!template) throw Object.assign(new Error('Template not found'), { status: 400 });
  if (!name?.trim()) throw Object.assign(new Error('Business name is required'), { status: 400 });
  const finalSlug = uniqueSlug(slug || name, siteSlugTaken);
  const siteId = id('site');
  const theme = defaultTheme(template);
  theme.logoText = name;
  const content = defaultContent(template, { name, slug: finalSlug });
  content.footer.copyright = `© ${new Date().getFullYear()} ${name}. All rights reserved.`;
  content.meta.title = `${name} — ${template.demo.eyebrow}`;
  content.meta.description = description || template.demo.subheadline;
  const categoryId = category || template.category;
  const settings = {
    seo: {
      title: `${name} — ${template.style}`,
      description: description || template.demo.subheadline,
      keywords: [categoryId, template.style.split(' ')[0].toLowerCase(), name.toLowerCase()],
      ogImage: template.image,
      canonical: '',
      indexable: true,
    },
    business: {
      name,
      email: `hello@${finalSlug}.com`,
      phone: '+44 20 7946 0128',
      address: '14 Market Street, London',
      timezone: 'Europe/London',
      currency: 'USD',
    },
    publishing: { showBadge: true, password: '' },
    social: { instagram: '', facebook: '', x: '', linkedin: '' },
  };

  db.prepare(`
    INSERT INTO sites (id, owner_id, name, slug, description, category, template_id, status, theme, content, settings, published_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    siteId, ownerId, name.trim(), finalSlug, description, categoryId, templateId,
    status, JSON.stringify(theme), JSON.stringify(content), JSON.stringify(settings),
    status === 'published' ? new Date().toISOString() : null,
  );

  const plan = 'starter';
  const limits = PLAN_LIMITS[plan];
  db.prepare(`
    INSERT INTO subscriptions (id, site_id, plan, status, ai_limit, ai_used, product_limit, storage_limit_mb, renews_at)
    VALUES (?, ?, ?, 'trialing', ?, 0, ?, ?, ?)
  `).run(id('sub'), siteId, plan, limits.aiLimit, limits.productLimit, limits.storageLimitMb, new Date(Date.now() + 14 * 86400000).toISOString());

  // Seed the template's demo catalogue so the dashboard is useful from day one.
  const kind = verticalKind(categoryId);
  const categoryMap = new Map();
  const gallery = template.demo.gallery?.length ? template.demo.gallery : [template.image, template.image2].filter(Boolean);
  for (const demoItem of template.demo.items) {
    const catName = demoItem.category || 'General';
    const catSlug = slugify(catName);
    if (!categoryMap.has(catName)) {
      const catId = id('cat');
      db.prepare('INSERT INTO categories (id, site_id, kind, name, slug, sort_order) VALUES (?, ?, ?, ?, ?, ?)')
        .run(catId, siteId, kind, catName, catSlug, categoryMap.size);
      categoryMap.set(catName, catId);
    }
    const meta = {
      tag: demoItem.tag || '',
      duration: demoItem.duration || '',
      meta: demoItem.meta || '',
      author: demoItem.author || '',
      readTime: demoItem.readTime || '',
      suffix: demoItem.suffix || '',
      compareAt: demoItem.compareAt || null,
    };
    if (template.demo.items.indexOf(demoItem) === 0) {
      if (['ecommerce', 'fashion'].includes(categoryId)) {
        meta.variations = [{ name: 'Size', options: ['XS', 'S', 'M', 'L', 'XL'] }, { name: 'Colour', options: ['Black', 'Cream'] }];
      } else if (categoryId === 'technology') {
        meta.variations = [{ name: 'Storage', options: ['128 GB', '256 GB', '512 GB'] }, { name: 'Colour', options: ['Graphite', 'Silver'] }];
      } else if (categoryId === 'automotive') {
        meta.variations = [{ name: 'Transmission', options: ['Manual', 'Automatic'] }];
      }
    }
    const image = gallery[template.demo.items.indexOf(demoItem) % gallery.length] || template.image;
    db.prepare(`
      INSERT INTO items (id, site_id, category_id, kind, name, slug, description, price_cents, compare_at_cents, stock, status, images, metadata, featured, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?)
    `).run(
      id('item'), siteId, categoryMap.get(catName), kind, demoItem.name, slugify(demoItem.name),
      demoItem.description, Math.round(Number(demoItem.price || 0) * 100),
      demoItem.compareAt ? Math.round(Number(demoItem.compareAt) * 100) : null,
      kind === 'service' || kind === 'menu' || kind === 'course' || kind === 'room' || kind === 'property' ? 0 : 24,
      JSON.stringify([image]), JSON.stringify(meta),
      demoItem.tag ? 1 : 0, template.demo.items.indexOf(demoItem),
    );
  }

  const mediaImages = [...new Set([template.image, template.image2, ...gallery].filter(Boolean))];
  for (const image of mediaImages) {
    db.prepare('INSERT INTO media (id, site_id, name, url, mime, size) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id('med'), siteId, image.split('/').pop(), image, 'image/jpeg', 180000);
  }

  db.prepare('INSERT INTO activity (id, site_id, user_id, action, detail) VALUES (?, ?, ?, ?, ?)')
    .run(id('act'), siteId, ownerId, 'site.created', `Created ${name} using the ${template.name} design`);
  db.prepare('INSERT INTO activity (id, site_id, user_id, action, detail) VALUES (?, ?, ?, ?, ?)')
    .run(id('act'), siteId, ownerId, 'template.applied', `Applied ${template.name} (${template.category})`);

  db.prepare('UPDATE templates SET uses = uses + 1 WHERE id = ?').run(templateId);

  return db.prepare('SELECT * FROM sites WHERE id = ?').get(siteId);
}

export function getSiteOwner(site) {
  return db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(site.owner_id);
}

export function parseSite(site) {
  return {
    ...site,
    theme: parseJson(site.theme),
    content: parseJson(site.content),
    settings: parseJson(site.settings),
  };
}
