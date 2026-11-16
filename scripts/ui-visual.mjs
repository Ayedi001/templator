import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:4100';
const OUT = path.resolve('.shots');
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', args: ['--disable-gpu', '--hide-scrollbars'] });
const errors = [];
async function newPage(viewport = { width: 1440, height: 1000 }) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(`console: ${msg.text()}`); });
  return { context, page };
}
async function shot(page, name) {
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
  console.log('shot', name);
}
async function loginApi(email, password) {
  return fetch(`${BASE}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) }).then((r) => r.json());
}

const main = await newPage();
const page = main.page;
console.log('\nLanding sections');
await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
await page.locator('#features').scrollIntoViewIfNeeded();
await shot(page, 'landing-features');
await page.locator('.ai-section').scrollIntoViewIfNeeded();
await shot(page, 'landing-ai');
await page.locator('.pricing-section').scrollIntoViewIfNeeded();
await shot(page, 'landing-pricing');
await page.locator('.marketing-footer').scrollIntoViewIfNeeded();
await shot(page, 'landing-footer');

console.log('\nTemplate preview layout');
await page.goto(`${BASE}/templates/form-fitness`, { waitUntil: 'networkidle' });
await page.waitForSelector('.site-root');
const heroColumns = await page.locator('.site-hero-inner').evaluate((el) => getComputedStyle(el).gridTemplateColumns);
console.log('  hero columns:', heroColumns);
await shot(page, 'template-form-fixed');

console.log('\nMobile marketplace and template detail');
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${BASE}/templates`, { waitUntil: 'networkidle' });
await shot(page, 'marketplace-mobile');
await page.goto(`${BASE}/templates/atelier-noir`, { waitUntil: 'networkidle' });
await page.waitForSelector('.site-root');
await shot(page, 'template-detail-mobile-fixed');

console.log('\nAccount page');
const owner = await loginApi('maya@nexora.studio', 'Demo1234!');
await page.setViewportSize({ width: 1440, height: 1000 });
await page.addInitScript((token) => localStorage.setItem('nexora_token', token), owner.token);
await page.goto(`${BASE}/dashboard/account`, { waitUntil: 'networkidle' });
await shot(page, 'account-page');

console.log('\nMobile dashboard topbar');
const mobile = await newPage({ width: 390, height: 844 });
await mobile.page.addInitScript((token) => localStorage.setItem('nexora_token', token), owner.token);
const atelier = owner.sites.find((s) => s.slug === 'atelier-noir');
await mobile.page.goto(`${BASE}/dashboard/${atelier.id}`, { waitUntil: 'networkidle' });
await shot(mobile.page, 'dashboard-mobile-fixed');
const overflow = await mobile.page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
console.log('  horizontal overflow:', overflow);

console.log('\nNon-commerce tenant dashboard');
const sofia = await loginApi('sofia@nexora.studio', 'Demo1234!');
const hotel = sofia.sites.find((s) => s.slug === 'solace-hotel');
const servicePage = await newPage();
await servicePage.page.addInitScript((token) => localStorage.setItem('nexora_token', token), sofia.token);
await servicePage.page.goto(`${BASE}/dashboard/${hotel.id}`, { waitUntil: 'networkidle' });
await shot(servicePage.page, 'dashboard-hotel-overview');
await servicePage.page.goto(`${BASE}/dashboard/${hotel.id}/items`, { waitUntil: 'networkidle' });
await shot(servicePage.page, 'dashboard-hotel-rooms');

console.log('\nAdmin pages');
const admin = await loginApi('admin@nexora.studio', 'Platform123!');
const adminPage = await newPage();
await adminPage.page.addInitScript((token) => localStorage.setItem('nexora_token', token), admin.token);
for (const [route, name] of [
  ['/admin/subscriptions', 'admin-subscriptions'],
  ['/admin/ai', 'admin-ai'],
  ['/admin/analytics', 'admin-analytics'],
  ['/admin/activity', 'admin-activity'],
  ['/admin/settings', 'admin-settings'],
  ['/admin/users', 'admin-users-fixed'],
]) {
  await adminPage.page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' });
  await shot(adminPage.page, name);
}

console.log('\nPublished demo websites');
const publicSites = await fetch(`${BASE}/api/public/sites`).then((r) => r.json()).then((d) => d.sites);
for (const site of publicSites) {
  await adminPage.page.goto(`${BASE}/site/${site.slug}`, { waitUntil: 'domcontentloaded' });
  await adminPage.page.waitForSelector('.site-root', { timeout: 10000 });
  process.stdout.write('.');
}
console.log(`\n${publicSites.length} published sites rendered.`);

await browser.close();
if (errors.length) { console.log('\nBrowser errors:\n' + [...new Set(errors)].slice(0, 30).join('\n')); process.exitCode = 1; }
else console.log('\nNo browser errors.');
