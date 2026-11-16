import crypto from 'node:crypto';

export function id(prefix = 'id') {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

export function slugify(value = '') {
  return String(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

export function uniqueSlug(base, exists) {
  const root = slugify(base) || 'site';
  let candidate = root;
  let n = 2;
  while (exists(candidate)) {
    candidate = `${root}-${n}`;
    n += 1;
  }
  return candidate;
}

export function toArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function parseJson(value, fallback = {}) {
  if (value && typeof value === 'object') return value;
  try { return JSON.parse(value); } catch { return fallback; }
}

export function nowIso() {
  return new Date().toISOString();
}

export function dateOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export function money(cents) {
  return Math.round(Number(cents) || 0);
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function pick(obj, keys) {
  const out = {};
  for (const key of keys) if (obj[key] !== undefined) out[key] = obj[key];
  return out;
}

export function publicSite(site) {
  return {
    id: site.id,
    name: site.name,
    slug: site.slug,
    description: site.description,
    category: site.category,
    templateId: site.template_id,
    status: site.status,
    customDomain: site.custom_domain,
    domainStatus: site.domain_status,
    publishedAt: site.published_at,
    createdAt: site.created_at,
    updatedAt: site.updated_at,
    theme: parseJson(site.theme),
    content: parseJson(site.content),
    settings: parseJson(site.settings),
  };
}

export function siteListItem(site, subscription) {
  return {
    id: site.id,
    name: site.name,
    slug: site.slug,
    description: site.description,
    category: site.category,
    templateId: site.template_id,
    status: site.status,
    customDomain: site.custom_domain,
    domainStatus: site.domain_status,
    publishedAt: site.published_at,
    createdAt: site.created_at,
    updatedAt: site.updated_at,
    plan: subscription?.plan || 'starter',
    subscriptionStatus: subscription?.status || 'trialing',
    publicUrl: site.status === 'published' ? `/site/${site.slug}` : null,
  };
}

export function safeJson(value, fallback = {}) {
  if (value === undefined) return fallback;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return fallback; }
  }
  return value;
}
