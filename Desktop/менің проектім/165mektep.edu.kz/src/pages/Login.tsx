import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthShell, type AuthRole } from './AuthShell';
import { PhoneInput } from '../components/PhoneInput';
import { PasswordInput } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { isValidPhone } from '../lib/phone';
import { friendlyError } from '../lib/errors';
import { useSeo } from '../lib/seo';
import { useT } from '../i18n';

function LoginForm({ role, gate }: { role: AuthRole; gate?: boolean }) {
  const t = useT();
  const { signIn, signOut } = useAuth();
  const nav = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isValidPhone(phone) || !password) { setError(t('auth.loginFail')); return; }
    setBusy(true);
    try {
      const p = await signIn(phone, password);
      const staff = p.role === 'admin' || p.role === 'director' || p.role === 'teacher';
      if (!staff && p.role !== role) {
        await signOut();
        setError(t('auth.wrongRole'));
        return;
      }
      if (!gate) {
        const dest = p.role === 'admin' ? '/admin'
          : p.role === 'director' ? '/direktor-admin'
          : p.role === 'teacher' ? '/teacher' : '/cabinet';
        nav(dest, { replace: true });
      }
    } catch (err) {
      const msg = friendlyError(err);
      setError(msg.includes('Телефон нөмірі немесе') ? t('auth.loginFail') : msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="form">
      <PhoneInput id="login-phone" label={t('auth.phone')} value={phone} onChange={setPhone} />
      <PasswordInput id="login-pass" label={t('auth.password')} showLabel={t('auth.showPassword')}
        value={password} onChange={setPassword} autoComplete="current-password" />
      {error && <div className="alert alert-error" role="alert">{error}</div>}
      <button className="btn btn-gold btn-block" disabled={busy}>{busy ? t('common.loading') : t('auth.loginBtn')}</button>
    </form>
  );
}

export default function Login({ gate = false }: { gate?: boolean }) {
  const t = useT();
  const [role, setRole] = useState<AuthRole>('student');
  useSeo(gate ? t('auth.needLogin') : t('auth.loginTitle'), 'Жүйеге кіру — 165 MEKTEP.', '/login');
  return (
    <AuthShell
      title={gate ? t('auth.needLogin') : t('auth.loginTitle')}
      subtitle={gate ? t('auth.needLoginText') : undefined}
      role={role} onRole={setRole}
      footer={<span>{t('auth.noAccount')} <Link to="/register" className="link-gold">{t('nav.register')}</Link></span>}
    >
      <LoginForm key={role} role={role} gate={gate} />
    </AuthShell>
  );
}
