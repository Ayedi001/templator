import { db, tx } from './db.js';
import { env } from './config.js';
import { hashPassword } from './lib/auth.js';
import { id, dateOffset } from './lib/helpers.js';
import { TEMPLATES, TEMPLATE_CATEGORIES } from './templates/catalog.js';
import { createSite, PLAN_LIMITS } from './services/sites.js';

const OWNERS = [
  { key: 'maya', name: 'Maya Laurent', email: 'maya@nexora.studio', password: 'Demo1234!', color: '#6c5ce7', daysAgo: 365 },
  { key: 'omar', name: 'Omar Haddad', email: 'omar@nexora.studio', password: 'Demo1234!', color: '#c46a3a', daysAgo: 250 },
  { key: 'sofia', name: 'Sofia Lindqvist', email: 'sofia@nexora.studio', password: 'Demo1234!', color: '#2f7d6b', daysAgo: 400 },
  { key: 'jules', name: 'Jules Okafor', email: 'jules@nexora.studio', password: 'Demo1234!', color: '#8f7cff', daysAgo: 120 },
  { key: 'nina', name: 'Nina Rossi', email: 'nina@nexora.studio', password: 'Demo1234!', color: '#d97642', daysAgo: 160 },
];

const NEW_SIGNUPS = [
  { name: 'Elena Rossi', email: 'elena@studio-rossi.com', color: '#b05c4b', daysAgo: 2 },
  { name: 'Kofi Mensah', email: 'kofi@mensah.co', color: '#2f6b5b', daysAgo: 4 },
  { name: 'Hana Sato', email: 'hana@satostudio.jp', color: '#8b6cae', daysAgo: 7 },
  { name: 'Liam Byrne', email: 'liam@byrneandco.ie', color: '#b78b3f', daysAgo: 12 },
  { name: 'Amara Diallo', email: 'amara@diallo.design', color: '#5d6faf', daysAgo: 21 },
];

const DEMO_SITES = [
  { key: 'atelier', owner: 'maya', name: 'Atelier Noir', slug: 'atelier-noir', category: 'ecommerce', template: 'atelier-noir', status: 'published', plan: 'growth', domain: 'atelier-noir.com', daysAgo: 280, desc: 'Independent Parisian fashion house.' },
  { key: 'roast', owner: 'omar', name: 'Roast & Ritual', slug: 'roast-ritual', category: 'food', template: 'roast-ritual', status: 'published', plan: 'starter', domain: null, daysAgo: 190, desc: 'Neighborhood specialty coffee and bakery.' },
  { key: 'solace', owner: 'sofia', name: 'Solace', slug: 'solace-hotel', category: 'hospitality', template: 'solace-hotel', status: 'published', plan: 'growth', domain: 'solacehotel.com', daysAgo: 320, desc: 'Boutique hotel in the old town.' },
  { key: 'form', owner: 'jules', name: 'FORM', slug: 'form-strength', category: 'health-beauty', template: 'form-fitness', status: 'published', plan: 'starter', domain: null, daysAgo: 95, desc: 'Small-group strength coaching gym.' },
  { key: 'urban', owner: 'nina', name: 'Urban Nest', slug: 'urban-nest', category: 'real-estate', template: 'urban-nest', status: 'published', plan: 'growth', domain: null, daysAgo: 140, desc: 'Thoughtfully managed city rentals.' },
  { key: 'maison', owner: 'maya', name: 'Maison Élan', slug: 'maison-elan', category: 'fashion', template: 'maison-elan', status: 'draft', plan: 'starter', domain: null, daysAgo: 22, desc: 'A new luxury ready-to-wear label.' },
  { key: 'nimbus', owner: 'jules', name: 'Nimbus', slug: 'nimbus-demo', category: 'technology', template: 'nimbus', status: 'published', plan: 'scale', domain: 'nimbus-demo.com', daysAgo: 65, desc: 'Calm operations software for modern teams.' },
  { key: 'petal', owner: 'sofia', name: 'Petal & Stem', slug: 'petal-stem', category: 'services', template: 'petal-stem', status: 'published', plan: 'starter', domain: null, daysAgo: 48, desc: 'Seasonal floral studio and wedding flowers.' },
];

