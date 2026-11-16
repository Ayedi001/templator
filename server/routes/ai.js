import express from 'express';
import { z } from 'zod';
import { db, logActivity } from '../db.js';
import { id, parseJson, publicSite } from '../lib/helpers.js';
import { authenticate, loadSite } from '../middleware/auth.js';
import { orchestrate } from '../ai/orchestrator.js';
import { agentCatalog } from '../ai/agents/index.js';
import businessAnalysisAgent from '../ai/agents/business-analysis.js';
import templateRecommendationAgent from '../ai/agents/template-recommendation.js';
import websiteGenerationAgent from '../ai/agents/website-generation.js';
import productContentAgent from '../ai/agents/product-content.js';
import designAssistantAgent from '../ai/agents/design-assistant.js';
import seoAgent from '../ai/agents/seo.js';
import customerSupportAgent from '../ai/agents/customer-support.js';
import { serializeTemplate } from './templates.js';
import { PLAN_LIMITS } from '../services/sites.js';
import { getDisabledAgents, isAgentEnabled } from '../ai/settings.js';

const router = express.Router();
router.use(authenticate);

function siteWithItems(site) {
  const base = publicSite(site);
  base.items = db.prepare("SELECT * FROM items WHERE site_id = ? AND status = 'active' LIMIT 20").all(site.id)
    .map((item) => ({ ...item, images: parseJson(item.images, []), metadata: parseJson(item.metadata, {}) }));
  return base;
}

function usageFor(siteId) {
  const sub = db.prepare('SELECT * FROM subscriptions WHERE site_id = ?').get(siteId);
  return {
    used: sub?.ai_used || 0,
    limit: sub?.ai_limit || PLAN_LIMITS.starter.aiLimit,
    remaining: Math.max(0, (sub?.ai_limit || PLAN_LIMITS.starter.aiLimit) - (sub?.ai_used || 0)),
    plan: sub?.plan || 'starter',
  };
}

function enforceUsage(req, res) {
  if (req.user.role === 'admin') return true;
  const usage = usageFor(req.site.id);
  if (usage.remaining <= 0) {
    res.status(429).json({ error: `You have used all ${usage.limit} AI actions included in your plan. Upgrade to keep creating.`, usage });
    return false;
  }
  return true;
}

