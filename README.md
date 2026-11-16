# Nexora Studio

A working, multi-tenant AI website-builder SaaS: 64 original industry templates, a visual design studio with live preview, tenant-isolated commerce/content dashboards, one-click publishing, seven specialist AI agents, subscription limits and a platform super-admin.

> **Live local app:** `http://127.0.0.1:4100` (after `npm run build && npm start`)

---

## What is included

### Template marketplace
- **64 distinct, original templates across 13 categories** — e-commerce, food & restaurants, fashion, technology, health & beauty, services, corporate, media & publishing, portfolio, real estate, hospitality, education and automotive.
- Every template has its own palette, type pairing, layout archetype, hero pattern, navigation style and card treatment. They are data-driven but not recolours of a single page.
- Full interactive previews with desktop/tablet/mobile toggles before selection.
- Industry-aware content model: products, menus, services, stories, projects, properties, rooms or programs.
- Local demo photography included in `client/public/images`.

### Authentication & tenancy
- JWT authentication, bcrypt password hashing and rate-limited auth endpoints.
- One platform administrator and unlimited independent business owners.
- **Server-enforced tenant isolation** — every dashboard query is scoped to the authenticated owner's site, not just filtered in the UI.
- Role-based access control, account suspension, password changes and subscription-gated publishing.
- Independent websites at `/site/:slug` with optional password protection.

### Website builder
- Guided onboarding: business details → AI analysis → template recommendations → address → create/publish.
- Visual **Design studio** with a live, interactive preview at desktop/tablet/mobile widths.
- Edit logo, announcement, palette, fonts, radius, layout, navigation labels, section order/visibility, hero, about, contact, hours, testimonials and footer copy.
- Unsaved-change guarding, template restoration, media picking and image uploads.
- Apply a new template without losing catalogue or content.

### Business dashboard
- Overview with real revenue/visitor metrics, chart, recent orders/enquiries, activity and setup checklist.
- Industry-adaptive labels and features (Products, Menu, Rooms, Properties, Stories, Programs, Services…).
- Catalogue CRUD, categories, multiple images, stock, discounts, featured items, draft/active/archived states.
- Orders (commerce tenants) with status workflow and CSV export.
- Customers, inbox for contact/booking/newsletter enquiries, media library.
- SEO studio with Google preview, metadata editor and AI audit.
- Domain management (plan-gated), publishing controls, social/contact settings and danger zone.
- Plan comparison, usage bars, plan changes and cancellation.
- AI Studio with assistant chat and focused workflows for content, products, design, SEO and support.

### AI architecture
Seven separate agents, a central orchestrator and deterministic local fallbacks:

| Agent | Responsibility |
|---|---|
| Business Analysis | Audience, positioning, required sections/functionality |
| Template Recommendation | Match designs, explain rationale, recommend palettes/layout |
| Website Generation | Hero, About, SEO and supporting homepage copy |
| Product & Content | Product titles, descriptions, tags, categories, SEO copy |
| Design Assistant | Palettes, fonts, layout and section guidance |
| SEO | Metadata, keywords, content audit, issues, structured data |
| Customer Support | Platform guidance and step-by-step help |

The orchestrator classifies intent, invokes **only** the agents that request needs, validates their structured output and composes one reply. Generated changes are never auto-published. Add an OpenAI-compatible API key to enable hybrid provider mode; without one every agent still works locally.

### Super-admin
- Platform overview: businesses, websites, MRR, GMV, AI calls.
- Manage/suspend business accounts.
- Moderate/suspend/delete websites.
- Add, edit, feature, hide and delete templates.
- Manage plans and subscription status.
- Enable/disable individual AI agents and change monthly AI allowances per plan.
- Analytics, complete activity audit trail and platform settings.

---

## Quick start

Requirements: **Node.js 22+** (this project uses the built-in `node:sqlite`, so no native database build step).

```powershell
cd C:\Users\marwe\Desktop\templates-deepseek
npm install
npm run seed -- --reset     # optional: rebuild demo data
npm run build
npm start
```

Open **http://127.0.0.1:4100**.

For live development (API + Vite):

```powershell
npm run dev
# app: http://127.0.0.1:5174
# API: http://127.0.0.1:4100
```

Copy `.env.example` to `.env` before changing configuration.

### Demo accounts

| Role | Email | Password |
|---|---|---|
| Business owner (Maya — Atelier Noir / Maison Élan) | `maya@nexora.studio` | `Demo1234!` |
| Business owner (Omar — Roast & Ritual) | `omar@nexora.studio` | `Demo1234!` |
| Business owner (Sofia — Solace / Petal & Stem) | `sofia@nexora.studio` | `Demo1234!` |
| Platform super-admin | `admin@nexora.studio` | `Platform123!` |

