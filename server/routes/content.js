import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { db, logActivity } from '../db.js';
import { id, parseJson, slugify } from '../lib/helpers.js';
import { authenticate, loadSite } from '../middleware/auth.js';
import { env } from '../config.js';
import { PLAN_LIMITS } from '../services/sites.js';

const router = express.Router({ mergeParams: true });
router.use(authenticate, loadSite);

const itemSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(160),
  description: z.string().max(5000).optional().default(''),
  priceCents: z.coerce.number().int().min(0).max(100000000).optional().default(0),
  compareAtCents: z.coerce.number().int().min(0).max(100000000).nullable().optional(),
  categoryId: z.string().nullable().optional(),
  kind: z.string().max(30).optional(),
  stock: z.coerce.number().int().min(0).max(1000000).optional().default(0),
  status: z.enum(['active', 'draft', 'archived']).optional().default('active'),
  images: z.array(z.string().max(2000000)).max(8).optional().default([]),
  metadata: z.record(z.string(), z.any()).optional().default({}),
  featured: z.boolean().optional().default(false),
});

function itemOut(row) {
  return { ...row, images: parseJson(row.images, []), metadata: parseJson(row.metadata, {}) };
}

function checkProductLimit(req, res) {
  const sub = req.subscription;
  const limit = PLAN_LIMITS[sub?.plan || 'starter'].productLimit;
  const count = db.prepare("SELECT COUNT(*) AS n FROM items WHERE site_id = ? AND status != 'archived'").get(req.site.id).n;
  if (count >= limit) {
    res.status(403).json({ error: `Your plan allows ${limit} catalogue items. Upgrade to add more.` });
    return false;
  }
  return true;
}

