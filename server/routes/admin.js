import express from 'express';
import { z } from 'zod';
import { db, logActivity } from '../db.js';
import { id, parseJson, slugify } from '../lib/helpers.js';
import { authenticate, requireSuperAdmin } from '../middleware/auth.js';
import { serializeTemplate } from './templates.js';
import { PLAN_LIMITS, getTemplateById } from '../services/sites.js';
import { agentCatalog } from '../ai/agents/index.js';
import { aiStatus } from '../ai/provider.js';

const router = express.Router();
router.use(authenticate, requireSuperAdmin);

function plans() {
  return Object.entries(PLAN_LIMITS).map(([id, data]) => ({ id, ...data }));
}

function readSetting(key, fallback = null) {
  const row = db.prepare('SELECT value FROM platform_settings WHERE key = ?').get(key);
  if (!row) return fallback;
  try { return JSON.parse(row.value); } catch { return row.value; }
}

function writeSetting(key, value) {
  const stored = typeof value === 'string' ? value : JSON.stringify(value);
  db.prepare(`INSERT INTO platform_settings (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value`).run(key, stored);
}

function userRows() {
  return db.prepare(`
    SELECT u.*,
      (SELECT COUNT(*) FROM sites s WHERE s.owner_id = u.id) AS sites_count,
      (SELECT COUNT(*) FROM sites s WHERE s.owner_id = u.id AND s.status = 'published') AS published_count,
      (SELECT COALESCE(SUM(o.total_cents),0) FROM orders o JOIN sites s ON s.id = o.site_id WHERE s.owner_id = u.id AND o.status NOT IN ('cancelled','refunded')) AS gmv_cents
    FROM users u ORDER BY u.created_at DESC
  `).all();
}

router.get('/overview', (_req, res) => {
  const counts = {
    users: db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'owner'").get().n,
    admins: db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'admin'").get().n,
    sites: db.prepare('SELECT COUNT(*) AS n FROM sites').get().n,
    published: db.prepare("SELECT COUNT(*) AS n FROM sites WHERE status = 'published'").get().n,
    drafts: db.prepare("SELECT COUNT(*) AS n FROM sites WHERE status = 'draft'").get().n,
    templates: db.prepare('SELECT COUNT(*) AS n FROM templates WHERE enabled = 1').get().n,
    orders: db.prepare('SELECT COUNT(*) AS n FROM orders').get().n,
    gmv: db.prepare("SELECT COALESCE(SUM(total_cents),0) AS n FROM orders WHERE status NOT IN ('cancelled','refunded')").get().n,
    aiCalls: db.prepare("SELECT COUNT(*) AS n FROM ai_usage WHERE created_at >= datetime('now','start of month')").get().n,
    inquiries: db.prepare('SELECT COUNT(*) AS n FROM inquiries').get().n,
  };
  const subscriptions = db.prepare("SELECT plan, status, COUNT(*) AS n FROM subscriptions GROUP BY plan, status").all();
  const mrr = subscriptions
    .filter((s) => ['active', 'trialing'].includes(s.status))
    .reduce((sum, s) => sum + (PLAN_LIMITS[s.plan]?.price || 0) * s.n, 0);
  const chart = [];
  for (let i = 13; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const date = d.toISOString().slice(0, 10);
    chart.push({
      date,
      label: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      users: db.prepare('SELECT COUNT(*) AS n FROM users WHERE substr(created_at,1,10) = ?').get(date).n,
      sites: db.prepare('SELECT COUNT(*) AS n FROM sites WHERE substr(created_at,1,10) = ?').get(date).n,
      orders: db.prepare('SELECT COUNT(*) AS n FROM orders WHERE substr(created_at,1,10) = ?').get(date).n,
    });
  }
  const latestUsers = userRows().slice(0, 5).map((u) => ({
    id: u.id, name: u.name, email: u.email, role: u.role, status: u.status, sitesCount: u.sites_count, createdAt: u.created_at,
  }));
  const latestSites = db.prepare(`
    SELECT s.id, s.name, s.slug, s.status, s.category, s.created_at, u.name AS owner_name, t.name AS template_name
    FROM sites s JOIN users u ON u.id = s.owner_id LEFT JOIN templates t ON t.id = s.template_id
    ORDER BY s.created_at DESC LIMIT 5
  `).all();
  const activity = db.prepare(`
    SELECT a.*, u.name AS user_name, s.name AS site_name FROM activity a
    LEFT JOIN users u ON u.id = a.user_id LEFT JOIN sites s ON s.id = a.site_id
    ORDER BY a.created_at DESC LIMIT 10
  `).all();
  res.json({ counts: { ...counts, mrr }, subscriptions, chart, latestUsers, latestSites, activity });
});

