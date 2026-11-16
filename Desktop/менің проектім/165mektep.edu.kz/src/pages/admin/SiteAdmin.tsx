import { useEffect, useState, type FormEvent } from 'react';
import { Field } from '../../components/ui';
import { ImageUpload } from '../../components/ImageUpload';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../lib/supabase';
import { friendlyError } from '../../lib/errors';

const KEYS = [
  'school_name', 'logo_url', 'favicon_url', 'seo_title', 'seo_description',
  'primary_color', 'secondary_color', 'default_theme', 'site_language',
  'address', 'phone', 'email', 'working_hours',
];

export default function SiteAdmin() {
  const { settings, loaded, reload } = useSettings();
  const toast = useToast();
  const [vals, setVals] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => { setVals(settings); }, [settings]);

  const set = (key: string, value: string) => setVals((v) => ({ ...v, [key]: value }));

  const save = async (e: FormEvent) => {
    e.preventDefault();
    for (const key of ['primary_color', 'secondary_color']) {
      const v = (vals[key] ?? '').trim();
      if (v && !/^#[0-9a-f]{6}$/i.test(v)) { toast.show('Түс #RRGGBB форматында болуы керек', 'error'); return; }
    }
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

  return (
    <div className="stack-lg">
      <div className="section-row">
        <h1>Сайт баптаулары</h1>
        <span className="badge badge-open">{loaded ? 'Supabase' : 'Жүктелуде'}</span>
      </div>
      <form className="card pad form" onSubmit={save} noValidate>
        <h2>Бренд</h2>
        <div className="grid grid-2 tight">
          <Field label="Мектеп атауы"><input className="input" value={vals.school_name ?? ''} maxLength={80}
            onChange={(e) => set('school_name', e.target.value)} placeholder="165 MEKTEP" /></Field>
          <Field label="Әдепкі тақырып">
            <select className="input" value={vals.default_theme ?? 'dark'} onChange={(e) => set('default_theme', e.target.value)}>
              <option value="dark">Қара (Black & Gold)</option>
              <option value="light">Ақ (Light)</option>
            </select>
          </Field>
        </div>
        <div className="grid grid-2 tight">
          <ImageUpload bucket="site-media" label="Логотип" value={vals.logo_url || null} onChange={(u) => set('logo_url', u ?? '')} />
          <ImageUpload bucket="site-media" label="Favicon" value={vals.favicon_url || null} onChange={(u) => set('favicon_url', u ?? '')} />
        </div>
        <div className="grid grid-2 tight">
          <Field label="Негізгі түс (алтын)" hint="#FFD700">
            <input className="input" type="color" value={vals.primary_color || '#FFD700'} onChange={(e) => set('primary_color', e.target.value)} />
          </Field>
          <Field label="Қосымша түс" hint="#F5B800">
            <input className="input" type="color" value={vals.secondary_color || '#F5B800'} onChange={(e) => set('secondary_color', e.target.value)} />
          </Field>
        </div>

        <h2>SEO</h2>
        <Field label="SEO тақырыбы (title)" hint="60–70 таңба ұсынылады">
          <input className="input" value={vals.seo_title ?? ''} maxLength={160} onChange={(e) => set('seo_title', e.target.value)} />
        </Field>
        <Field label="SEO сипаттамасы (description)" hint="150–160 таңба ұсынылады">
          <textarea className="input" rows={3} value={vals.seo_description ?? ''} maxLength={320}
            onChange={(e) => set('seo_description', e.target.value)} />
        </Field>

        <h2>Тіл</h2>
        <Field label="Сайт тілі" hint="Қазіргі нұсқада қазақ тілі негізгі. Орыс/ағылшын сөздіктері қосылғанда таңдау кеңейеді.">
          <select className="input" value={vals.site_language || 'kk'} onChange={(e) => set('site_language', e.target.value)}>
            <option value="kk">Қазақша</option>
          </select>
        </Field>

        <h2>Байланыс</h2>
        <div className="grid grid-2 tight">
          <Field label="Телефон"><input className="input" value={vals.phone ?? ''} onChange={(e) => set('phone', e.target.value)} placeholder="+7 ..." /></Field>
          <Field label="Email"><input className="input" value={vals.email ?? ''} onChange={(e) => set('email', e.target.value)} placeholder="info@..." /></Field>
        </div>
        <Field label="Мекенжай"><input className="input" value={vals.address ?? ''} onChange={(e) => set('address', e.target.value)} /></Field>
        <Field label="Жұмыс уақыты"><input className="input" value={vals.working_hours ?? ''} onChange={(e) => set('working_hours', e.target.value)} placeholder="Дс–Жм 08:00–18:00" /></Field>

        <p className="muted small">Бос өрістер сайтта жалған мәліметсіз «Жақында қосылады» күйінде көрсетіледі.</p>
        <div className="row end"><button className="btn btn-gold" disabled={busy}>{busy ? 'Сақталуда...' : 'Сақтау'}</button></div>
      </form>
    </div>
  );
}
