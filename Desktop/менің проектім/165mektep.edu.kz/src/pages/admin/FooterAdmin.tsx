import { useEffect, useState, type FormEvent } from 'react';
import { Field } from '../../components/ui';
import { Logo } from '../../components/Logo';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../lib/supabase';
import { friendlyError } from '../../lib/errors';
import { useT } from '../../i18n';

const KEYS = ['footer_about', 'copyright', 'school_name', 'address', 'phone', 'email'];

export default function FooterAdmin() {
  const { settings, reload } = useSettings();
  const toast = useToast();
  const t = useT();
  const [vals, setVals] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => { setVals(settings); }, [settings]);
  const set = (key: string, value: string) => setVals((v) => ({ ...v, [key]: value }));

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const rows = KEYS.map((key) => ({ key, value: (vals[key] ?? '').trim() }));
      const { error } = await supabase.from('site_settings').upsert(rows, { onConflict: 'key' });
      if (error) throw error;
      await reload();
      toast.show('Сақталды', 'success');
    } catch (err) { toast.show(friendlyError(err), 'error'); }
    finally { setBusy(false); }
  };

  const about = vals.footer_about?.trim() || t('footer.about');
  const copyright = vals.copyright?.trim() || `© ${new Date().getFullYear()} ${vals.school_name?.trim() || '165 MEKTEP'}.`;

  return (
    <div className="stack-lg">
      <div className="section-row">
        <div>
          <h1>Footer басқару</h1>
          <p className="muted small">Footer мәтіні, авторлық құқық және байланыс. Әлеуметтік желілер мен дүкен сілтемелері бөлек бөлімдерде басқарылады.</p>
        </div>
      </div>

      <div className="grid grid-2">
        <form className="card pad form" onSubmit={save} noValidate>
          <Field label="Мектеп атауы (логотипте де көрінеді)"><input className="input" value={vals.school_name ?? ''} onChange={(e) => set('school_name', e.target.value)} /></Field>
          <Field label="Footer сипаттамасы"><textarea className="input" rows={3} value={vals.footer_about ?? ''} onChange={(e) => set('footer_about', e.target.value)} /></Field>
          <Field label="Авторлық құқық мәтіні" hint="Бос болса автоматты түрде жыл мен мектеп атауы қойылады">
            <input className="input" value={vals.copyright ?? ''} onChange={(e) => set('copyright', e.target.value)} placeholder={`© ${new Date().getFullYear()} 165 MEKTEP.`} />
          </Field>
          <div className="grid grid-2 tight">
            <Field label="Телефон"><input className="input" value={vals.phone ?? ''} onChange={(e) => set('phone', e.target.value)} /></Field>
            <Field label="Email"><input className="input" value={vals.email ?? ''} onChange={(e) => set('email', e.target.value)} /></Field>
          </div>
          <Field label="Мекенжай"><input className="input" value={vals.address ?? ''} onChange={(e) => set('address', e.target.value)} /></Field>
          <div className="row end"><button className="btn btn-gold" disabled={busy}>{busy ? 'Сақталуда...' : 'Сақтау'}</button></div>
        </form>

        <div className="card pad">
          <div className="section-row"><h2>Мобильді көрініс</h2><span className="badge badge-open">Preview</span></div>
          <div className="phone-frame">
            <div className="phone-frame-inner">
              <Logo />
              <p className="small">{about}</p>
              <div className="footer-links small">
                <span>{t('footer.quick')}</span>
                <span>{t('footer.contact')}</span>
                <span>{t('footer.social')}</span>
              </div>
              <div className="preview-contacts small">
                <span>{vals.address?.trim() || t('footer.soon')}</span>
                <span>{vals.phone?.trim() || t('footer.soon')}</span>
                <span>{vals.email?.trim() || t('footer.soon')}</span>
              </div>
              <div className="preview-legal small muted">{copyright}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
