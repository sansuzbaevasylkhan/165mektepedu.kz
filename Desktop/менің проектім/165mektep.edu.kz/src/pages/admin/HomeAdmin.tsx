import { useEffect, useState, type FormEvent } from 'react';
import { Field } from '../../components/ui';
import { ImageUpload } from '../../components/ImageUpload';
import { Icon } from '../../components/Icons';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../lib/supabase';
import { friendlyError } from '../../lib/errors';
import { HOME_SECTIONS, homeSectionOrder, parseJson, safeHref, ADVANTAGE_ICONS, parseAdvantages, parseDirections,
  type HomeContent, type HomeSectionId, type AdvantageItem, type DirectionBlock } from '../../lib/settings';

export default function HomeAdmin() {
  const { settings, reload } = useSettings();
  const toast = useToast();
  const [vals, setVals] = useState<HomeContent>({});
  const [image, setImage] = useState('');
  const [order, setOrder] = useState<HomeSectionId[]>([]);
  const [adv, setAdv] = useState<AdvantageItem[]>([]);
  const [dirs, setDirs] = useState<DirectionBlock[]>([]);
  const [dirItems, setDirItems] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setVals(parseJson<HomeContent>(settings.home_content, {}));
    setImage(settings.hero_image_url ?? '');
    setOrder(homeSectionOrder(settings.home_sections));
    setAdv(parseAdvantages(settings.home_advantages));
    const parsed = parseDirections(settings.home_directions);
    setDirs(parsed);
    setDirItems(Object.fromEntries(parsed.map((d) => [d.id, d.items.map((i) => `${i.title} | ${i.text}`).join('\n')])));
  }, [settings]);

  const set = (key: keyof HomeContent, value: string) => setVals((v) => ({ ...v, [key]: value }));

  const move = (index: number, dir: -1 | 1) => {
    const next = [...order];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    for (const key of ['primary_link', 'secondary_link'] as const) {
      const v = vals[key]?.trim();
      if (v && !safeHref(v)) { toast.show('Батырма сілтемесі /жол немесе https:// түрінде болуы керек', 'error'); return; }
    }
    setBusy(true);
    try {
      const clean: HomeContent = {};
      (Object.keys(vals) as (keyof HomeContent)[]).forEach((k) => { const v = vals[k]?.trim(); if (v) clean[k] = v; });
      const cleanAdv = adv.filter((a) => a.title.trim()).map((a) => ({ icon: a.icon, title: a.title.trim(), text: a.text.trim() }));
      const cleanDirs = dirs.filter((d) => d.tab.trim()).map((d) => ({
        id: d.id, tab: d.tab.trim(), title: (d.title || d.tab).trim(), text: d.text.trim(),
        items: (dirItems[d.id] ?? '').split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
          const [title, ...rest] = line.split('|');
          return { title: title.trim(), text: rest.join('|').trim() };
        }).filter((it) => it.title),
      }));
      const rows = [
        { key: 'home_content', value: JSON.stringify(clean) },
        { key: 'home_sections', value: JSON.stringify(order) },
        { key: 'hero_image_url', value: image.trim() },
        { key: 'home_advantages', value: JSON.stringify(cleanAdv) },
        { key: 'home_directions', value: JSON.stringify(cleanDirs) },
      ];
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
        <div>
          <h1>Басты бетті басқару</h1>
          <p className="muted small">Кодсыз өзгерту: hero мәтіні, батырмалар, сурет және бөлімдер реті.</p>
        </div>
      </div>

      <form className="card pad form" onSubmit={save} noValidate>
        <h2>Hero (басты экран)</h2>
        <Field label="Үстіңгі жазу (eyebrow)"><input className="input" value={vals.eyebrow ?? ''} onChange={(e) => set('eyebrow', e.target.value)} placeholder="165 MEKTEP" /></Field>
        <Field label="Негізгі тақырып"><input className="input" value={vals.hero_title ?? ''} onChange={(e) => set('hero_title', e.target.value)} placeholder="«Білім — болашаққа бастар жол»" /></Field>
        <Field label="Қосымша мәтін"><textarea className="input" rows={2} value={vals.hero_subtitle ?? ''} onChange={(e) => set('hero_subtitle', e.target.value)} /></Field>
        <div className="grid grid-2 tight">
          <Field label="Бірінші батырма мәтіні"><input className="input" value={vals.primary_text ?? ''} onChange={(e) => set('primary_text', e.target.value)} /></Field>
          <Field label="Бірінші батырма сілтемесі" hint="/ubt немесе https://..."><input className="input" value={vals.primary_link ?? ''} onChange={(e) => set('primary_link', e.target.value)} /></Field>
          <Field label="Екінші батырма мәтіні"><input className="input" value={vals.secondary_text ?? ''} onChange={(e) => set('secondary_text', e.target.value)} /></Field>
          <Field label="Екінші батырма сілтемесі" hint="/about немесе https://..."><input className="input" value={vals.secondary_link ?? ''} onChange={(e) => set('secondary_link', e.target.value)} /></Field>
        </div>
        <ImageUpload bucket="site-media" label="Hero суреті" value={image || null} onChange={(u) => setImage(u ?? '')} />

        <h2>«Мектеп туралы» блогы</h2>
        <Field label="Блок тақырыбы"><input className="input" value={vals.about_title ?? ''} onChange={(e) => set('about_title', e.target.value)} /></Field>
        <Field label="Блок мәтіні"><textarea className="input" rows={3} value={vals.about_intro ?? ''} onChange={(e) => set('about_intro', e.target.value)} /></Field>

        <h2>Мектептің артықшылықтары</h2>
        <p className="muted small">Иконка, тақырып және сипаттама. Бос қалдырсаңыз — әдепкі тізім қолданылады.</p>
        <div className="order-list">
          {adv.map((a, i) => (
            <div key={i} className="block-row">
              <select className="input" aria-label="Иконка" value={a.icon}
                onChange={(e) => setAdv(adv.map((x, j) => (j === i ? { ...x, icon: e.target.value } : x)))}>
                {ADVANTAGE_ICONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
              </select>
              <input className="input" placeholder="Тақырып" value={a.title}
                onChange={(e) => setAdv(adv.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
              <input className="input" placeholder="Сипаттама" value={a.text}
                onChange={(e) => setAdv(adv.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} />
              <button type="button" className="icon-btn" aria-label="Жолды өшіру" onClick={() => setAdv(adv.filter((_, j) => j !== i))}>✕</button>
            </div>
          ))}
        </div>
        <button type="button" className="btn btn-ghost btn-sm" disabled={adv.length >= 9}
          onClick={() => setAdv([...adv, { icon: 'star', title: '', text: '' }])}>Артықшылық қосу</button>

        <h2>Білім беру бағыттары</h2>
        <p className="muted small">Қойынды атауы, кіріспе мәтін және элементтер. Элементтер әр жолға «Тақырып | Сипаттама» түрінде жазылады.</p>
        {dirs.map((d, i) => (
          <div key={d.id} className="card pad stack">
            <div className="grid grid-2 tight">
              <Field label="Қойынды атауы"><input className="input" value={d.tab}
                onChange={(e) => setDirs(dirs.map((x, j) => (j === i ? { ...x, tab: e.target.value } : x)))} /></Field>
              <Field label="Тақырып"><input className="input" value={d.title}
                onChange={(e) => setDirs(dirs.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} /></Field>
            </div>
            <Field label="Кіріспе мәтін"><textarea className="input" rows={2} value={d.text}
              onChange={(e) => setDirs(dirs.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} /></Field>
            <Field label="Элементтер" hint="Әр жол: Тақырып | Сипаттама">
              <textarea className="input" rows={4} value={dirItems[d.id] ?? ''}
                onChange={(e) => setDirItems({ ...dirItems, [d.id]: e.target.value })} />
            </Field>
            <div className="row end">
              <button type="button" className="btn btn-danger btn-sm" onClick={() => setDirs(dirs.filter((_, j) => j !== i))}>Бағытты өшіру</button>
            </div>
          </div>
        ))}
        <button type="button" className="btn btn-ghost btn-sm"
          onClick={() => {
            const id = `dir-${Date.now()}`;
            setDirs([...dirs, { id, tab: 'Жаңа бағыт', title: 'Жаңа бағыт', text: '', items: [] }]);
            setDirItems({ ...dirItems, [id]: '' });
          }}>Бағыт қосу</button>

        <h2>Бөлімдер реті</h2>
        <p className="muted small">Жоғары/төмен жылжытып ретті өзгертіңіз. Hero әрқашан бірінші тұрады.</p>
        <div className="order-list">
          {order.map((id, i) => {
            const meta = HOME_SECTIONS.find((s) => s[0] === id);
            return (
              <div key={id} className="order-row">
                <span className="order-n">{i + 1}</span>
                <b>{meta?.[1] ?? id}</b>
                <div className="row">
                  <button type="button" className="icon-btn" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Жоғары"><Icon name="chevron" size={16} /></button>
                  <button type="button" className="icon-btn" disabled={i === order.length - 1} onClick={() => move(i, 1)} aria-label="Төмен"><Icon name="chevron" size={16} /></button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="row end">
          <button type="button" className="btn btn-ghost" onClick={() => setOrder(homeSectionOrder(''))}>Әдепкі рет</button>
          <button className="btn btn-gold" disabled={busy}>{busy ? 'Сақталуда...' : 'Сақтау'}</button>
        </div>
      </form>
    </div>
  );
}
