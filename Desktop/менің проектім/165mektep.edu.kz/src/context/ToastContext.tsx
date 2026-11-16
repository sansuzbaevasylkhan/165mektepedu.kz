import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type Kind = 'success' | 'error' | 'info';
interface Toast { id: number; kind: Kind; text: string }
interface ToastApi { show: (text: string, kind?: Kind) => void }

const ToastContext = createContext<ToastApi>({ show: () => {} });
let counter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const show = useCallback((text: string, kind: Kind = 'info') => {
    const id = ++counter;
    setItems((l) => [...l, { id, kind, text }]);
    window.setTimeout(() => setItems((l) => l.filter((x) => x.id !== id)), 4500);
  }, []);

  const value = useMemo(() => ({ show }), [show]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`toast toast-${t.kind}`}>{t.text}</div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
