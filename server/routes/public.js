import express from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { id, parseJson, publicSite } from '../lib/helpers.js';
import { serializeTemplate } from './templates.js';

const router = express.Router();

function publishedSite(identifier) {
  return db.prepare("SELECT * FROM sites WHERE (slug = ? OR custom_domain = ?) AND status = 'published'")
    .get(identifier, identifier) || null;
}

function sitePayload(site) {
  const templateRow = db.prepare('SELECT * FROM templates WHERE id = ?').get(site.template_id);
  const items = db.prepare(`
    SELECT * FROM items WHERE site_id = ? AND status = 'active' ORDER BY sort_order ASC, created_at DESC
  `).all(site.id).map((item) => ({
    ...item,
    images: parseJson(item.images, []),
    metadata: parseJson(item.metadata, {}),
  }));
  const categories = db.prepare('SELECT * FROM categories WHERE site_id = ? ORDER BY sort_order').all(site.id);
  const base = publicSite(site);
  delete base.settings?.publishing?.password;
  return {
    site: base,
    template: templateRow ? serializeTemplate(templateRow) : null,
    items,
    categories,
    owner: db.prepare('SELECT name FROM users WHERE id = ?').get(site.owner_id)?.name || '',
    reviews: parseJson(site.content).testimonials || [],
  };
}

router.get('/sites', (_req, res) => {
  const sites = db.prepare(`
    SELECT s.*, t.name AS template_name FROM sites s
    LEFT JOIN templates t ON t.id = s.template_id
    WHERE s.status = 'published' ORDER BY s.updated_at DESC LIMIT 12
  `).all();
  res.json({
    sites: sites.map((site) => {
      const content = parseJson(site.content);
      return {
        id: site.id, name: site.name, slug: site.slug, category: site.category,
        templateId: site.template_id, templateName: site.template_name,
        description: site.description,
        headline: content.hero?.headline,
        image: content.hero?.image,
        publicUrl: `/site/${site.slug}`,
      };
    })
  });
});

router.get('/sites/:slug', (req, res) => {
  const site = publishedSite(req.params.slug);
  if (!site) return res.status(404).json({ error: 'This website is not published' });
  const settings = parseJson(site.settings);
  const password = settings.publishing?.password;
  if (password && req.query.access !== password) {
    return res.status(401).json({ error: 'This website is password protected', passwordRequired: true });
  }
  res.json(sitePayload(site));
});

router.post('/sites/:slug/view', (req, res) => {
  const site = publishedSite(req.params.slug);
  if (!site) return res.status(404).json({ error: 'Site not found' });
  db.prepare('INSERT INTO site_views (id, site_id, path, referrer) VALUES (?, ?, ?, ?)')
    .run(id('view'), site.id, String(req.body?.path || '/').slice(0, 200), String(req.body?.referrer || '').slice(0, 300));
  db.prepare('UPDATE sites SET updated_at = updated_at WHERE id = ?').run(site.id);
  res.json({ ok: true });
});

