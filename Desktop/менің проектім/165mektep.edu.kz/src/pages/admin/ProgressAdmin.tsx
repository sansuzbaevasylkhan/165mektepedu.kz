import { useMemo, useState } from 'react';
import { Empty, ErrorState, Modal, ProgressBar, Spinner, useAsync } from '../../components/ui';
import { ProgressView } from '../../components/ProgressView';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { friendlyError } from '../../lib/errors';
import { useRealtime } from '../../lib/useRealtime';
import { prettyFromE164 } from '../../lib/phone';
import type { AdminPerson, Overview } from '../../types';

export default function ProgressAdmin() {
  const toast = useToast();
  const list = useAsync(() => api.people('student'), []);
  useRealtime(['profiles', 'lesson_progress', 'test_attempts'], list.reload);
  const [q, setQ] = useState('');
  const [view, setView] = useState<AdminPerson | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(false);

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return [...(list.data ?? [])]
      .filter((u) => !s || `${u.last_name} ${u.first_name} ${u.phone}`.toLowerCase().includes(s))
      .sort((a, b) => (b.progress?.percent ?? 0) - (a.progress?.percent ?? 0));
  }, [list.data, q]);

  const active = (list.data ?? []).filter((u) => (u.progress?.percent ?? 0) > 0).length;
  const finished = (list.data ?? []).filter((u) => (u.progress?.percent ?? 0) >= 100).length;
  const avg = rows.length ? Math.round(rows.reduce((s, u) => s + (u.progress?.percent ?? 0), 0) / rows.length) : 0;

  const open = async (u: AdminPerson) => {
    setView(u); setOverview(null); setLoading(true);
    try { setOverview(await api.overview(u.id)); }
    catch (e) { toast.show(friendlyError(e), 'error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="stack-lg">
      <div className="section-row">
        <h1>Оқушылар прогресі</h1>
        <span className="badge badge-open">Сервер есептеуі</span>
      </div>
      <div className="grid grid-3">
        <div className="card pad stat"><div><div className="stat-n">{avg}%</div><div className="muted">Орташа прогресс</div></div></div>
        <div className="card pad stat"><div><div className="stat-n">{active}</div><div className="muted">Бастаған оқушы</div></div></div>
        <div className="card pad stat"><div><div className="stat-n">{finished}</div><div className="muted">100% аяқтаған</div></div></div>
      </div>
      <input className="input search" placeholder="Оқушыны іздеу" value={q} onChange={(e) => setQ(e.target.value)} />

      {list.loading && !list.data ? <Spinner />
        : list.error ? <ErrorState message={friendlyError(list.error)} onRetry={list.reload} />
        : rows.length === 0 ? <Empty title="Оқушылар жоқ" />
        : (
          <div className="card table-wrap">
            <table className="table">
              <thead><tr><th>Оқушы</th><th>Телефон</th><th>Прогресс</th><th>Сабақтар</th><th>Тест</th><th /></tr></thead>
              <tbody>
                {rows.map((u) => (
                  <tr key={u.id}>
                    <td><b>{u.last_name} {u.first_name}</b>{u.is_blocked && <span className="badge badge-locked"> бұғатталған</span>}</td>
                    <td>{prettyFromE164(u.phone)}</td>
                    <td className="cell-progress"><ProgressBar slim value={u.progress?.percent ?? 0} /><span className="muted small">{u.progress?.percent ?? 0}%</span></td>
                    <td className="muted">{u.progress?.lessons_done ?? 0}/{u.progress?.lessons_total ?? 0}</td>
                    <td className="muted">{u.progress?.tests_passed ?? 0} · {u.progress?.avg_score ?? 0}%</td>
                    <td className="actions"><button className="btn btn-ghost btn-sm" onClick={() => void open(u)}>Толық</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>)}

      {view && (
        <Modal title={`${view.last_name} ${view.first_name} — прогресс`} onClose={() => { setView(null); setOverview(null); }} wide>
          {loading ? <Spinner /> : overview ? <ProgressView data={overview} linkLessons={false} /> : <ErrorState message="Деректер жүктелмеді" />}
        </Modal>)}
    </div>
  );
}
