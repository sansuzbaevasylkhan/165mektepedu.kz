import { useEffect, useState } from 'react';
import { supabase, errMsg } from '../../lib/supabase';
import { SETTING_KEYS, useSettings, type SettingKey } from '../../lib/settings';
import type { SocialLink } from '../../lib/types';
import { ErrorBox } from '../../components/ui';
import { uploadFile } from './shared';

const FIELDS: { key: SettingKey; label: string; multi?: boolean; hint?: string }[] = [
  { key: 'school_address', label: 'Мектеп мекенжайы' },
  { key: 'school_phone', label: 'Телефон' },
  { key: 'school_email', label: 'Email' },
  { key: 'google_play_url', label: 'Google Play сілтемесі', hint: 'Қосымша жарияланғанда ғана ресми сілтемені қойыңыз' },
  { key: 'app_store_url', label: 'App Store сілтемесі', hint: 'Қосымша жарияланғанда ғана ресми сілтемені қойыңыз' },
  { key: 'hero_image_url', label: 'Басты беттегі визуал (сурет URL)', hint: 'Бос қалса, әдепкі иллюстрация көрсетіледі' },
  { key: 'about_history', label: 'Мектеп тарихы', multi: true },
  { key: 'about_mission', label: 'Миссия', multi: true },
  { key: 'about_goal', label: 'Мақсат', multi: true },
  { key: 'about_system', label: 'Білім беру жүйесі', multi: true },
  { key: 'about_teachers', label: 'Мұғалімдер', multi: true, hint: 'Әр жолға бір мұғалім: Аты-жөні | Пәні' },
  { key: 'about_achievements', label: 'Мектеп жетістіктері', multi: true, hint: 'Әр жолға бір жетістік' },
  { key: 'about_student_achievements', label: 'Оқушылардың жетістіктері', multi: true, hint: 'Әр жолға бір жетістік' },
  { key: 'gallery_urls', label: 'Фотогалерея (сурет URL-дері)', multi: true, hint: 'Әр жолға бір сурет сілтемесі; төмендегі батырмамен жүктеуге болады' },
];

const NAMES: Record<string, string> = { instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube', facebook: 'Facebook' };

export default function SettingsAdmin() {
  const { settings, social, reload } = useSettings();
  const [vals, setVals] = useState<Record<string, string>>({});
  const [soc, setSoc] = useState<SocialLink[]>([]);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const v: Record<string, string> = {};
    for (const k of SETTING_KEYS) v[k] = settings[k] ?? '';
    setVals(v);
    setSoc(social);
  }, [settings, social]);

  const save = async () => {
    setBusy(true);
    setErr('');
    setOk('');
    const rows = SETTING_KEYS.map((k) => ({ key: k, value: (vals[k] ?? '').trim(), updated_at: new Date().toISOString() }));
    const r1 = await supabase.from('site_settings').upsert(rows, { onConflict: 'key' });
    if (r1.error) {
      setBusy(false);
      return setErr(errMsg(r1.error));
    }
    for (const s of soc) {
      const url = s.url.trim();
      if (url && !/^https?:\/\//i.test(url)) {
        setBusy(false);
        return setErr(`${NAMES[s.platform]} сілтемесі https:// деп басталуы керек.`);
      }
      const r = await supabase.from('social_links').update({ url, enabled: s.enabled }).eq('id', s.id);
      if (r.error) {
        setBusy(false);
        return setErr(errMsg(r.error));
      }
    }
    await reload();
    setBusy(false);
    setOk('Баптаулар сақталды.');
  };

  const addGallery = async (f: File | undefined) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) return setErr('Тек сурет файлын жүктеңіз.');
    setBusy(true);
    try {
      const r = await uploadFile('site-media', f);
      setVals((v) => ({ ...v, gallery_urls: [v.gallery_urls, r.url].filter(Boolean).join('\n') }));
      setErr('');
    } catch (e) {
      setErr(errMsg(e));
    }
    setBusy(false);
  };

  return (
    <>
      <h2 className="admin-h">Сайт баптаулары</h2>
      {err && <ErrorBox message={err} />}
      {ok && <div className="alert ok">{ok}</div>}
      <div className="card admin-form">
        <h3>Мазмұн және байланыс</h3>
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label>{f.label}</label>
            {f.multi ? (
              <textarea rows={4} value={vals[f.key] ?? ''} onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })} />
            ) : (
              <input value={vals[f.key] ?? ''} onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })} />
            )}
            {f.hint && <small className="muted">{f.hint}</small>}
            {f.key === 'gallery_urls' && <input type="file" accept="image/*" onChange={(e) => addGallery(e.target.files?.[0])} />}
          </div>
        ))}

        <h3>Әлеуметтік желілер</h3>
        {soc.map((s, i) => (
          <div key={s.id} className="soc-edit">
            <b>{NAMES[s.platform]}</b>
            <input placeholder="https://…" value={s.url} onChange={(e) => setSoc(soc.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
            <label className="check"><input type="checkbox" checked={s.enabled} onChange={(e) => setSoc(soc.map((x, j) => (j === i ? { ...x, enabled: e.target.checked } : x)))} /><span>Көрсету</span></label>
          </div>
        ))}
        <div className="row-btns"><button className="btn btn-gold" disabled={busy} onClick={save}>{busy ? 'Сақталуда…' : 'Барлығын сақтау'}</button></div>
      </div>
    </>
  );
}
