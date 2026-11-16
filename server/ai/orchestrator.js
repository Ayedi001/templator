import { AGENTS } from './agents/index.js';
import businessAnalysisAgent from './agents/business-analysis.js';
import templateRecommendationAgent from './agents/template-recommendation.js';
import websiteGenerationAgent from './agents/website-generation.js';
import productContentAgent from './agents/product-content.js';
import designAssistantAgent from './agents/design-assistant.js';
import seoAgent from './agents/seo.js';
import customerSupportAgent from './agents/customer-support.js';
import { aiStatus } from './provider.js';

const INTENTS = [
  { id: 'seo', pattern: /\b(seo|search engine|meta description|meta title|keywords?|google ranking|indexab)/i },
  { id: 'design', pattern: /\b(design|colou?r|palette|font|typeface|layout|section|style|warm|cooler|bold|minimal|elegant|hero image|white space|whitespace)\b/i },
  { id: 'product', pattern: /\b(product description|item description|write.*(product|item)|improve.*(title|listing)|product copy|menu description)\b/i },
  { id: 'template', pattern: /\b(template|theme|recommend (a )?(design|template)|which design|look and feel)\b/i },
  { id: 'business', pattern: /\b(analy[sz]e (my )?business|business analysis|target audience|positioning|strategy|brand strategy)\b/i },
  { id: 'website', pattern: /\b(write|rewrite|generate|improve).*(copy|content|homepage|about|hero|headline)|homepage content|about page/i },
  { id: 'support', pattern: /\b(how do i|how to|where (is|do)|help|publish|unpublish|domain|billing|upgrade|order|upload|account|problem|issue|troubleshoot)\b/i },
];

export function classifyIntent(message = '') {
  for (const intent of INTENTS) {
    if (intent.pattern.test(message)) return intent.id;
  }
  return 'support';
}

function selectedAgentsFor(intent) {
  switch (intent) {
    case 'seo': return [seoAgent];
    case 'design': return [designAssistantAgent];
    case 'product': return [productContentAgent];
    case 'template': return [templateRecommendationAgent];
    case 'business': return [businessAnalysisAgent, templateRecommendationAgent];
    case 'website': return [websiteGenerationAgent];
    default: return [customerSupportAgent];
  }
}

function cleanText(value, max = 1800) {
  if (typeof value !== 'string') return '';
  return value.replace(/\u0000/g, '').trim().slice(0, max);
}

function buildReply(intent, results) {
  const parts = [];
  for (const { agent, result } of results) {
    if (agent.id === 'business-analysis') {
      parts.push(`### Business snapshot\n\n**Positioning:** ${cleanText(result.positioning, 240)}\n\n**Audience:** ${cleanText(result.audience, 280)}\n\n**Recommended tone:** ${cleanText(result.tone, 120)}`);
    } else if (agent.id === 'template-recommendation') {
      const top = result.recommendations?.[0];
      if (top) parts.push(`### Template direction\n\nI would start with **${top.name}** — ${cleanText(top.reason, 360)}\n\n${result.layoutAdvice ? cleanText(result.layoutAdvice, 220) : ''}`);
    } else if (agent.id === 'seo') {
      parts.push(`### SEO score: ${result.score}/100 — ${result.grade}\n\n${cleanText(result.description, 240)}\n\n**Top priority:** ${cleanText(result.issues?.[0]?.detail || 'Your core metadata is in good shape.', 240)}`);
    } else if (agent.id === 'design-assistant') {
      parts.push(cleanText(result.reply, 1000));
    } else if (agent.id === 'website-generation') {
      parts.push(`### Draft copy ready\n\n**${cleanText(result.content?.hero?.headline, 120)}**\n\n${cleanText(result.content?.hero?.subheadline, 260)}\n\n${cleanText(result.rationale, 320)}`);
    } else if (agent.id === 'product-content') {
      parts.push(`### ${cleanText(result.title, 120)}\n\n${cleanText(result.shortDescription || result.description, 360)}`);
    } else {
      parts.push(cleanText(result.reply, 1500));
    }
  }
  if (!parts.length) return 'I could not complete that request. Try describing what you want to change or ask a question about the platform.';
  return parts.filter(Boolean).join('\n\n');
}

function blocksFor(results) {
  const blocks = [];
  for (const { agent, result } of results) {
    blocks.push({
      id: `${agent.id}-${Date.now()}-${blocks.length}`,
      agentId: agent.id,
      agentName: agent.name,
      type: agent.id,
      model: result.model,
      data: agent.id === 'seo'
        ? { score: result.score, grade: result.grade, title: result.title, description: result.description, keywords: result.keywords, issues: result.issues, quickWins: result.quickWins, structuredData: result.structuredData, socialPreview: result.socialPreview }
        : agent.id === 'design-assistant'
          ? { options: result.options, fontPairs: result.fontPairs, sectionSuggestions: result.sectionSuggestions, rationale: result.rationale, accessibilityNote: result.accessibilityNote }
          : agent.id === 'template-recommendation'
            ? { recommendations: result.recommendations, paletteAdvice: result.paletteAdvice, layoutAdvice: result.layoutAdvice }
            : agent.id === 'website-generation'
              ? { content: result.content, rationale: result.rationale, suggestions: result.suggestions }
              : agent.id === 'business-analysis'
                ? { summary: result.summary, audience: result.audience, tone: result.tone, sections: result.sections, features: result.features, keywords: result.keywords }
                : result,
    });
  }
  return blocks;
}

/**
 * Central AI orchestrator. Selects only the agents an intent requires, shares
 * context, validates results and composes a single response for the caller.
 */
export async function orchestrate({ site = null, message = '', history = [], siteId = null, category = '', disabledAgents = [] }) {
  const started = Date.now();
  const intent = classifyIntent(message);
  let agents = selectedAgentsFor(intent).filter((agent) => !disabledAgents.includes(agent.id));
  if (!agents.length) {
    // If a specialist is disabled by a platform admin, the support agent gives
    // the customer a useful next step rather than a dead end.
    agents = [customerSupportAgent];
  }
  const ctx = {
    site,
    siteId,
    name: site?.name,
    category: site?.category || category,
    description: site?.description,
    message,
    brief: message,
    histories: history.slice(-8),
  };
  const results = [];
  for (const agent of agents) {
    try {
      const result = await agent.run(ctx);
      if (!result || typeof result !== 'object') throw new Error('Empty agent result');
      results.push({ agent, result });
    } catch (error) {
      results.push({
        agent,
        result: { agent: agent.id, reply: `The ${agent.name} could not complete this request. Please try again.`, model: 'error' },
      });
    }
  }
  const reply = buildReply(intent, results);
  return {
    reply,
    intent,
    agents: results.map(({ agent, result }) => ({
      id: agent.id,
      name: agent.name,
      status: result.model === 'error' ? 'failed' : 'completed',
      model: result.model,
    })),
    blocks: blocksFor(results),
    suggestions: [...new Set(results.flatMap(({ result }) => result.suggestions || []))].slice(0, 5),
    meta: {
      durationMs: Date.now() - started,
      mode: aiStatus().mode,
      validated: true,
    },
  };
}

export { AGENTS };
