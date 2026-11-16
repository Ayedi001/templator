import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:4100';
const OUT = path.resolve('.shots');
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  args: ['--disable-gpu', '--hide-scrollbars'],
});

const errors = [];
async function newPage(viewport = { width: 1440, height: 1000 }) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(`console: ${msg.text()}`); });
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  return { context, page };
}

async function loginToken(email, password) {
  const res = await fetch(`${BASE}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data;
}

async function setToken(page, token) {
  await page.addInitScript((t) => localStorage.setItem('nexora_token', t), token);
}

async function shot(page, name, options = {}) {
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: Boolean(options.fullPage) });
  console.log('shot', name);
}

const publicPage = await newPage();
const page = publicPage.page;
await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await shot(page, 'landing-v2');

await page.goto(`${BASE}/templates`, { waitUntil: 'networkidle' });
await shot(page, 'marketplace');
await page.goto(`${BASE}/templates/roast-ritual`, { waitUntil: 'networkidle' });
await shot(page, 'template-detail');
await page.goto(`${BASE}/site/atelier-noir`, { waitUntil: 'networkidle' });
await shot(page, 'published-site');
await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
await shot(page, 'login');

const owner = await loginToken('maya@nexora.studio', 'Demo1234!');
const siteId = owner.sites[0].id;
const dashboard = await newPage();
await setToken(dashboard.page, owner.token);
await dashboard.page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' });
await shot(dashboard.page, 'dashboard-home');
await dashboard.page.goto(`${BASE}/dashboard/${siteId}`, { waitUntil: 'networkidle' });
await shot(dashboard.page, 'dashboard-overview');
for (const [slug, name] of [
  ['items', 'dashboard-items'],
  ['orders', 'dashboard-orders'],
  ['design', 'dashboard-design'],
  ['templates', 'dashboard-templates'],
  ['customers', 'dashboard-customers'],
  ['inbox', 'dashboard-inbox'],
  ['media', 'dashboard-media'],
  ['seo', 'dashboard-seo'],
  ['settings', 'dashboard-settings'],
  ['billing', 'dashboard-billing'],
  ['ai', 'dashboard-ai'],
]) {
  await dashboard.page.goto(`${BASE}/dashboard/${siteId}/${slug}`, { waitUntil: 'networkidle' });
  await dashboard.page.waitForTimeout(700);
  await shot(dashboard.page, name);
}

const admin = await loginToken('admin@nexora.studio', 'Platform123!');
const adminPage = await newPage();
await setToken(adminPage.page, admin.token);
for (const [route, name] of [
  ['/admin', 'admin-overview'],
  ['/admin/users', 'admin-users'],
  ['/admin/sites', 'admin-sites'],
  ['/admin/templates', 'admin-templates'],
  ['/admin/ai', 'admin-ai'],
]) {
  await adminPage.page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' });
  await adminPage.page.waitForTimeout(700);
  await shot(adminPage.page, name);
}

const mobile = await newPage({ width: 390, height: 844 });
await mobile.page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
await shot(mobile.page, 'landing-mobile');
await mobile.page.goto(`${BASE}/dashboard/${siteId}`, { waitUntil: 'networkidle' });
await shot(mobile.page, 'dashboard-mobile');

await browser.close();
if (errors.length) {
  console.log('\nERRORS:\n' + errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log('\nNo console/page errors.');
}
