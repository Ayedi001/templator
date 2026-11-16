import { generate, aiConfigured } from '../provider.js';

const TOPICS = [
  {
    id: 'customize', keywords: ['customize', 'customise', 'color', 'font', 'logo', 'design', 'change look', 'edit website'],
    title: 'Customising your website',
    answer: 'Open **Website → Design studio** from your dashboard. The live preview updates as you work. You can change the palette, fonts, section order, logo, imagery and every piece of copy, then press **Save changes** to publish the update.',
    steps: ['Go to Website → Design studio', 'Choose a palette or edit individual colors', 'Update the hero, about and other sections', 'Use the device toggle to check mobile', 'Press Save changes'],
    link: '/dashboard/:siteId/design',
  },
  {
    id: 'publish', keywords: ['publish', 'unpublish', 'live', 'url', 'launch', 'site address'],
    title: 'Publishing your website',
    answer: 'Publishing puts your site live at **yourslug.nexora.studio** (and your custom domain when verified). Go to **Website settings → Publishing** and press **Publish website**. You can unpublish any time without losing content.',
    steps: ['Open Website settings', 'Check your web address', 'Press Publish website', 'Open the live site to confirm it looks right'],
    link: '/dashboard/:siteId/settings',
  },
  {
    id: 'products', keywords: ['product', 'add product', 'catalog', 'catalogue', 'stock', 'price', 'item', 'menu', 'service'],
    title: 'Managing products and services',
    answer: 'Use **Catalogue** (the label changes by business type — Menu, Services, Programs and so on). Add an item, upload images, set a price and stock, and organise it with categories. The Product Content Agent can write the description for you.',
    steps: ['Go to Catalogue', 'Press Add item', 'Fill in name, price and description', 'Add images and a category', 'Save, then set the status to Active'],
    link: '/dashboard/:siteId/items',
  },
  {
    id: 'orders', keywords: ['order', 'sale', 'customer', 'shipping', 'refund', 'fulfil', 'checkout'],
    title: 'Managing orders',
    answer: 'New orders appear in **Orders** with the customer, items and total. Open an order to update its status — Pending, Processing, Shipped, Completed or Cancelled. Live orders are created automatically when a customer checks out on your published site.',
    steps: ['Go to Orders', 'Open the order', 'Update the status as you fulfil it', 'Use the customer record to see their history'],
    link: '/dashboard/:siteId/orders',
  },
  {
    id: 'domain', keywords: ['domain', 'dns', 'custom domain', 'www', 'ssl'],
    title: 'Connecting a custom domain',
    answer: 'Custom domains are available on Growth and Scale plans. Open **Website settings → Domains**, add your domain, then point its DNS to Nexora. Press **Verify** once the records have propagated — SSL is issued automatically.',
    steps: ['Open Website settings → Domains', 'Add your domain', 'Create the DNS records shown', 'Press Verify domain'],
    link: '/dashboard/:siteId/settings',
  },
  {
    id: 'ai', keywords: ['ai', 'agent', 'generate', 'copy', 'seo', 'assistant', 'usage'],
    title: 'Using AI agents',
    answer: 'Open **AI Studio** to access specialist agents for business analysis, content, product copy, design and SEO. Only the relevant agents run for each request, and every result is editable before it goes live. Your plan includes a monthly AI action allowance shown on the page.',
    steps: ['Open AI Studio', 'Choose a workflow or ask a question', 'Review the result', 'Apply it to your site'],
    link: '/dashboard/:siteId/ai',
  },
  {
    id: 'templates', keywords: ['template', 'theme', 'switch template', 'marketplace'],
    title: 'Switching templates',
    answer: 'Go to **Template marketplace** in your dashboard. Preview any design, then press **Apply to this website**. Your content is preserved; you can also reset the demo content if you want a clean start.',
    steps: ['Open Template marketplace', 'Preview a template', 'Press Apply to this website', 'Review the result in Design studio'],
    link: '/dashboard/:siteId/templates',
  },
  {
    id: 'billing', keywords: ['billing', 'subscription', 'plan', 'upgrade', 'payment', 'invoice', 'limit'],
    title: 'Plans and billing',
    answer: 'Your plan determines how many websites, catalogue items, AI actions and custom domains you can use. Open **Billing** to compare plans and change yours. Changes are pro-rated for the remainder of the billing period.',
    steps: ['Open Billing', 'Compare plan limits', 'Choose a plan', 'Confirm the change'],
    link: '/dashboard/:siteId/billing',
  },
  {
    id: 'seo', keywords: ['seo', 'google', 'search', 'meta', 'keyword'],
    title: 'Improving your search visibility',
    answer: 'Go to **SEO** in your dashboard. The SEO Agent audits your title, description, headings and content, then gives you prioritised fixes you can apply in one click. Focus first on a clear H1, a useful 150-word description and unique product copy.',
    steps: ['Open SEO', 'Run the audit', 'Apply the suggested title and description', 'Add unique descriptions to your top items'],
    link: '/dashboard/:siteId/seo',
  },
  {
    id: 'media', keywords: ['image', 'photo', 'upload', 'media', 'logo', 'picture'],
    title: 'Uploading images',
    answer: 'Open **Media library**. Upload JPG, PNG, WEBP, GIF or SVG files up to 8 MB, or paste an image URL. Click an image to copy its URL, then paste it into any image field in Design studio.',
    steps: ['Open Media library', 'Press Upload image', 'Choose a file', 'Copy the image URL into your design'],
    link: '/dashboard/:siteId/media',
  },
];

