import express from 'express';
import { z } from 'zod';
import { db, logActivity } from '../db.js';
import { id, parseJson, slugify, uniqueSlug, siteListItem, publicSite } from '../lib/helpers.js';
import { authenticate, loadSite } from '../middleware/auth.js';
import { createSite, siteSlugTaken, PLAN_LIMITS, verticalKind, getTemplateById } from '../services/sites.js';
import { serializeTemplate } from './templates.js';
import { defaultContent, defaultTheme } from '../templates/catalog.js';

const router = express.Router();
router.use(authenticate);

const createSchema = z.object({
  name: z.string().trim().min(2).max(100),
  category: z.string().trim().min(2).max(50),
  templateId: z.string().trim().min(2).max(80),
  description: z.string().max(500).optional().default(''),
  slug: z.string().trim().max(64).optional(),
});

function deepMerge(base, patch) {
  if (patch === undefined) return base;
  if (Array.isArray(patch)) return patch;
  if (patch === null || typeof patch !== 'object') return patch;
  const output = (base && typeof base === 'object' && !Array.isArray(base)) ? { ...base } : {};
  for (const [key, value] of Object.entries(patch)) {
    output[key] = deepMerge(output[key], value);
  }
  return output;
}

function subscriptionFor(siteId) {
  return db.prepare('SELECT * FROM subscriptions WHERE site_id = ?').get(siteId) || null;
}

function siteDetails(site) {
  const templateRow = db.prepare('SELECT * FROM templates WHERE id = ?').get(site.template_id);
  return {
    site: publicSite(site),
    subscription: subscriptionFor(site.id),
    template: templateRow ? serializeTemplate(templateRow) : null,
    domains: db.prepare('SELECT * FROM domains WHERE site_id = ? ORDER BY created_at DESC').all(site.id),
    limits: PLAN_LIMITS[subscriptionFor(site.id)?.plan || 'starter'],
  };
}

router.get('/slug-availability', (req, res) => {
  const base = slugify(String(req.query.slug || ''));
  if (!base) return res.json({ available: false, slug: '' });
  const slug = siteSlugTaken(base) ? uniqueSlug(base, siteSlugTaken) : base;
  res.json({ available: !siteSlugTaken(base), slug, suggestion: slug });
});

