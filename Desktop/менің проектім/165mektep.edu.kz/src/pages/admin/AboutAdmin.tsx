import { useEffect, useState, type FormEvent } from 'react';
import { Field } from '../../components/ui';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../lib/supabase';
import { friendlyError } from '../../lib/errors';
import { about } from '../../content/kk';
import { parseJson, type AboutContent } from '../../lib/settings';
import { ContentManager } from './ContentManager';

export default function AboutAdmin() {
  const { settings, reload } = useSettings();
  const toast = useToast();
  const [vals, setVals] = useState<AboutContent>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => { setVals(parseJson<AboutContent>(settings.about_content, {})); }, [settings]);
  const set = (key: keyof AboutContent, value: string) => setVals((v) => ({ ...v, [key]: value }));

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const clean: AboutContent = {};
      (Object.keys(vals) as (keyof AboutContent)[]).forEach((k) => { const v = vals[k]?.trim(); if (v) clean[k] = v; });
      const { error } = await supabase.from('site_settings').upsert(
        { key: 'about_content', value: JSON.stringify(clean) }, { onConflict: 'key' },
      );
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
          <h1>Мектеп туралы</h1>
          <p className="muted small">Тарих, миссия, мақсат мәтіндері және мұғалімдер/жетістіктер бөлек басқарылады.</p>
        </div>
      </div>

      <form className="card pad form" onSubmit={save} noValidate>
        <h2>Негізгі мәтіндер</h2>
        <Field label="Кіріспе (беттің басында)"><textarea className="input" rows={3} value={vals.intro ?? ''}
          onChange={(e) => set('intro', e.target.value)} placeholder={about.intro} /></Field>
        <Field label="Мектеп тарихы" hint="Әр абзацты жаңа жолдан бастаңыз. Бос болса — әдепкі мәтін қолданылады.">
          <textarea className="input" rows={6} value={vals.history ?? ''}
            onChange={(e) => set('history', e.target.value)} placeholder={about.history.join('\n\n')} />
        </Field>
        <div className="grid grid-2 tight">
          <Field label="Миссия"><textarea className="input" rows={4} value={vals.mission ?? ''}
            onChange={(e) => set('mission', e.target.value)} placeholder={about.mission} /></Field>
          <Field label="Мақсат"><textarea className="input" rows={4} value={vals.goal ?? ''}
            onChange={(e) => set('goal', e.target.value)} placeholder={about.goal} /></Field>
        </div>
        <div className="row end"><button className="btn btn-gold" disabled={busy}>{busy ? 'Сақталуда...' : 'Сақтау'}</button></div>
      </form>

      <ContentManager kinds={['teacher', 'achievement', 'student_achievement']} title="Мұғалімдер және жетістіктер" />
    </div>
  );
}