export const customerSupportAgent = {
  id: 'customer-support',
  name: 'Customer Support Agent',
  description: 'Answers platform questions and gives step-by-step guidance.',
  capabilities: ['platform help', 'guided troubleshooting', 'feature explanations'],

  local({ message = '', siteId = ':siteId' } = {}) {
    const text = message.toLowerCase();
    const scored = TOPICS.map((topic) => ({
      topic,
      score: topic.keywords.reduce((sum, word) => sum + (text.includes(word) ? (word.includes(' ') ? 3 : 2) : 0), 0),
    })).sort((a, b) => b.score - a.score);
    const best = scored[0].score > 0 ? scored[0].topic : null;
    if (best) {
      return {
        reply: `### ${best.title}\n\n${best.answer}`,
        topic: best.title,
        steps: best.steps,
        link: best.link.replace(':siteId', siteId),
        related: scored.slice(1, 4).filter((s) => s.score > 0).map((s) => s.topic.title),
      };
    }
    return {
      reply: `I can help with publishing, templates, customising your site, products, orders, domains, media, SEO and billing.\n\nTell me what you are trying to do and I will walk you through it. If you are just getting started, open **Website → Design studio** to make the site yours, then publish when you are ready.`,
      topic: 'Getting started',
      steps: ['Choose or preview a template', 'Add your products or services', 'Customise the design', 'Publish your website'],
      link: `/dashboard/${siteId}/design`,
      related: ['Publishing your website', 'Customising your website', 'Managing products and services'],
    };
  },

  async run(ctx) {
    const local = this.local(ctx);
    if (!aiConfigured()) return { agent: this.id, ...local, model: 'nexora-local-v1' };
    const result = await generate({
      system: 'You are Nexora Studio support. Be concise and accurate. Use the platform documentation below. If unsure, say so and point to support@nexora.studio. Return JSON only.',
      prompt: `Docs: ${JSON.stringify(TOPICS.map((t) => ({ title: t.title, answer: t.answer, steps: t.steps })))}. Customer question: ${ctx.message}. Return JSON {reply,topic,steps,link,related}.`,
      json: true,
    });
    if (!result?.reply) return { agent: this.id, ...local, model: 'nexora-local-v1' };
    return { agent: this.id, ...local, reply: result.reply, topic: result.topic || local.topic, steps: result.steps || local.steps, model: 'ai-provider' };
  },
};

export default customerSupportAgent;