router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT s.*, sub.plan, sub.status AS subscription_status
    FROM sites s LEFT JOIN subscriptions sub ON sub.site_id = s.id
    WHERE s.owner_id = ? ORDER BY s.updated_at DESC
  `).all(req.user.id);
  const sites = rows.map((row) => {
    const counts = db.prepare(`SELECT
      (SELECT COUNT(*) FROM items WHERE site_id = ? AND status != 'archived') AS items,
      (SELECT COUNT(*) FROM orders WHERE site_id = ?) AS orders,
      (SELECT COUNT(*) FROM customers WHERE site_id = ?) AS customers
    `).get(row.id, row.id, row.id);
    return { ...siteListItem(row, { plan: row.plan, status: row.subscription_status }), counts };
  });
  res.json({ sites, planLimits: PLAN_LIMITS });
});

router.post('/', (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  if (!getTemplateById(parsed.data.templateId)) return res.status(400).json({ error: 'Choose a valid template' });

  const planRows = db.prepare(`
    SELECT sub.plan FROM sites s JOIN subscriptions sub ON sub.site_id = s.id WHERE s.owner_id = ?
  `).all(req.user.id);
  const highest = planRows.reduce((best, row) => {
    const order = ['starter', 'growth', 'scale'];
    return order.indexOf(row.plan) > order.indexOf(best) ? row.plan : best;
  }, 'starter');
  const siteLimit = PLAN_LIMITS[highest].sites;
  if (planRows.length >= siteLimit) {
    return res.status(403).json({ error: `Your ${PLAN_LIMITS[highest].name} plan allows ${siteLimit} website${siteLimit > 1 ? 's' : ''}. Upgrade to add more.` });
  }

  const site = createSite({ ownerId: req.user.id, ...parsed.data });
  logActivity({ siteId: site.id, userId: req.user.id, action: 'site.created', detail: `Created ${site.name}` });
  res.status(201).json(siteDetails(site));
});

router.get('/:siteId', loadSite, (req, res) => {
  res.json(siteDetails(req.site));
});

router.patch('/:siteId', loadSite, (req, res) => {
  const schema = z.object({
    name: z.string().trim().min(2).max(100).optional(),
    description: z.string().max(500).optional(),
    slug: z.string().trim().max(64).optional(),
    category: z.string().trim().max(50).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const updates = [];
  const values = [];
  if (parsed.data.name !== undefined) { updates.push('name = ?'); values.push(parsed.data.name); }
  if (parsed.data.description !== undefined) { updates.push('description = ?'); values.push(parsed.data.description); }
  if (parsed.data.category !== undefined) { updates.push('category = ?'); values.push(parsed.data.category); }
  if (parsed.data.slug !== undefined) {
    const nextSlug = slugify(parsed.data.slug);
    if (!nextSlug) return res.status(400).json({ error: 'Enter a valid web address' });
    if (siteSlugTaken(nextSlug, req.site.id)) return res.status(409).json({ error: 'That web address is already taken' });
    updates.push('slug = ?'); values.push(nextSlug);
  }
  if (!updates.length) return res.json(siteDetails(req.site));
  updates.push("updated_at = datetime('now')");
  db.prepare(`UPDATE sites SET ${updates.join(', ')} WHERE id = ?`).run(...values, req.site.id);
  const site = db.prepare('SELECT * FROM sites WHERE id = ?').get(req.site.id);
  logActivity({ siteId: site.id, userId: req.user.id, action: 'site.updated', detail: 'Updated website details' });
  res.json(siteDetails(site));
});

router.delete('/:siteId', loadSite, (req, res) => {
  db.prepare('DELETE FROM sites WHERE id = ?').run(req.site.id);
  logActivity({ userId: req.user.id, action: 'site.deleted', detail: `Deleted ${req.site.name}` });
  res.json({ ok: true });
});

router.post('/:siteId/duplicate', loadSite, (req, res) => {
  const source = req.site;
  const site = createSite({
    ownerId: req.user.id,
    name: `${source.name} (copy)`,
    category: source.category,
    templateId: source.template_id,
    description: source.description,
    slug: `${source.slug}-copy`,
    status: 'draft',
  });
  db.prepare('UPDATE sites SET theme = ?, content = ?, settings = ? WHERE id = ?')
    .run(source.theme, source.content, source.settings, site.id);
  res.status(201).json(siteDetails(db.prepare('SELECT * FROM sites WHERE id = ?').get(site.id)));
});

router.patch('/:siteId/design', loadSite, (req, res) => {
  const schema = z.object({
    theme: z.record(z.string(), z.any()).optional(),
    content: z.record(z.string(), z.any()).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid design data' });
  const theme = parsed.data.theme ? deepMerge(parseJson(req.site.theme), parsed.data.theme) : parseJson(req.site.theme);
  const content = parsed.data.content ? deepMerge(parseJson(req.site.content), parsed.data.content) : parseJson(req.site.content);
  db.prepare("UPDATE sites SET theme = ?, content = ?, updated_at = datetime('now') WHERE id = ?")
    .run(JSON.stringify(theme), JSON.stringify(content), req.site.id);
  logActivity({ siteId: req.site.id, userId: req.user.id, action: 'design.updated', detail: 'Saved design customizations' });
  const site = db.prepare('SELECT * FROM sites WHERE id = ?').get(req.site.id);
  res.json(siteDetails(site));
});

router.patch('/:siteId/settings', loadSite, (req, res) => {
  const schema = z.object({ settings: z.record(z.string(), z.any()) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid settings' });
  const settings = deepMerge(parseJson(req.site.settings), parsed.data.settings);
  db.prepare("UPDATE sites SET settings = ?, updated_at = datetime('now') WHERE id = ?")
    .run(JSON.stringify(settings), req.site.id);
  logActivity({ siteId: req.site.id, userId: req.user.id, action: 'settings.updated', detail: 'Updated website settings' });
  const site = db.prepare('SELECT * FROM sites WHERE id = ?').get(req.site.id);
  res.json(siteDetails(site));
});

router.post('/:siteId/publish', loadSite, (req, res) => {
  const subscription = subscriptionFor(req.site.id);
  if (subscription && ['paused', 'cancelled'].includes(subscription.status)) {
    return res.status(403).json({ error: 'Your subscription is not active. Update billing to publish.' });
  }
  db.prepare("UPDATE sites SET status = 'published', published_at = COALESCE(published_at, ?), updated_at = datetime('now') WHERE id = ?")
    .run(new Date().toISOString(), req.site.id);
  logActivity({ siteId: req.site.id, userId: req.user.id, action: 'site.published', detail: `Published ${req.site.name}` });
  const site = db.prepare('SELECT * FROM sites WHERE id = ?').get(req.site.id);
  res.json({ ...siteDetails(site), publicUrl: `/site/${site.slug}` });
});

router.post('/:siteId/unpublish', loadSite, (req, res) => {
  db.prepare("UPDATE sites SET status = 'draft', updated_at = datetime('now') WHERE id = ?").run(req.site.id);
  logActivity({ siteId: req.site.id, userId: req.user.id, action: 'site.unpublished', detail: `Unpublished ${req.site.name}` });
  const site = db.prepare('SELECT * FROM sites WHERE id = ?').get(req.site.id);
  res.json(siteDetails(site));
});

router.post('/:siteId/apply-template', loadSite, (req, res) => {
  const schema = z.object({ templateId: z.string(), resetContent: z.boolean().optional().default(false) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Choose a template' });
  const template = getTemplateById(parsed.data.templateId);
  if (!template) return res.status(404).json({ error: 'Template not found' });
  const theme = defaultTheme(template);
  theme.logoText = req.site.name;
  let content = parseJson(req.site.content);
  if (parsed.data.resetContent) {
    content = defaultContent(template, { name: req.site.name, slug: req.site.slug });
  }
  db.prepare("UPDATE sites SET template_id = ?, category = ?, theme = ?, content = ?, updated_at = datetime('now') WHERE id = ?")
    .run(template.id, template.category, JSON.stringify(theme), JSON.stringify(content), req.site.id);
  db.prepare('UPDATE templates SET uses = uses + 1 WHERE id = ?').run(template.id);
  logActivity({ siteId: req.site.id, userId: req.user.id, action: 'template.applied', detail: `Applied ${template.name}` });
  res.json(siteDetails(db.prepare('SELECT * FROM sites WHERE id = ?').get(req.site.id)));
});

router.get('/:siteId/domains', loadSite, (req, res) => {
  res.json({ domains: db.prepare('SELECT * FROM domains WHERE site_id = ? ORDER BY created_at DESC').all(req.site.id) });
});

router.post('/:siteId/domains', loadSite, (req, res) => {
  const schema = z.object({ domain: z.string().trim().min(4).max(253) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Enter a domain name' });
  const domain = parsed.data.domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '');
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) return res.status(400).json({ error: 'Enter a valid domain, like yourbusiness.com' });
  const existing = db.prepare('SELECT id FROM domains WHERE domain = ?').get(domain);
  if (existing) return res.status(409).json({ error: 'That domain is already connected to a site' });
  const sub = subscriptionFor(req.site.id);
  if (!PLAN_LIMITS[sub?.plan || 'starter'].customDomain) {
    return res.status(403).json({ error: 'Custom domains are available on Growth and Scale plans.' });
  }
  db.prepare('INSERT INTO domains (id, site_id, domain, status, ssl_status) VALUES (?, ?, ?, ?, ?)')
    .run(id('dom'), req.site.id, domain, 'pending', 'pending');
  db.prepare("UPDATE sites SET custom_domain = ?, domain_status = 'pending', updated_at = datetime('now') WHERE id = ?").run(domain, req.site.id);
  logActivity({ siteId: req.site.id, userId: req.user.id, action: 'domain.added', detail: `Connected ${domain}` });
  res.status(201).json({ domains: db.prepare('SELECT * FROM domains WHERE site_id = ? ORDER BY created_at DESC').all(req.site.id) });
});

router.post('/:siteId/domains/:domainId/verify', loadSite, (req, res) => {
  const domain = db.prepare('SELECT * FROM domains WHERE id = ? AND site_id = ?').get(req.params.domainId, req.site.id);
  if (!domain) return res.status(404).json({ error: 'Domain not found' });
  // Local/demo verification. In production this is an asynchronous DNS + TLS check.
  db.prepare("UPDATE domains SET status = 'verified', ssl_status = 'active' WHERE id = ?").run(domain.id);
  db.prepare("UPDATE sites SET domain_status = 'verified', updated_at = datetime('now') WHERE id = ?").run(req.site.id);
  logActivity({ siteId: req.site.id, userId: req.user.id, action: 'domain.verified', detail: `Verified ${domain.domain}` });
  res.json({ domains: db.prepare('SELECT * FROM domains WHERE site_id = ? ORDER BY created_at DESC').all(req.site.id) });
});

router.delete('/:siteId/domains/:domainId', loadSite, (req, res) => {
  const domain = db.prepare('SELECT * FROM domains WHERE id = ? AND site_id = ?').get(req.params.domainId, req.site.id);
  if (!domain) return res.status(404).json({ error: 'Domain not found' });
  db.prepare('DELETE FROM domains WHERE id = ?').run(domain.id);
  const next = db.prepare('SELECT * FROM domains WHERE site_id = ? ORDER BY created_at DESC LIMIT 1').get(req.site.id);
  db.prepare("UPDATE sites SET custom_domain = ?, domain_status = ? WHERE id = ?")
    .run(next?.domain || null, next?.status || 'none', req.site.id);
  res.json({ domains: db.prepare('SELECT * FROM domains WHERE site_id = ? ORDER BY created_at DESC').all(req.site.id) });
});

router.get('/:siteId/overview', loadSite, (req, res) => {  const siteId = req.site.id;
  const orderStats = db.prepare(`
    SELECT COUNT(*) AS orders, COALESCE(SUM(total_cents),0) AS revenue
    FROM orders WHERE site_id = ? AND status NOT IN ('cancelled','refunded')
  `).get(siteId);
  const totalOrders = db.prepare('SELECT COUNT(*) AS n FROM orders WHERE site_id = ?').get(siteId).n;
  const pending = db.prepare("SELECT COUNT(*) AS n FROM orders WHERE site_id = ? AND status IN ('pending','processing')").get(siteId).n;
  const customers = db.prepare('SELECT COUNT(*) AS n FROM customers WHERE site_id = ?').get(siteId).n;
  const items = db.prepare("SELECT COUNT(*) AS n FROM items WHERE site_id = ? AND status != 'archived'").get(siteId).n;
  const newInquiries = db.prepare("SELECT COUNT(*) AS n FROM inquiries WHERE site_id = ? AND status = 'new'").get(siteId).n;
  const aiUsed = db.prepare('SELECT COUNT(*) AS n FROM ai_usage WHERE site_id = ?').get(siteId).n;
  const visits = db.prepare("SELECT COUNT(*) AS n FROM site_views WHERE site_id = ? AND created_at >= datetime('now','-30 days')").get(siteId).n;
  const recentOrders = db.prepare('SELECT * FROM orders WHERE site_id = ? ORDER BY created_at DESC LIMIT 6').all(siteId)
    .map((o) => ({ ...o, items: parseJson(o.items, []) }));
  const activity = db.prepare('SELECT * FROM activity WHERE site_id = ? ORDER BY created_at DESC LIMIT 8').all(siteId);
  const topItems = db.prepare(`
    SELECT id, name, images, price_cents, stock FROM items WHERE site_id = ? AND status = 'active' ORDER BY featured DESC, created_at DESC LIMIT 4
  `).all(siteId).map((i) => ({ ...i, images: parseJson(i.images, []) }));

  const days = 14;
  const buckets = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    buckets.push({ date: d.toISOString().slice(0, 10), label: d.toLocaleDateString('en', { weekday: 'short' }), revenue: 0, orders: 0, visits: 0, inquiries: 0 });
  }
  const chartRows = db.prepare(`
    SELECT substr(created_at,1,10) AS date, SUM(total_cents) AS revenue, COUNT(*) AS orders
    FROM orders WHERE site_id = ? AND status NOT IN ('cancelled','refunded') AND created_at >= ?
    GROUP BY substr(created_at,1,10)
  `).all(siteId, buckets[0].date);
  for (const row of chartRows) {
    const bucket = buckets.find((b) => b.date === row.date);
    if (bucket) { bucket.revenue = row.revenue; bucket.orders = row.orders; }
  }
  const viewRows = db.prepare(`
    SELECT substr(created_at,1,10) AS date, COUNT(*) AS visits
    FROM site_views WHERE site_id = ? AND created_at >= ? GROUP BY substr(created_at,1,10)
  `).all(siteId, buckets[0].date);
  for (const row of viewRows) {
    const bucket = buckets.find((b) => b.date === row.date);
    if (bucket) bucket.visits = row.visits;
  }
  const inquiryRows = db.prepare(`
    SELECT substr(created_at,1,10) AS date, COUNT(*) AS inquiries
    FROM inquiries WHERE site_id = ? AND created_at >= ? GROUP BY substr(created_at,1,10)
  `).all(siteId, buckets[0].date);
  for (const row of inquiryRows) {
    const bucket = buckets.find((b) => b.date === row.date);
    if (bucket) bucket.inquiries = row.inquiries;
  }

  const site = publicSite(req.site);
  res.json({
    site,
    subscription: subscriptionFor(siteId),
    limits: PLAN_LIMITS[subscriptionFor(siteId)?.plan || 'starter'],
    stats: {
      revenue: orderStats.revenue,
      orders: totalOrders,
      paidOrders: orderStats.orders,
      pendingOrders: pending,
      customers,
      items,
      newInquiries,
      aiUsed,
      visits,
      conversion: visits ? Number(((orderStats.orders / visits) * 100).toFixed(1)) : 0,
    },
    recentOrders,
    activity,
    topItems,
    chart: buckets,
    type: verticalKind(req.site.category),
  });
});

export default router;
