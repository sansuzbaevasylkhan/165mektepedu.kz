import { useState } from 'react';
import { Empty, ErrorState, Spinner, useAsync } from '../../components/ui';
import { Icon } from '../../components/Icons';
import { api } from '../../lib/api';
import { friendlyError } from '../../lib/errors';
import { useRealtime } from '../../lib/useRealtime';
import { fmtDateTime } from '../../lib/util';

const ACTION: Record<string, string> = { INSERT: 'Қосу', UPDATE: 'Өзгерту', DELETE: 'Өшіру' };
const ENTITY: Record<string, string> = {
  news: 'Жаңалық', subjects: 'Пән', lessons: 'Сабақ', tests: 'Тест', questions: 'Сұрақ',
  site_settings: 'Сайт баптауы', social_links: 'Әлеуметтік сілтеме', content_items: 'Мазмұн',
  parent_student_links: 'Ата-ана байланысы', profiles: 'Пайдаланушы',
};

export default function LogsAdmin() {
  const [entity, setEntity] = useState('');
  const [limit, setLimit] = useState(100);
  const { data, error, loading, reload } = useAsync(() => api.logs(limit, entity), [limit, entity]);
  useRealtime(['admin_activity_logs'], reload);

  return (
    <div className="stack-lg">
      <div className="section-row">
        <div>
          <h1>Әрекеттер тарихы</h1>
          <p className="muted small">Кім, қандай өзгеріс жасады — сервердегі audit log негізінде.</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={reload} disabled={loading}><Icon name="history" size={16} /> Жаңарту</button>
      </div>

      <div className="toolbar">
        <select className="input compact" value={entity} onChange={(e) => setEntity(e.target.value)}>
          <option value="">Барлық бөлімдер</option>
          {(data?.entities ?? []).map((e) => <option key={e} value={e}>{ENTITY[e] ?? e}</option>)}
        </select>
        <select className="input compact" value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
          <option value={50}>50 жазба</option>
          <option value={100}>100 жазба</option>
          <option value={250}>250 жазба</option>
          <option value={500}>500 жазба</option>
        </select>
      </div>

      {loading && !data ? <Spinner />
        : error ? <ErrorState message={friendlyError(error)} onRetry={reload} />
        : !data?.logs.length ? <Empty title="Әрекеттер жоқ" text="Әкімші өзгеріс жасағанда осында жазылады." />
        : (
          <div className="card table-wrap">
            <table className="table">
              <thead><tr><th>#</th><th>Әкімші</th><th>Әрекет</th><th>Бөлім</th><th>Жазба ID</th><th>Уақыты</th></tr></thead>
              <tbody>
                {data.logs.map((l) => (
                  <tr key={l.id}>
                    <td className="muted small">{l.id}</td>
                    <td><b>{l.actor}</b></td>
                    <td><span className="badge badge-open">{ACTION[l.action] ?? l.action}</span></td>
                    <td>{ENTITY[l.entity] ?? l.entity}</td>
                    <td className="muted small mono">{l.entity_id ? l.entity_id.slice(0, 8) : '—'}</td>
                    <td className="muted small">{fmtDateTime(l.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>)}
    </div>
  );
}
