import { generate, aiConfigured } from '../provider.js';
import { TEMPLATE_CATEGORIES } from '../../templates/catalog.js';

const HEADLINES = {
  products: ['Made for the way you live.', 'Fewer things. Better chosen.', 'The details make the difference.'],
  menu: ['A table worth lingering at.', 'Made fresh. Poured with care.', 'Come hungry. Leave happy.'],
  services: ['Expertise you can count on.', 'Good work, done properly.', 'Care that shows in the details.'],
  articles: ['Stories worth your attention.', 'Slow down. Read something good.', 'Independent stories, carefully told.'],
  projects: ['Work with a point of view.', 'Ideas made visible.', 'Selected work, considered.'],
  properties: ['A place to begin again.', 'Find the one that feels right.', 'Some places just feel like home.'],
  rooms: ['Stay a little longer.', 'Arrive as a guest. Leave as a regular.', 'Room to breathe.'],
  courses: ['Learn something that changes things.', 'Skills for the work ahead.', 'Start curious. Finish capable.'],
};

const FEATURES = {
  products: [['Chosen with care', 'A considered selection, tested by people who use it.'], ['Built to last', 'Quality materials and details that hold up over time.'], ['Easy returns', 'Thirty days to change your mind, no questions asked.']],
  menu: [['Made from scratch', 'Fresh ingredients, prepared in-house every day.'], ['Local sourcing', 'We work with growers and makers close to home.'], ['Warm welcome', 'A room that feels like it was made for you.']],
  services: [['Straightforward pricing', 'Clear quotes, no surprises.'], ['Experienced team', 'Specialists who have done this before.'], ['On your schedule', 'Flexible appointments that fit around real life.']],
  articles: [['Independent', 'Reader-supported and editorially free.'], ['In depth', 'Long reads with room for nuance.'], ['New voices', 'Writing you will not find anywhere else.']],
  projects: [['Strategy first', 'Every decision starts with the problem.'], ['Craft in the details', 'Considered typography, motion and code.'], ['Built to last', 'Work that stays relevant beyond the launch.']],
  properties: [['Local knowledge', 'We know the streets, not just the listings.'], ['Personal service', 'One point of contact from viewing to keys.'], ['Honest advice', 'The right move, not the quick sale.']],
  rooms: [['Direct rates', 'The best price when you book with us.'], ['Thoughtful details', 'Comfort that has been considered.'], ['A sense of place', 'Local recommendations from people who live here.']],
  courses: [['Learn by doing', 'Real projects, feedback and practice.'], ['Expert guidance', 'Taught by people doing the work.'], ['Supportive cohort', 'Learn alongside people on the same path.']],
};

function sentenceCase(text = '') {
  const trimmed = text.trim().replace(/\s+/g, ' ');
  return trimmed ? trimmed.charAt(0).toUpperCase() + trimmed.slice(1) : trimmed;
}

export const websiteGenerationAgent = {
  id: 'website-generation',
  name: 'Website Generation Agent',
  description: 'Generates homepage, about, contact and SEO content tailored to the business.',
  capabilities: ['content generation', 'homepage copy', 'about page', 'service descriptions'],

  local({ site = {}, name = '', category = '', description = '', brief = '', tone = '' }) {
    const cat = TEMPLATE_CATEGORIES.find((c) => c.id === (category || site.category));
    const vertical = cat?.vertical || 'products';
    const businessName = name || site.name || 'Your business';
    const source = brief || description || site.description || '';
    const existing = site.content || {};
    const hero = existing.hero || {};
    const variations = HEADLINES[vertical] || HEADLINES.products;
    const index = Math.abs(businessName.length) % variations.length;
    const defaultHeadline = variations[index];
    const focus = source.split(/[.!?]/)[0]?.trim();
    const headline = brief && brief.length < 120 && brief.split(' ').length < 14
      ? sentenceCase(brief)
      : focus && focus.split(' ').length >= 4
        ? `${focus}.`
        : defaultHeadline;
    const words = headline.replace(/[.!?]$/, '').split(' ');
    const highlight = words.slice(-2).join(' ');
    const featureSet = FEATURES[vertical] || FEATURES.products;
    const aboutLead = source || `${businessName} is an independent ${cat?.name?.toLowerCase() || 'business'} with a simple promise: do good work for people who care about the details.`;
    return {
      content: {
        hero: {
          eyebrow: `${cat?.name || 'Modern business'} · ${new Date().getFullYear()}`,
          headline,
          highlight,
          subheadline: `${aboutLead.replace(/\.$/, '')}. ${tone === 'playful' ? 'Come see what we mean.' : 'Discover the difference for yourself.'}`.slice(0, 240),
          primaryCta: hero.primaryCta || 'Get started',
          secondaryCta: hero.secondaryCta || 'Our story',
        },
        about: {
          title: `Why ${businessName}?`,
          body: `${aboutLead.replace(/\.$/, '')}. We believe the best businesses are built on specifics: good materials, honest advice and people who actually care. That is what you will find here.`,
          features: featureSet.map(([title, body]) => ({ title, body })),
        },
        meta: {
          title: `${businessName} — ${cat?.name || 'Independent business'}`,
          description: `${businessName}: ${source || 'a considered, independent business worth knowing.'}`.slice(0, 158),
        },
      },
      rationale: `Led with a specific promise, supported it with three proof-led benefits, and kept the language human. The ${vertical === 'products' ? 'product-first' : vertical === 'menu' ? 'menu-led' : vertical === 'articles' ? 'editorial' : 'service-led'} structure matches how your customers decide.`,
      suggestions: [
        'Add one real customer quote to build trust.',
        'Use your own photography for the hero image.',
        'Keep the primary button label focused on one action.',
      ],
    };
  },

  async run(ctx) {
    const local = this.local(ctx);
    if (!aiConfigured()) return { agent: this.id, ...local, model: 'nexora-local-v1' };
    const result = await generate({
      system: 'You are a senior website copywriter. Write specific, warm, premium copy. No clichés, no invented facts, no fake testimonials. Return JSON only.',
      prompt: `Generate website copy for this business. Return JSON {content:{hero:{eyebrow,headline,highlight,subheadline,primaryCta,secondaryCta},about:{title,body,features:[{title,body}]},meta:{title,description}},rationale,suggestions:[string]}. Business: ${JSON.stringify({ name: ctx.name, category: ctx.category, description: ctx.description, brief: ctx.brief, tone: ctx.tone })}. Existing copy for reference: ${JSON.stringify(ctx.site?.content || {})}.`,
      json: true,
    });
    if (!result?.content?.hero) return { agent: this.id, ...local, model: 'nexora-local-v1' };
    return { agent: this.id, ...local, content: { ...local.content, ...result.content, hero: { ...local.content.hero, ...result.content.hero }, about: { ...local.content.about, ...result.content.about }, meta: { ...local.content.meta, ...result.content.meta } }, rationale: result.rationale || local.rationale, suggestions: result.suggestions || local.suggestions, model: 'ai-provider' };
  },
};

export default websiteGenerationAgent;
