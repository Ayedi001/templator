import express from 'express';
import { z } from 'zod';
import { db, logActivity } from '../db.js';
import { id, siteListItem } from '../lib/helpers.js';
import { findUserByEmail, hashPassword, checkPassword, publicUser, signToken } from '../lib/auth.js';
import { authenticate, authRateLimit } from '../middleware/auth.js';

const router = express.Router();

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(80),
  email: z.string().trim().email('Enter a valid email address').max(160),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

function userSites(userId) {
  const rows = db.prepare(`
    SELECT s.*, sub.plan, sub.status AS subscription_status
    FROM sites s LEFT JOIN subscriptions sub ON sub.site_id = s.id
    WHERE s.owner_id = ? ORDER BY s.updated_at DESC
  `).all(userId);
  return rows.map((site) => siteListItem(site, { plan: site.plan, status: site.subscription_status }));
}

router.post('/register', authRateLimit, (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const { name, email, password } = parsed.data;
  if (findUserByEmail(email)) return res.status(409).json({ error: 'An account with that email already exists' });
  const userId = id('usr');
  db.prepare('INSERT INTO users (id, email, password_hash, name, role, avatar_color) VALUES (?, ?, ?, ?, ?, ?)')
    .run(userId, email.toLowerCase(), hashPassword(password), name, 'owner', '#6c5ce7');
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  logActivity({ userId: user.id, action: 'user.registered', detail: `${name} joined Nexora Studio` });
  res.status(201).json({ token: signToken(user), user: publicUser(user), sites: [] });
});

router.post('/login', authRateLimit, (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Enter a valid email and password' });
  const user = findUserByEmail(parsed.data.email);
  if (!user || !checkPassword(parsed.data.password, user.password_hash)) {
    return res.status(401).json({ error: 'Incorrect email or password' });
  }
  if (user.status === 'suspended') {
    return res.status(403).json({ error: 'This account has been suspended. Contact support@nexora.studio.' });
  }
  res.json({ token: signToken(user), user: publicUser(user), sites: userSites(user.id) });
});

router.get('/me', authenticate, (req, res) => {
  res.json({ user: publicUser(req.user), sites: userSites(req.user.id) });
});

router.patch('/me', authenticate, (req, res) => {
  const schema = z.object({
    name: z.string().trim().min(2).max(80).optional(),
    email: z.string().trim().email().max(160).optional(),
    avatarColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  if (parsed.data.email) {
    const taken = db.prepare('SELECT id FROM users WHERE lower(email) = lower(?) AND id != ?').get(parsed.data.email, req.user.id);
    if (taken) return res.status(409).json({ error: 'That email is already in use' });
  }
  const next = {
    name: parsed.data.name ?? req.user.name,
    email: parsed.data.email ? parsed.data.email.toLowerCase() : req.user.email,
    avatar_color: parsed.data.avatarColor ?? req.user.avatar_color,
  };
  db.prepare('UPDATE users SET name = ?, email = ?, avatar_color = ? WHERE id = ?')
    .run(next.name, next.email, next.avatar_color, req.user.id);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  logActivity({ userId: user.id, action: 'account.updated', detail: 'Updated account profile' });
  res.json({ user: publicUser(user) });
});

router.patch('/me/password', authenticate, (req, res) => {
  const schema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  if (!checkPassword(parsed.data.currentPassword, req.user.password_hash)) {
    return res.status(400).json({ error: 'Current password is incorrect' });
  }
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(parsed.data.newPassword), req.user.id);
  logActivity({ userId: req.user.id, action: 'account.password_changed', detail: 'Changed account password' });
  res.json({ ok: true });
});

export default router;
