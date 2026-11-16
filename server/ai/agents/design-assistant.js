import { generate, aiConfigured } from '../provider.js';

const PALETTES = [
  {
    id: 'warm-editorial', name: 'Warm editorial',
    description: 'Cream paper, espresso ink and a terracotta accent. Feels considered and human.',
    keywords: ['warm', 'editorial', 'earthy', 'terracotta', 'cozy', 'organic', 'craft'],
    palette: { primary: '#2d1a12', secondary: '#c46a3a', accent: '#c46a3a', bg: '#fbf4e8', surface: '#fffaf2', text: '#2d1a12', muted: '#826e5f', line: '#e6d8c5' },
    fonts: { heading: "'Fraunces', Georgia, serif", body: "'DM Sans', system-ui, sans-serif" },
  },
  {
    id: 'modern-minimal', name: 'Modern minimal',
    description: 'Cool white, near-black type and one electric accent. Lets the product lead.',
    keywords: ['minimal', 'clean', 'modern', 'simple', 'white', 'monochrome', 'premium'],
    palette: { primary: '#151515', secondary: '#6b6b6b', accent: '#ff5c35', bg: '#f7f7f5', surface: '#ffffff', text: '#151515', muted: '#6f6f69', line: '#e2e2de' },
    fonts: { heading: "'Archivo', system-ui, sans-serif", body: "'DM Sans', system-ui, sans-serif" },
  },
  {
    id: 'coastal-calm', name: 'Coastal calm',
    description: 'Sea glass blue, warm sand and a quiet sage accent. Calm without being cold.',
    keywords: ['calm', 'coastal', 'blue', 'sea', 'wellness', 'spa', 'relaxing', 'fresh'],
    palette: { primary: '#0f4f5c', secondary: '#78a6a1', accent: '#d9a760', bg: '#f2f7f5', surface: '#ffffff', text: '#153a40', muted: '#638187', line: '#d6e5e2' },
    fonts: { heading: "'Manrope', system-ui, sans-serif", body: "'DM Sans', system-ui, sans-serif" },
  },
  {
    id: 'bold-contrast', name: 'Bold contrast',
    description: 'Ink black, bone white and acid lime. High energy, impossible to ignore.',
    keywords: ['bold', 'loud', 'sport', 'energy', 'street', 'contrast', 'impact', 'gym'],
    palette: { primary: '#111111', secondary: '#c8ff3d', accent: '#c8ff3d', bg: '#0b0b0a', surface: '#181816', text: '#f4f6ec', muted: '#9ca092', line: '#2b2d26' },
    fonts: { heading: "'Archivo', system-ui, sans-serif", body: "'Space Grotesk', system-ui, sans-serif" },
  },
  {
    id: 'luxe-earth', name: 'Luxe earth',
    description: 'Deep forest, warm brass and parchment. Quiet luxury with substance.',
    keywords: ['luxury', 'luxe', 'gold', 'green', 'elegant', 'premium', 'jewelry', 'hotel'],
    palette: { primary: '#c9a867', secondary: '#e9d9b8', accent: '#c9a867', bg: '#0d0b09', surface: '#17130f', text: '#f4ead7', muted: '#a89a83', line: '#322b23' },
    fonts: { heading: "'Cormorant Garamond', Georgia, serif", body: "'Plus Jakarta Sans', system-ui, sans-serif" },
  },
  {
    id: 'botanical', name: 'Botanical',
    description: 'Soft sage, garden green and a rose accent. Grown rather than manufactured.',
    keywords: ['green', 'nature', 'flowers', 'garden', 'botanical', 'plant', 'organic', 'fresh'],
    palette: { primary: '#3d5744', secondary: '#b07d6a', accent: '#b07d6a', bg: '#f4f3e9', surface: '#fbfaf3', text: '#2d3a2f', muted: '#788174', line: '#dcdccb' },
    fonts: { heading: "'Cormorant Garamond', Georgia, serif", body: "'Manrope', system-ui, sans-serif" },
  },
  {
    id: 'playful-sun', name: 'Playful sun',
    description: 'Cobalt blue, sunshine yellow and a coral highlight. Friendly and full of life.',
    keywords: ['playful', 'fun', 'friendly', 'kids', 'sunny', 'bright', 'happy', 'yellow'],
    palette: { primary: '#14539a', secondary: '#f5b82e', accent: '#ee6b4d', bg: '#fff9e9', surface: '#ffffff', text: '#17324f', muted: '#6c7f91', line: '#eee0bf' },
    fonts: { heading: "'Bricolage Grotesque', system-ui, sans-serif", body: "'DM Sans', system-ui, sans-serif" },
  },
  {
    id: 'tech-trust', name: 'Tech trust',
    description: 'Deep navy, electric blue and signal mint. Confident, technical, clear.',
    keywords: ['tech', 'saas', 'software', 'digital', 'trust', 'finance', 'professional', 'blue'],
    palette: { primary: '#3d7eff', secondary: '#8af5d1', accent: '#8af5d1', bg: '#080b12', surface: '#0f1520', text: '#eaf1ff', muted: '#8695ad', line: '#1c2638' },
    fonts: { heading: "'Sora', system-ui, sans-serif", body: "'DM Sans', system-ui, sans-serif" },
  },
];

