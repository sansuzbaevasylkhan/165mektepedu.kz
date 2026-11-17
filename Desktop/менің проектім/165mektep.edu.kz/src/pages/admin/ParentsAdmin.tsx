import { useMemo, useState } from 'react';
import { Empty, ErrorState, Modal, ProgressBar, Spinner, useAsync, useConfirm } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { friendlyError } from '../../lib/errors';
import { useRealtime } from '../../lib/useRealtime';
import { prettyFromE164 } from '../../lib/phone';
import { fmtDateTime } from '../../lib/util';
import type { AdminPerson } from '../../types';

const LINK_LABEL = { approved: 'Бекітілген', pending: 'Күтуде', rejected: 'Қабылданбады' } as const;

export default function ParentsAdmin() {
  const toast = useToast();
  const confirm = useConfirm();
  const list = useAsync(() => api.people('parent'), []);
  useRealtime(['profiles', 'parent_student_links'], list.reload);
  const [q, setQ] = useState('');
  const [view, setView] = useState<AdminPerson | null>(null);

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (list.data ?? []).filter((u) => !s || `${u.last_name} ${u.first_name} ${u.phone}`.toLowerCase().includes(s));
  }, [list.data, q]);

  const setBlocked = async (u: AdminPerson) => {
    if (!confirm(`${u.last_name} ${u.first_name} ${u.is_blocked ? 'бұғаттан шығарылсын ба' : 'бұғатталсын ба'}?`)) return;
    const { error } = await supabase.from('profiles').update({ is_blocked: !u.is_blocked }).eq('id', u.id);
    if (error) toast.show(friendlyError(error), 'error');
    else { toast.show('Сақталды', 'success'); list.reload(); setView({ ...u, is_blocked: !u.is_blocked }); }
  };

  return (
    <div className="stack-lg">
      <div className="section-row">
        <h1>Ата-аналар</h1>
        <span className="badge badge-open">{(list.data ?? []).length} тіркелген</span>
      </div>
      <input className="input search" placeholder="Аты-жөні немесе телефон бойынша іздеу" value={q} onChange={(e) => setQ(e.target.value)} />

      {list.loading && !list.data ? <Spinner />
        : list.error ? <ErrorState message={friendlyError(list.error)} onRetry={list.reload} />
        : rows.length === 0 ? <Empty title="Ата-аналар табылмады" />
        : (
          <div className="card table-wrap">
            <table className="table">
              <thead><tr><th>ID</th><th>Аты-жөні</th><th>Телефон</th><th>Байланысқан оқушылар</th><th>Тіркелген</th><th>Күйі</th><th /></tr></thead>
              <tbody>
                {rows.map((u) => (
                  <tr key={u.id} className={u.is_blocked ? 'blocked' : ''}>
                    <td className="muted small mono">{u.id.slice(0, 8)}</td>
                    <td><b>{u.last_name} {u.first_name}</b></td>
                    <td>{prettyFromE164(u.phone)}</td>
                    <td>
                      {u.students.length === 0 ? <span className="muted">—</span> : (
                        <div className="chip-list">
                          {u.students.map((s) => (
                            <span key={s.link_id} className="mini-chip" title={LINK_LABEL[s.status]}>
                              {s.last_name} {s.first_name} · {s.progress?.percent ?? 0}%
                            </span>
                          ))}
                        </div>)}
                    </td>
                    <td className="muted">{fmtDateTime(u.created_at)}</td>
                    <td><span className={`badge ${u.is_blocked ? 'badge-locked' : 'badge-done'}`}>{u.is_blocked ? 'Бұғатталған' : 'Белсенді'}</span></td>
                    <td className="actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => setView(u)}>Профиль</button>
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
        <Modal title={`${view.last_name} ${view.first_name} — ата-ана`} onClose={() => setView(null)} wide>
          <div className="profile-head">
            <div>
              <p><b>ID:</b> <span className="mono small">{view.id}</span></p>
              <p><b>Телефон:</b> {prettyFromE164(view.phone)}</p>
              <p><b>Тіркелген:</b> {fmtDateTime(view.created_at)}</p>
              <p><b>Соңғы кіру:</b> {view.last_seen_at ? fmtDateTime(view.last_seen_at) : '—'}</p>
            </div>
          </div>
          <h3>Байланысқан оқушылар</h3>
          {view.students.length === 0 ? <p className="muted">Байланысқан оқушы жоқ.</p> : (
            <div className="stack">
              {view.students.map((s) => (
                <div key={s.link_id} className="card pad">
                  <div className="section-row">
                    <b>{s.last_name} {s.first_name}</b>
                    <span className={`badge ${s.status === 'approved' ? 'badge-done' : s.status === 'pending' ? 'badge-open' : 'badge-locked'}`}>
                      {LINK_LABEL[s.status]}
                    </span>
                  </div>
                  <p className="muted small">{prettyFromE164(s.phone)}</p>
                  <ProgressBar value={s.progress?.percent ?? 0} label="Прогресс" />
                  <p className="muted small">{s.progress?.lessons_done ?? 0}/{s.progress?.lessons_total ?? 0} сабақ · орташа тест {s.progress?.avg_score ?? 0}%</p>
                </div>
              ))}
            </div>)}
          <div className="row end">
            <button className={`btn ${view.is_blocked ? 'btn-gold' : 'btn-danger'}`} onClick={() => void setBlocked(view)}>
              {view.is_blocked ? 'Бұғаттан шығару' : 'Бұғаттау'}
            </button>
          </div>
        </Modal>)}
    </div>
  );
}
