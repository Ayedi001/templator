/**
 * End-to-end API smoke test. Run against a seeded local server:
 *   node server/index.js
 *   node server/tests/smoke.test.js
 */
const BASE = process.env.BASE_URL || 'http://127.0.0.1:4100';
let passed = 0;
function assert(condition, message) {
  if (!condition) throw new Error(message);
  passed += 1;
  console.log(`  ✓ ${message}`);
}

async function api(path, { method = 'GET', token, body } = {}) {
  const response = await fetch(`${BASE}/api${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => null);
  return { status: response.status, data };
}

async function login(email, password) {
  const { status, data } = await api('/auth/login', { method: 'POST', body: { email, password } });
  assert(status === 200, `login ${email}`);
  return data;
}

async function run() {
  console.log(`Nexora smoke test · ${BASE}\n`);
  console.log('Public foundation');
  const health = await api('/health');
  assert(health.status === 200 && health.data.ok, 'health endpoint responds');
  const templates = await api('/templates');
  assert(templates.status === 200 && templates.data.total >= 60, `${templates.data.total} templates available`);
  assert(templates.data.templates.some((template) => template.id === 'northstar-fintech'), 'expanded template collection is available');
  const categories = await api('/templates/categories');
  assert(categories.data.categories.length === 13, '13 template categories');
  const publishedList = await api('/public/sites');
  assert(publishedList.data.sites.length >= 5, 'published websites listed');
  const siteHtmlResponse = await fetch(`${BASE}/site/atelier-noir`);
  const siteHtml = await siteHtmlResponse.text();
  assert(siteHtmlResponse.status === 200 && /<meta property="og:title"/.test(siteHtml), 'published site HTML includes crawler metadata');
  assert(/"@type":"Store"/.test(siteHtml) && /application\/ld\+json/.test(siteHtml), 'published site includes structured data');
  const sitemap = await fetch(`${BASE}/sitemap.xml`).then((r) => r.text());
  assert(sitemap.includes('/site/atelier-noir') && sitemap.includes('<urlset'), 'sitemap lists published sites');
  const robots = await fetch(`${BASE}/robots.txt`).then((r) => r.text());
  assert(/Sitemap: .*\/sitemap\.xml/.test(robots) && /Disallow: \/admin/.test(robots), 'robots file exposes sitemap and blocks private areas');

  console.log('\nAuthentication & tenant isolation');
  const owner = await login('maya@nexora.studio', 'Demo1234!');
  assert(owner.sites.length >= 2, 'owner sees their websites');
  const ownerSite = owner.sites.find((s) => s.status === 'published');
  const otherOwner = await login('omar@nexora.studio', 'Demo1234!');
  const forbidden = await api(`/sites/${ownerSite.id}/overview`, { token: otherOwner.token });
  assert(forbidden.status === 403, 'cross-tenant site access is blocked');
  const adminAsOwner = await api('/admin/overview', { token: owner.token });
  assert(adminAsOwner.status === 403, 'super-admin routes reject owners');

  const overview = await api(`/sites/${ownerSite.id}/overview`, { token: owner.token });
  assert(overview.status === 200 && overview.data.stats, 'tenant dashboard overview loads');

  console.log('\nAI orchestration');
  const analysis = await api('/ai/analyze', { method: 'POST', token: owner.token, body: { name: 'Test Atelier', category: 'fashion', description: 'Slow luxury fashion made with natural fabrics.' } });
  assert(analysis.status === 200 && analysis.data.recommendations.recommendations.length === 3, 'business analysis returns three template recommendations');
  const chat = await api('/ai/chat', { method: 'POST', token: owner.token, body: { siteId: ownerSite.id, message: 'Make my design feel warmer and more editorial.' } });
  assert(chat.status === 200 && chat.data.agents[0].id === 'design-assistant', 'orchestrator selects the design agent');
  const seo = await api('/ai/seo', { method: 'POST', token: owner.token, body: { siteId: ownerSite.id } });
  assert(seo.status === 200 && seo.data.result.score > 0, 'SEO agent returns an audit score');
  const productCopy = await api('/ai/product-copy', { method: 'POST', token: owner.token, body: { siteId: ownerSite.id, name: 'Wool Overcoat', category: 'Outerwear', notes: 'Double faced wool, horn buttons.', priceCents: 69000 } });
  assert(productCopy.status === 200 && productCopy.data.result.title, 'product content agent returns copy');
  const support = await api('/ai/support', { method: 'POST', token: owner.token, body: { message: 'How do I publish my website?' } });
  assert(support.status === 200 && support.data.result.steps?.length > 0, 'support agent returns steps');

  console.log('\nStorefront, orders & inquiries');
  const publicSite = await api(`/public/sites/${ownerSite.slug}`);
  assert(publicSite.status === 200 && Array.isArray(publicSite.data.items), 'published website is publicly readable');
  const inStock = publicSite.data.items.find((item) => item.price_cents > 0);
  const variant = inStock.metadata?.variations?.[0];
  const orderOptions = variant ? { [variant.name]: variant.options[0] } : {};
  const order = await api(`/public/sites/${ownerSite.slug}/orders`, { method: 'POST', body: { customer: { name: 'Smoke Tester', email: `smoke-${Date.now()}@example.com`, phone: '000' }, items: [{ id: inStock.id, quantity: 1, options: orderOptions }], note: 'Automated smoke test' } });
  assert(order.status === 201 && order.data.order.number, 'storefront order is accepted');
  assert(!variant || order.data.order.items[0].options?.[variant.name] === variant.options[0], 'product variation is preserved on the order');
  const orders = await api(`/sites/${ownerSite.id}/orders`, { token: owner.token });
  assert(orders.data.orders.some((o) => o.number === order.data.order.number), 'new order appears in tenant dashboard');
  const inquiry = await api(`/public/sites/${ownerSite.slug}/inquiries`, { method: 'POST', body: { name: 'Smoke Lead', email: 'lead-smoke@example.com', message: 'I would like to book a viewing.' } });
  assert(inquiry.status === 201, 'contact form is accepted');
  const inbox = await api(`/sites/${ownerSite.id}/inquiries`, { token: owner.token });
  assert(inbox.data.inquiries.some((i) => i.email === 'lead-smoke@example.com'), 'inquiry appears in tenant inbox');

  console.log('\nNew account, onboarding & publishing');
  const unique = Date.now();
  const register = await api('/auth/register', { method: 'POST', body: { name: 'Smoke Owner', email: `smoke-owner-${unique}@example.com`, password: 'SmokeTest123!' } });
  assert(register.status === 201 && register.data.token, 'new owner can register');
  const newToken = register.data.token;
  const created = await api('/sites', { method: 'POST', token: newToken, body: { name: 'Smoke Kitchen', category: 'food', templateId: 'forno-pizza', description: 'A test neighborhood kitchen.' } });
  assert(created.status === 201 && created.data.site.slug, 'owner creates a website from an expanded template');
  const secondSite = await api('/sites', { method: 'POST', token: newToken, body: { name: 'Second Site', category: 'food', templateId: 'forno-pizza', description: '' } });
  assert(secondSite.status === 403, 'starter site limit is enforced');
  const design = await api(`/sites/${created.data.site.id}/design`, { method: 'PATCH', token: newToken, body: { theme: { palette: { accent: '#123456' } }, content: { hero: { headline: 'Smoke tested design.' } } } });
  assert(design.status === 200 && design.data.site.theme.palette.accent === '#123456', 'design changes persist with tenant authorisation');
  const publish = await api(`/sites/${created.data.site.id}/publish`, { method: 'POST', token: newToken });
  assert(publish.status === 200 && publish.data.site.status === 'published', 'website publishes');
  const live = await api(`/public/sites/${created.data.site.slug}`);
  assert(live.status === 200 && live.data.site.content.hero.headline === 'Smoke tested design.', 'published content is served at unique URL');
  const domainBlocked = await api(`/sites/${created.data.site.id}/domains`, { method: 'POST', token: newToken, body: { domain: 'smoke-test-domain.com' } });
  assert(domainBlocked.status === 403, 'custom domain is plan-gated for starter');
  const media = await api(`/sites/${created.data.site.id}/media`, { method: 'POST', token: newToken, body: { url: 'https://example.com/test-image.jpg', name: 'Test image' } });
  assert(media.status === 201 && media.data.media.url, 'media can be added to tenant library');
  const deletedMedia = await api(`/sites/${created.data.site.id}/media/${media.data.media.id}`, { method: 'DELETE', token: newToken });
  assert(deletedMedia.status === 200, 'media can be deleted');

  console.log('\nSuper admin');
  const admin = await login('admin@nexora.studio', 'Platform123!');
  const adminOverview = await api('/admin/overview', { token: admin.token });
  assert(adminOverview.status === 200 && adminOverview.data.counts.sites >= 8, 'admin overview aggregates platform');
  const users = await api('/admin/users', { token: admin.token });
  assert(users.status === 200 && users.data.users.length >= 6, 'admin can list all businesses');
  const adminSites = await api('/admin/sites', { token: admin.token });
  assert(adminSites.status === 200 && adminSites.data.sites.length >= 8, 'admin can list all websites');
  const templateClone = await api('/admin/templates', { method: 'POST', token: admin.token, body: { name: `Smoke Template ${unique}`, baseTemplateId: 'nimbus', category: 'technology', style: 'Test variant', description: 'A temporary template.' } });
  assert(templateClone.status === 201 && templateClone.data.template.id, 'admin can add a new template');
  const templateDelete = await api(`/admin/templates/${templateClone.data.template.id}`, { method: 'DELETE', token: admin.token });
  assert(templateDelete.status === 200 && templateDelete.data.disabled === false, 'unused template is deleted');
  const aiConfig = await api('/admin/ai', { token: admin.token });
  assert(aiConfig.status === 200 && aiConfig.data.agents.length === 7, 'admin sees all seven AI agents');

  console.log('\nCleanup');
  const cleanup = await api(`/sites/${created.data.site.id}`, { method: 'DELETE', token: newToken });
  assert(cleanup.status === 200, 'test website deleted');
  await api(`/sites/${ownerSite.id}/orders`); // no-op keeps test readable

  console.log(`\n✓ ${passed} assertions passed.`);
}

run().catch((error) => {
  console.error('\n✗ Smoke test failed:', error.message);
  process.exitCode = 1;
});
