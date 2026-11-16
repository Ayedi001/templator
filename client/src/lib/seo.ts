import type { Site } from './types';

const DEFAULT_TITLE = 'Nexora Studio — Beautiful websites, intelligently made';
const DEFAULT_DESCRIPTION = 'Nexora Studio — beautiful websites, intelligently made. Build, customise and publish a professional website for your business in minutes.';

function upsertMeta(attribute: 'name' | 'property', key: string, content: string) {
  if (!content) return;
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attribute, key);
    tag.dataset.nexoraDynamic = 'true';
    document.head.appendChild(tag);
  }
  tag.content = content;
}

function upsertCanonical(href: string) {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    link.dataset.nexoraDynamic = 'true';
    document.head.appendChild(link);
  }
  link.href = href;
}

export function applySiteMeta(site: Site) {
  const seo = site.settings.seo || {};
  const title = seo.title || site.content.meta?.title || `${site.name} — ${site.category}`;
  const description = seo.description || site.content.meta?.description || site.description || '';
  const canonical = /^https?:\/\//i.test(seo.canonical || '') ? seo.canonical! : `${window.location.origin}/site/${site.slug}`;
  const image = seo.ogImage || site.content.hero?.image || '';
  const absoluteImage = image ? (image.startsWith('http') ? image : `${window.location.origin}${image.startsWith('/') ? '' : '/'}${image}`) : '';

  document.title = title;
  upsertMeta('name', 'description', description);
  upsertMeta('name', 'robots', seo.indexable === false ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');
  upsertMeta('property', 'og:type', 'website');
  upsertMeta('property', 'og:site_name', site.name);
  upsertMeta('property', 'og:title', title);
  upsertMeta('property', 'og:description', description);
  upsertMeta('property', 'og:url', canonical);
  if (absoluteImage) upsertMeta('property', 'og:image', absoluteImage);
  upsertMeta('name', 'twitter:card', absoluteImage ? 'summary_large_image' : 'summary');
  upsertMeta('name', 'twitter:title', title);
  upsertMeta('name', 'twitter:description', description);
  if (absoluteImage) upsertMeta('name', 'twitter:image', absoluteImage);
  upsertCanonical(canonical);
}

export function resetSiteMeta() {
  document.title = DEFAULT_TITLE;
  upsertMeta('name', 'description', DEFAULT_DESCRIPTION);
  document.querySelectorAll<HTMLElement>('[data-nexora-dynamic="true"]').forEach((element) => element.remove());
}
