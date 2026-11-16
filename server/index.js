import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import fs from 'node:fs';
import path from 'node:path';
import { env } from './config.js';
import { db } from './db.js';
import { seedDatabase } from './seed.js';
import { getPublishedSite, renderRobots, renderSiteHtml, renderSitemap } from './services/seo.js';
import authRoutes from './routes/auth.js';
import templateRoutes from './routes/templates.js';
import siteRoutes from './routes/sites.js';
import contentRoutes from './routes/content.js';
import publicRoutes from './routes/public.js';
import aiRoutes from './routes/ai.js';
import adminRoutes from './routes/admin.js';
import billingRoutes from './routes/billing.js';

fs.mkdirSync(env.UPLOAD_DIR, { recursive: true });

// Seed only an empty database. Demo data can be rebuilt with `npm run seed -- --reset`.
try {
  const result = seedDatabase();
  if (result.seeded) console.log(`[nexora] seeded ${result.templates} templates, ${result.categories} categories`);
} catch (error) {
  console.error('[nexora] seed failed', error);
}

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin(origin, callback) {
    if (!origin || env.NODE_ENV !== 'production') return callback(null, true);
    if ([env.FRONTEND_URL].includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: false,
}));
app.use(express.json({ limit: '25mb' }));
app.use('/uploads', express.static(env.UPLOAD_DIR, { maxAge: '7d' }));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    app: env.APP_NAME,
    version: '1.0.0',
    templates: db.prepare('SELECT COUNT(*) AS n FROM templates WHERE enabled = 1').get().n,
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/sites', siteRoutes);
app.use('/api/sites/:siteId', contentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/billing', billingRoutes);

app.use('/api', (_req, res) => res.status(404).json({ error: 'API endpoint not found' }));

function publicOrigin(req) {
  return `${req.protocol}://${req.get('host')}`;
}

// Crawler-friendly discovery files are available from the app itself.
app.get('/robots.txt', (req, res) => {
  res.type('text/plain').set('Cache-Control', 'public, max-age=300').send(renderRobots(publicOrigin(req)));
});
app.get('/sitemap.xml', (req, res) => {
  res.type('application/xml').set('Cache-Control', 'public, max-age=300').send(renderSitemap(publicOrigin(req)));
});

if (fs.existsSync(env.CLIENT_DIST)) {
  const clientIndex = path.join(env.CLIENT_DIST, 'index.html');

  // Published sites get per-page title, description, Open Graph and JSON-LD in
  // the initial HTML so social crawlers and non-JS search agents see real data.
  app.get('/site/:slug', (req, res, next) => {
    const site = getPublishedSite(req.params.slug);
    if (!site) return next();
    try {
      const template = fs.readFileSync(clientIndex, 'utf8');
      res.type('html').set('Cache-Control', 'public, max-age=60').send(renderSiteHtml(template, site, publicOrigin(req)));
    } catch (error) {
      next(error);
    }
  });

  app.use(express.static(env.CLIENT_DIST, { maxAge: '1h', index: false }));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
    res.sendFile(clientIndex);
  });
}

app.use((error, _req, res, _next) => {
  console.error('[nexora]', error);
  if (error?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'The uploaded content is too large (25 MB maximum)' });
  }
  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({ error: 'Invalid JSON request' });
  }
  res.status(error.status || 500).json({
    error: env.NODE_ENV === 'production' ? 'Something went wrong' : (error.message || 'Internal server error'),
  });
});

const server = app.listen(env.PORT, () => {
  console.log(`[nexora] API listening on http://127.0.0.1:${env.PORT}`);
  console.log(`[nexora] environment: ${env.NODE_ENV}`);
  if (!fs.existsSync(env.CLIENT_DIST)) console.log('[nexora] no client build found — run `npm run dev:web` for the Vite app');
});

function shutdown() {
  server.close(() => {
    try { db.close(); } catch { /* ignore */ }
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 3000).unref();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export default app;
