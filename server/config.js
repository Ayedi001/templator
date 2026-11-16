import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, '..');

function num(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: num(process.env.PORT, 4100),
  JWT_SECRET: process.env.JWT_SECRET || 'nexora-local-development-secret-change-in-production',
  DB_PATH: process.env.DB_PATH || path.join(ROOT, 'data', 'nexora.db'),
  UPLOAD_DIR: process.env.UPLOAD_DIR || path.join(ROOT, 'data', 'uploads'),
  CLIENT_DIST: path.join(ROOT, 'dist'),
  APP_NAME: process.env.APP_NAME || 'Nexora Studio',
  APP_DOMAIN: process.env.APP_DOMAIN || 'nexora.studio',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5174',
  SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL || 'admin@nexora.studio',
  SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD || 'Platform123!',
  AI_API_KEY: process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '',
  AI_BASE_URL: process.env.AI_BASE_URL || 'https://api.openai.com/v1',
  AI_MODEL: process.env.AI_MODEL || 'gpt-4o-mini',
  AI_ENABLED: process.env.AI_ENABLED !== 'false',
};
