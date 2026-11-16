import { generate, aiConfigured } from '../provider.js';
import { TEMPLATE_CATEGORIES } from '../../templates/catalog.js';

function clean(text = '') {
  return String(text).replace(/\s+/g, ' ').trim();
}

export const seoAgent = {
  id: 'seo',
  name: 'SEO Agent',
  description: 'Audits and generates search metadata, keywords and structured data.',
  capabilities: ['SEO audit', 'meta descriptions', 'keywords', 'structured data'],

  local({ site = {} }) {
    const content = site.content || {};
    const settings = site.settings || {};
    const seo = settings.seo || {};
    const category = TEMPLATE_CATEGORIES.find((c) => c.id === site.category);
    const hero = content.hero || {};
    const about = content.about || {};
    const items = site.items || [];
    const businessAddress = settings.business?.address || content.contact?.address || '';
    const city = businessAddress.split(',').map((s) => s.trim()).filter(Boolean).at(-1) || '';
    const name = site.name || 'Your business';
    const description = clean(site.description || hero.subheadline || about.body || '');

    const title = clean(seo.title || `${name} — ${category?.name || 'Independent business'}${city ? ` in ${city}` : ''}`).slice(0, 60);
    const metaDescription = clean(seo.description || `${name}${city ? ` in ${city}` : ''}: ${description || hero.subheadline || 'A considered independent business.'}`).slice(0, 158);
    const keywords = [...new Set([
      name.toLowerCase(),
      ...(category?.name || '').toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 2 && w !== 'and'),
      ...(city ? [city.toLowerCase()] : []),
      ...(seo.keywords || []).map((k) => String(k).toLowerCase().trim()).filter(Boolean),
      ...items.slice(0, 4).flatMap((item) => item.name.toLowerCase().split(/\s+/).filter((w) => w.length > 3 && /^[a-z]+$/.test(w))),
    ])].slice(0, 10);

    const issues = [];
    let score = 48;
    const rawTitle = clean(seo.title || content.meta?.title || '');
    if (rawTitle.length >= 30 && rawTitle.length <= 60) score += 10;
    else issues.push({ severity: 'high', title: 'Title length is not optimised', detail: rawTitle ? `Your title is ${rawTitle.length} characters. Aim for 30–60.` : 'Add a page title between 30 and 60 characters.', fix: title });
    if (metaDescription.length >= 110 && metaDescription.length <= 160) score += 10;
    else issues.push({ severity: 'medium', title: 'Meta description could be stronger', detail: 'Aim for 110–160 characters with a clear benefit and a call to action.', fix: metaDescription });
    if (hero.headline && hero.headline.length >= 15) score += 8;
    else issues.push({ severity: 'high', title: 'Missing a clear H1 promise', detail: 'Your hero headline should say what you do and who it is for.', fix: 'Add a specific, benefit-led headline.' });
    if ((about.body || '').length > 140) score += 6;
    else issues.push({ severity: 'medium', title: 'Homepage content is thin', detail: 'Add 150–300 words of genuinely useful content about the business.', fix: 'Expand the About section with specifics.' });
    if (keywords.length >= 5) score += 5;
    if (content.hero?.image) score += 3;
    else issues.push({ severity: 'low', title: 'No hero image', detail: 'Add a high-quality hero image with descriptive alt text.', fix: 'Upload brand photography.' });
    if (content.contact?.phone && content.contact?.email) score += 4;
    else issues.push({ severity: 'medium', title: 'Contact details incomplete', detail: 'Add a phone number and email so search engines can connect your business details.', fix: 'Add both in Website settings → Contact.' });
    if (site.status === 'published') score += 4;
    else issues.push({ severity: 'low', title: 'Website is not published', detail: 'Search engines cannot index a draft website.', fix: 'Publish when ready.' });
    const thinItems = items.filter((item) => (item.description || '').length < 40);
    if (items.length && thinItems.length > items.length / 2) {
      issues.push({ severity: 'medium', title: 'Product descriptions need depth', detail: `${thinItems.length} items have very short descriptions. Add unique, useful detail.`, fix: 'Use the Product Content Agent.' });
    } else if (items.length) score += 4;
    score = Math.min(96, score);

    return {
      score,
      grade: score >= 90 ? 'Excellent' : score >= 75 ? 'Good' : score >= 55 ? 'Needs work' : 'Weak',
      title,
      description: metaDescription,
      keywords,
      issues,
      quickWins: issues.slice(0, 3).map((issue) => issue.fix),
      structuredData: {
        '@context': 'https://schema.org',
        '@type': ['LocalBusiness', 'Organization'],
        name,
        description: metaDescription,
        url: `https://${site.custom_domain || `${site.slug}.nexora.studio`}`,
        ...(businessAddress ? { address: { '@type': 'PostalAddress', streetAddress: businessAddress } } : {}),
        ...(content.contact?.phone ? { telephone: content.contact.phone } : {}),
        ...(content.contact?.email ? { email: content.contact.email } : {}),
      },
      socialPreview: {
        title, description: metaDescription,
        image: seo.ogImage || content.hero?.image || '',
      },
      suggestions: [
        'Write a unique description for every product or service.',
        city ? `Create a page targeting "${category?.name?.toLowerCase() || 'services'} in ${city}".` : 'Add your city or service area to capture local search.',
        'Add descriptive alt text to every meaningful image.',
        'Link your Google Business Profile to this website.',
      ],
    };
  },

  async run(ctx) {
    const local = this.local(ctx);
    if (!aiConfigured()) return { agent: this.id, ...local, model: 'nexora-local-v1' };
    const result = await generate({
      system: 'You are a technical SEO specialist for small businesses. Be honest, specific and concise. Never promise rankings. Return JSON only.',
      prompt: `Audit this website. Return JSON {score,grade,title,description,keywords:[8],issues:[{severity,title,detail,fix}],quickWins:[3],suggestions:[4]}. Website: ${JSON.stringify({ name: ctx.site?.name, category: ctx.site?.category, description: ctx.site?.description, content: ctx.site?.content, seo: ctx.site?.settings?.seo, items: (ctx.site?.items || []).slice(0, 5) })}.`,
      json: true,
    });
    if (!result?.score) return { agent: this.id, ...local, model: 'nexora-local-v1' };
    return { agent: this.id, ...local, ...result, title: result.title || local.title, description: result.description || local.description, structuredData: local.structuredData, socialPreview: { ...local.socialPreview, title: result.title || local.title, description: result.description || local.description }, model: 'ai-provider' };
  },
};

export default seoAgent;
