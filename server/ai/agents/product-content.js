import { generate, aiConfigured } from '../provider.js';

const DESCRIPTION_OPENERS = [
  'Made for everyday use and built to last',
  'A considered addition to your collection',
  'Quietly excellent in all the ways that matter',
  'Designed with intention, finished by hand',
  'An easy favourite, made properly',
];

const CATEGORY_TAGS = {
  coffee: ['specialty coffee', 'single origin', 'cafe'], food: ['seasonal', 'house-made', 'fresh'],
  fashion: ['considered', 'quality', 'everyday'], shoes: ['comfort', 'craft', 'everyday'],
  jewelry: ['solid gold', 'handmade', 'heirloom'], electronics: ['performance', 'design', 'setup'],
  beauty: ['skin health', 'ritual', 'expert'], gym: ['strength', 'coaching', 'community'],
  hotel: ['stay', 'design', 'local'], travel: ['journey', 'small group', 'local'],
  real: ['home', 'architecture', 'location'], books: ['reading', 'independent', 'curated'],
  education: ['learning', 'practical', 'expert-led'], auto: ['performance', 'care', 'precision'],
};

export function inferTags(name, category = '', notes = '') {
  const text = `${name} ${category} ${notes}`.toLowerCase();
  const found = new Set();
  for (const [key, tags] of Object.entries(CATEGORY_TAGS)) {
    if (text.includes(key)) tags.forEach((tag) => found.add(tag));
  }
  (notes.match(/[a-z]{5,}/gi) || []).slice(0, 3).forEach((w) => found.add(w.toLowerCase()));
  if (!found.size) ['independent', 'quality', 'considered'].forEach((t) => found.add(t));
  return [...found].slice(0, 6);
}

export const productContentAgent = {
  id: 'product-content',
  name: 'Product & Content Agent',
  description: 'Improves product titles, writes descriptions, suggests categories and SEO metadata.',
  capabilities: ['product copy', 'categorisation', 'SEO descriptions'],

  local({ name = 'Untitled item', category = '', notes = '', priceCents = 0, site = {} }) {
    const cleanName = name.trim().replace(/\s+/g, ' ');
    const title = cleanName.length < 3 ? `The ${category || 'Signature'} Edit` : cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
    const opener = DESCRIPTION_OPENERS[cleanName.length % DESCRIPTION_OPENERS.length];
    const detail = notes.trim() || `A ${category ? category.toLowerCase() : 'carefully made'} piece chosen for its quality, character and everyday usefulness.`;
    const description = `${title} — ${opener.toLowerCase()}.\n\n${detail.replace(/\.$/, '')}. Every detail has been considered, from the materials to the finish.\n\nWhy we love it:\n• ${notes ? notes.split(/[.,]/)[0].trim() : 'Thoughtfully made and genuinely useful'}\n• Designed to fit naturally into your day\n• One of our most requested pieces`;
    const tags = inferTags(cleanName, category, notes);
    const price = priceCents ? Math.round(priceCents / 100) : 0;
    return {
      title,
      description,
      shortDescription: `${opener}. ${detail.split('.')[0]}.`.slice(0, 150),
      category: category || 'Signature',
      tags,
      seoTitle: `${title}${category ? ` | ${category}` : ''} — ${site.name || 'Our store'}`.slice(0, 60),
      seoDescription: `${opener}: ${title}. ${detail.split('.')[0]}. Free shipping and easy returns.`.slice(0, 158),
      priceSuggestion: price || 49,
      suggestions: ['Add a lifestyle image alongside the product shot.', 'Mention dimensions or materials if relevant.', 'Use the first sentence as the meta description.'],
    };
  },

  async run(ctx) {
    const local = this.local(ctx);
    if (!aiConfigured()) return { agent: this.id, ...local, model: 'nexora-local-v1' };
    const result = await generate({
      system: 'You are an expert e-commerce copywriter. Write accurate, sensory, concise copy. Never invent certifications or materials not supplied. Return JSON only.',
      prompt: `Write product content. Return JSON {title,description,shortDescription,tags:[6],seoTitle,seoDescription,priceSuggestion,suggestions:[3]}. Item: ${JSON.stringify({ name: ctx.name, category: ctx.category, notes: ctx.notes, priceCents: ctx.priceCents })}. Store: ${ctx.site?.name || ''}.`,
      json: true,
    });
    if (!result?.description) return { agent: this.id, ...local, model: 'nexora-local-v1' };
    return { agent: this.id, ...local, ...result, model: 'ai-provider' };
  },
};

export default productContentAgent;
