import businessAnalysisAgent from './business-analysis.js';
import templateRecommendationAgent from './template-recommendation.js';
import websiteGenerationAgent from './website-generation.js';
import productContentAgent from './product-content.js';
import designAssistantAgent from './design-assistant.js';
import seoAgent from './seo.js';
import customerSupportAgent from './customer-support.js';
import { aiStatus } from '../provider.js';

export const AGENTS = [
  businessAnalysisAgent,
  templateRecommendationAgent,
  websiteGenerationAgent,
  productContentAgent,
  designAssistantAgent,
  seoAgent,
  customerSupportAgent,
];

export function agentCatalog() {
  return {
    agents: AGENTS.map((agent) => ({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      capabilities: agent.capabilities,
      status: 'online',
    })),
    status: aiStatus(),
  };
}
