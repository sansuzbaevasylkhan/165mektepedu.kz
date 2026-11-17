import { useMemo, useState } from 'react';
import { Empty, ErrorState, Modal, ProgressBar, Spinner, useAsync, useConfirm } from '../../components/ui';
import { ProgressView } from '../../components/ProgressView';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { friendlyError } from '../../lib/errors';
import { useRealtime } from '../../lib/useRealtime';
import { prettyFromE164 } from '../../lib/phone';
import { fmtDateTime } from '../../lib/util';
import type { AdminPerson, Overview } from '../../types';

export default function StudentsAdmin() {
  const toast = useToast();
  const confirm = useConfirm();
  const list = useAsync(() => api.people('student'), []);
  useRealtime(['profiles', 'lesson_progress', 'test_attempts', 'parent_student_links'], list.reload);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'blocked'>('all');
  const [view, setView] = useState<AdminPerson | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (list.data ?? []).filter((u) => {
      if (status === 'active' && u.is_blocked) return false;
      if (status === 'blocked' && !u.is_blocked) return false;
      return !s || `${u.last_name} ${u.first_name} ${u.phone}`.toLowerCase().includes(s);
    });
  }, [list.data, q, status]);

  const setBlocked = async (u: AdminPerson) => {
    if (!u.is_blocked && !confirm(`${u.last_name} ${u.first_name} бұғатталсын ба? Ол жүйеге кіре алмайды.`)) return;
    if (u.is_blocked && !confirm(`${u.last_name} ${u.first_name} бұғаттан шығарылсын ба?`)) return;
    const { error } = await supabase.from('profiles').update({ is_blocked: !u.is_blocked }).eq('id', u.id);
    if (error) toast.show(friendlyError(error), 'error');
    else { toast.show(u.is_blocked ? 'Бұғаттан шығарылды' : 'Бұғатталды', 'success'); list.reload(); }
  };

  const open = async (u: AdminPerson) => {
    setView(u); setOverview(null); setViewLoading(true);
    try { setOverview(await api.overview(u.id)); }
    catch (e) { toast.show(friendlyError(e), 'error'); }
    finally { setViewLoading(false); }
  };

  return (
    <div className="stack-lg">
      <div className="section-row">
        <h1>Оқушылар</h1>
        <span className="badge badge-open">{(list.data ?? []).length} тіркелген</span>
      </div>

      <div className="toolbar">
        <input className="input search" placeholder="Аты-жөні немесе телефон бойынша іздеу" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input compact" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
          <option value="all">Барлығы</option>
          <option value="active">Белсенді</option>
          <option value="blocked">Бұғатталған</option>
        </select>
      </div>

      {list.loading && !list.data ? <Spinner />
        : list.error ? <ErrorState message={friendlyError(list.error)} onRetry={list.reload} />
        : rows.length === 0 ? <Empty title="Оқушылар табылмады" text="Іздеу шартын өзгертіп көріңіз." />
        : (
          <div className="card table-wrap">
            <table className="table">
              <thead><tr><th>ID</th><th>Аты-жөні</th><th>Телефон</th><th>Тіркелген</th><th>Прогресс</th><th>Күйі</th><th /></tr></thead>
              <tbody>
                {rows.map((u) => (
                  <tr key={u.id} className={u.is_blocked ? 'blocked' : ''}>
                    <td className="muted small mono">{u.id.slice(0, 8)}</td>
                    <td><b>{u.last_name} {u.first_name}</b></td>
                    <td>{prettyFromE164(u.phone)}</td>
                    <td className="muted">{fmtDateTime(u.created_at)}</td>
                    <td className="cell-progress"><ProgressBar slim value={u.progress?.percent ?? 0} /><span className="muted small">{u.progress?.percent ?? 0}% · {u.progress?.lessons_done ?? 0}/{u.progress?.lessons_total ?? 0}</span></td>
                    <td><span className={`badge ${u.is_blocked ? 'badge-locked' : 'badge-done'}`}>{u.is_blocked ? 'Бұғатталған' : 'Белсенді'}</span></td>
                    <td className="actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => void open(u)}>Профиль</button>
                      <button className={`btn btn-sm ${u.is_blocked ? 'btn-gold' : 'btn-danger'}`} onClick={() => void setBlocked(u)}>
                        {u.is_blocked ? 'Ашу' : 'Бұғаттау'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>)}

      {view && (
        <Modal title={`${view.last_name} ${view.first_name} — профиль`} onClose={() => { setView(null); setOverview(null); }} wide>
          <div className="profile-head">
            <div>
              <p><b>ID:</b> <span className="mono small">{view.id}</span></p>
              <p><b>Телефон:</b> {prettyFromE164(view.phone)}</p>
              <p><b>Тіркелген:</b> {fmtDateTime(view.created_at)}</p>
              <p><b>Соңғы кіру:</b> {view.last_seen_at ? fmtDateTime(view.last_seen_at) : '—'}</p>
              <p><b>Күйі:</b> {view.is_blocked ? 'Бұғатталған' : 'Белсенді'}</p>
            </div>
            <div className="profile-stats">
              <div><b>{view.progress?.percent ?? 0}%</b><span>жалпы прогресс</span></div>
              <div><b>{view.progress?.lessons_done ?? 0}</b><span>аяқталған сабақ</span></div>
              <div><b>{view.progress?.avg_score ?? 0}%</b><span>орташа тест</span></div>
            </div>
          </div>
          {viewLoading ? <Spinner /> : overview ? <ProgressView data={overview} linkLessons={false} /> : null}
          <div className="row end">
            <button className={`btn ${view.is_blocked ? 'btn-gold' : 'btn-danger'}`} onClick={() => void setBlocked(view)}>
              {view.is_blocked ? 'Бұғаттан шығару' : 'Бұғаттау'}
            </button>
          </div>
        </Modal>)}
    </div>
  );
}
