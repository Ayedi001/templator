import express from 'express';
import { db } from '../db.js';
import { parseJson } from '../lib/helpers.js';
import { TEMPLATE_CATEGORIES } from '../templates/catalog.js';

const router = express.Router();

export function serializeTemplate(row) {
  const manifest = parseJson(row.manifest);
  return {
    ...manifest,
    uses: row.uses,
    enabled: Boolean(row.enabled),
    featured: Boolean(row.featured),
    categoryName: TEMPLATE_CATEGORIES.find((c) => c.id === row.category)?.name || row.category,
  };
}

router.get('/categories', (_req, res) => {
  const counts = db.prepare('SELECT category, COUNT(*) AS n FROM templates WHERE enabled = 1 GROUP BY category').all();
  const countMap = Object.fromEntries(counts.map((row) => [row.category, row.n]));
  res.json({
    categories: TEMPLATE_CATEGORIES.map((cat) => ({ ...cat, count: countMap[cat.id] || 0 })),
  });
});

router.get('/', (req, res) => {
  const { category, search, featured, sort } = req.query;
  const rows = db.prepare('SELECT * FROM templates WHERE enabled = 1 ORDER BY name').all();
  let templates = rows.map(serializeTemplate);
  if (category && category !== 'all') templates = templates.filter((t) => t.category === category);
  if (featured === 'true') templates = templates.filter((t) => t.featured);
  if (search) {
    const q = String(search).toLowerCase();
    templates = templates.filter((t) =>
      [t.name, t.style, t.description, t.categoryName, ...(t.tags || [])].join(' ').toLowerCase().includes(q)
    );
  }
  if (sort === 'popular') templates.sort((a, b) => b.uses - a.uses);
  if (sort === 'newest') templates.reverse();
  res.json({ templates, total: templates.length });
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM templates WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Template not found' });
  res.json({ template: serializeTemplate(row) });
});

export default router;
