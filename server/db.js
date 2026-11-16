import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { env } from './config.js';

fs.mkdirSync(path.dirname(env.DB_PATH), { recursive: true });

export const db = new DatabaseSync(env.DB_PATH);
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner','admin')),
    status TEXT NOT NULL DEFAULT 'active',
    avatar_color TEXT DEFAULT '#6c5ce7',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sites (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT DEFAULT '',
    category TEXT NOT NULL,
    template_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','suspended')),
    custom_domain TEXT,
    domain_status TEXT DEFAULT 'none',
    theme TEXT NOT NULL DEFAULT '{}',
    content TEXT NOT NULL DEFAULT '{}',
    settings TEXT NOT NULL DEFAULT '{}',
    published_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    style TEXT NOT NULL,
    description TEXT NOT NULL,
    manifest TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    featured INTEGER NOT NULL DEFAULT 0,
    uses INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    kind TEXT NOT NULL DEFAULT 'product',
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    UNIQUE(site_id, kind, slug)
  );

  CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY,
    site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    kind TEXT NOT NULL DEFAULT 'product',
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT DEFAULT '',
    price_cents INTEGER NOT NULL DEFAULT 0,
    compare_at_cents INTEGER,
    stock INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','draft','archived')),
    images TEXT NOT NULL DEFAULT '[]',
    metadata TEXT NOT NULL DEFAULT '{}',
    featured INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    number TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    items TEXT NOT NULL DEFAULT '[]',
    subtotal_cents INTEGER NOT NULL DEFAULT 0,
    shipping_cents INTEGER NOT NULL DEFAULT 0,
    total_cents INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','shipped','completed','cancelled','refunded')),
    payment_status TEXT NOT NULL DEFAULT 'paid',
    note TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT DEFAULT '',
    orders_count INTEGER NOT NULL DEFAULT 0,
    total_spent_cents INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(site_id, email)
  );

  CREATE TABLE IF NOT EXISTS site_views (
    id TEXT PRIMARY KEY,
    site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    path TEXT DEFAULT '/',
    referrer TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS inquiries (    id TEXT PRIMARY KEY,
    site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT DEFAULT '',
    message TEXT DEFAULT '',
    type TEXT NOT NULL DEFAULT 'contact',
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','read','replied','archived')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS media (
    id TEXT PRIMARY KEY,
    site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    mime TEXT DEFAULT 'image/jpeg',
    size INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    site_id TEXT NOT NULL UNIQUE REFERENCES sites(id) ON DELETE CASCADE,
    plan TEXT NOT NULL DEFAULT 'starter',
    status TEXT NOT NULL DEFAULT 'trialing',
    ai_limit INTEGER NOT NULL DEFAULT 50,
    ai_used INTEGER NOT NULL DEFAULT 0,
    product_limit INTEGER NOT NULL DEFAULT 25,
    storage_limit_mb INTEGER NOT NULL DEFAULT 250,
    renews_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS domains (
    id TEXT PRIMARY KEY,
    site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    domain TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending',
    ssl_status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS ai_usage (
    id TEXT PRIMARY KEY,
    site_id TEXT REFERENCES sites(id) ON DELETE CASCADE,
    agent TEXT NOT NULL,
    action TEXT NOT NULL,
    input_chars INTEGER DEFAULT 0,
    output_chars INTEGER DEFAULT 0,
    model TEXT DEFAULT 'local',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS activity (
    id TEXT PRIMARY KEY,
    site_id TEXT REFERENCES sites(id) ON DELETE SET NULL,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    detail TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS platform_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_sites_owner ON sites(owner_id);
  CREATE INDEX IF NOT EXISTS idx_items_site ON items(site_id);
  CREATE INDEX IF NOT EXISTS idx_orders_site ON orders(site_id);
  CREATE INDEX IF NOT EXISTS idx_customers_site ON customers(site_id);
  CREATE INDEX IF NOT EXISTS idx_media_site ON media(site_id);
  CREATE INDEX IF NOT EXISTS idx_inquiries_site ON inquiries(site_id);
  CREATE INDEX IF NOT EXISTS idx_views_site ON site_views(site_id, created_at);
  CREATE INDEX IF NOT EXISTS idx_ai_site ON ai_usage(site_id);
  CREATE INDEX IF NOT EXISTS idx_activity_site ON activity(site_id);
`);

export function tx(fn) {
  db.exec('BEGIN');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

export function json(value, fallback = {}) {
  if (value == null) return fallback;
  if (typeof value === 'object') return value;
  try { return JSON.parse(value); } catch { return fallback; }
}

export function logActivity({ siteId = null, userId = null, action, detail = '' }) {
  db.prepare(
    'INSERT INTO activity (id, site_id, user_id, action, detail) VALUES (?, ?, ?, ?, ?)'
  ).run(crypto.randomUUID(), siteId, userId, action, detail);
}
