import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:4100';
const OUT = path.resolve('.shots');
fs.mkdirSync(OUT, { recursive: true });
const templates = await fetch(`${BASE}/api/templates`).then((r) => r.json()).then((d) => d.templates);
const browser = await chromium.launch({ headless: true, executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', args: ['--disable-gpu', '--hide-scrollbars'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
let current = '';
const pageErrors = [];
page.on('pageerror', (err) => pageErrors.push(`${current}: ${err.message}`));
page.on('console', (msg) => { if (msg.type() === 'error') pageErrors.push(`${current}: ${msg.text()}`); });
page.on('response', (res) => { if (res.status() >= 400) pageErrors.push(`${current}: HTTP ${res.status()} ${res.url()}`); });

let pass = 0;
const failures = [];
for (const template of templates) {
  current = template.id;
  try {
    await page.goto(`${BASE}/templates/${template.id}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForSelector('.site-root', { timeout: 10000 });
    const cards = await page.locator('.site-item-card').count();
    const title = await page.title();
    if (!title.includes(template.name)) failures.push(`${template.id}: title mismatch (${title})`);
    if (!cards) failures.push(`${template.id}: no catalogue cards rendered`);
    const text = await page.locator('body').innerText();
    if (/undefined|\[object Object\]/.test(text)) failures.push(`${template.id}: undefined text rendered`);
    pass += 1;
    process.stdout.write('.');
  } catch (error) {
    failures.push(`${template.id}: ${error.message.split('\n')[0]}`);
    process.stdout.write('x');
  }
}
console.log(`\n\n${pass}/${templates.length} template previews rendered.`);

const samples = [
  ['roast-ritual', 'template-coffee'],
  ['solace-hotel', 'template-hotel'],
  ['the-fold', 'template-magazine'],
  ['form-fitness', 'template-gym'],
  ['haven-estate', 'template-realestate'],
  ['brightpath-academy', 'template-school'],
];
for (const [id, name] of samples) {
  await page.goto(`${BASE}/templates/${id}`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
  console.log('screenshot', name);
}

await page.setViewportSize({ width: 390, height: 844 });
const mobileSamples = [['atelier-noir', 'mobile-atelier'], ['roast-ritual', 'mobile-coffee'], ['solace-hotel', 'mobile-hotel']];
for (const [id, name] of mobileSamples) {
  await page.goto(`${BASE}/templates/${id}`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
  console.log('screenshot', name);
}

// Published demo websites
const publicSites = await fetch(`${BASE}/api/public/sites`).then((r) => r.json()).then((d) => d.sites);
const siteResults = [];
for (const site of publicSites) {
  current = `site:${site.slug}`;
  try {
    await page.goto(`${BASE}/site/${site.slug}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForSelector('.site-root', { timeout: 10000 });
    const itemCount = await page.locator('.site-item-card').count();
    siteResults.push({ slug: site.slug, items: itemCount, ok: true });
    process.stdout.write('.');
  } catch (error) {
    siteResults.push({ slug: site.slug, ok: false, error: error.message.split('\n')[0] });
    process.stdout.write('x');
  }
}
console.log(`\n${siteResults.filter((s) => s.ok).length}/${siteResults.length} published sites rendered.`);

await browser.close();
if (failures.length) console.log('\nTemplate failures:\n' + failures.join('\n'));
const relevantErrors = pageErrors.filter((e) => !e.startsWith('site:') || !e.includes('favicon'));
if (relevantErrors.length) console.log('\nBrowser errors:\n' + relevantErrors.slice(0, 20).join('\n'));
if (failures.length || siteResults.some((s) => !s.ok) || relevantErrors.length) process.exitCode = 1;
