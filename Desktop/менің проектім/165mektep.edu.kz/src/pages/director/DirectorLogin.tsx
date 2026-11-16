import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogoMark } from '../../components/Logo';
import { PhoneInput } from '../../components/PhoneInput';
import { PasswordInput } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { isValidPhone } from '../../lib/phone';
import { friendlyError } from '../../lib/errors';
import { useSeo } from '../../lib/seo';

export default function DirectorLogin() {
  useSeo('Директор кіруі', '165 MEKTEP директор панеліне кіру.', '/direktor-admin/login');
  const { signIn, signOut, profile, loading } = useAuth();
  const { settings } = useSettings();
  const nav = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && profile?.role === 'director') nav('/direktor-admin', { replace: true });
  }, [loading, profile, nav]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isValidPhone(phone) || !password) { setError('Телефон нөмірі мен құпия сөзді толық енгізіңіз.'); return; }
    setBusy(true);
    try {
      const p = await signIn(phone, password);
      if (p.role !== 'director') {
        await signOut();
        setError('Бұл аккаунтқа директор құқығы берілмеген.');
        return;
      }
      nav('/direktor-admin', { replace: true });
    } catch (err) {
      setError(friendlyError(err));
    } finally { setBusy(false); }
  };

  return (
    <section className="admin-auth">
      <div className="admin-auth-card glass">
        <div className="admin-auth-brand">
          <LogoMark size={64} src={settings.logo_url?.trim() || null} />
          <span className="logo-text big">{settings.school_name?.trim() || '165 MEKTEP'}</span>
        </div>
        <span className="admin-auth-kicker">DIRECTOR ACCESS</span>
        <h1>Директор панеліне кіру</h1>
        <p className="muted small">
          Сабақ кестесін басқару құқығы тек директор рөліне берілген. Рөл сервер жағында тексеріледі.
        </p>
        <form className="form" onSubmit={submit} noValidate>
          <PhoneInput id="director-phone" label="Телефон нөмірі" value={phone} onChange={setPhone} />
          <PasswordInput id="director-pass" label="Құпия сөз" showLabel="Құпия сөзді көрсету"
            value={password} onChange={setPassword} autoComplete="current-password" />
          {error && <div className="alert alert-error" role="alert">{error}</div>}
          <button className="btn btn-gold btn-block" disabled={busy}>{busy ? 'Тексерілуде...' : 'Кіру'}</button>
        </form>
        <div className="admin-auth-footer">
          <Link to="/" className="link-gold">← Сайтқа оралу</Link>
        </div>
      </div>
    </section>
  );
}
