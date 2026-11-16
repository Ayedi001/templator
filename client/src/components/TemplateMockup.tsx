import type { Template } from '../lib/types';

export function TemplateMockup({ template, className = '', showChrome = true }: { template: Template; className?: string; showChrome?: boolean }) {
  const p = template.palette;
  const style = {
    '--tp-primary': p.primary,
    '--tp-secondary': p.secondary,
    '--tp-accent': p.accent,
    '--tp-bg': p.bg,
    '--tp-surface': p.surface,
    '--tp-text': p.text,
    '--tp-muted': p.muted,
    '--tp-line': p.line,
    '--tp-heading': template.fonts.heading,
    '--tp-body': template.fonts.body,
    '--tp-radius': template.radius,
  } as React.CSSProperties;
  const words = template.demo.headline.replace(/[.!?]/g, '').split(' ');
  const shortHeadline = words.slice(0, 6).join(' ');
  return (
    <div className={`tpl-mock layout-${template.layout} hero-${template.hero} nav-${template.nav} card-${template.card} ${className}`} style={style}>
      {showChrome && (
        <div className="tpl-chrome">
          <span className="tpl-dots"><i /><i /><i /></span>
          <span className="tpl-url">{template.id.replace(/-/g, '')}.nexora.site</span>
          <span className="tpl-lock" />
        </div>
      )}
      <div className="tpl-view">
        <div className="tpl-nav">
          <span className="tpl-logo">{template.name}</span>
          <span className="tpl-links"><i /><i /><i /></span>
          <span className="tpl-nav-cta" />
        </div>
        <div className="tpl-hero">
          <div className="tpl-copy">
            <span className="tpl-eyebrow">{template.demo.eyebrow.split('/')[0]}</span>
            <strong>{shortHeadline}</strong>
            <span className="tpl-sub">{template.demo.subheadline.split('.')[0]}.</span>
            <span className="tpl-cta">{template.demo.primaryCta}</span>
          </div>
          <div className="tpl-visual">
            <img src={template.image} alt="" loading="lazy" />
            {template.layout === 'bento' && <span className="tpl-tile-detail" />}
          </div>
          {template.layout === 'editorial' && (
            <div className="tpl-editorial-index">
              <span>01</span><span>02</span><span>03</span>
            </div>
          )}
        </div>
        <div className="tpl-meta-row">
          <span>{template.style}</span>
          <span className="tpl-meta-line" />
          <span>{template.categoryName}</span>
        </div>
        <div className="tpl-cards">
          {[template.image2, template.demo.gallery[1] || template.image, template.demo.gallery[2] || template.image].map((src, i) => (
            <div className={`tpl-card tpl-card-${i + 1}`} key={i}>
              <img src={src} alt="" loading="lazy" />
              <span>{template.demo.items[i]?.name || ['Collection', 'Editorial', 'Details'][i]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
