import { useState } from 'react';
import { Empty, ErrorState, Spinner, useAsync } from '../../components/ui';
import { Icon } from '../../components/Icons';
import { fmtTime, weekdayName } from '../../components/TimetableBoard';
import { api } from '../../lib/api';
import { friendlyError } from '../../lib/errors';
import { useSeo } from '../../lib/seo';
import { useTimetableRealtime } from '../../lib/useTimetableRealtime';
import { fmtDateTime } from '../../lib/util';

const ACTION: Record<string, { label: string; cls: string }> = {
  INSERT: { label: 'Қосылды', cls: 'badge-done' },
  UPDATE: { label: 'Өзгертілді', cls: 'badge-open' },
  DELETE: { label: 'Өшірілді', cls: 'badge-locked' },
};

export default function DirectorHistory() {
  useSeo('Директор — өзгерістер тарихы', 'Сабақ кестесінің өзгерістер тарихы.', '/direktor-admin/history');
  const [action, setAction] = useState('');
  const [limit, setLimit] = useState(150);
  const { data, error, loading, reload } = useAsync(() => api.timetableHistory(limit), [limit]);
  useTimetableRealtime(reload);

  const rows = (data ?? []).filter((r) => !action || r.action === action);

  return (
    <div className="stack-lg">
      <div className="section-row">
        <div>
          <h1>Өзгерістер тарихы</h1>
          <p className="muted small">
            Кестені кім, қашан және қандай өзгеріс жасады — бұл жазбаларды сервер триггері автоматты түрде жазады.
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={reload} disabled={loading}>
          <Icon name="history" size={16} /> Жаңарту
        </button>
      </div>

      <div className="toolbar">
        <select className="input compact" value={action} onChange={(e) => setAction(e.target.value)}>
          <option value="">Барлық әрекеттер</option>
          <option value="INSERT">Қосылды</option>
          <option value="UPDATE">Өзгертілді</option>
          <option value="DELETE">Өшірілді</option>
        </select>
        <select className="input compact" value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
          <option value={50}>50 жазба</option>
          <option value={150}>150 жазба</option>
          <option value={300}>300 жазба</option>
        </select>
        <span className="muted small">{rows.length} жазба</span>
      </div>

      {loading && !data ? <Spinner />
        : error ? <ErrorState message={friendlyError(error)} onRetry={reload} />
        : rows.length === 0 ? (
          <Empty title="Өзгерістер жоқ" text="Кестеге бірінші өзгеріс жасалғанда осында жазылады." />
        ) : (
          <div className="card table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th><th>Әрекет</th><th>Мұғалім</th><th>Пән</th><th>Сынып</th>
                  <th>Күні / уақыты</th><th>Кабинет</th><th>Кім</th><th>Жазылған уақыт</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const act = ACTION[r.action] ?? { label: r.action, cls: 'badge-open' };
                  const d = r.data;
                  const slot = d?.weekday
                    ? `${weekdayName(d.weekday)}${d.start_time ? `, ${fmtTime(d.start_time)}` : ''}${d.end_time ? `–${fmtTime(d.end_time)}` : ''}`
                    : '—';
                  return (
                    <tr key={r.id}>
                      <td className="muted small">{r.id}</td>
                      <td><span className={`badge ${act.cls}`}>{act.label}</span></td>
                      <td>{d?.teacher_name ?? '—'}</td>
                      <td>{d?.subject_title ?? '—'}</td>
                      <td>{d?.class_name ?? '—'}</td>
                      <td className="small">{slot}</td>
                      <td className="muted small">{d?.room?.trim() || '—'}</td>
                      <td><b>{r.actor_name || '—'}</b></td>
                      <td className="muted small">{fmtDateTime(r.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}