const CUSTOMER_NAMES = [
  ['Camille Roux', 'camille.roux@example.com', '+33 6 12 34 56 78'],
  ['Nadia Khan', 'nadia.khan@example.com', '+44 7700 900142'],
  ['Elena Rossi', 'elena.rossi@example.com', '+39 333 456 7890'],
  ['Tom Becker', 'tom.becker@example.com', '+49 151 2345678'],
  ['Amina Bello', 'amina.bello@example.com', '+234 803 456 7890'],
  ['Lucas Martin', 'lucas.martin@example.com', '+33 6 98 76 54 32'],
  ['Sofia Marín', 'sofia.marin@example.com', '+34 611 223 344'],
  ['Harriet Stone', 'harriet.stone@example.com', '+44 7700 900883'],
  ['Kenji Watanabe', 'kenji.w@example.com', '+81 90 1234 5678'],
  ['Priya Nair', 'priya.nair@example.com', '+91 98765 43210'],
];

function insertTemplates() {
  const upsert = db.prepare(`
    INSERT INTO templates (id, name, category, style, description, manifest, enabled, featured, uses)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?, 0)
    ON CONFLICT(id) DO UPDATE SET
      name=excluded.name, category=excluded.category, style=excluded.style,
      description=excluded.description, manifest=excluded.manifest
  `);
  for (const template of TEMPLATES) {
    upsert.run(template.id, template.name, template.category, template.style, template.description, JSON.stringify(template), template.featured ? 1 : 0);
  }
}

function updateSiteTimestamp(siteId, daysAgo) {
  const created = new Date(Date.now() - daysAgo * 86400000).toISOString();
  db.prepare('UPDATE sites SET created_at = ?, updated_at = ?, published_at = CASE WHEN status = ? THEN ? ELSE NULL END WHERE id = ?')
    .run(created, created, 'published', created, siteId);
}

function setPlan(siteId, plan, status = 'active') {
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.starter;
  const renews = new Date(Date.now() + 23 * 86400000).toISOString();
  db.prepare(`UPDATE subscriptions SET plan = ?, status = ?, ai_limit = ?, product_limit = ?, storage_limit_mb = ?, renews_at = ? WHERE site_id = ?`)
    .run(plan, status, limits.aiLimit, limits.productLimit, limits.storageLimitMb, renews, siteId);
}

function seedOrdersAndCustomers(site, index) {
  const items = db.prepare('SELECT * FROM items WHERE site_id = ? LIMIT 4').all(site.id);
  if (!items.length) return;
  const orders = [
    { status: 'completed', payment: 'paid', days: 2 + index },
    { status: 'processing', payment: 'paid', days: 5 + index },
    { status: 'shipped', payment: 'paid', days: 9 + index },
    { status: 'completed', payment: 'paid', days: 14 + index },
    { status: 'pending', payment: 'pending', days: 1 + index },
    { status: 'cancelled', payment: 'refunded', days: 22 + index },
  ];
  const count = index % 2 === 0 ? 6 : 5;
  for (let i = 0; i < count; i += 1) {
    const [name, email, phone] = CUSTOMER_NAMES[(index * 3 + i) % CUSTOMER_NAMES.length];
    const chosen = items.slice(i % items.length).slice(0, (i % 2) + 1);
    const lineItems = chosen.map((item) => ({
      id: item.id, name: item.name, price: item.price_cents / 100, quantity: 1 + (i % 2),
    }));
    const subtotal = Math.round(lineItems.reduce((sum, li) => sum + li.price * 100 * li.quantity, 0));
    const total = subtotal + (subtotal > 10000 ? 0 : 900);
    const orderId = id('ord');
    const when = dateOffset(-(orders[i].days));
    db.prepare(`
      INSERT INTO orders (id, site_id, number, customer_name, customer_email, items, subtotal_cents, shipping_cents, total_cents, status, payment_status, note, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(orderId, site.id, `NX-${1040 + index * 10 + i}`, name, email,
      JSON.stringify(lineItems), subtotal, total - subtotal, total, orders[i].status, orders[i].payment,
      i === 2 ? 'Please leave with the concierge.' : '', when);

    const existing = db.prepare('SELECT * FROM customers WHERE site_id = ? AND email = ?').get(site.id, email);
    if (existing) {
      if (!['cancelled', 'refunded'].includes(orders[i].status)) {
        db.prepare('UPDATE customers SET orders_count = orders_count + 1, total_spent_cents = total_spent_cents + ? WHERE id = ?')
          .run(total, existing.id);
      }
    } else {
      db.prepare(`
        INSERT INTO customers (id, site_id, name, email, phone, orders_count, total_spent_cents, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id('cust'), site.id, name, email, phone,
        ['cancelled', 'refunded'].includes(orders[i].status) ? 0 : 1,
        ['cancelled', 'refunded'].includes(orders[i].status) ? 0 : total, when);
    }
  }
}