All seeded owners use `Demo1234!`. The demo includes published sites for Atelier Noir, Roast & Ritual, Solace, FORM, Urban Nest, Nimbus and Petal & Stem.

---

## Architecture

```
server/
  index.js                 Express app, security middleware, static hosting
  db.js                    node:sqlite schema + connection
  seed.js                  deterministic demo dataset
  middleware/auth.js       JWT auth, role checks, tenant loading
  routes/
    auth.js                register / login / profile / password
    sites.js               sites, publish, design, settings, domains, overview
    content.js             items, categories, orders, customers, inbox, media
    public.js              published sites, orders, enquiries, analytics
    templates.js           marketplace API
    ai.js                  agent endpoints + orchestrator chat
    admin.js               super-admin API
    billing.js             plans, usage and subscription changes
  ai/
    provider.js            optional OpenAI-compatible provider
    orchestrator.js        intent routing + validation + composition
    agents/*.js            seven independently maintainable agents
  services/sites.js        site creation, template lookup, plan limits
  templates/catalog.js     the 44-template core catalog
templates/expanded.js    the 20-template expansion collection

client/
  src/components/SiteRenderer.tsx     shared published-site + preview renderer
  src/components/TemplateMockup.tsx   data-driven marketplace thumbnails
  src/components/dashboard/           tenant shell and live design studio
  src/pages/dashboard/                tenant features
  src/pages/admin/                    super-admin features
  src/pages/…                         marketing, auth, onboarding, published sites
  src/styles/                         design system + responsive site CSS

data/
  nexora.db                SQLite database (WAL, foreign keys on)
  uploads/                 tenant-uploaded media
```

### Data isolation
Every tenant route resolves the site through `loadSite`, verifies `site.owner_id === req.user.id` (unless super-admin), then scopes every SQL statement by `site_id`. Cross-tenant access is covered by the smoke test.

### Publishing
Publishing sets `status = published`; the public API resolves only published sites. A website is available at:

```
/site/<slug>
```

The dashboard displays `<slug>.nexora.studio`. Custom domains are stored per site, plan-gated and verified through a demo DNS check; production would replace that with asynchronous DNS + TLS provisioning. The built-in subdomain path works end-to-end locally.

### Commerce
Live storefronts include item detail, stock awareness, cart, quantity management, checkout and server-side price/stock validation. Orders, customers and order status updates flow into the tenant dashboard.

### Storage limits
Plan limits are enforced server-side for websites, catalogue items, AI actions, custom domains and media storage.

---

## AI provider configuration

```env
AI_ENABLED=true
AI_API_KEY=your-key
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
```

Any OpenAI-compatible `/chat/completions` endpoint works. Secrets stay server-side. If the provider fails or is absent, the agents fall back to their local deterministic implementations.

Platform admins can disable individual agents and set plan-level monthly AI limits in **/admin/ai**.

---

## Testing

Start the server first, then:

```powershell
npm run test:smoke       # 43 API assertions: auth, tenant isolation, AI, orders, SEO, publishing, admin
npm run test:templates   # renders all 64 template previews + all published demo sites
npm run test:ui          # Playwright: login, SEO, CRUD, design save, AI chat, checkout, onboarding, admin
npm run test:catalog     # validates template count, unique IDs, categories and image references
```

Browser tests use the local Chrome installation via `playwright-core`. Screenshots are written to `.shots/`.

### Verified flows
- Owner registration → AI analysis → template choice → publish → live website
- Cross-tenant access returns `403`; super-admin routes reject owners
- Product creation, stock checks, storefront cart/checkout and dashboard order
- Design studio save/reload persistence
- SEO audit, content generation, product copy, design suggestions and support
- AI orchestration chooses the correct specialist(s)
- Template create/disable/delete in the super-admin dashboard
- All 64 templates and every seeded published site render without page errors

---

## Production checklist
- Set a strong `JWT_SECRET`; rotate seeded demo passwords.
- Use a managed database (or keep SQLite with backups) and object storage/CDN for uploads.
- Put the API behind TLS and a reverse proxy; configure `FRONTEND_URL`/CORS.
- Add a real payment provider and webhook handling for subscriptions.
- Replace simulated domain verification with DNS + ACME automation.
- Add email delivery for order confirmations and enquiries.
- Replace demo photography with licensed brand photography.
- Add backups, monitoring, structured logs and CI.

Template designs and copy in this project are original. Demo photography is sourced from Unsplash and is included for development/demo purposes.
