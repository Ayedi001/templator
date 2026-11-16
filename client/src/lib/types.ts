export interface User {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin';
  status?: string;
  avatarColor: string;
  createdAt: string;
}

export interface Palette {
  primary: string;
  secondary: string;
  accent: string;
  bg: string;
  surface: string;
  text: string;
  muted: string;
  line: string;
}

export interface Fonts {
  heading: string;
  body: string;
}

export interface Theme {
  palette: Palette;
  fonts: Fonts;
  layout: string;
  hero: string;
  nav: string;
  card: string;
  radius: string;
  logoText?: string;
  logoUrl?: string;
  mode?: string;
}

export interface ContentFeature {
  title: string;
  body: string;
}

export interface Content {
  hero: {
    eyebrow: string;
    headline: string;
    highlight?: string;
    subheadline: string;
    primaryCta: string;
    secondaryCta: string;
    image: string;
    image2?: string;
  };
  about: { title: string; body: string; image?: string; features: ContentFeature[] };
  stats?: { value: string; label: string }[];
  gallery?: string[];
  testimonials?: { quote: string; name: string; role: string }[];
  sections: string[];
  navLinks?: { label: string; href: string }[];
  contact: {
    title: string;
    body: string;
    address: string;
    phone: string;
    email: string;
    hours: { day: string; time: string }[];
    mapLabel?: string;
  };
  footer: { tagline: string; copyright: string };
  announcement?: string;
  newsletter?: { title: string; body: string; button: string };
  meta?: { title: string; description: string };
}

export interface SiteSettings {
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
    ogImage?: string;
    canonical?: string;
    indexable?: boolean;
  };
  business?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    timezone?: string;
    currency?: string;
  };
  publishing?: { showBadge?: boolean; password?: string };
  social?: { instagram?: string; facebook?: string; x?: string; linkedin?: string };
}

export interface Site {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  templateId: string;
  status: 'draft' | 'published' | 'suspended';
  customDomain?: string | null;
  domainStatus?: string;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  theme: Theme;
  content: Content;
  settings: SiteSettings;
}

export interface SiteSummary {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  templateId: string;
  status: 'draft' | 'published' | 'suspended';
  customDomain?: string | null;
  domainStatus?: string;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  plan: string;
  subscriptionStatus: string;
  publicUrl?: string | null;
  counts?: { items: number; orders: number; customers: number };
}

export interface Template {
  id: string;
  name: string;
  category: string;
  categoryName: string;
  style: string;
  description: string;
  featured: boolean;
  enabled: boolean;
  uses: number;
  palette: Palette;
  fonts: Fonts;
  radius: string;
  layout: string;
  hero: string;
  nav: string;
  card: string;
  image: string;
  image2: string;
  tags: string[];
  sections: string[];
  commerce?: boolean;
  demo: {
    eyebrow: string;
    headline: string;
    highlight: string;
    subheadline: string;
    primaryCta: string;
    secondaryCta: string;
    aboutTitle: string;
    aboutBody: string;
    features: ContentFeature[];
    stats: { value: string; label: string }[];
    items: DemoItem[];
    gallery: string[];
    testimonials: { quote: string; name: string; role: string }[];
  };
}

export interface DemoItem {
  name: string;
  description: string;
  price: number;
  category: string;
  tag?: string;
  duration?: string;
  meta?: string;
  author?: string;
  readTime?: string;
  suffix?: string;
}

export interface TemplateCategory {
  id: string;
  name: string;
  blurb: string;
  icon: string;
  vertical: string;
  itemLabel: string;
  count: number;
}

export interface Item {
  id: string;
  site_id: string;
  category_id?: string | null;
  kind: string;
  name: string;
  slug: string;
  description: string;
  price_cents: number;
  compare_at_cents?: number | null;
  stock: number;
  status: string;
  images: string[];
  metadata: Record<string, any>;
  featured: number;
  created_at: string;
}

export interface Category {
  id: string;
  site_id: string;
  kind: string;
  name: string;
  slug: string;
  sort_order: number;
  count?: number;
}

export interface OrderLine {
  id: string;
  name: string;
  price: number;
  quantity: number;
  kind?: string;
  options?: Record<string, string>;
}

export interface Order {
  id: string;
  site_id: string;
  number: string;
  customer_name: string;
  customer_email: string;
  items: OrderLine[];
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  status: string;
  payment_status: string;
  note: string;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  orders_count: number;
  total_spent_cents: number;
  created_at: string;
}

export interface Media {
  id: string;
  name: string;
  url: string;
  mime: string;
  size: number;
  created_at: string;
}

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  type: string;
  status: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  site_id: string;
  plan: 'starter' | 'growth' | 'scale';
  status: string;
  ai_limit: number;
  ai_used: number;
  product_limit: number;
  storage_limit_mb: number;
  renews_at?: string;
}

export interface Domain {
  id: string;
  domain: string;
  status: string;
  ssl_status: string;
  created_at: string;
}

export interface SiteDetails {
  site: Site;
  subscription: Subscription;
  template: Template;
  domains: Domain[];
  limits: Plan;
  publicUrl?: string;
}

export interface Plan {
  id?: string;
  name: string;
  price: number;
  aiLimit: number;
  productLimit: number;
  storageLimitMb: number;
  sites: number;
  customDomain: boolean;
  features?: string[];
}

export interface AgentRun {
  id: string;
  name: string;
  status: string;
  model: string;
}

export interface AiBlock {
  id: string;
  agentId: string;
  agentName: string;
  type: string;
  model: string;
  data: any;
}

export interface AiChatResponse {
  reply: string;
  intent: string;
  agents: AgentRun[];
  blocks: AiBlock[];
  suggestions: string[];
  meta: { durationMs: number; mode: string; validated: boolean };
  usage: AiUsage;
}

export interface AiUsage {
  used: number;
  limit: number;
  remaining: number;
  plan: string;
}

export interface PublicSitePayload {
  site: Site;
  template: Template;
  items: Item[];
  categories: Category[];
  owner: string;
  reviews: { quote: string; name: string; role: string }[];
}
