import { env } from '../config.js';

export function aiConfigured() {
  return Boolean(env.AI_ENABLED && env.AI_API_KEY);
}

export function aiStatus() {
  return {
    enabled: env.AI_ENABLED,
    configured: aiConfigured(),
    provider: aiConfigured() ? new URL(env.AI_BASE_URL).hostname : 'Nexora local intelligence',
    model: aiConfigured() ? env.AI_MODEL : 'nexora-local-v1',
    mode: aiConfigured() ? 'hybrid' : 'local',
  };
}

/**
 * Calls any OpenAI-compatible chat completion endpoint. Returns null when AI is
 * not configured or the provider fails, so every agent can use its deterministic
 * local reasoning as a graceful fallback.
 */
export async function generate({ system, prompt, temperature = 0.6, maxTokens = 1200, json = false }) {
  if (!aiConfigured()) return null;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);
    const response = await fetch(`${env.AI_BASE_URL.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: env.AI_MODEL,
        temperature,
        max_tokens: maxTokens,
        ...(json ? { response_format: { type: 'json_object' } } : {}),
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt },
        ],
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!response.ok) return null;
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return null;
    if (!json) return content;
    try {
      return JSON.parse(content.replace(/^```json\s*/i, '').replace(/```$/, ''));
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}