router.post('/sites/:slug/inquiries', (req, res) => {
  const site = publishedSite(req.params.slug);
  if (!site) return res.status(404).json({ error: 'Site not found' });
  const schema = z.object({
    name: z.string().trim().min(1, 'Your name is required').max(100),
    email: z.string().trim().email('Enter a valid email').max(160),
    phone: z.string().trim().max(40).optional().default(''),
    message: z.string().trim().max(3000).optional().default(''),
    type: z.enum(['contact', 'booking', 'newsletter']).optional().default('contact'),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const inquiryId = id('inq');
  db.prepare('INSERT INTO inquiries (id, site_id, name, email, phone, message, type) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(inquiryId, site.id, parsed.data.name, parsed.data.email, parsed.data.phone, parsed.data.message, parsed.data.type);
  const existingCustomer = db.prepare('SELECT id FROM customers WHERE site_id = ? AND email = ?').get(site.id, parsed.data.email);
  if (existingCustomer) {
    db.prepare('UPDATE customers SET name = ?, phone = COALESCE(NULLIF(?, \'\'), phone) WHERE id = ?')
      .run(parsed.data.name, parsed.data.phone, existingCustomer.id);
  } else {
    db.prepare('INSERT INTO customers (id, site_id, name, email, phone, orders_count, total_spent_cents) VALUES (?, ?, ?, ?, ?, 0, 0)')
      .run(id('cust'), site.id, parsed.data.name, parsed.data.email, parsed.data.phone);
  }
  res.status(201).json({ ok: true, message: 'Thanks — we will be in touch shortly.' });
});

router.post('/sites/:slug/orders', (req, res) => {
  const site = publishedSite(req.params.slug);
  if (!site) return res.status(404).json({ error: 'Site not found' });
  const schema = z.object({
    customer: z.object({
      name: z.string().trim().min(1).max(100),
      email: z.string().trim().email().max(160),
      phone: z.string().trim().max(40).optional().default(''),
    }),
    items: z.array(z.object({ id: z.string(), quantity: z.number().int().min(1).max(20), options: z.record(z.string(), z.string()).optional().default({}) })).min(1).max(30),
    note: z.string().max(1000).optional().default(''),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const lineItems = [];
  for (const requested of parsed.data.items) {
    const item = db.prepare("SELECT * FROM items WHERE id = ? AND site_id = ? AND status = 'active'").get(requested.id, site.id);
    if (!item) return res.status(400).json({ error: 'One of the items is no longer available' });
    if (item.kind === 'product' && item.stock >= 0 && item.stock < requested.quantity) {
      return res.status(409).json({ error: `${item.name} has only ${item.stock} left in stock` });
    }
    lineItems.push({ id: item.id, name: item.name, price: item.price_cents / 100, quantity: requested.quantity, kind: item.kind, options: requested.options || {} });
  }
  const subtotal = Math.round(lineItems.reduce((sum, li) => sum + li.price * 100 * li.quantity, 0));
  const physical = lineItems.some((li) => li.kind === 'product');
  const shipping = physical && subtotal < 15000 ? 900 : 0;
  const total = subtotal + shipping;
  const number = `NX-${Date.now().toString().slice(-6)}`;
  const orderId = id('ord');

  db.exec('BEGIN');
  try {
    for (const requested of parsed.data.items) {
      const item = db.prepare('SELECT kind, stock FROM items WHERE id = ?').get(requested.id);
      if (item?.kind === 'product') {
        db.prepare('UPDATE items SET stock = MAX(0, stock - ?) WHERE id = ?').run(requested.quantity, requested.id);
      }
    }
    db.prepare(`
      INSERT INTO orders (id, site_id, number, customer_name, customer_email, items, subtotal_cents, shipping_cents, total_cents, status, payment_status, note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'paid', ?)
    `).run(orderId, site.id, number, parsed.data.customer.name, parsed.data.customer.email,
      JSON.stringify(lineItems), subtotal, shipping, total, parsed.data.note);
    const existing = db.prepare('SELECT * FROM customers WHERE site_id = ? AND email = ?').get(site.id, parsed.data.customer.email);
    if (existing) {
      db.prepare('UPDATE customers SET orders_count = orders_count + 1, total_spent_cents = total_spent_cents + ?, name = ?, phone = COALESCE(NULLIF(?, \'\'), phone) WHERE id = ?')
        .run(total, parsed.data.customer.name, parsed.data.customer.phone, existing.id);
    } else {
      db.prepare('INSERT INTO customers (id, site_id, name, email, phone, orders_count, total_spent_cents) VALUES (?, ?, ?, ?, ?, 1, ?)')
        .run(id('cust'), site.id, parsed.data.customer.name, parsed.data.customer.email, parsed.data.customer.phone, total);
    }
    db.prepare('INSERT INTO activity (id, site_id, action, detail) VALUES (?, ?, ?, ?)')
      .run(id('act'), site.id, 'order.created', `New order ${number} placed on the live site`);
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
  res.status(201).json({
    ok: true,
    order: { id: orderId, number, totalCents: total, items: lineItems },
    message: 'Order received. A confirmation has been sent to your email.',
  });
});

export default router;
