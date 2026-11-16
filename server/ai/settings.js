import { db } from '../db.js';

export function getDisabledAgents() {
  const row = db.prepare("SELECT value FROM platform_settings WHERE key = 'ai.disabledAgents'").get();
  if (!row) return [];
  try {
    const parsed = JSON.parse(row.value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function isAgentEnabled(agentId) {
  return !getDisabledAgents().includes(agentId);
}
