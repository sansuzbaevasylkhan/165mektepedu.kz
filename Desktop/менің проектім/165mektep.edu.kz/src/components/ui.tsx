import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Icon } from './Icons';
import { useT } from '../i18n';

export function Spinner({ label }: { label?: string }) {
  const t = useT();
  return (
    <div className="state" role="status">
      <div className="spinner" />
      <p>{label ?? t('common.loading')}</p>
    </div>
  );
}

export function Empty({ title, text, action }: { title?: string; text?: string; action?: ReactNode }) {
  const t = useT();
  return (
    <div className="state empty">
      <div className="state-icon"><Icon name="spark" size={28} /></div>
      <h3>{title ?? t('common.empty')}</h3>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const t = useT();
  return (
    <div className="state error">
      <h3>{t('common.error')}</h3>
      <p>{message}</p>
      {onRetry && <button className="btn btn-ghost" onClick={onRetry}>{t('common.retry')}</button>}
    </div>
  );
}

export function ProgressBar({ value, label, slim }: { value: number; label?: string; slim?: boolean }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={`progress ${slim ? 'slim' : ''}`}>
      {label && <div className="progress-head"><span>{label}</span><b>{v}%</b></div>}
      <div className="progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={v}>
        <div className="progress-fill" style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

export function Ring({ value, size = 132 }: { value: number; size?: number }) {
  const v = Math.max(0, Math.min(100, value));
  const r = size / 2 - 10;
  const c = 2 * Math.PI * r;
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} className="ring-bg" />
        <circle cx={size / 2} cy={size / 2} r={r} className="ring-fg"
          strokeDasharray={c} strokeDashoffset={c - (c * v) / 100}
          transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <span>{Math.round(v)}%</span>
    </div>
  );
}

export function Modal({ title, onClose, children, wide }: {
  title: string; onClose: () => void; children: ReactNode; wide?: boolean;
}) {
  const t = useT();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.classList.add('no-scroll');
    ref.current?.focus();
    return () => { document.removeEventListener('keydown', onKey); document.body.classList.remove('no-scroll'); };
  }, [onClose]);
  return (
    <div className="modal-back" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`modal glass ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label={t('nav.close')}><Icon name="close" /></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export function useConfirm() {
  const t = useT();
  return (text?: string) => window.confirm(text ?? t('common.confirmDelete'));
}

export function Field({ label, error, hint, children }: {
  label: string; error?: string | null; hint?: string; children: ReactNode;
}) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && !error && <span className="field-hint">{hint}</span>}
      {error && <span className="field-error" role="alert">{error}</span>}
    </label>
  );
}

export function PasswordInput({ id, value, onChange, autoComplete, label, showLabel, error }: {
  id?: string; value: string; onChange: (v: string) => void; autoComplete: string;
  label: string; showLabel: string; error?: string | null;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>{label}</label>
      <input id={id} className="input" type={show ? 'text' : 'password'} value={value}
        autoComplete={autoComplete} onChange={(e) => onChange(e.target.value)} />
      <label className="check small">
        <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />
        <span>{showLabel}</span>
      </label>
      {error && <span className="field-error" role="alert">{error}</span>}
    </div>
  );
}

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    fn().then((d) => { if (alive) setData(d); })
      .catch((e) => { if (alive) setError(e); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  return { data, error, loading, reload: () => setTick((x) => x + 1), setData };
}
