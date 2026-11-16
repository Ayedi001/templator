import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, ArrowUpRight, Bot, Check, Globe2, Layers, MousePointer2,
  Palette, ShieldCheck, Sparkles, Star, Wand2, Zap,
} from 'lucide-react';
import { MarketingFooter, MarketingNav } from '../components/marketing/MarketingNav';
import { TemplateCard } from '../components/marketing/TemplateCard';
import { TemplateMockup } from '../components/TemplateMockup';
import { get } from '../lib/api';
import type { Template, TemplateCategory } from '../lib/types';

const FEATURES = [
  { icon: Layers, title: '13 industries, 64 distinct designs', desc: 'Every template is an original design system — not a recoloured copy. Find a starting point that already feels like your business.' },
  { icon: MousePointer2, title: 'Design without the learning curve', desc: 'Edit words, colours, fonts, imagery and sections in a live preview. No code, no page reloads, no surprises.' },
  { icon: Bot, title: 'Seven specialist AI agents', desc: 'Strategy, content, product copy, design and SEO — coordinated by one orchestrator that only runs the agents you need.' },
  { icon: Globe2, title: 'Publish in one click', desc: 'A unique address, custom domain support and secure tenant isolation, built in from the database up.' },
];

export function Landing() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [annual, setAnnual] = useState(true);

  useEffect(() => {
    get<{ templates: Template[] }>('/templates').then((data) => {
      setTemplates(data.templates);
    }).catch(() => undefined);
    get<{ categories: TemplateCategory[] }>('/templates/categories').then((data) => setCategories(data.categories)).catch(() => undefined);
  }, []);

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll('[data-reveal]'));
    if (!('IntersectionObserver' in window)) {
      elements.forEach((el) => el.classList.add('revealed'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px' });
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [templates.length]);

  const featured = templates.filter((t) => t.featured);
  const curated = (id: string, fallbackIndex: number) => templates.find((t) => t.id === id) || featured[fallbackIndex] || templates[fallbackIndex];
  const heroMain = curated('atelier-noir', 0);
  const heroSecond = curated('northstar-fintech', 1);
  const heroThird = curated('bitter-orange', 2);
  const visible = templates.filter((t) => activeCategory === 'all' || t.category === activeCategory).slice(0, 6);
  const popularCategories = categories.filter((c) => ['ecommerce', 'food', 'fashion', 'services', 'portfolio', 'hospitality', 'health-beauty', 'real-estate'].includes(c.id)).slice(0, 7);
  const totalTemplates = templates.length || 64;

  return (
    <div className="landing">
      <MarketingNav />
      <section className="hero">
        <div className="container">
          <div className="hero-grid">
            <div className="hero-copy">
              <div className="hero-badge"><b>New</b> {totalTemplates} studio-grade templates <span>·</span> AI included</div>
              <h1>Your next website, <em>beautifully</em> made.</h1>
              <p className="hero-sub">
                Start with a design that already understands your industry. Make it yours with a live editor and a team of specialist AI agents. Publish in one click.
              </p>
              <div className="hero-actions">
                <Link className="btn btn-accent btn-lg" to="/register">Build your website <ArrowRight size={16} /></Link>
                <Link className="btn btn-outline btn-lg" to="/templates">Explore templates <ArrowUpRight size={15} /></Link>
              </div>
              <div className="hero-proof">
                <div className="avatar-stack">
                  <span style={{ background: '#c46a3a' }}>ML</span>
                  <span style={{ background: '#2c5d4c' }}>OH</span>
                  <span style={{ background: '#6c4fa8' }}>SL</span>
                  <span style={{ background: '#b5623f' }}>JO</span>
                </div>
                <div className="proof-text">
                  <div className="stars">{[...Array(5)].map((_, i) => <Star key={i} size={11} fill="currentColor" />)}</div>
                  <span>Trusted by <b>2,400+</b> independent businesses</span>
                </div>
              </div>
            </div>
            <div className="hero-stage" aria-hidden={!heroMain}>
              {heroMain && heroSecond && heroThird && (
                <>
                  <div className="hero-main"><TemplateMockup template={heroMain} className="landing-mini" /></div>
                  <div className="hero-secondary"><TemplateMockup template={heroThird} className="landing-mini" /></div>
                  <div className="hero-float-pill"><i /> Published · {heroMain.id}.nexora.site</div>
                  <div className="hero-float-card">
                    <span className="hero-float-icon"><Sparkles size={16} /></span>
                    <div><b>AI copy is ready</b><small>3 agents collaborated · just now</small></div>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="hero-bottom">
            <span>Designed for every kind of business</span>
            <div className="logo-row">
              <b>Maison Élan</b><b>Northlane</b><b>Casa Palma</b><b>FORM</b><b>Signal</b>
            </div>
          </div>
        </div>
      </section>

      <div className="marquee-band">
        <div className="marquee-track">
          {[0, 1].map((group) => (
            <span key={group}>
              Fashion <i /> Coffee shops <i /> Design studios <i /> Hotels <i /> Real estate <i /> Gyms <i /> Bookshops <i /> Agencies <i /> Restaurants <i /> Education <i />
            </span>
          ))}
        </div>
      </div>

      <section className="section" id="features">
        <div className="container">
          <div className="section-head" data-reveal>
            <div className="eyebrow">Everything in one place</div>
            <h2>A website builder that takes your business <em>seriously.</em></h2>
            <p>Not a blank canvas and a hundred decisions. A thoughtful starting point, expert guidance and the freedom to make it unmistakably yours.</p>
          </div>
          <div className="feature-grid">
            <div className="feature-tile span-7 tile-builder" data-reveal>
              <div className="tile-builder-copy">
                <div className="tile-eyebrow"><Wand2 size={12} /> Visual builder</div>
                <h3>Change anything. Break nothing.</h3>
                <p>Typography, palette, sections, imagery and copy — every choice updates in the live preview beside you. The design system keeps it all coherent.</p>
              </div>
              <div className="builder-ui">
                <div className="builder-ui-top"><i /><i /><i /></div>
                <div className="builder-ui-body">
                  <div className="builder-tools"><i /><i /><i /><i /><i /></div>
                  <div className="builder-canvas"><b /><span /><span /><div className="bc-img" /><span style={{ width: '45%' }} /></div>
                </div>
              </div>
            </div>
            <div className="feature-tile span-5 lime" data-reveal>
              <div className="tile-eyebrow"><Layers size={12} /> Template library</div>
              <h3>One library. Real range.</h3>
              <p>Editorial fashion, streetwear, fine dining, SaaS, surf lodges, law firms. Every template has its own type, palette and layout logic.</p>
              <div className="template-count-big">{totalTemplates} <small>original templates across 13 industries</small></div>
              <div className="mini-cat-cloud">
                <span>E-commerce</span><span>Food</span><span>Portfolio</span><span>Hospitality</span><span>Health</span><span>Education</span>
              </div>
            </div>
            <div className="feature-tile span-5 dark" data-reveal>
              <div className="tile-eyebrow"><Bot size={12} /> Multi-agent AI</div>
              <h3>A team, not a text box.</h3>
              <p>Seven agents with defined jobs. The orchestrator picks only what your request needs, then checks the work before it reaches you.</p>
              <div className="agent-list">
                <div className="agent-pill"><i />Business Analysis<span>strategy</span></div>
                <div className="agent-pill"><i />Template Recommendation<span>design</span></div>
                <div className="agent-pill"><i />Website Generation<span>content</span></div>
                <div className="agent-pill"><i />SEO<span>visibility</span></div>
              </div>
            </div>
            <div className="feature-tile span-7 publish-tile accent" data-reveal>
              <div className="tile-eyebrow"><Globe2 size={12} /> Multi-tenant publishing</div>
              <h3>Every business gets its own front door.</h3>
              <p>Isolated products, orders, customers and settings. Independent websites. One platform that stays calm at scale.</p>
              <div className="publish-url"><i /> atelier-noir.nexora.studio <span style={{ marginLeft: 'auto', opacity: .55 }}>Live</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 20 }}>
        <div className="container">
          <div className="section-topline" data-reveal>
            <div className="section-head">
              <div className="eyebrow">The collection</div>
              <h2>Start with a design<br />that <em>gets it.</em></h2>
            </div>
            <Link to="/templates" className="text-link">Browse all {totalTemplates} <ArrowUpRight size={14} /></Link>
          </div>
          <div className="template-tabs" data-reveal>
            <button className={`chip ${activeCategory === 'all' ? 'active' : ''}`} onClick={() => setActiveCategory('all')}>All designs</button>
            {popularCategories.map((cat) => (
              <button key={cat.id} className={`chip ${activeCategory === cat.id ? 'active' : ''}`} onClick={() => setActiveCategory(cat.id)}>{cat.name} <span className="chip-count">{cat.count}</span></button>
            ))}
          </div>
          <div className="home-template-grid">
            {visible.length === 0 && [0, 1, 2].map((i) => <div className="skeleton" style={{ aspectRatio: '4/3.3', borderRadius: 18 }} key={i} />)}
            {visible.map((template) => <TemplateCard key={template.id} template={template} featuredLabel />)}
          </div>
          <div className="text-center mt-32">
            <Link to="/templates" className="btn btn-outline">Explore the full marketplace <ArrowRight size={15} /></Link>
          </div>
        </div>
      </section>

      <section className="section ai-section" id="ai">
        <div className="container">
          <div className="ai-grid">
            <div data-reveal>
              <div className="eyebrow">Nexora Intelligence</div>
              <div className="section-head" style={{ marginBottom: 0 }}>
                <h2>Specialists, working<br /><em>together.</em></h2>
                <p>Most AI tools hand you a generic paragraph. Nexora runs an orchestrated team: a strategist, a designer, a copywriter, a product editor, an SEO specialist and a support guide. Only the relevant agents run, and you approve every change.</p>
              </div>
              <div className="ai-feature-list">
                <div className="ai-feature"><span className="ai-feature-num">01</span><div><h4>Context, not guesswork</h4><p>Agents work from your real business details, catalogue and current design — not a blank prompt.</p></div></div>
                <div className="ai-feature"><span className="ai-feature-num">02</span><div><h4>One orchestrator</h4><p>A central router understands intent, selects the right specialists and validates their output.</p></div></div>
                <div className="ai-feature"><span className="ai-feature-num">03</span><div><h4>You stay in control</h4><p>Every suggestion is optional. Apply a palette, rewrite a title or leave it — nothing changes without you.</p></div></div>
              </div>
            </div>
            <div className="ai-chat-demo" data-reveal>
              <div className="ai-chat-inner">
                <div className="ai-chat-head"><span className="orb" /><b>Nexora Orchestrator</b><span>4 agents online</span></div>
                <div className="ai-chat-body">
                  <div className="ai-msg user">I want the site to feel warmer and more editorial. Also improve our product descriptions.</div>
                  <div className="ai-agent-row"><span className="ai-agent-chip"><i />Design Assistant</span><span className="ai-agent-chip"><i />Product Content</span></div>
                  <div className="ai-msg agent">
                    <b>Design Assistant</b><br />
                    I'd move the palette toward <b>Warm editorial</b> — cream, espresso and terracotta. It keeps your current layout while making the photography feel intentional. I've prepared three options.
                  </div>
                  <div className="ai-msg agent">
                    <b>Product Content</b><br />
                    Rewritten 12 product descriptions with specific materials and provenance. The first three are ready for your review — no changes applied yet.
                  </div>
                  <div className="ai-agent-row"><span className="ai-agent-chip"><i />Validated</span><span className="ai-agent-chip">1.8s</span><span className="ai-agent-chip">2 of 7 agents used</span></div>
                </div>
                <div className="ai-chat-input"><span>Ask for a change, a rewrite or a second opinion…</span><b><ArrowRight size={13} /></b></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section dash-showcase">
        <div className="container">
          <div className="section-head center" data-reveal>
            <div className="eyebrow">One calm dashboard</div>
            <h2>Run the whole business,<br />not just the <em>website.</em></h2>
            <p>Products, orders, customers, messages, media, SEO and billing — shaped around the type of business you run.</p>
          </div>
          <div className="dash-frame" data-reveal>
            <div className="dash-frame-bar"><i /><i /><i /><span>atelier-noir.nexora.studio/dashboard</span></div>
            <div className="dash-frame-inner">
              <div className="dash-frame-side">
                <div className="dash-side-logo"><i /> Nexora Studio</div>
                <div className="dash-side-nav">
                  <span className="active"><i />Overview</span><span><i />Atelier Noir</span><span><i />Catalogue</span><span><i />Orders</span><span><i />Customers</span><span><i />Media</span><span><i />Design studio</span><span><i />SEO</span><span><i />AI Studio</span>
                </div>
              </div>
              <div className="dash-main">
                <div className="dash-main-head">
                  <div><h4>Good morning, Maya.</h4><p>Here is how Atelier Noir is doing this week.</p></div>
                  <b>Preview site</b>
                </div>
                <div className="dash-stat-row">
                  <div className="dash-stat"><small>Revenue</small><b>$12,840</b><em>↑ 18.2%</em></div>
                  <div className="dash-stat"><small>Orders</small><b>64</b><em>↑ 9.1%</em></div>
                  <div className="dash-stat"><small>Visitors</small><b>3,280</b><em>↑ 24.6%</em></div>
                  <div className="dash-stat"><small>Conversion</small><b>1.95%</b><em>↑ 0.4%</em></div>
                </div>
                <div className="dash-grid-main">
                  <div className="dash-chart">
                    <h5>Revenue overview</h5><p>Last 14 days</p>
                    <svg viewBox="0 0 300 100" preserveAspectRatio="none">
                      <defs><linearGradient id="dashFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e8613a" stopOpacity=".25" /><stop offset="100%" stopColor="#e8613a" stopOpacity="0" /></linearGradient></defs>
                      <path d="M0 80 C30 78 40 58 70 62 S110 72 140 48 S190 30 220 42 S260 18 300 24 L300 100 L0 100Z" fill="url(#dashFill)" />
                      <path d="M0 80 C30 78 40 58 70 62 S110 72 140 48 S190 30 220 42 S260 18 300 24" fill="none" stroke="#e8613a" strokeWidth="2" />
                    </svg>
                  </div>
                  <div className="dash-mini-list">
                    <h5>Recent orders</h5>
                    <div className="dash-mini-row"><i /><span>Camille R. · Margaux Coat</span><b>$690</b></div>
                    <div className="dash-mini-row"><i /><span>Nadia K. · Silk Column Dress</span><b>$420</b></div>
                    <div className="dash-mini-row"><i /><span>Elena R. · Leather Mini Bag</span><b>$360</b></div>
                    <div className="dash-mini-row"><i /><span>Tom B. · Noir Trouser</span><b>$280</b></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head center" data-reveal>
            <div className="eyebrow">Built for real businesses</div>
            <h2>Less time maintaining.<br />More time <em>making.</em></h2>
          </div>
          <div className="quote-band">
            <div className="quote-card" data-reveal>
              <blockquote>I launched our new store in a weekend. It looks like an agency built it, and I can change anything myself.</blockquote>
              <div className="quote-author"><span className="quote-avatar">CR</span><div><b>Camille Roux</b><small>Atelier Noir · Paris</small></div></div>
            </div>
            <div className="quote-card" data-reveal>
              <blockquote>The AI wrote a homepage that actually sounds like our cafe. I only changed two sentences.</blockquote>
              <div className="quote-author"><span className="quote-avatar">OH</span><div><b>Omar Haddad</b><small>Roast & Ritual · London</small></div></div>
            </div>
            <div className="quote-card" data-reveal>
              <blockquote>Our bookings are up 38%. The site feels like the hotel — calm, considered and quietly confident.</blockquote>
              <div className="quote-author"><span className="quote-avatar">SL</span><div><b>Sofia Lindqvist</b><small>Solace · Copenhagen</small></div></div>
            </div>
          </div>
        </div>
      </section>

      <section className="section pricing-section" id="pricing">
        <div className="container">
          <div className="section-head center" data-reveal>
            <div className="eyebrow">Simple pricing</div>
            <h2>Start small. <em>Grow well.</em></h2>
            <p>Every plan includes the template library, the visual editor, publishing and your own isolated workspace. No setup fees. Cancel any time.</p>
          </div>
          <div className="pricing-toggle">
            <div className="segmented">
              <button className={!annual ? 'active' : ''} onClick={() => setAnnual(false)}>Monthly</button>
              <button className={annual ? 'active' : ''} onClick={() => setAnnual(true)}>Annual · save 20%</button>
            </div>
          </div>
          <div className="price-grid">
            {[
              { name: 'Starter', desc: 'For your first website.', price: 19, features: ['1 website', '25 catalogue items', '50 AI actions / month', 'Nexora subdomain', 'Standard support'], cta: 'Start free' },
              { name: 'Growth', desc: 'For a growing business.', price: 49, features: ['3 websites', '250 catalogue items', '500 AI actions / month', 'Custom domain + SSL', 'Advanced SEO tools', 'Priority support'], cta: 'Start free', featured: true },
              { name: 'Scale', desc: 'For multiple brands.', price: 99, features: ['10 websites', 'Unlimited catalogue items', '2,500 AI actions / month', 'Multiple custom domains', 'AI usage analytics', 'Dedicated support'], cta: 'Start free' },
            ].map((plan) => (
              <div className={`price-card ${plan.featured ? 'featured' : ''}`} key={plan.name} data-reveal>
                {plan.featured && <span className="price-badge">Most popular</span>}
                <div className="price-name">{plan.name}</div>
                <p className="price-desc">{plan.desc}</p>
                <div className="price-amount">
                  <b>${annual ? Math.round(plan.price * 0.8) : plan.price}</b><span>/ month{annual ? ', billed yearly' : ''}</span>
                </div>
                <ul className="price-features">
                  {plan.features.map((feature) => <li key={feature}><Check size={13} />{feature}</li>)}
                </ul>
                <Link className={`btn ${plan.featured ? 'btn-accent' : 'btn-outline'} btn-block`} to="/register">{plan.cta} <ArrowRight size={14} /></Link>
              </div>
            ))}
          </div>
          <p className="pricing-note">All plans start with a 14-day free trial. No credit card required.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="cta-band" data-reveal>
            <h2>Your best website<br />starts <em>here.</em></h2>
            <p>Pick a design, add your story and publish something you are genuinely proud of. It takes less time than you think.</p>
            <div className="flex-center gap-10" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link className="btn btn-light btn-lg" to="/register">Create your website <ArrowRight size={16} /></Link>
              <Link className="btn btn-lg" style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,.32)' }} to="/templates">Browse templates</Link>
            </div>
            <div className="hero-proof">
              <div className="stars" style={{ color: '#fff' }}>{[...Array(5)].map((_, i) => <Star key={i} size={11} fill="currentColor" />)}</div>
              <span><b>4.9/5</b> from 2,400+ business owners · No credit card required</span>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
