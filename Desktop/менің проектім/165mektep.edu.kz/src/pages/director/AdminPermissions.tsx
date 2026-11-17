import { useState } from 'react';
import { Empty, ErrorState, Spinner, useAsync } from '../../components/ui';
import { Icon } from '../../components/Icons';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { friendlyError } from '../../lib/errors';
import { prettyFromE164 } from '../../lib/phone';
import { useRealtime } from '../../lib/useRealtime';
import type { DirectorAdminRow } from '../../types';

const KEYS = [
  { key: 'view', title: 'Тізімді көру', hint: 'Мұғалімдер тізімі мен профилін көру' },
  { key: 'documents', title: 'Құжаттарды көру', hint: 'Мұғалім құжаттары мен есептерін тексеру' },
  { key: 'edit', title: 'Мәліметті өңдеу', hint: 'Профиль, пән, тапсырма, журнал өзгерту' },
  { key: 'accounts', title: 'Аккаунтты басқару', hint: 'Бұғаттау, мұрағаттау, құпиясөзді қалпына келтіру' },
] as const;

type Key = typeof KEYS[number]['key'];

export default function AdminPermissions() {
  const toast = useToast();
  const data = useAsync(() => api.director.admins(), []);
  useRealtime(['admin_teacher_permissions', 'profiles'], data.reload);
  const [busy, setBusy] = useState<string | null>(null);
  const admins = data.data ?? [];

  const toggle = async (a: DirectorAdminRow, key: Key) => {
    setBusy(`${a.id}-${key}`);
    try {
      await api.director.setAdminPermission(a.id, key, !a[key]);
      toast.show('Рұқсат жаңартылды', 'success');
      data.reload();
    } catch (err) { toast.show(friendlyError(err), 'error'); }
    finally { setBusy(null); }
  };

  const enabled = (a: DirectorAdminRow) => KEYS.filter((k) => a[k.key]).length;

  return (
    <div className="stack-lg tch-page">
      <div className="section-row">
        <div>
          <span className="tch-eyebrow">DIRECTOR · Басқару</span>
          <h1>Әкімші рұқсаттары</h1>
          <p className="muted small">ADMIN рөлі тек мұғалімдерді басқарады. Бұл рұқсаттарды тек DIRECTOR береді.</p>
        </div>
        <span className="badge adm-badge-done">DIRECTOR</span>
      </div>

      <div className="tch-note">
        <Icon name="shield" size={16} />
        <span>
          Әкімші өзіне DIRECTOR құқығын бере алмайды және рөлді өзгерте алмайды — бұл серверде (RLS + security definer)
          тексеріледі. Барлық өзгерістер audit журналына жазылады.
        </span>
      </div>

      {data.loading && !data.data ? <Spinner />
        : data.error ? <ErrorState message={friendlyError(data.error)} onRetry={data.reload} />
        : admins.length === 0 ? <Empty title="Әкімші жоқ" text="Жүйеде ADMIN рөліндегі пайдаланушы тіркелмеген." />
        : (
          <div className="card table-wrap">
            <table className="table tch-perm-table">
              <thead>
                <tr>
                  <th>Әкімші</th>
                  {KEYS.map((k) => <th key={k.key} title={k.hint}>{k.title}</th>)}
                  <th>Белсенді</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((a) => (
                  <tr key={a.id} className={a.is_blocked ? 'blocked' : ''}>
                    <td>
                      <b>{a.last_name} {a.first_name}</b>
                      <div className="muted small">{prettyFromE164(a.phone)}</div>
                      {a.is_blocked && <span className="badge adm-badge-bad">Бұғатталған</span>}
                    </td>
                    {KEYS.map((k) => (
                      <td key={k.key}>
                        <label className="adm-switch">
                          <input type="checkbox" checked={a[k.key]}
                            disabled={busy === `${a.id}-${k.key}` || a.is_blocked}
                            onChange={() => void toggle(a, k.key)} />
                          <span className="adm-switch-track" />
                          <span className="sr-only">{k.title}</span>
                        </label>
                      </td>
                    ))}
                    <td className="muted small">{enabled(a)} / {KEYS.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      <div className="card pad">
        <h3>Рұқсат түрлері</h3>
        <div className="tch-perm-legend">
          {KEYS.map((k) => (
            <div key={k.key}>
              <b>{k.title}</b>
              <span className="muted small">{k.hint}</span>
            </div>
          ))}
        </div>
        <p className="muted small tch-hint">
          «Аккаунтты басқару» рұқсаты болмаса, әкімші мұғалімді бұғаттай, мұрағаттай немесе құпиясөзін ауыстыра алмайды.
          Мұғалім аккаунтын ашу үшін де осы рұқсат қажет.
        </p>
      </div>
    </div>
  );
}
