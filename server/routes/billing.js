import express from 'express';
import { z } from 'zod';
import { db, logActivity } from '../db.js';
import { authenticate, loadSite } from '../middleware/auth.js';
import { PLAN_LIMITS } from '../services/sites.js';

const router = express.Router();
router.use(authenticate);

router.get('/plans', (_req, res) => {
  res.json({ plans: Object.entries(PLAN_LIMITS).map(([id, data]) => ({ id, ...data, features: planFeatures(id) })) });
});

router.get('/:siteId/billing', loadSite, (req, res) => {
  const sub = db.prepare('SELECT * FROM subscriptions WHERE site_id = ?').get(req.site.id);
  const itemCount = db.prepare("SELECT COUNT(*) AS n FROM items WHERE site_id = ? AND status != 'archived'").get(req.site.id).n;
  const mediaBytes = db.prepare('SELECT COALESCE(SUM(size),0) AS n FROM media WHERE site_id = ?').get(req.site.id).n;
  res.json({
    subscription: sub,
    plans: Object.entries(PLAN_LIMITS).map(([id, data]) => ({ id, ...data, features: planFeatures(id) })),
    usage: {
      items: itemCount,
      itemLimit: sub?.product_limit || PLAN_LIMITS.starter.productLimit,
      aiUsed: sub?.ai_used || 0,
      aiLimit: sub?.ai_limit || PLAN_LIMITS.starter.aiLimit,
      storageMb: Number((mediaBytes / 1024 / 1024).toFixed(1)),
      storageLimitMb: sub?.storage_limit_mb || PLAN_LIMITS.starter.storageLimitMb,
      domains: db.prepare('SELECT COUNT(*) AS n FROM domains WHERE site_id = ?').get(req.site.id).n,
    },
  });
});

router.patch('/:siteId/plan', loadSite, (req, res) => {
  const schema = z.object({ plan: z.enum(['starter', 'growth', 'scale']) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Choose a valid plan' });
  const limits = PLAN_LIMITS[parsed.data.plan];
  db.prepare('UPDATE subscriptions SET plan = ?, status = ?, ai_limit = ?, product_limit = ?, storage_limit_mb = ?, renews_at = ? WHERE site_id = ?')
    .run(parsed.data.plan, 'active', limits.aiLimit, limits.productLimit, limits.storageLimitMb,
      new Date(Date.now() + 30 * 86400000).toISOString(), req.site.id);
  logActivity({ siteId: req.site.id, userId: req.user.id, action: 'billing.plan_changed', detail: `Changed plan to ${limits.name}` });
  const sub = db.prepare('SELECT * FROM subscriptions WHERE site_id = ?').get(req.site.id);
  res.json({ subscription: sub, plan: parsed.data.plan });
});

router.post('/:siteId/cancel', loadSite, (req, res) => {
  db.prepare("UPDATE subscriptions SET status = 'cancelled' WHERE site_id = ?").run(req.site.id);
  logActivity({ siteId: req.site.id, userId: req.user.id, action: 'billing.cancelled', detail: 'Cancelled subscription' });
  const sub = db.prepare('SELECT * FROM subscriptions WHERE site_id = ?').get(req.site.id);
  res.json({ subscription: sub });
});

function planFeatures(plan) {
  if (plan === 'starter') return ['1 website', '25 catalogue items', '50 AI actions / month', 'Nexora subdomain', 'Standard support'];
  if (plan === 'growth') return ['3 websites', '250 catalogue items', '500 AI actions / month', 'Custom domain + SSL', 'Priority support', 'Advanced SEO tools'];
  return ['10 websites', 'Unlimited catalogue items', '2,500 AI actions / month', 'Multiple custom domains', 'Dedicated support', 'AI usage analytics'];
}

export default router;
