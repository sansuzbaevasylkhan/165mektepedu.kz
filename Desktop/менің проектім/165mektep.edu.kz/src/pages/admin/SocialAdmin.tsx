import { useEffect, useState, type FormEvent } from 'react';
import { Field } from '../../components/ui';
import { Icon, type IconName } from '../../components/Icons';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../lib/supabase';
import { friendlyError } from '../../lib/errors';
import { isHttpUrl } from '../../lib/util';
import type { SocialLink } from '../../types';

const LABEL: Record<SocialLink['platform'], string> = {
  instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube', facebook: 'Facebook', telegram: 'Telegram',
};
const PLATFORMS = Object.keys(LABEL) as SocialLink['platform'][];

export default function SocialAdmin() {
  const { social, reload } = useSettings();
  const toast = useToast();
  const [rows, setRows] = useState<SocialLink[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => { setRows(social); }, [social]);

  const patch = (platform: SocialLink['platform'], value: Partial<SocialLink>) =>
    setRows((list) => list.some((r) => r.platform === platform)
      ? list.map((r) => (r.platform === platform ? { ...r, ...value } : r))
      : [...list, { platform, url: '', is_active: true, sort_order: PLATFORMS.indexOf(platform) + 1, ...value }]);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    for (const r of rows) {
      if (r.url.trim() && !isHttpUrl(r.url.trim())) {
        toast.show(`${LABEL[r.platform]}: сілтеме https:// бастап жазылуы керек`, 'error'); return;
      }
    }
    setBusy(true);
    try {
      const { error } = await supabase.from('social_links').upsert(
        rows.map((r) => ({ platform: r.platform, url: r.url.trim(), is_active: r.is_active, sort_order: r.sort_order })),
        { onConflict: 'platform' },
      );
      if (error) throw error;
      await reload();
      toast.show('Сақталды', 'success');
    } catch (err) { toast.show(friendlyError(err), 'error'); }
    finally { setBusy(false); }
  };

  const clear = async (platform: SocialLink['platform']) => {
    const { error } = await supabase.from('social_links').upsert({ platform, url: '', is_active: false }, { onConflict: 'platform' });
    if (error) { toast.show(friendlyError(error), 'error'); return; }
    await reload();
    toast.show('Сілтеме өшірілді', 'success');
  };

  return (
    <div className="stack-lg">
      <div className="section-row">
        <div>
          <h1>Әлеуметтік желілер</h1>
          <p className="muted small">Тек ресми сілтемелерді енгізіңіз. Бос сілтеме сайтта «Жақында» күйінде көрсетіледі.</p>
        </div>
        <span className="badge badge-open">{rows.filter((r) => r.is_active && r.url.trim()).length} белсенді</span>
      </div>

      <form className="card pad form" onSubmit={save} noValidate>
        {PLATFORMS.map((p) => {
          const row = rows.find((r) => r.platform === p) ?? { platform: p, url: '', is_active: true, sort_order: PLATFORMS.indexOf(p) + 1 };
          return (
            <div key={p} className="social-row">
              <div className="adv-icon"><Icon name={p as IconName} size={20} /></div>
              <Field label={LABEL[p]}>
                <input className="input" value={row.url} placeholder="https://"
                  onChange={(e) => patch(p, { url: e.target.value })} />
              </Field>
              <label className="check small">
                <input type="checkbox" checked={row.is_active} onChange={(e) => patch(p, { is_active: e.target.checked })} />
                <span>Көрсету</span>
              </label>
              <button type="button" className="btn btn-danger btn-sm" disabled={!row.url} onClick={() => void clear(p)}>Өшіру</button>
            </div>
          );
        })}
        <div className="row end">
          <button className="btn btn-gold" disabled={busy}>{busy ? 'Сақталуда...' : 'Сақтау'}</button>
        </div>
      </form>
    </div>
  );
}
