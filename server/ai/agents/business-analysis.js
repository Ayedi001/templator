import { generate, aiConfigured } from '../provider.js';
import { TEMPLATE_CATEGORIES } from '../../templates/catalog.js';

const TONE_WORDS = [
  { tone: 'luxurious and editorial', words: ['luxury', 'premium', 'elegant', 'bespoke', 'atelier', 'fine'] },
  { tone: 'warm and personal', words: ['family', 'neighborhood', 'friendly', 'home', 'local', 'cozy'] },
  { tone: 'bold and energetic', words: ['bold', 'fast', 'performance', 'street', 'gym', 'drop', 'loud'] },
  { tone: 'calm and trustworthy', words: ['care', 'clinic', 'legal', 'financial', 'professional', 'trusted'] },
  { tone: 'curious and considered', words: ['studio', 'design', 'craft', 'editorial', 'independent', 'slow'] },
];

const VERTICAL_SECTIONS = {
  products: ['Hero with product visual', 'Featured collection', 'Brand story', 'Product grid', 'Reviews', 'Newsletter'],
  menu: ['Hero with atmosphere', 'Menu highlights', 'Our story', 'Full menu', 'Opening hours & map', 'Reservation CTA'],
  services: ['Hero with promise', 'Services & pricing', 'About the team', 'Process', 'Testimonials', 'Booking form'],
  articles: ['Masthead & latest story', 'Featured stories', 'Categories', 'Author spotlight', 'Newsletter subscribe'],
  projects: ['Statement hero', 'Selected work', 'About the practice', 'Process', 'Press & recognition', 'Contact'],
  properties: ['Hero with featured property', 'Property search', 'Featured listings', 'About the agency', 'Neighborhood guides', 'Valuation CTA'],
  rooms: ['Cinematic hero', 'Rooms & suites', 'Amenities', 'Dining', 'Local guide', 'Availability / booking'],
  courses: ['Outcome-led hero', 'Programs', 'Curriculum & outcomes', 'Instructors', 'Student stories', 'Enrol CTA'],
};

export const businessAnalysisAgent = {
  id: 'business-analysis',
  name: 'Business Analysis Agent',
  description: 'Understands the business, audience and required website architecture.',
  capabilities: ['business analysis', 'audience', 'website sections', 'positioning'],

  local({ name = 'Your business', category = '', description = '' }) {
    const cat = TEMPLATE_CATEGORIES.find((c) => c.id === category);
    const vertical = cat?.vertical || 'products';
    const text = `${description} ${name}`.toLowerCase();
    const tone = TONE_WORDS.find((entry) => entry.words.some((word) => text.includes(word)))?.tone
      || (vertical === 'menu' ? 'warm and inviting' : vertical === 'courses' ? 'encouraging and clear' : 'confident and modern');
    const sections = (VERTICAL_SECTIONS[vertical] || VERTICAL_SECTIONS.products).map((title, index) => ({
      title,
      reason: index === 0 ? 'First impressions: communicate the offer and personality immediately.' : 'Supports the buying journey with proof and a clear next step.',
      priority: index < 3 ? 'essential' : 'recommended',
    }));
    const words = description.split(/[.,]/).map((s) => s.trim()).filter(Boolean);
    const audience = `People actively looking for ${cat?.name?.toLowerCase() || 'a business like yours'}, plus local customers who value a clear, trustworthy online presence.`;
    const summary = `${name} is a ${cat?.name?.toLowerCase() || 'modern'} business. The site should lead with a specific promise, show the human side of the business, and make the primary action obvious on every screen.`;
    const positioning = words[0] ? `${words[0].charAt(0).toUpperCase()}${words[0].slice(1)}.` : `A ${tone} ${cat?.name?.toLowerCase() || 'business'} experience.`;
    return {
      summary, audience, tone, positioning, vertical,
      sections,
      features: [
        vertical === 'menu' ? 'Menu management with categories and prices' : vertical === 'articles' ? 'Long-form article publishing with authors' : vertical === 'rooms' ? 'Room listings with availability' : vertical === 'properties' ? 'Property listings with search' : 'Catalogue management with categories',
        'Mobile-first responsive design',
        'Contact / lead capture',
        'SEO controls and structured metadata',
        vertical === 'products' ? 'Secure checkout and order management' :'Online booking or enquiry form',
      ],
      keywords: [name.toLowerCase(), ...(cat?.name ? [cat.name.toLowerCase()] : []), ...(description.toLowerCase().match(/[a-z]{4,}/g) || []).slice(0, 6)],
      recommendation: 'Start with a strong editorial template, then replace the demo content with specifics: names, places, prices and proof.',
    };
  },

  async run(ctx) {
    const local = this.local(ctx);
    if (!aiConfigured()) return { agent: this.id, ...local, model: 'nexora-local-v1' };
    const result = await generate({
      system: 'You are a senior brand strategist for a website builder. Return concise, specific JSON only. Never use clichés or invent awards or credentials.',
      prompt: `Analyse this business for a website project. Return JSON with keys summary, audience, tone, positioning, sections (array of {title, reason, priority}), features (array of 4 strings), keywords (array of 6 strings), recommendation. Business: ${JSON.stringify(ctx)}`,
      json: true,
    });
    if (!result) return { agent: this.id, ...local, model: 'nexora-local-v1' };
    return { agent: this.id, ...local, ...result, model: 'ai-provider' };
  },
};

export default businessAnalysisAgent;
