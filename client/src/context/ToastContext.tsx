import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CheckCircle2, Info, X, AlertTriangle } from 'lucide-react';

type ToastKind = 'success' | 'error' | 'info';
interface ToastItem { id: number; message: string; kind: ToastKind; }

interface ToastContextValue {
  toast: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, kind: ToastKind = 'success') => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev.slice(-3), { id, message, kind }]);
    window.setTimeout(() => setItems((prev) => prev.filter((item) => item.id !== id)), 4200);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {items.map((item) => (
          <div className={`toast toast-${item.kind}`} key={item.id}>
            {item.kind === 'success' ? <CheckCircle2 size={18} /> : item.kind === 'error' ? <AlertTriangle size={18} /> : <Info size={18} />}
            <span>{item.message}</span>
            <button className="toast-close" onClick={() => setItems((prev) => prev.filter((i) => i.id !== item.id))} aria-label="Dismiss">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}
