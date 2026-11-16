import { useEffect } from 'react';

/**
 * Көшіруден интерфейстік қорғаныс. Бұл тек "оңай көшіруді" қиындатады —
 * браузерде 100% тыйым салу мүмкін емес. Негізгі қауіпсіздік серверде (RLS/RPC).
 * Енгізу өрістері мен `.allow-copy` аймағы (admin кестелері) бұл шектеуден тыс.
 */
export function CopyGuard() {
  useEffect(() => {
    const allowed = (t: EventTarget | null) =>
      t instanceof Element && t.closest('input, textarea, select, [contenteditable="true"], .allow-copy') !== null;

    const onContext = (e: MouseEvent) => { if (!allowed(e.target)) e.preventDefault(); };
    const onCopy = (e: ClipboardEvent) => { if (!allowed(document.activeElement)) e.preventDefault(); };
    const onDrag = (e: DragEvent) => { if (!allowed(e.target)) e.preventDefault(); };
    const onSelectStart = (e: Event) => { if (!allowed(e.target)) e.preventDefault(); };
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const k = e.key.toLowerCase();
      if (['c', 'x', 'u', 's', 'p', 'a'].includes(k) && !allowed(e.target)) e.preventDefault();
    };

    document.addEventListener('contextmenu', onContext);
    document.addEventListener('copy', onCopy);
    document.addEventListener('cut', onCopy);
    document.addEventListener('dragstart', onDrag);
    document.addEventListener('selectstart', onSelectStart);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('contextmenu', onContext);
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('cut', onCopy);
      document.removeEventListener('dragstart', onDrag);
      document.removeEventListener('selectstart', onSelectStart);
      document.removeEventListener('keydown', onKey);
    };
  }, []);
  return null;
}
