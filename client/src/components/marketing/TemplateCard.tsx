import { Link } from 'react-router-dom';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import type { Template } from '../../lib/types';
import { TemplateMockup } from '../TemplateMockup';

export function TemplateCard({ template, featuredLabel }: { template: Template; featuredLabel?: boolean }) {
  return (
    <Link to={`/templates/${template.id}`} className="template-card">
      <div className="template-card-preview">
        <TemplateMockup template={template} />
        <span className="template-card-hover">Preview design <ArrowUpRight size={15} /></span>
        {featuredLabel && template.featured && (
          <span className="template-card-pick"><Sparkles size={11} /> Curator's pick</span>
        )}
      </div>
      <div className="template-card-meta">
        <div>
          <h3>{template.name}</h3>
          <p>{template.style}</p>
        </div>
        <span className="template-card-cat">{template.categoryName}</span>
      </div>
    </Link>
  );
}