const FONT_PAIRS = [
  { id: 'editorial-sans', name: 'Editorial + Sans', heading: "'Playfair Display', Georgia, serif", body: "'DM Sans', system-ui, sans-serif", note: 'Classic contrast for a premium, magazine-like feel.' },
  { id: 'grotesk', name: 'Neo-grotesk', heading: "'Space Grotesk', system-ui, sans-serif", body: "'DM Sans', system-ui, sans-serif", note: 'Technical and contemporary without feeling cold.' },
  { id: 'soft-serif', name: 'Soft serif', heading: "'Fraunces', Georgia, serif", body: "'Manrope', system-ui, sans-serif", note: 'Warm and characterful, excellent for food and craft.' },
  { id: 'quiet-sans', name: 'Quiet sans', heading: "'Manrope', system-ui, sans-serif", body: "'DM Sans', system-ui, sans-serif", note: 'Lets imagery and whitespace carry the design.' },
  { id: 'display-pair', name: 'Display contrast', heading: "'Cormorant Garamond', Georgia, serif", body: "'Plus Jakarta Sans', system-ui, sans-serif", note: 'High-contrast elegance for luxury and hospitality.' },
];

const SECTION_IDEAS = {
  products: ['A three-step brand story', 'A "shop the look" gallery', 'A press or stockist strip'],
  menu: ['A seasonal specials banner', 'An opening-hours and find-us section', 'A reservation call-to-action'],
  services: ['A simple three-tier pricing table', 'A meet-the-team strip', 'An FAQ that reduces hesitation'],
  articles: ['A most-read sidebar', 'An author spotlight', 'A curated reading list'],
  projects: ['A process section with four steps', 'A client logo strip', 'A selected press list'],
  properties: ['A featured-property carousel', 'A neighborhood guide block', 'A valuation lead form'],
  rooms: ['A room comparison table', 'A local guide section', 'A direct-booking reassurance strip'],
  courses: ['An outcomes section', 'A curriculum timeline', 'A student story block'],
};

export const designAssistantAgent = {
  id: 'design-assistant',
  name: 'Design Assistant Agent',
  description: 'Suggests palettes, fonts, sections and layout improvements in natural language.',
  capabilities: ['color palettes', 'typography', 'layout', 'homepage sections'],

  local({ message = '', site = {}, category } = {}) {
    const text = message.toLowerCase();
    const scored = PALETTES.map((p) => ({
      ...p,
      match: p.keywords.reduce((score, word) => score + (text.includes(word) ? 3 : 0), 0)
        + (p.id === 'warm-editorial' && /warm|inviting|cozy/.test(text) ? 2 : 0),
    })).sort((a, b) => b.match - a.match);
    const chosen = scored.slice(0, 3).map((p, i) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      palette: p.palette,
      fonts: p.fonts,
      recommended: i === 0,
    }));
    const fontPair = FONT_PAIRS.find((pair) => text.includes(pair.id.split('-')[0])) || FONT_PAIRS[scored[0].id === 'luxe-earth' ? 4 : scored[0].id === 'warm-editorial' ? 2 : 1];
    const vertical = site?.category || category || 'products';
    const sections = SECTION_IDEAS[vertical] || SECTION_IDEAS.products;
    const currentPalette = site?.theme?.palette;
    return {
      reply: `I would start with **${chosen[0].name}** — ${chosen[0].description.toLowerCase()} Keep your existing layout: it is already doing the right job. Add one new section (${sections[0].toLowerCase()}) and remove anything that repeats the same message.`,
      options: chosen,
      fontPairs: [fontPair, ...FONT_PAIRS.filter((p) => p.id !== fontPair.id).slice(0, 2)],
      sectionSuggestions: sections,
      rationale: `Your current palette uses ${currentPalette?.primary || 'a strong primary'} on ${currentPalette?.bg || 'a light base'}. The suggested shift keeps contrast readable while changing the emotional temperature. One accent color used consistently will feel more premium than several.`,
      accessibilityNote: 'Check body text against the background at 4.5:1 contrast or better. All suggested palettes are designed with that in mind.',
    };
  },

  async run(ctx) {
    const local = this.local(ctx);
    if (!aiConfigured()) return { agent: this.id, ...local, model: 'nexora-local-v1' };
    const result = await generate({
      system: 'You are a senior brand and web designer. Give practical, specific design advice. Return JSON only. Choose from the supplied palettes, do not invent hex colors.',
      prompt: `Site: ${JSON.stringify({ name: ctx.site?.name, category: ctx.site?.category, theme: ctx.site?.theme })}. Request: ${ctx.message}. Available palettes: ${JSON.stringify(PALETTES.map((p) => ({ id: p.id, name: p.name, description: p.description, palette: p.palette, fonts: p.fonts })))}. Return JSON {reply, options:[{id,name,description,palette,fonts,recommended}], sectionSuggestions:[3], rationale}.`,
      json: true,
    });
    if (!result?.reply) return { agent: this.id, ...local, model: 'nexora-local-v1' };
    const merged = local.options.map((opt) => {
      const ai = result.options?.find((o) => o.id === opt.id);
      return ai ? { ...opt, description: ai.description || opt.description, recommended: Boolean(ai.recommended) } : opt;
    });
    return { agent: this.id, ...local, reply: result.reply, options: merged, sectionSuggestions: result.sectionSuggestions || local.sectionSuggestions, rationale: result.rationale || local.rationale, model: 'ai-provider' };
  },
};

export default designAssistantAgent;
