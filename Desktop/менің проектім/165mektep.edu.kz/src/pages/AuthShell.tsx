import type { ReactNode } from 'react';
import { LogoMark } from '../components/Logo';
import { useT } from '../i18n';

export type AuthRole = 'student' | 'parent';

export function AuthShell({ title, subtitle, role, onRole, children, footer }: {
  title: string; subtitle?: string; role: AuthRole; onRole: (r: AuthRole) => void;
  children: ReactNode; footer?: ReactNode;
}) {
  const t = useT();
  return (
    <section className="auth-page">
      <div className="auth-card glass">
        <div className="auth-logo"><LogoMark size={76} /><span className="logo-text big">165 <b>MEKTEP</b></span></div>
        <h1>{title}</h1>
        {subtitle && <p className="muted center">{subtitle}</p>}
        <div className="tabs" role="tablist">
          {(['student', 'parent'] as const).map((r) => (
            <button key={r} role="tab" aria-selected={role === r} type="button"
              className={`tab ${role === r ? 'active' : ''}`} onClick={() => onRole(r)}>
              {t(`role.${r}`)}
            </button>
          ))}
        </div>
        {children}
        {footer && <div className="auth-footer">{footer}</div>}
      </div>
    </section>
  );
}
