import { generate, aiConfigured } from '../provider.js';
import { TEMPLATES, TEMPLATE_CATEGORIES } from '../../templates/catalog.js';

function scoreTemplate(template, { category, description = '', name = '' }) {
  const cat = TEMPLATE_CATEGORIES.find((c) => c.id === category);
  const text = `${description} ${name}`.toLowerCase();
  let score = template.category === category ? 40 : 0;
  if (cat?.name?.toLowerCase().split(' ').some((w) => text.includes(w))) score += 5;
  for (const tag of template.tags) if (text.includes(tag.toLowerCase())) score += 8;
  for (const word of template.style.toLowerCase().split(/\s+/)) if (word.length > 3 && text.includes(word)) score += 3;
  if (template.featured) score += 3;
  score += Math.min(10, Math.round((template.demo.items?.length || 0) / 2));
  return score;
}

export const templateRecommendationAgent = {
  id: 'template-recommendation',
  name: 'Template Recommendation Agent',
  description: 'Matches a business to templates and explains the design rationale.',
  capabilities: ['template matching', 'design rationale', 'palette recommendation'],

  local({ category, description = '', name = '', templates = TEMPLATES }) {
    const exact = templates.filter((t) => t.category === category);
    const pool = exact.length ? exact : templates;
    const ranked = [...pool]
      .map((template) => ({ template, score: scoreTemplate(template, { category, description, name }) }))
      .sort((a, b) => b.score - a.score || a.template.name.localeCompare(b.template.name))
      .slice(0, 3);
    const selected = ranked.map(({ template, score }, i) => ({
      id: template.id,
      name: template.name,
      category: template.category,
      style: template.style,
      description: template.description,
      image: template.image,
      layout: template.layout,
      palette: template.palette,
      fonts: template.fonts,
      score: 96 - i * 4,
      reason: i === 0
        ? `${template.name} is built around the visual codes your customers expect from ${template.style.toLowerCase()}, while the ${template.layout} layout gives your content room to breathe. Its ${template.palette.primary} accent feels distinctive without fighting your imagery.`
        : `${template.name} offers a ${template.layout} alternative with ${template.style.toLowerCase()} energy. ${template.description}`,
      bestFor: template.tags.slice(0, 3).join(' · '),
    }));
    return {
      recommendations: selected,
      paletteAdvice: selected[0]
        ? `Keep ${selected[0].palette.primary} as the signature accent and use ${selected[0].palette.bg} for breathing room. One accent color used consistently reads more premium than many.`
        : 'Choose a neutral base and one confident accent.',
      layoutAdvice: selected[0]
        ? `The ${selected[0].layout} archetype suits your content. Keep the homepage to five or six sections and let the imagery do the talking.`
        : 'Lead with a clear hero, then proof, then a primary action.',
    };
  },

  async run(ctx) {
    const local = this.local(ctx);
    if (!aiConfigured()) return { agent: this.id, ...local, model: 'nexora-local-v1' };
    const result = await generate({
      system: 'You are a tasteful website design director. Return JSON only. Recommend the supplied templates, never invent templates. Be specific and brief.',
      prompt: `Business: ${JSON.stringify({ name: ctx.name, category: ctx.category, description: ctx.description })}. Candidate templates: ${JSON.stringify((ctx.templates || TEMPLATES).map((t) => ({ id: t.id, name: t.name, category: t.category, style: t.style, layout: t.layout, tags: t.tags })))}. Return JSON {recommendations:[{id,name,reason,score}], paletteAdvice, layoutAdvice}.`,
      json: true,
    });
    if (!result?.recommendations) return { agent: this.id, ...local, model: 'nexora-local-v1' };
    const merged = local.recommendations.map((rec) => {
      const ai = result.recommendations.find((r) => r.id === rec.id);
      return ai ? { ...rec, reason: ai.reason || rec.reason, score: ai.score || rec.score } : rec;
    });
    return { agent: this.id, ...local, recommendations: merged, paletteAdvice: result.paletteAdvice || local.paletteAdvice, layoutAdvice: result.layoutAdvice || local.layoutAdvice, model: 'ai-provider' };
  },
};

export default templateRecommendationAgent;
