import { Link } from 'react-router-dom';

export function Logo({ light = false, compact = false, to = '/' }: { light?: boolean; compact?: boolean; to?: string }) {
  return (
    <Link to={to} className={`brand-logo${light ? ' light' : ''}`} aria-label="Nexora Studio home">
      <span className="brand-mark" aria-hidden="true">
        <span>N</span>
        <i />
      </span>
      {!compact && (
        <span className="brand-word">
          Nexora<span>Studio</span>
        </span>
      )}
    </Link>
  );
}
