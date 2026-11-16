import { useEffect } from 'react';

// Көшіруден интерфейстік қорғаныс. Ескерту: браузерде 100% қорғау мүмкін емес,
// негізгі қауіпсіздік сервер жағында (RLS + RPC) орындалады.
const isEditable = (t: EventTarget | null) => {
  const el = t as HTMLElement | null;
  if (!el || !el.closest) return false;
  return Boolean(el.closest('input, textarea, select, [contenteditable="true"], [data-allow-copy]'));
};

export function useCopyProtection() {
  useEffect(() => {
    const block = (e: Event) => {
      if (!isEditable(e.target)) e.preventDefault();
    };
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && ['c', 'u', 's', 'p', 'x'].includes(k) && !isEditable(e.target)) {
        e.preventDefault();
      }
    };
    document.addEventListener('contextmenu', block);
    document.addEventListener('copy', block);
    document.addEventListener('cut', block);
    document.addEventListener('dragstart', block);
    document.addEventListener('selectstart', block);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('contextmenu', block);
      document.removeEventListener('copy', block);
      document.removeEventListener('cut', block);
      document.removeEventListener('dragstart', block);
      document.removeEventListener('selectstart', block);
      document.removeEventListener('keydown', onKey);
    };
  }, []);
}
