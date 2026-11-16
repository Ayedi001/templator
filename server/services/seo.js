import { db, json } from '../db.js';

const SCHEMA_TYPES = {
  ecommerce: 'Store',
  fashion: 'ClothingStore',
  technology: 'Organization',
  automotive: 'AutoDealer',
  food: 'Restaurant',
  'health-beauty': 'HealthAndBeautyBusiness',
  services: 'ProfessionalService',
  corporate: 'ProfessionalService',
  media: 'NewsMediaOrganization',
  portfolio: 'Organization',
  'real-estate': 'RealEstateAgent',
  hospitality: 'Hotel',
  education: 'School',
};

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeXml(value = '') {
  return escapeHtml(value).replace(/&apos;/g, '&#39;');
}

function trim(value, length) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  return text.length > length ? `${text.slice(0, length - 1).trimEnd()}…` : text;
}

function absolute(origin, value) {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('/')) return `${origin}${value}`;
  return `${origin}/${value}`;
}

export function getPublishedSite(slug) {
  return db.prepare(`
    SELECT s.*, t.name AS template_name, t.style AS template_style
    FROM sites s LEFT JOIN templates t ON t.id = s.template_id
    WHERE s.slug = ? AND s.status = 'published'
  `).get(slug) || null;
}

function seoData(site, origin) {
  const settings = json(site.settings);
  const content = json(site.content);
  const seo = settings.seo || {};
  const name = site.name;
  const description = trim(seo.description || content.meta?.description || content.hero?.subheadline || site.description || `${name} — ${site.template_style || 'independent business'}.`, 158);
  const title = trim(seo.title || content.meta?.title || `${name} — ${site.template_style || site.category}`, 68);
  const canonical = /^https?:\/\//i.test(seo.canonical || '') ? seo.canonical : `${origin}/site/${site.slug}`;
  const image = absolute(origin, seo.ogImage || content.hero?.image || '');
  const indexable = seo.indexable !== false;
  const city = settings.business?.address?.split(',').map((part) => part.trim()).filter(Boolean).at(-1) || '';
  const socials = Object.values(settings.social || {}).filter((value) => typeof value === 'string' && value.startsWith('http'));
  const items = db.prepare("SELECT name, description, price_cents FROM items WHERE site_id = ? AND status = 'active' ORDER BY featured DESC, sort_order LIMIT 6").all(site.id);
  return { settings, content, seo, name, description, title, canonical, image, indexable, city, socials, items, type: SCHEMA_TYPES[site.category] || 'LocalBusiness' };
}

function structuredData(site, data) {
  const business = data.settings.business || {};
  const contact = data.content.contact || {};
  const schema = {
    '@context': 'https://schema.org',
    '@type': data.type,
    name: data.name,
    description: data.description,
    url: data.canonical,
    ...(data.image ? { image: data.image } : {}),
    ...(business.email || contact.email ? { email: business.email || contact.email } : {}),
    ...(business.phone || contact.phone ? { telephone: business.phone || contact.phone } : {}),
    ...(business.address || contact.address ? {
      address: {
        '@type': 'PostalAddress',
        streetAddress: business.address || contact.address,
        ...(data.city ? { addressLocality: data.city } : {}),
      },
    } : {}),
    ...(data.socials.length ? { sameAs: data.socials } : {}),
    ...(data.items.filter((item) => item.price_cents > 0).length ? {
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: `${data.name} catalogue`,
        itemListElement: data.items.filter((item) => item.price_cents > 0).slice(0, 6).map((item) => ({
          '@type': 'Offer',
          itemOffered: { '@type': 'Product', name: item.name, description: trim(item.description, 160) },
          price: (item.price_cents / 100).toFixed(2),
          priceCurrency: data.settings.business?.currency || 'USD',
        })),
      },
    } : {}),
  };
  return schema;
}