router.get('/users', (req, res) => {
  const search = String(req.query.search || '').toLowerCase();
  let users = userRows();
  if (search) users = users.filter((u) => `${u.name} ${u.email}`.toLowerCase().includes(search));
  res.json({
    users: users.map((u) => ({
      id: u.id, name: u.name, email: u.email, role: u.role, status: u.status,
      avatarColor: u.avatar_color, createdAt: u.created_at,
      sitesCount: u.sites_count, publishedCount: u.published_count, gmvCents: u.gmv_cents,
    })),
  });
});

router.patch('/users/:userId', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const schema = z.object({
    status: z.enum(['active', 'suspended']).optional(),
    name: z.string().trim().min(2).max(80).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  if (user.id === req.user.id && parsed.data.status === 'suspended') {
    return res.status(400).json({ error: 'You cannot suspend your own account' });
  }
  if (user.role === 'admin' && parsed.data.status === 'suspended') {
    return res.status(400).json({ error: 'Platform administrators cannot be suspended from this screen' });
  }
  db.prepare('UPDATE users SET status = ?, name = ? WHERE id = ?')
    .run(parsed.data.status ?? user.status, parsed.data.name ?? user.name, user.id);
  logActivity({ userId: req.user.id, action: 'admin.user_updated', detail: `Updated ${user.email}` });
  res.json({ ok: true });
});

router.get('/sites', (req, res) => {
  const search = String(req.query.search || '').toLowerCase();
  let sites = db.prepare(`
    SELECT s.*, u.name AS owner_name, u.email AS owner_email, sub.plan, sub.status AS subscription_status,
      (SELECT COUNT(*) FROM items i WHERE i.site_id = s.id) AS items_count,
      (SELECT COUNT(*) FROM orders o WHERE o.site_id = s.id) AS orders_count
    FROM sites s JOIN users u ON u.id = s.owner_id
    LEFT JOIN subscriptions sub ON sub.site_id = s.id
    ORDER BY s.created_at DESC
  `).all();
  if (search) sites = sites.filter((s) => `${s.name} ${s.slug} ${s.owner_name} ${s.owner_email}`.toLowerCase().includes(search));
  res.json({
    sites: sites.map((s) => ({
      id: s.id, name: s.name, slug: s.slug, status: s.status, category: s.category,
      templateId: s.template_id, ownerName: s.owner_name, ownerEmail: s.owner_email,
      plan: s.plan, subscriptionStatus: s.subscription_status, itemsCount: s.items_count,
      ordersCount: s.orders_count, customDomain: s.custom_domain, createdAt: s.created_at,
      publishedAt: s.published_at,
    })),
  });
});

router.patch('/sites/:siteId', (req, res) => {
  const site = db.prepare('SELECT * FROM sites WHERE id = ?').get(req.params.siteId);
  if (!site) return res.status(404).json({ error: 'Website not found' });
  const schema = z.object({ status: z.enum(['draft', 'published', 'suspended']) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid website status' });
  db.prepare("UPDATE sites SET status = ?, published_at = CASE WHEN ? = 'published' THEN COALESCE(published_at, ?) ELSE published_at END, updated_at = datetime('now') WHERE id = ?")
    .run(parsed.data.status, parsed.data.status, new Date().toISOString(), site.id);
  logActivity({ siteId: site.id, userId: req.user.id, action: 'admin.site_status', detail: `Admin set website to ${parsed.data.status}` });
  res.json({ ok: true });
});

router.delete('/sites/:siteId', (req, res) => {
  const site = db.prepare('SELECT * FROM sites WHERE id = ?').get(req.params.siteId);
  if (!site) return res.status(404).json({ error: 'Website not found' });
  db.prepare('DELETE FROM sites WHERE id = ?').run(site.id);
  logActivity({ userId: req.user.id, action: 'admin.site_deleted', detail: `Admin deleted ${site.name}` });
  res.json({ ok: true });
});

router.get('/templates', (_req, res) => {
  const rows = db.prepare('SELECT * FROM templates ORDER BY enabled DESC, featured DESC, uses DESC, name').all();
  const usage = db.prepare('SELECT template_id, COUNT(*) AS n FROM sites GROUP BY template_id').all();
  const usageMap = Object.fromEntries(usage.map((u) => [u.template_id, u.n]));
  res.json({
    templates: rows.map((row) => ({ ...serializeTemplate(row), activeSites: usageMap[row.id] || 0 })),
    categories: db.prepare('SELECT category, COUNT(*) AS n FROM templates GROUP BY category').all(),
    plans: plans(),
  });
});

router.post('/templates', (req, res) => {
  const schema = z.object({
    name: z.string().trim().min(2).max(60),
    baseTemplateId: z.string().min(2),
    category: z.string().trim().max(50).optional(),
    style: z.string().trim().max(80).optional(),
    description: z.string().trim().max(300).optional(),
    palette: z.record(z.string(), z.string()).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const base = getTemplateById(parsed.data.baseTemplateId);
  if (!base) return res.status(404).json({ error: 'Base template not found' });
  const templateId = slugify(parsed.data.name);
  if (db.prepare('SELECT id FROM templates WHERE id = ?').get(templateId)) {
    return res.status(409).json({ error: 'A template with that name already exists' });
  }
  const manifest = {
    ...base,
    id: templateId,
    name: parsed.data.name,
    category: parsed.data.category || base.category,
    style: parsed.data.style || base.style,
    description: parsed.data.description || base.description,
    palette: { ...base.palette, ...(parsed.data.palette || {}) },
    featured: false,
  };
  db.prepare(`INSERT INTO templates (id, name, category, style, description, manifest, enabled, featured, uses)
    VALUES (?, ?, ?, ?, ?, ?, 1, 0, 0)`)
    .run(templateId, manifest.name, manifest.category, manifest.style, manifest.description, JSON.stringify(manifest));
  logActivity({ userId: req.user.id, action: 'admin.template_created', detail: `Created template ${manifest.name}` });
  const row = db.prepare('SELECT * FROM templates WHERE id = ?').get(templateId);
  res.status(201).json({ template: serializeTemplate(row) });
});

router.patch('/templates/:templateId', (req, res) => {
  const row = db.prepare('SELECT * FROM templates WHERE id = ?').get(req.params.templateId);
  if (!row) return res.status(404).json({ error: 'Template not found' });
  const schema = z.object({
    name: z.string().trim().min(2).max(80).optional(),
    style: z.string().trim().max(100).optional(),
    description: z.string().trim().max(400).optional(),
    category: z.string().trim().max(50).optional(),
    enabled: z.boolean().optional(),
    featured: z.boolean().optional(),
    palette: z.record(z.string(), z.string().regex(/^#[0-9a-fA-F]{6}$/)).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const manifest = parseJson(row.manifest);
  const next = {
    name: parsed.data.name ?? row.name,
    style: parsed.data.style ?? row.style,
    description: parsed.data.description ?? row.description,
    category: parsed.data.category ?? row.category,
    enabled: parsed.data.enabled !== undefined ? (parsed.data.enabled ? 1 : 0) : row.enabled,
    featured: parsed.data.featured !== undefined ? (parsed.data.featured ? 1 : 0) : row.featured,
  };
  manifest.name = next.name;
  manifest.style = next.style;
  manifest.description = next.description;
  manifest.category = next.category;
  manifest.enabled = Boolean(next.enabled);
  manifest.featured = Boolean(next.featured);
  if (parsed.data.palette) manifest.palette = { ...manifest.palette, ...parsed.data.palette };
  db.prepare(`UPDATE templates SET name=?, category=?, style=?, description=?, manifest=?, enabled=?, featured=? WHERE id=?`)
    .run(next.name, next.category, next.style, next.description, JSON.stringify(manifest), next.enabled, next.featured, row.id);
  logActivity({ userId: req.user.id, action: 'admin.template_updated', detail: `Updated template ${next.name}` });
  res.json({ template: serializeTemplate(db.prepare('SELECT * FROM templates WHERE id = ?').get(row.id)) });
});

router.delete('/templates/:templateId', (req, res) => {
  const row = db.prepare('SELECT * FROM templates WHERE id = ?').get(req.params.templateId);
  if (!row) return res.status(404).json({ error: 'Template not found' });
  const used = db.prepare('SELECT COUNT(*) AS n FROM sites WHERE template_id = ?').get(row.id).n;
  if (used > 0) {
    db.prepare('UPDATE templates SET enabled = 0 WHERE id = ?').run(row.id);
    return res.json({ ok: true, disabled: true, message: `This template is used by ${used} website(s), so it was unpublished from the marketplace instead of deleted.` });
  }
  db.prepare('DELETE FROM templates WHERE id = ?').run(row.id);
  logActivity({ userId: req.user.id, action: 'admin.template_deleted', detail: `Deleted template ${row.name}` });
  res.json({ ok: true, disabled: false });
});

router.get('/subscriptions', (_req, res) => {
  const rows = db.prepare(`
    SELECT sub.*, s.name AS site_name, s.slug, u.name AS owner_name, u.email AS owner_email
    FROM subscriptions sub JOIN sites s ON s.id = sub.site_id JOIN users u ON u.id = s.owner_id
    ORDER BY sub.created_at DESC
  `).all();
  res.json({
    subscriptions: rows.map((s) => ({ ...s, mrr: PLAN_LIMITS[s.plan]?.price || 0 })),
    plans: plans(),
  });
});

router.patch('/subscriptions/:subscriptionId', (req, res) => {
  const sub = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(req.params.subscriptionId);
  if (!sub) return res.status(404).json({ error: 'Subscription not found' });
  const schema = z.object({
    plan: z.enum(['starter', 'growth', 'scale']).optional(),
    status: z.enum(['active', 'trialing', 'paused', 'cancelled']).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid subscription update' });
  const plan = parsed.data.plan || sub.plan;
  const limits = PLAN_LIMITS[plan];
  db.prepare('UPDATE subscriptions SET plan = ?, status = ?, ai_limit = ?, product_limit = ?, storage_limit_mb = ? WHERE id = ?')
    .run(plan, parsed.data.status || sub.status, limits.aiLimit, limits.productLimit, limits.storageLimitMb, sub.id);
  logActivity({ siteId: sub.site_id, userId: req.user.id, action: 'admin.subscription_updated', detail: `Subscription changed to ${plan} / ${parsed.data.status || sub.status}` });
  res.json({ ok: true });
});

router.get('/analytics', (_req, res) => {
  const websiteCategories = db.prepare('SELECT category, COUNT(*) AS n FROM sites GROUP BY category ORDER BY n DESC').all();
  const templateUsage = db.prepare('SELECT id, name, uses, category, featured, enabled FROM templates ORDER BY uses DESC LIMIT 8').all();
  const aiByAgent = db.prepare("SELECT agent, COUNT(*) AS n FROM ai_usage WHERE created_at >= datetime('now','-30 days') GROUP BY agent ORDER BY n DESC").all();
  const siteRevenue = db.prepare(`
    SELECT s.name, s.slug, COALESCE(SUM(o.total_cents),0) AS revenue, COUNT(o.id) AS orders
    FROM sites s LEFT JOIN orders o ON o.site_id = s.id AND o.status NOT IN ('cancelled','refunded')
    GROUP BY s.id ORDER BY revenue DESC LIMIT 8
  `).all();
  const signups = [];
  for (let i = 29; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    signups.push({
      date: d.toISOString().slice(0, 10),
      users: db.prepare('SELECT COUNT(*) AS n FROM users WHERE substr(created_at,1,10) = ?').get(d.toISOString().slice(0, 10)).n,
    });
  }
  res.json({ websiteCategories, templateUsage, aiByAgent, siteRevenue, signups });
});

router.get('/activity', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const activity = db.prepare(`
    SELECT a.*, u.name AS user_name, u.email AS user_email, s.name AS site_name
    FROM activity a LEFT JOIN users u ON u.id = a.user_id LEFT JOIN sites s ON s.id = a.site_id
    ORDER BY a.created_at DESC LIMIT ?
  `).all(limit);
  res.json({ activity });
});

router.get('/ai', (_req, res) => {
  const catalog = agentCatalog();
  const disabled = readSetting('ai.disabledAgents', []);
  const byAgent = db.prepare("SELECT agent, COUNT(*) AS calls, SUM(input_chars+output_chars) AS chars FROM ai_usage GROUP BY agent ORDER BY calls DESC").all();
  const monthly = db.prepare("SELECT COUNT(*) AS n FROM ai_usage WHERE created_at >= datetime('now','start of month')").get().n;
  const agents = catalog.agents.map((agent) => ({ ...agent, enabled: !disabled.includes(agent.id) }));
  const planRows = plans().map((plan) => ({
    ...plan,
    activeSites: db.prepare('SELECT COUNT(*) AS n FROM subscriptions WHERE plan = ?').get(plan.id).n,
    monthlyCalls: db.prepare(`SELECT COUNT(*) AS n FROM ai_usage u JOIN subscriptions s ON s.site_id = u.site_id WHERE s.plan = ? AND u.created_at >= datetime('now','start of month')`).get(plan.id).n,
  }));
  res.json({ agents, usageByAgent: byAgent, monthlyCalls: monthly, provider: aiStatus(), plans: planRows, settings: readSetting('ai.settings', {}) });
});

router.patch('/ai', (req, res) => {
  const schema = z.object({
    disabledAgents: z.array(z.string()).optional(),
    planLimits: z.object({ starter: z.number().int().min(0).optional(), growth: z.number().int().min(0).optional(), scale: z.number().int().min(0).optional() }).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid AI configuration' });
  if (parsed.data.disabledAgents) {
    const valid = new Set(agentCatalog().agents.map((a) => a.id));
    const disabled = parsed.data.disabledAgents.filter((agent) => valid.has(agent));
    writeSetting('ai.disabledAgents', disabled);
  }
  if (parsed.data.planLimits) {
    for (const [plan, limit] of Object.entries(parsed.data.planLimits)) {
      if (limit === undefined) continue;
      db.prepare('UPDATE subscriptions SET ai_limit = ? WHERE plan = ?').run(limit, plan);
    }
    writeSetting('ai.planLimits', parsed.data.planLimits);
  }
  logActivity({ userId: req.user.id, action: 'admin.ai_config', detail: 'Updated AI agent configuration' });
  res.json({ ok: true });
});

router.get('/settings', (_req, res) => {
  const rows = db.prepare('SELECT key, value FROM platform_settings ORDER BY key').all();
  const settings = {};
  for (const row of rows) {
    try { settings[row.key] = JSON.parse(row.value); } catch { settings[row.key] = row.value; }
  }
  res.json({ settings, provider: aiStatus() });
});

router.patch('/settings', (req, res) => {
  const schema = z.object({ settings: z.record(z.string(), z.any()) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid settings' });
  for (const [key, value] of Object.entries(parsed.data.settings)) {
    if (!key.startsWith('platform.') && !key.startsWith('ai.') && !key.startsWith('support.')) {
      return res.status(400).json({ error: `Setting ${key} cannot be changed here` });
    }
    writeSetting(key, value);
  }
  logActivity({ userId: req.user.id, action: 'admin.settings_updated', detail: 'Updated platform settings' });
  res.json({ ok: true });
});

router.get('/agents', (_req, res) => {
  res.json(agentCatalog());
});

export default router;
