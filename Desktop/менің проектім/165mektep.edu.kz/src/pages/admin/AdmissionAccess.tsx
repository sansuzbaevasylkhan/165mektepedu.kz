import { useMemo, useState } from 'react';
import { Empty, ErrorState, Spinner, useAsync } from '../../components/ui';
import { Icon } from '../../components/Icons';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { admissionErrorText, PERMISSION_KEYS, PERMISSION_LABEL } from '../../lib/admission';
import { useRealtime } from '../../lib/useRealtime';
import { prettyFromE164 } from '../../lib/phone';
import type { AdmissionPermissionKey, AdmissionTeacher } from '../../types';

export default function AdmissionAccess() {
  const toast = useToast();
  const list = useAsync(() => api.admission.teachers(), []);
  useRealtime(['admission_permission_settings', 'profiles'], list.reload);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const teachers = list.data ?? [];
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter((t) => `${t.last_name} ${t.first_name} ${t.phone}`.toLowerCase().includes(q));
  }, [teachers, query]);

  const toggle = async (t: AdmissionTeacher, key: AdmissionPermissionKey) => {
    setBusy(`${t.id}-${key}`);
    try {
      await api.admission.setPermission(t.id, key, !t[key]);
      toast.show('Рұқсат жаңартылды', 'success');
      list.reload();
    } catch (e) { toast.show(admissionErrorText(e), 'error'); }
    finally { setBusy(null); }
  };

  const enabled = (t: AdmissionTeacher) => PERMISSION_KEYS.filter((k) => t[k]).length;

  return (
    <div className="stack-lg">
      <div className="section-row">
        <div>
          <h1>Мұғалім рұқсаттары</h1>
          <p className="muted small">Қабылдау өтініштеріне қолжетімділік. Әдепкіде мұғалім тек тізім мен негізгі ақпаратты көреді — жеке құжаттар автоматты түрде ашылмайды.</p>
        </div>
        <span className="badge badge-open">{teachers.length} мұғалім</span>
      </div>

      <p className="adm-note"><Icon name="shield" size={15} /> Рұқсаттар серверде тексеріледі: тікелей Supabase сұраулары да рұқсатсыз құжатқа қол жеткізе алмайды.</p>

      <input className="input search" placeholder="Мұғалім аты-жөні немесе телефоны" value={query}
        onChange={(e) => setQuery(e.target.value)} aria-label="Мұғалім іздеу" />

      {list.loading && !list.data ? <Spinner />
        : list.error ? <ErrorState message={admissionErrorText(list.error)} onRetry={list.reload} />
        : rows.length === 0 ? <Empty title="Мұғалім табылмады" />
        : (
          <div className="card table-wrap">
            <table className="table adm-perm-table">
              <thead>
                <tr>
                  <th>Мұғалім</th>
                  {PERMISSION_KEYS.map((k) => (
                    <th key={k} title={PERMISSION_LABEL[k].hint}>{PERMISSION_LABEL[k].title}</th>
                  ))}
                  <th>Белсенді</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr key={t.id} className={t.is_blocked ? 'blocked' : ''}>
                    <td>
                      <b>{t.last_name} {t.first_name}</b>
                      <div className="muted small">{prettyFromE164(t.phone)}</div>
                    </td>
                    {PERMISSION_KEYS.map((k) => (
                      <td key={k}>
                        <label className="adm-switch">
                          <input type="checkbox" checked={t[k]} disabled={busy === `${t.id}-${k}` || t.is_blocked}
                            onChange={() => void toggle(t, k)} />
                          <span className="adm-switch-track" />
                          <span className="sr-only">{PERMISSION_LABEL[k].title}</span>
                        </label>
                      </td>
                    ))}
                    <td className="muted small">{enabled(t)} / {PERMISSION_KEYS.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      <div className="card pad adm-legend">
        <h4>Рұқсат түрлері</h4>
        <div className="adm-legend-grid">
          {PERMISSION_KEYS.map((k) => (
            <div key={k}>
              <b>{PERMISSION_LABEL[k].title}</b>
              <span className="muted small">{PERMISSION_LABEL[k].hint}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
