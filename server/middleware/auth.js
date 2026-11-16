import jwt from 'jsonwebtoken';
import { env } from '../config.js';
import { db } from '../db.js';
import { findUserById } from '../lib/auth.js';
import { publicSite } from '../lib/helpers.js';

const attempts = new Map();

export function authRateLimit(req, res, next) {
  const key = `${req.ip}:${req.path}`;
  const now = Date.now();
  const entry = attempts.get(key) || { count: 0, start: now };
  if (now - entry.start > 15 * 60 * 1000) {
    entry.count = 0;
    entry.start = now;
  }
  entry.count += 1;
  attempts.set(key, entry);
  if (entry.count > 30) {
    return res.status(429).json({ error: 'Too many attempts. Please try again later.' });
  }
  next();
}

export function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    const user = findUserById(payload.sub);
    if (!user) return res.status(401).json({ error: 'Session user no longer exists' });
    if (user.status === 'suspended') return res.status(403).json({ error: 'This account has been suspended' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}

export function requireSuperAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Super admin access required' });
  next();
}

export function loadSite(req, res, next) {
  const siteId = req.params.siteId || req.params.id || req.body.siteId || req.query.siteId;
  if (!siteId) return res.status(400).json({ error: 'Site id is required' });
  const site = db.prepare('SELECT * FROM sites WHERE id = ?').get(siteId);
  if (!site) return res.status(404).json({ error: 'Website not found' });
  if (req.user.role !== 'admin' && site.owner_id !== req.user.id) {
    return res.status(403).json({ error: 'You do not have access to this website' });
  }
  req.site = site;
  req.subscription = db.prepare('SELECT * FROM subscriptions WHERE site_id = ?').get(site.id);
  next();
}

export function sendSite(req, res) {
  res.json({ site: publicSite(req.site), subscription: req.subscription || null });
}
