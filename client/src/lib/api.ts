const TOKEN_KEY = 'nexora_token';

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export async function api<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`/api${path}`, { ...options, headers });
  let data: any = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) data = await response.json();
  else data = await response.text();
  if (!response.ok) {
    throw new ApiError(data?.error || data?.message || `Request failed (${response.status})`, response.status, data);
  }
  return data as T;
}

export const get = <T = any>(path: string) => api<T>(path);
export const post = <T = any>(path: string, body?: any) => api<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) });
export const patch = <T = any>(path: string, body?: any) => api<T>(path, { method: 'PATCH', body: JSON.stringify(body ?? {}) });
export const del = <T = any>(path: string) => api<T>(path, { method: 'DELETE' });

export function formatMoney(cents: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: cents % 100 === 0 && Math.abs(cents) >= 1000 ? 0 : 2,
  }).format((cents || 0) / 100);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US', { notation: value > 9999 ? 'compact' : 'standard' }).format(value || 0);
}

export function formatDate(date?: string | null, options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }) {
  if (!date) return '—';
  const d = new Date(date.includes('T') ? date : `${date.replace(' ', 'T')}Z`);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', options);
}

export function timeAgo(date?: string | null) {
  if (!date) return '—';
  const d = new Date(date.includes('T') ? date : `${date.replace(' ', 'T')}Z`);
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return formatDate(date, { month: 'short', day: 'numeric' });
}

export function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((n) => n[0]?.toUpperCase()).join('') || 'N';
}