function seedInquiriesAndLeads(site, index, count = 4) {
  const messagesByCategory = {
    food: ['We would love a table for four on Saturday evening.', 'Could you cater a small private dinner for twelve?', 'Do you have a gluten-free menu?', 'Can we bring a highchair?'],
    hospitality: ['We are looking at a long weekend in October — is the courtyard suite available?', 'Could you arrange airport transfers and a late checkout?', 'Is the hotel suitable for a small wedding party?', 'Do you allow dogs in the garden rooms?'],
    'health-beauty': ['I would like to book the signature treatment for next week.', 'Do you offer a consultation for sensitive skin?', 'Can I buy a gift voucher?', 'What is your cancellation policy?'],
    'real-estate': ['We would like to arrange a private viewing of the Glass House.', 'Could you provide a valuation for our apartment?', 'Are there any off-market properties coming up?', 'Do you manage furnished rentals?'],
    services: ['Can you quote for wedding flowers in June?', 'Do you deliver on Sundays?', 'I would like to set up a regular arrangement.', 'Could we discuss a workshop for our team?'],
    media: ['I would like to pitch a story for the next issue.', 'Do you offer annual subscriptions?', 'Can I stock your magazine in my shop?', 'How do I submit a correction?'],
    portfolio: ['We have a rebrand project starting in spring — are you taking new work?', 'Could we commission a series of photographs?', 'What is your typical project timeline?', 'Do you work with clients remotely?'],
    education: ['I would like to arrange a visit and tour of the school.', 'Are scholarships available?', 'When do applications close for next year?', 'Can we speak to a current parent?'],
    corporate: ['We need advice on a shareholder agreement.', 'Could we book an introductory call?', 'Do you work with founder-led companies?', 'What are your fees?'],
    technology: ['Does the platform support single sign-on?', 'Can we book a technical demo?', 'What is your data retention policy?', 'Do you offer annual billing?'],
    automotive: ['I would like to book a test drive this weekend.', 'Do you take trade-ins?', 'Can you send the full service history?', 'Is the car available to view today?'],
    ecommerce: ['I have a question about sizing before I order.', 'Can you help with an exchange?', 'Do you ship internationally?', 'Is this item coming back in stock?'],
    fashion: ['Could you advise on sizing for the wool coat?', 'Is the collection available to view in person?', 'Do you offer alterations?', 'When is the next drop?'],
  };
  const messages = messagesByCategory[site.category] || messagesByCategory.services;
  const types = ['booking', 'contact', 'contact', 'newsletter'];
  for (let i = 0; i < count; i += 1) {
    const [name, email, phone] = CUSTOMER_NAMES[(index * 4 + i + 5) % CUSTOMER_NAMES.length];
    const when = dateOffset(-(1 + i * 2 + index));
    const status = i < 2 ? 'new' : i === 2 ? 'read' : 'replied';
    const inquiryType = types[i % types.length];
    const message = inquiryType === 'newsletter' ? 'Please add me to your newsletter.' : messages[i % messages.length];
    db.prepare(`
      INSERT INTO inquiries (id, site_id, name, email, phone, message, type, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id('inq'), site.id, name, email, phone, message, inquiryType, status, when);

    const existing = db.prepare('SELECT id FROM customers WHERE site_id = ? AND email = ?').get(site.id, email);
    if (existing) {
      db.prepare('UPDATE customers SET name = ?, phone = COALESCE(NULLIF(?, \'\'), phone) WHERE id = ?').run(name, phone, existing.id);
    } else {
      db.prepare('INSERT INTO customers (id, site_id, name, email, phone, orders_count, total_spent_cents, created_at) VALUES (?, ?, ?, ?, ?, 0, 0, ?)')
        .run(id('cust'), site.id, name, email, phone, when);
    }
  }
}

function seedAiUsage(site, index) {
  const agents = ['business-analysis', 'template-recommendation', 'website-generation', 'product-content', 'design-assistant', 'seo', 'customer-support'];
  for (let i = 0; i < 5 + (index % 4); i += 1) {
    const agent = agents[i % agents.length];
    const when = dateOffset(-(1 + i * 3 + index));
    db.prepare(`
      INSERT INTO ai_usage (id, site_id, agent, action, input_chars, output_chars, model, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id('ai'), site.id, agent, agent === 'seo' ? 'seo-audit' : agent === 'design-assistant' ? 'design-suggestion' : 'generation',
      320 + i * 47, 640 + i * 93, 'nexora-local-v1', when);
  }
  const used = 8 + index * 5;
  db.prepare('UPDATE subscriptions SET ai_used = ? WHERE site_id = ?').run(used, site.id);
}

function seedActivity(site, ownerId, index) {
  const commerce = ['ecommerce', 'fashion', 'technology', 'automotive'].includes(site.category);
  const itemWord = { food: 'menu item', hospitality: 'room', 'health-beauty': 'treatment', services: 'service', 'real-estate': 'property', corporate: 'practice area', education: 'program', portfolio: 'project' }[site.category] || 'product';
  const actions = commerce ? [
    ['site.published', 'Published website to the web'],
    ['item.updated', 'Updated a product image and description'],
    ['order.status_changed', 'Moved an order to shipped'],
    ['template.applied', 'Explored the template marketplace'],
    ['seo.updated', 'Updated the SEO title and meta description'],
    ['media.uploaded', 'Uploaded new brand photography'],
  ] : [
    ['site.published', 'Published website to the web'],
    ['item.updated', `Updated a ${itemWord} and its photography`],
    ['inquiry.received', 'Received and replied to a new booking enquiry'],
    ['template.applied', 'Explored the template marketplace'],
    ['seo.updated', 'Updated the SEO title and meta description'],
    ['media.uploaded', 'Uploaded new brand photography'],
  ];
  for (let i = 0; i < actions.length; i += 1) {
    db.prepare('INSERT INTO activity (id, site_id, user_id, action, detail, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id('act'), site.id, ownerId, actions[i][0], actions[i][1], dateOffset(-(i + index + 1)));
  }
}

export function seedDatabase({ reset = false } = {}) {
  if (reset) {
    for (const table of ['ai_usage', 'activity', 'domains', 'media', 'site_views', 'inquiries', 'customers', 'orders', 'items', 'categories', 'subscriptions', 'sites', 'templates', 'users', 'platform_settings']) {
      db.exec(`DELETE FROM ${table};`);
    }
  }
  const existing = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
  if (existing > 0) return { seeded: false, reason: 'already-seeded' };

  tx(() => {
    insertTemplates();

    const users = {};
    const insertUser = db.prepare('INSERT INTO users (id, email, password_hash, name, role, avatar_color) VALUES (?, ?, ?, ?, ?, ?)');
    for (const owner of OWNERS) {
      const uid = id('usr');
      insertUser.run(uid, owner.email, hashPassword(owner.password), owner.name, 'owner', owner.color);
      db.prepare('UPDATE users SET created_at = ? WHERE id = ?').run(dateOffset(-owner.daysAgo), uid);
      users[owner.key] = uid;
    }
    for (const signup of NEW_SIGNUPS) {
      const uid = id('usr');
      insertUser.run(uid, signup.email, hashPassword('Demo1234!'), signup.name, 'owner', signup.color);
      db.prepare('UPDATE users SET created_at = ? WHERE id = ?').run(dateOffset(-signup.daysAgo), uid);
    }
    const adminId = id('usr');
    insertUser.run(adminId, env.SUPER_ADMIN_EMAIL, hashPassword(env.SUPER_ADMIN_PASSWORD), 'Nexora Platform Admin', 'admin', '#171412');
    db.prepare('UPDATE users SET created_at = ? WHERE id = ?').run(dateOffset(-420), adminId);

    const sites = {};
    DEMO_SITES.forEach((cfg, index) => {
      const site = createSite({
        ownerId: users[cfg.owner],
        name: cfg.name,
        category: cfg.category,
        templateId: cfg.template,
        description: cfg.desc,
        slug: cfg.slug,
        status: cfg.status,
      });
      updateSiteTimestamp(site.id, cfg.daysAgo);
      setPlan(site.id, cfg.plan);
      if (cfg.domain) {
        db.prepare('INSERT INTO domains (id, site_id, domain, status, ssl_status) VALUES (?, ?, ?, ?, ?)')
          .run(id('dom'), site.id, cfg.domain, 'verified', 'active');
        db.prepare('UPDATE sites SET custom_domain = ?, domain_status = ? WHERE id = ?').run(cfg.domain, 'verified', site.id);
      }
      const commerce = ['ecommerce', 'fashion', 'technology', 'automotive'].includes(cfg.category);
      if (commerce) seedOrdersAndCustomers(site, index);
      seedInquiriesAndLeads(site, index, commerce ? 2 : 4);
      seedAiUsage(site, index);
      seedActivity(site, users[cfg.owner], index);
      sites[cfg.key] = site;

      if (cfg.status === 'published') {
        for (let v = 0; v < 24; v += 1) {
          const day = v % 13;
          const when = dateOffset(-day);
          db.prepare('INSERT INTO site_views (id, site_id, path, referrer, created_at) VALUES (?, ?, ?, ?, ?)')
            .run(id('view'), site.id, '/', ['direct', 'instagram', 'google', 'newsletter'][v % 4], when);
        }
      }

      // A few extra library assets per site makes the media library feel lived-in.
      const extraImages = ['/images/natural.jpg', '/images/crafts.jpg', '/images/architecture.jpg'];
      extraImages.forEach((url, n) => {
        db.prepare('INSERT INTO media (id, site_id, name, url, mime, size, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
          .run(id('med'), site.id, url.split('/').pop(), url, 'image/jpeg', 150000 + n * 20000, dateOffset(-(n + 2)));
      });
    });

    // Dashboard metrics and marketplace usage.
    const usage = { 'atelier-noir': 12, 'roast-ritual': 6, 'solace-hotel': 9, 'form-fitness': 5, 'urban-nest': 7, 'nimbus': 16, 'petal-stem': 4, 'maison-elan': 2 };
    for (const t of TEMPLATES) {
      const count = usage[t.id] ?? (t.featured ? 5 : 2);
      db.prepare('UPDATE templates SET uses = ? WHERE id = ?').run(count, t.id);
    }

    const settings = [
      ['platform.name', 'Nexora Studio'],
      ['platform.tagline', 'Beautiful websites, intelligently made.'],
      ['ai.enabled', 'true'],
      ['ai.monthlyAllowance', '500'],
      ['ai.autoPublish', 'false'],
      ['support.email', 'support@nexora.studio'],
      ['templates.autoApprove', 'true'],
    ];
    const insertSetting = db.prepare('INSERT INTO platform_settings (key, value) VALUES (?, ?)');
    for (const [key, value] of settings) insertSetting.run(key, value);

    db.prepare('INSERT INTO activity (id, site_id, user_id, action, detail, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id('act'), null, adminId, 'platform.started', 'Platform initialized with 44 templates', new Date().toISOString());
  });

  return {
    seeded: true,
    owner: OWNERS[0].email,
    admin: env.SUPER_ADMIN_EMAIL,
    templates: TEMPLATES.length,
    categories: TEMPLATE_CATEGORIES.length,
  };
}

const isDirectRun = process.argv[1] && process.argv[1].endsWith('seed.js');
if (isDirectRun) {
  const reset = process.argv.includes('--reset');
  const result = seedDatabase({ reset });
  console.log(JSON.stringify(result, null, 2));
  if (!result.seeded) console.log('Database already contains users. Pass --reset to rebuild demo data.');
}
