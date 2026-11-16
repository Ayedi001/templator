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
const failedResponses = [];

async function makePage(viewport = { width: 1440, height: 1000 }) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(`console: ${msg.text()}`); });
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  page.on('response', (res) => { if (res.status() >= 400) failedResponses.push(`${res.status()} ${res.url()}`); });
  return { context, page };
}

async function shot(page, name) {
  await page.waitForTimeout(350);
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
  console.log('  screenshot', name);
}

function check(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`  ✓ ${message}`);
}

async function apiLogin() {
  const response = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'maya@nexora.studio', password: 'Demo1234!' }),
  });
  return response.json();
}

const owner = await apiLogin();
const atelier = owner.sites.find((s) => s.slug === 'atelier-noir') || owner.sites[0];

// ── Owner dashboard flows ────────────────────────────────────────────────
const { page, context } = await makePage();
console.log('\nOwner login & dashboard');
await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
await page.fill('#login-email', 'maya@nexora.studio');
await page.fill('#login-password', 'Demo1234!');
await page.click('button[type="submit"]');
await page.waitForURL('**/dashboard', { timeout: 15000 });
check(true, 'owner signed in through the UI');

await page.goto(`${BASE}/dashboard/${atelier.id}/seo`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => {
  const el = document.querySelector('.seo-ring-value');
  return el && /\d/.test(el.textContent || '');
}, { timeout: 20000 }).catch(() => undefined);
const seoScore = await page.locator('.seo-ring-value').innerText().catch(() => '');
check(/\d/.test(seoScore), `SEO page loads an audit score (${seoScore.replace(/\n/g, ' ')}).`);
await shot(page, 'seo-fixed');

console.log('\nCatalogue create through UI');
await page.goto(`${BASE}/dashboard/${atelier.id}/items`, { waitUntil: 'networkidle' });
await page.getByRole('button', { name: /Add (piece|product)/i }).click();
await page.locator('#item-form input').first().fill('Smoke Test Coat');
await page.locator('#item-form textarea').fill('A structured coat made for automated confidence and everyday wear.');
const numberInputs = page.locator('#item-form input[type="number"]');
await numberInputs.nth(0).fill('495');
if (await numberInputs.count() >= 3) await numberInputs.last().fill('10');
await page.locator('.modal-foot .btn-accent').click();
await page.getByText('Smoke Test Coat').first().waitFor({ timeout: 10000 });
check(true, 'new catalogue item created through the dashboard');
await shot(page, 'items-fixed');

console.log('\nDesign studio save');
await page.goto(`${BASE}/dashboard/${atelier.id}/design`, { waitUntil: 'networkidle' });
const logoInput = page.locator('.design-controls-body input').first();
const nextLogo = `Atelier Noir ${Date.now().toString().slice(-4)}`;
await logoInput.fill(nextLogo);
await page.getByRole('button', { name: 'Save changes' }).click();
await page.getByText('Design saved.').waitFor({ timeout: 10000 });
await page.reload({ waitUntil: 'networkidle' });
const savedLogo = await page.locator('.design-controls-body input').first().inputValue();
check(savedLogo === nextLogo, 'design change persisted after reload');

console.log('\nAI chat');
await page.goto(`${BASE}/dashboard/${atelier.id}/ai`, { waitUntil: 'networkidle' });
await page.locator('.ai-composer textarea').fill('Make my design feel warmer and more editorial.');
await page.locator('.ai-composer button').click();
await page.locator('.ai-message.assistant .ai-bubble').first().waitFor({ timeout: 20000 });
const agentChips = await page.locator('.ai-agents-used').first().innerText();
check(/Design Assistant/i.test(agentChips), `orchestrator returned a specialist result (${agentChips.replace(/\n/g, ', ')})`);
await shot(page, 'ai-chat-result');

