import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

export function PageLoader({ label = 'Loading your studio' }: { label?: string }) {
  return (
    <div className="page-loader">
      <Loader2 className="spin" size={28} />
      <p>{label}</p>
    </div>
  );
}

export function Spinner({ dark = false, large = false }: { dark?: boolean; large?: boolean }) {
  return <span className={`spinner${dark ? ' dark' : ''}${large ? ' lg' : ''}`} />;
}

export function StatusBadge({ status }: { status?: string }) {
  const value = status || 'none';
  return <span className={`badge ${value}`}>{value.replace(/_/g, ' ')}</span>;
}

export function PageHeader({
  eyebrow, title, description, actions,
}: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) {
  return (
    <header className="dash-page-head">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="dash-page-actions">{actions}</div>}
    </header>
  );
}

export function EmptyState({
  icon, title, description, action,
}: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-icon">{icon}</div>}
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action && <div className="mt-8">{action}</div>}
    </div>
  );
}
