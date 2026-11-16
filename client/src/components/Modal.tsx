import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'default' | 'wide' | 'xwide';
  className?: string;
}

export function Modal({ open, onClose, title, subtitle, children, footer, size = 'default', className = '' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.classList.add('no-scroll');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('no-scroll');
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className={`modal-backdrop ${className}`} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`modal ${size === 'wide' ? 'wide' : size === 'xwide' ? 'xwide' : ''}`} role="dialog" aria-modal="true">
        {(title || subtitle) && (
          <div className="modal-head">
            <div>
              {title && (typeof title === 'string' ? <h2>{title}</h2> : title)}
              {subtitle && <p className="muted text-sm mt-4">{subtitle}</p>}
            </div>
            <button className="icon-btn" onClick={onClose} aria-label="Close dialog"><X size={17} /></button>
          </div>
        )}
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open, onClose, onConfirm, title, children, confirmLabel = 'Confirm', danger = false, busy = false,
}: {
  open: boolean; onClose: () => void; onConfirm: () => void; title: string;
  children: ReactNode; confirmLabel?: string; danger?: boolean; busy?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={(
        <>
          <button className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className={`btn ${danger ? 'btn-danger' : ''}`} onClick={onConfirm} disabled={busy}>
            {busy && <span className="spinner" />}{confirmLabel}
          </button>
        </>
      )}
    >
      <div className="confirm-copy">{children}</div>
    </Modal>
  );
}
