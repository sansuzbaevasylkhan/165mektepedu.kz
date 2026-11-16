import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthShell, type AuthRole } from './AuthShell';
import { PhoneInput } from '../components/PhoneInput';
import { Field, PasswordInput } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { isValidPhone } from '../lib/phone';
import { friendlyError } from '../lib/errors';
import { useSeo } from '../lib/seo';
import { useT } from '../i18n';

const NAME_RE = /^[\p{L}][\p{L}\-' ]{1,58}$/u;

function RegisterForm({ role }: { role: AuthRole }) {
  const t = useT();
  const { signUp } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [phone, setPhone] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [agree, setAgree] = useState(false);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const lastOk = NAME_RE.test(lastName.trim());
  const firstOk = NAME_RE.test(firstName.trim());
  const phoneOk = isValidPhone(phone);
  const pwOk = pw.length >= 8;
  const matchOk = pw === pw2;
  const valid = lastOk && firstOk && phoneOk && pwOk && pw2.length > 0 && matchOk;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setError(null);
    if (!valid || !agree) return;
    setBusy(true);
    try {
      const r = await signUp({ role, firstName, lastName, phoneDigits: phone, password: pw });
      if (r.hasSession) {
        toast.show(t('auth.registerOk'), 'success');
        nav('/cabinet', { replace: true });
      } else {
        setError(t('auth.noSession'));
      }
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="form">
      <Field label={t('auth.lastName')} error={touched && !lastOk ? t('auth.nameInvalid') : null}>
        <input className="input" value={lastName} maxLength={60} autoComplete="family-name"
          onChange={(e) => setLastName(e.target.value)} />
      </Field>
      <Field label={t('auth.firstName')} error={touched && !firstOk ? t('auth.nameInvalid') : null}>
        <input className="input" value={firstName} maxLength={60} autoComplete="given-name"
          onChange={(e) => setFirstName(e.target.value)} />
      </Field>
      <PhoneInput id="reg-phone" label={t('auth.phone')} value={phone} onChange={setPhone}
        error={touched && !phoneOk ? t('auth.phoneInvalid') : null} />
      <PasswordInput id="reg-pass" label={t('auth.passwordNew')} showLabel={t('auth.showPassword')}
        value={pw} onChange={setPw} autoComplete="new-password"
        error={touched && !pwOk ? t('auth.passwordShort') : null} />
      <PasswordInput id="reg-pass2" label={t('auth.passwordRepeat')} showLabel={t('auth.showPassword')}
        value={pw2} onChange={setPw2} autoComplete="new-password"
        error={pw2.length > 0 && !matchOk ? t('auth.passwordMismatch') : null} />

      <label className="check">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
        <span>
          {t('auth.policyText')}{' '}
          <Link to="/privacy" target="_blank" rel="noopener" className="link-gold">{t('auth.policyLink')}</Link>
        </span>
      </label>

      {error && <div className="alert alert-error" role="alert">{error}</div>}

      {/* Келісім белгіленбесе немесе өрістер толық болмаса — ТІРКЕЛУ батырмасы көрсетілмейді */}
      {agree && valid && (
        <button className="btn btn-gold btn-block pop-in" disabled={busy}>
          {busy ? t('common.loading') : t('auth.registerBtn')}
        </button>
      )}
    </form>
  );
}

export default function Register() {
  const t = useT();
  const [role, setRole] = useState<AuthRole>('student');
  useSeo(t('auth.registerTitle'), '165 MEKTEP порталына оқушы немесе ата-ана ретінде тіркелу.', '/register');
  return (
    <AuthShell title={t('auth.registerTitle')} role={role} onRole={setRole}
      footer={<span>{t('auth.haveAccount')} <Link to="/login" className="link-gold">{t('nav.login')}</Link></span>}>
      <RegisterForm key={role} role={role} />
    </AuthShell>
  );
}