function seoFallback(site, data) {
  const contact = data.content.contact || {};
  const items = data.items.map((item) => `<li>${escapeHtml(item.name)}${item.price_cents ? ` — ${escapeHtml((item.price_cents / 100).toFixed(2))}` : ''}</li>`).join('');
  return `<noscript><main style="font-family:system-ui,sans-serif;max-width:760px;margin:48px auto;padding:0 24px;line-height:1.6">
    <p>${escapeHtml(data.content.hero?.eyebrow || '')}</p>
    <h1>${escapeHtml(data.content.hero?.headline || data.name)}</h1>
    <p>${escapeHtml(data.content.hero?.subheadline || site.description || '')}</p>
    ${data.content.about?.body ? `<h2>${escapeHtml(data.content.about.title || 'About')}</h2><p>${escapeHtml(data.content.about.body)}</p>` : ''}
    ${items ? `<h2>${escapeHtml(site.category === 'food' ? 'Menu' : 'Catalogue')}</h2><ul>${items}</ul>` : ''}
    <h2>Contact</h2>
    <p>${escapeHtml(contact.address || '')}<br>${escapeHtml(contact.phone || '')}<br>${escapeHtml(contact.email || '')}</p>
    <p><a href="${escapeHtml(data.canonical)}">View ${escapeHtml(data.name)} with JavaScript enabled</a></p>
  </main></noscript>`;
}

export function renderSiteHtml(templateHtml, site, origin) {
  const data = seoData(site, origin);
  const schema = JSON.stringify(structuredData(site, data)).replace(/</g, '\\u003c');
  const robots = data.indexable ? 'index, follow, max-image-preview:large' : 'noindex, nofollow';
  const meta = `
    <meta name="robots" content="${robots}">
    <link rel="canonical" href="${escapeHtml(data.canonical)}">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="${escapeHtml(site.name)}">
    <meta property="og:title" content="${escapeHtml(data.title)}">
    <meta property="og:description" content="${escapeHtml(data.description)}">
    <meta property="og:url" content="${escapeHtml(data.canonical)}">
    ${data.image ? `<meta property="og:image" content="${escapeHtml(data.image)}">` : ''}
    <meta name="twitter:card" content="${data.image ? 'summary_large_image' : 'summary'}">
    <meta name="twitter:title" content="${escapeHtml(data.title)}">
    <meta name="twitter:description" content="${escapeHtml(data.description)}">
    ${data.image ? `<meta name="twitter:image" content="${escapeHtml(data.image)}">` : ''}
    <script type="application/ld+json">${schema}</script>
  `;
  let html = templateHtml
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(data.title)}</title>`)
    .replace(/<meta\s+name="description"[^>]*>/i, `<meta name="description" content="${escapeHtml(data.description)}">`);
  if (!/<meta\s+name="description"/i.test(html)) {
    html = html.replace('</head>', `    <meta name="description" content="${escapeHtml(data.description)}">\n  </head>`);
  }
  html = html.replace('</head>', `${meta}\n  </head>`);
  html = html.replace('<div id="root"></div>', `${seoFallback(site, data)}\n    <div id="root"></div>`);
  return html;
}

export function renderSitemap(origin) {
  const sites = db.prepare("SELECT slug, updated_at, settings FROM sites WHERE status = 'published' ORDER BY updated_at DESC").all();
  const urls = [
    { loc: `${origin}/`, lastmod: new Date().toISOString().slice(0, 10) },
    { loc: `${origin}/templates`, lastmod: new Date().toISOString().slice(0, 10) },
    ...sites.filter((site) => json(site.settings).seo?.indexable !== false).map((site) => ({
      loc: `${origin}/site/${site.slug}`,
      lastmod: String(site.updated_at || '').slice(0, 10),
    })),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url><loc>${escapeXml(url.loc)}</loc><lastmod>${escapeXml(url.lastmod)}</lastmod></url>`).join('\n')}\n</urlset>\n`;
}

export function renderRobots(origin) {
  return `User-agent: *\nAllow: /\nDisallow: /dashboard\nDisallow: /admin\nDisallow: /api\nDisallow: /preview\nDisallow: /onboarding\nDisallow: /login\nDisallow: /register\n\nSitemap: ${origin}/sitemap.xml\n`;
}