// ── Storefront purchase ─────────────────────────────────────────────────
console.log('\nStorefront cart & checkout');
await page.goto(`${BASE}/site/atelier-noir`, { waitUntil: 'networkidle' });
await page.locator('.site-item-image').first().click();
await page.getByRole('button', { name: /Add to bag/i }).click();
await page.getByRole('button', { name: /Continue to checkout/i }).click();
await page.locator('.site-cart-drawer').getByPlaceholder('Jane Smith').fill('UI Smoke Buyer');
await page.locator('.site-cart-drawer').getByPlaceholder('jane@example.com').fill(`ui-smoke-${Date.now()}@example.com`);
await page.getByRole('button', { name: /Place order/i }).click();
await page.getByText('Order confirmed').waitFor({ timeout: 15000 });
check(true, 'customer completed checkout in the live storefront');
await shot(page, 'checkout-success');

await context.close();

// ── Onboarding new account ──────────────────────────────────────────────
console.log('\nOnboarding a new business');
const fresh = await makePage();
const email = `ui-new-owner-${Date.now()}@example.com`;
await fresh.page.goto(`${BASE}/register`, { waitUntil: 'networkidle' });
await fresh.page.fill('#register-name', 'UI New Owner');
await fresh.page.fill('#register-email', email);
await fresh.page.fill('#register-password', 'NewOwner123!');
await fresh.page.locator('button[type="submit"]').click();
await fresh.page.waitForURL('**/onboarding', { timeout: 15000 });
await fresh.page.fill('#biz-name', 'Studio Smoke');
await fresh.page.locator('.category-choice').filter({ hasText: 'Fashion' }).first().click();
await fresh.page.fill('#biz-desc', 'An independent fashion studio focused on slow, considered clothing.');
await fresh.page.getByRole('button', { name: /Continue with AI/i }).click();
await fresh.page.getByText('A starting point,').waitFor({ timeout: 20000 });
await fresh.page.getByRole('button', { name: /^Continue$/ }).click();
await fresh.page.getByText('Choose your').waitFor({ timeout: 10000 });
await fresh.page.getByRole('button', { name: /Create & publish/i }).click();
await fresh.page.getByText('Studio Smoke is ready.').waitFor({ timeout: 20000 });
check(true, 'new owner completed onboarding and published a website');
await shot(fresh.page, 'onboarding-success');

// ── Mobile dashboard ────────────────────────────────────────────────────
const mobile = await makePage({ width: 390, height: 844 });
await mobile.page.addInitScript((token) => localStorage.setItem('nexora_token', token), owner.token);
await mobile.page.goto(`${BASE}/dashboard/${atelier.id}`, { waitUntil: 'networkidle' });
await shot(mobile.page, 'dashboard-mobile-auth');
check(await mobile.page.locator('.metric-grid').isVisible(), 'mobile dashboard renders with metrics');

// ── Admin UI ────────────────────────────────────────────────────────────
const adminLogin = await fetch(`${BASE}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'admin@nexora.studio', password: 'Platform123!' }) }).then((r) => r.json());
const adminPage = await makePage();
await adminPage.page.addInitScript((token) => localStorage.setItem('nexora_token', token), adminLogin.token);
await adminPage.page.goto(`${BASE}/admin/templates`, { waitUntil: 'networkidle' });
await adminPage.page.getByRole('button', { name: /Add template/i }).click();
await adminPage.page.locator('.modal input').first().fill(`UI Template ${Date.now().toString().slice(-5)}`);
await adminPage.page.locator('.modal .btn-accent').click();
await adminPage.page.getByText('Template created and added to the marketplace.').waitFor({ timeout: 15000 });
check(true, 'super admin created a template through the UI');
await shot(adminPage.page, 'admin-template-created');

await browser.close();
console.log('\nFailed HTTP responses:', failedResponses.length ? failedResponses.join(', ') : 'none');
if (errors.length) {
  console.log('Browser errors:\n' + errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log('No browser console or page errors.');
}
