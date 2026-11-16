import { useEffect, useState, type FormEvent } from 'react';
import { Field } from '../../components/ui';
import { ImageUpload } from '../../components/ImageUpload';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../lib/supabase';
import { friendlyError } from '../../lib/errors';
import { isHttpUrl } from '../../lib/util';

const KEYS = ['app_name', 'app_logo_url', 'google_play_url', 'app_store_url', 'google_play_active', 'app_store_active'];

export default function AppsAdmin() {
  const { settings, reload } = useSettings();
  const toast = useToast();
  const [vals, setVals] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => { setVals(settings); }, [settings]);
  const set = (key: string, value: string) => setVals((v) => ({ ...v, [key]: value }));

  const save = async (e: FormEvent) => {
    e.preventDefault();
    for (const key of ['google_play_url', 'app_store_url']) {
      const v = (vals[key] ?? '').trim();
      if (v && !isHttpUrl(v)) { toast.show('Дүкен сілтемесі https:// бастап жазылуы керек', 'error'); return; }
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

  const gp = (vals.google_play_url ?? '').trim();
  const as = (vals.app_store_url ?? '').trim();

  return (
    <div className="stack-lg">
      <div className="section-row">
        <div>
          <h1>Google Play / App Store</h1>
          <p className="muted small">Тек ресми дүкен сілтемелерін қосыңыз. Сілтеме жоқ болса, батырма «Жақында» күйінде көрсетіледі — жалған сілтеме қойылмайды.</p>
        </div>
      </div>

      <div className="grid grid-2">
        <form className="card pad form" onSubmit={save} noValidate>
          <h2>Қосымша</h2>
          <Field label="Қосымша атауы"><input className="input" value={vals.app_name ?? ''} onChange={(e) => set('app_name', e.target.value)} placeholder="165 MEKTEP" /></Field>
          <ImageUpload bucket="site-media" label="Қосымша логотипі" value={vals.app_logo_url || null} onChange={(u) => set('app_logo_url', u ?? '')} />

          <h2>Google Play</h2>
          <Field label="Дүкен сілтемесі" hint="https://play.google.com/store/apps/details?id=...">
            <input className="input" value={vals.google_play_url ?? ''} onChange={(e) => set('google_play_url', e.target.value)} placeholder="https://play.google.com/..." />
          </Field>
          <label className="check"><input type="checkbox" checked={vals.google_play_active !== 'false'}
            onChange={(e) => set('google_play_active', e.target.checked ? 'true' : 'false')} /><span>Сайтта көрсету</span></label>

          <h2>App Store</h2>
          <Field label="Дүкен сілтемесі" hint="https://apps.apple.com/...">
            <input className="input" value={vals.app_store_url ?? ''} onChange={(e) => set('app_store_url', e.target.value)} placeholder="https://apps.apple.com/..." />
          </Field>
          <label className="check"><input type="checkbox" checked={vals.app_store_active !== 'false'}
            onChange={(e) => set('app_store_active', e.target.checked ? 'true' : 'false')} /><span>Сайтта көрсету</span></label>

          <div className="row end"><button className="btn btn-gold" disabled={busy}>{busy ? 'Сақталуда...' : 'Сақтау'}</button></div>
        </form>

        <div className="card pad">
          <h2>Алдын ала көрініс</h2>
          <p className="muted small">Footer-дегі батырмалар осылай көрінеді.</p>
          <div className="store-preview">
            <div className="admin-preview-head">
              {vals.app_logo_url ? <img src={vals.app_logo_url} alt="" className="thumb" /> : <div className="adv-icon">APP</div>}
              <b>{vals.app_name?.trim() || '165 MEKTEP'}</b>
            </div>
            <div className="stores">
              {vals.google_play_active !== 'false' && (gp
                ? <a className="store" href={gp} target="_blank" rel="noopener noreferrer"><span><small>{vals.app_name || 'Google Play'}</small><b>Google Play</b></span></a>
                : <span className="store disabled"><span><small>Жақында</small><b>Google Play</b></span></span>)}
              {vals.app_store_active !== 'false' && (as
                ? <a className="store" href={as} target="_blank" rel="noopener noreferrer"><span><small>{vals.app_name || 'App Store'}</small><b>App Store</b></span></a>
                : <span className="store disabled"><span><small>Жақында</small><b>App Store</b></span></span>)}
            </div>
          </div>
          <p className="muted small">Ескерту: сілтеме енгізілмесе, жалған URL жасалмайды.</p>
        </div>
      </div>
    </div>
  );
}