// ── Catalogue items ────────────────────────────────────────────────────────
router.get('/items', (req, res) => {
  const { kind, status, search, categoryId } = req.query;
  let sql = 'SELECT * FROM items WHERE site_id = ?';
  const params = [req.site.id];
  if (kind) { sql += ' AND kind = ?'; params.push(kind); }
  if (status && status !== 'all') { sql += ' AND status = ?'; params.push(status); }
  if (categoryId) { sql += ' AND category_id = ?'; params.push(categoryId); }
  if (search) { sql += ' AND (name LIKE ? OR description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  sql += ' ORDER BY sort_order ASC, created_at DESC';
  const items = db.prepare(sql).all(...params).map(itemOut);
  res.json({ items });
});

router.post('/items', (req, res) => {
  if (!checkProductLimit(req, res)) return;
  const parsed = itemSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const data = parsed.data;
  if (data.categoryId) {
    const cat = db.prepare('SELECT id FROM categories WHERE id = ? AND site_id = ?').get(data.categoryId, req.site.id);
    if (!cat) data.categoryId = null;
  }
  const itemId = id('item');
  db.prepare(`
    INSERT INTO items (id, site_id, category_id, kind, name, slug, description, price_cents, compare_at_cents, stock, status, images, metadata, featured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(itemId, req.site.id, data.categoryId || null, data.kind || 'product', data.name, slugify(data.name),
    data.description, data.priceCents, data.compareAtCents ?? null, data.stock, data.status,
    JSON.stringify(data.images), JSON.stringify(data.metadata), data.featured ? 1 : 0);
  logActivity({ siteId: req.site.id, userId: req.user.id, action: 'item.created', detail: `Added ${data.name}` });
  res.status(201).json({ item: itemOut(db.prepare('SELECT * FROM items WHERE id = ?').get(itemId)) });
});

router.patch('/items/:itemId', (req, res) => {
  const existing = db.prepare('SELECT * FROM items WHERE id = ? AND site_id = ?').get(req.params.itemId, req.site.id);
  if (!existing) return res.status(404).json({ error: 'Item not found' });
  const parsed = itemSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const data = parsed.data;
  if (data.categoryId) {
    const cat = db.prepare('SELECT id FROM categories WHERE id = ? AND site_id = ?').get(data.categoryId, req.site.id);
    if (!cat) data.categoryId = null;
  }
  const next = {
    name: data.name ?? existing.name,
    slug: data.name ? slugify(data.name) : existing.slug,
    description: data.description ?? existing.description,
    price_cents: data.priceCents ?? existing.price_cents,
    compare_at_cents: data.compareAtCents !== undefined ? data.compareAtCents : existing.compare_at_cents,
    category_id: data.categoryId !== undefined ? data.categoryId : existing.category_id,
    kind: data.kind ?? existing.kind,
    stock: data.stock ?? existing.stock,
    status: data.status ?? existing.status,
    images: data.images ? JSON.stringify(data.images) : existing.images,
    metadata: data.metadata ? JSON.stringify(data.metadata) : existing.metadata,
    featured: data.featured !== undefined ? (data.featured ? 1 : 0) : existing.featured,
  };
  db.prepare(`
    UPDATE items SET name=?, slug=?, description=?, price_cents=?, compare_at_cents=?, category_id=?, kind=?, stock=?, status=?, images=?, metadata=?, featured=?, updated_at=datetime('now')
    WHERE id=? AND site_id=?
  `).run(next.name, next.slug, next.description, next.price_cents, next.compare_at_cents, next.category_id,
    next.kind, next.stock, next.status, next.images, next.metadata, next.featured, existing.id, req.site.id);
  logActivity({ siteId: req.site.id, userId: req.user.id, action: 'item.updated', detail: `Updated ${next.name}` });
  res.json({ item: itemOut(db.prepare('SELECT * FROM items WHERE id = ?').get(existing.id)) });
});

router.delete('/items/:itemId', (req, res) => {
  const existing = db.prepare('SELECT * FROM items WHERE id = ? AND site_id = ?').get(req.params.itemId, req.site.id);
  if (!existing) return res.status(404).json({ error: 'Item not found' });
  db.prepare('DELETE FROM items WHERE id = ?').run(existing.id);
  logActivity({ siteId: req.site.id, userId: req.user.id, action: 'item.deleted', detail: `Deleted ${existing.name}` });
  res.json({ ok: true });
});

// ── Categories ─────────────────────────────────────────────────────────────
router.get('/categories', (req, res) => {
  const categories = db.prepare(`
    SELECT c.*, (SELECT COUNT(*) FROM items i WHERE i.category_id = c.id) AS count
    FROM categories c WHERE c.site_id = ? ORDER BY c.sort_order ASC, c.name ASC
  `).all(req.site.id);
  res.json({ categories });
});

router.post('/categories', (req, res) => {
  const schema = z.object({ name: z.string().trim().min(1).max(80), kind: z.string().max(30).optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Enter a category name' });
  const slug = slugify(parsed.data.name);
  const exists = db.prepare('SELECT id FROM categories WHERE site_id = ? AND slug = ?').get(req.site.id, slug);
  if (exists) return res.status(409).json({ error: 'That category already exists' });
  const catId = id('cat');
  const order = db.prepare('SELECT COALESCE(MAX(sort_order),0)+1 AS n FROM categories WHERE site_id = ?').get(req.site.id).n;
  db.prepare('INSERT INTO categories (id, site_id, kind, name, slug, sort_order) VALUES (?, ?, ?, ?, ?, ?)')
    .run(catId, req.site.id, parsed.data.kind || 'product', parsed.data.name, slug, order);
  res.status(201).json({ category: db.prepare('SELECT * FROM categories WHERE id = ?').get(catId) });
});

router.patch('/categories/:categoryId', (req, res) => {
  const cat = db.prepare('SELECT * FROM categories WHERE id = ? AND site_id = ?').get(req.params.categoryId, req.site.id);
  if (!cat) return res.status(404).json({ error: 'Category not found' });
  const schema = z.object({ name: z.string().trim().min(1).max(80) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Enter a category name' });
  db.prepare('UPDATE categories SET name = ?, slug = ? WHERE id = ?').run(parsed.data.name, slugify(parsed.data.name), cat.id);
  res.json({ category: db.prepare('SELECT * FROM categories WHERE id = ?').get(cat.id) });
});

router.delete('/categories/:categoryId', (req, res) => {
  const cat = db.prepare('SELECT * FROM categories WHERE id = ? AND site_id = ?').get(req.params.categoryId, req.site.id);
  if (!cat) return res.status(404).json({ error: 'Category not found' });
  db.prepare('DELETE FROM categories WHERE id = ?').run(cat.id);
  res.json({ ok: true });
});

// ── Orders ─────────────────────────────────────────────────────────────────
router.get('/orders', (req, res) => {
  const { status, search } = req.query;
  let sql = 'SELECT * FROM orders WHERE site_id = ?';
  const params = [req.site.id];
  if (status && status !== 'all') { sql += ' AND status = ?'; params.push(status); }
  if (search) { sql += ' AND (number LIKE ? OR customer_name LIKE ? OR customer_email LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  sql += ' ORDER BY created_at DESC';
  const orders = db.prepare(sql).all(...params).map((o) => ({ ...o, items: parseJson(o.items, []) }));
  res.json({ orders });
});

router.patch('/orders/:orderId', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND site_id = ?').get(req.params.orderId, req.site.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  const schema = z.object({
    status: z.enum(['pending', 'processing', 'shipped', 'completed', 'cancelled', 'refunded']).optional(),
    paymentStatus: z.enum(['paid', 'pending', 'refunded']).optional(),
    note: z.string().max(1000).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  db.prepare('UPDATE orders SET status = ?, payment_status = ?, note = ? WHERE id = ?')
    .run(parsed.data.status ?? order.status, parsed.data.paymentStatus ?? order.payment_status, parsed.data.note ?? order.note, order.id);
  logActivity({ siteId: req.site.id, userId: req.user.id, action: 'order.status_changed', detail: `Order ${order.number} marked ${parsed.data.status || order.status}` });
  res.json({ order: { ...db.prepare('SELECT * FROM orders WHERE id = ?').get(order.id), items: parseJson(order.items, []) } });
});

// ── Customers & inquiries ──────────────────────────────────────────────────
router.get('/customers', (req, res) => {
  const { search } = req.query;
  let sql = 'SELECT * FROM customers WHERE site_id = ?';
  const params = [req.site.id];
  if (search) { sql += ' AND (name LIKE ? OR email LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  sql += ' ORDER BY total_spent_cents DESC, created_at DESC';
  res.json({ customers: db.prepare(sql).all(...params) });
});

router.get('/inquiries', (req, res) => {
  const inquiries = db.prepare('SELECT * FROM inquiries WHERE site_id = ? ORDER BY created_at DESC').all(req.site.id);
  res.json({ inquiries });
});

router.patch('/inquiries/:inquiryId', (req, res) => {
  const inquiry = db.prepare('SELECT * FROM inquiries WHERE id = ? AND site_id = ?').get(req.params.inquiryId, req.site.id);
  if (!inquiry) return res.status(404).json({ error: 'Message not found' });
  const schema = z.object({ status: z.enum(['new', 'read', 'replied', 'archived']) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid status' });
  db.prepare('UPDATE inquiries SET status = ? WHERE id = ?').run(parsed.data.status, inquiry.id);
  res.json({ ok: true });
});

// ── Media ──────────────────────────────────────────────────────────────────
router.get('/media', (req, res) => {
  res.json({ media: db.prepare('SELECT * FROM media WHERE site_id = ? ORDER BY created_at DESC').all(req.site.id) });
});

router.post('/media', (req, res) => {
  const schema = z.object({
    name: z.string().trim().max(180).optional(),
    url: z.string().trim().max(2000).optional(),
    dataUrl: z.string().max(12000000).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Add a file or image URL' });
  const { dataUrl, url } = parsed.data;
  let finalUrl = url || '';
  let mime = 'image/jpeg';
  let size = 0;
  if (dataUrl) {
    const match = dataUrl.match(/^data:(image\/(png|jpeg|jpg|webp|gif|svg\+xml));base64,(.+)$/);
    if (!match) return res.status(400).json({ error: 'Upload a PNG, JPG, WEBP, GIF or SVG image' });
    mime = match[1];
    const buffer = Buffer.from(match[3], 'base64');
    if (buffer.length > 8 * 1024 * 1024) return res.status(413).json({ error: 'Images must be smaller than 8 MB' });
    size = buffer.length;
    const storageLimit = (PLAN_LIMITS[req.subscription?.plan || 'starter'].storageLimitMb) * 1024 * 1024;
    const used = db.prepare('SELECT COALESCE(SUM(size),0) AS n FROM media WHERE site_id = ?').get(req.site.id).n;
    if (used + size > storageLimit) return res.status(403).json({ error: 'This upload would exceed your plan storage limit. Delete unused media or upgrade.' });
    const ext = mime.split('/')[1].replace('svg+xml', 'svg').replace('jpeg', 'jpg');
    fs.mkdirSync(env.UPLOAD_DIR, { recursive: true });
    const filename = `${req.site.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
    fs.writeFileSync(path.join(env.UPLOAD_DIR, filename), buffer);
    finalUrl = `/uploads/${filename}`;
  }
  if (!finalUrl || !/^(https?:\/\/|\/)/.test(finalUrl)) return res.status(400).json({ error: 'Enter a valid image URL' });
  const mediaId = id('med');
  db.prepare('INSERT INTO media (id, site_id, name, url, mime, size) VALUES (?, ?, ?, ?, ?, ?)')
    .run(mediaId, req.site.id, parsed.data.name || finalUrl.split('/').pop() || 'Image', finalUrl, mime, size);
  logActivity({ siteId: req.site.id, userId: req.user.id, action: 'media.uploaded', detail: `Added ${parsed.data.name || 'image'}` });
  res.status(201).json({ media: db.prepare('SELECT * FROM media WHERE id = ?').get(mediaId) });
});

router.delete('/media/:mediaId', (req, res) => {
  const media = db.prepare('SELECT * FROM media WHERE id = ? AND site_id = ?').get(req.params.mediaId, req.site.id);
  if (!media) return res.status(404).json({ error: 'Media not found' });
  if (media.url.startsWith('/uploads/')) {
    const filename = path.basename(media.url);
    try { fs.unlinkSync(path.join(env.UPLOAD_DIR, filename)); } catch { /* already gone */ }
  }
  db.prepare('DELETE FROM media WHERE id = ?').run(media.id);
  res.json({ ok: true });
});

// ── Activity ───────────────────────────────────────────────────────────────
router.get('/activity', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 30, 100);
  res.json({
    activity: db.prepare('SELECT * FROM activity WHERE site_id = ? ORDER BY created_at DESC LIMIT ?').all(req.site.id, limit)
  });
});

export default router;