function recordUsage(req, agents, action, inputChars, outputChars, model) {
  for (const agent of agents) {
    db.prepare(`
      INSERT INTO ai_usage (id, site_id, agent, action, input_chars, output_chars, model)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id('ai'), req.site.id, agent, action, inputChars, outputChars, model);
  }
  db.prepare('UPDATE subscriptions SET ai_used = ai_used + 1 WHERE site_id = ?').run(req.site.id);
  return usageFor(req.site.id);
}

function allTemplates() {
  return db.prepare('SELECT * FROM templates WHERE enabled = 1').all().map(serializeTemplate);
}

function agentEnabled(agentId) {
  if (isAgentEnabled(agentId)) return true;
  throw Object.assign(new Error('This agent is temporarily unavailable. Platform AI settings have disabled it.'), { status: 503 });
}

function requireAgent(res, agentId) {
  if (isAgentEnabled(agentId)) return true;
  res.status(503).json({ error: 'This agent is temporarily unavailable. Platform AI settings have disabled it.' });
  return false;
}

router.get('/catalog', (_req, res) => {
  res.json(agentCatalog());
});

router.get('/usage', (req, res) => {
  const siteId = String(req.query.siteId || '');
  const site = db.prepare('SELECT * FROM sites WHERE id = ? AND owner_id = ?').get(siteId, req.user.id);
  if (!site) return res.status(404).json({ error: 'Website not found' });
  res.json({ usage: usageFor(site.id) });
});

router.post('/analyze', async (req, res) => {
  const schema = z.object({
    name: z.string().trim().min(1).max(100),
    category: z.string().trim().min(1).max(50),
    description: z.string().trim().max(1000).optional().default(''),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const templates = allTemplates();
  const [analysis, recommendations] = await Promise.all([
    businessAnalysisAgent.run(parsed.data),
    templateRecommendationAgent.run({ ...parsed.data, templates }),
  ]);
  res.json({
    analysis,
    recommendations,
    agents: [
      { id: analysis.agent, name: 'Business Analysis Agent', status: 'completed', model: analysis.model },
      { id: recommendations.agent, name: 'Template Recommendation Agent', status: 'completed', model: recommendations.model },
    ],
    mode: agentCatalog().status.mode,
  });
});

router.post('/chat', loadSite, async (req, res) => {
  if (!enforceUsage(req, res)) return;
  const schema = z.object({
    message: z.string().trim().min(1).max(2000),
    history: z.array(z.object({ role: z.string(), content: z.string().max(4000) })).max(12).optional().default([]),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Type a message to get started' });
  const result = await orchestrate({
    site: siteWithItems(req.site),
    message: parsed.data.message,
    history: parsed.data.history,
    siteId: req.site.id,
    disabledAgents: getDisabledAgents(),
  });
  const model = result.agents[0]?.model || 'nexora-local-v1';
  const usage = recordUsage(req, result.agents.map((a) => a.id), 'orchestrated-chat', parsed.data.message.length, result.reply.length, model);
  res.json({ ...result, usage });
});

router.post('/generate-site', loadSite, async (req, res) => {
  if (!requireAgent(res, 'website-generation')) return;
  if (!enforceUsage(req, res)) return;
  const schema = z.object({
    brief: z.string().max(1000).optional().default(''),
    tone: z.string().max(50).optional().default(''),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Could not read the brief' });
  const result = await websiteGenerationAgent.run({
    site: siteWithItems(req.site),
    name: req.site.name,
    category: req.site.category,
    description: req.site.description,
    brief: parsed.data.brief || req.site.description,
    tone: parsed.data.tone,
  });
  const usage = recordUsage(req, [result.agent], 'generate-site', parsed.data.brief.length, JSON.stringify(result.content).length, result.model);
  res.json({ result, usage });
});

router.post('/design', loadSite, async (req, res) => {
  if (!requireAgent(res, 'design-assistant')) return;
  if (!enforceUsage(req, res)) return;
  const schema = z.object({ message: z.string().trim().min(1).max(600) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Describe the look you want' });
  const result = await designAssistantAgent.run({ site: siteWithItems(req.site), message: parsed.data.message, category: req.site.category });
  const usage = recordUsage(req, [result.agent], 'design-advice', parsed.data.message.length, result.reply.length, result.model);
  res.json({ result, usage });
});

router.post('/product-copy', loadSite, async (req, res) => {
  if (!requireAgent(res, 'product-content')) return;
  if (!enforceUsage(req, res)) return;
  const schema = z.object({
    name: z.string().trim().min(1).max(160),
    category: z.string().max(80).optional().default(''),
    notes: z.string().max(800).optional().default(''),
    priceCents: z.coerce.number().int().min(0).optional().default(0),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const result = await productContentAgent.run({ ...parsed.data, site: siteWithItems(req.site) });
  const usage = recordUsage(req, [result.agent], 'product-copy', JSON.stringify(parsed.data).length, JSON.stringify(result).length, result.model);
  res.json({ result, usage });
});

router.post('/seo', loadSite, async (req, res) => {
  if (!requireAgent(res, 'seo')) return;
  if (!enforceUsage(req, res)) return;
  const result = await seoAgent.run({ site: siteWithItems(req.site) });
  if (req.body?.apply) {
    const settings = parseJson(req.site.settings);
    settings.seo = {
      ...(settings.seo || {}),
      title: result.title,
      description: result.description,
      keywords: result.keywords,
    };
    db.prepare("UPDATE sites SET settings = ?, updated_at = datetime('now') WHERE id = ?")
      .run(JSON.stringify(settings), req.site.id);
    logActivity({ siteId: req.site.id, userId: req.user.id, action: 'seo.updated', detail: 'Applied AI SEO recommendations' });
  }
  const usage = recordUsage(req, [result.agent], 'seo-audit', 0, JSON.stringify(result).length, result.model);
  res.json({ result, usage, applied: Boolean(req.body?.apply) });
});

router.post('/support', async (req, res) => {
  if (!requireAgent(res, 'customer-support')) return;
  const schema = z.object({ message: z.string().trim().min(1).max(1000), siteId: z.string().optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Type your question' });
  const result = await customerSupportAgent.run({ message: parsed.data.message, siteId: parsed.data.siteId || ':siteId' });
  res.json({ result, mode: agentCatalog().status.mode });
});

export default router;
