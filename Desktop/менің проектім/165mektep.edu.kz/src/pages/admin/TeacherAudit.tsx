import { useState } from 'react';
import { Empty, ErrorState, Spinner, useAsync } from '../../components/ui';
import { Icon } from '../../components/Icons';
import { api } from '../../lib/api';
import { friendlyError } from '../../lib/errors';
import { useRealtime } from '../../lib/useRealtime';
import { fmtDateTime } from '../../lib/util';
import type { TeacherAuditRow } from '../../types';

const ENTITY_LABEL: Record<string, string> = {
  teacher_profiles: 'Мұғалім профилі',
  teacher_assignments: 'Пән тағайындау',
  teacher_documents: 'Құжат',
  teacher_tasks: 'Тапсырма',
  teacher_attendance: 'Қатысу',
  teacher_work_logs: 'Жұмыс журналы',
  teacher_reports: 'Есеп',
  profiles: 'Профиль',
  admin_teacher_permissions: 'Әкімші рұқсаты',
};

const ACTION_LABEL: Record<string, string> = {
  INSERT: 'Қосу',
  UPDATE: 'Өзгерту',
  DELETE: 'Өшіру',
  PASSWORD_RESET: 'Құпиясөзді қалпына келтіру',
};

function detailsSummary(row: TeacherAuditRow): string {
  const d = row.details as { before?: Record<string, unknown>; after?: Record<string, unknown> } | undefined;
  if (!d?.after) return '';
  const diff: string[] = [];
  const keys = ['employment_status', 'is_blocked', 'status', 'verified', 'role', 'block_reason'];
  for (const k of keys) {
    const before = d.before?.[k];
    const after = d.after[k];
    if (JSON.stringify(before) !== JSON.stringify(after) && after !== undefined) {
      diff.push(`${k}: ${String(after)}`);
    }
  }
  return diff.slice(0, 3).join(' · ');
}

export default function TeacherAudit() {
  const [limit, setLimit] = useState(100);
  const data = useAsync(() => api.teacher.audit(limit), [limit]);
  useRealtime(['admin_activity_logs'], data.reload);
  const rows = data.data ?? [];

  return (
    <div className="stack-lg tch-page">
      <div className="section-row">
        <div>
          <span className="tch-eyebrow">ADMIN · Audit</span>
          <h1>Әрекеттер журналы</h1>
          <p className="muted small">Мұғалім деректеріне қатысты барлық маңызды әрекеттер серверде автоматты жазылады.</p>
        </div>
        <select className="input tch-limit" value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
          <option value={50}>Соңғы 50</option>
          <option value={100}>Соңғы 100</option>
          <option value={200}>Соңғы 200</option>
        </select>
      </div>

      <div className="tch-note">
        <Icon name="shield" size={16} />
        <span>Журналға тек мұғалімдерге қатысты жазбалар кіреді. Оқушы/ата-ана деректеріне қатысты әрекеттер әкімшіге көрінбейді.</span>
      </div>

      {data.loading && !data.data ? <Spinner />
        : data.error ? <ErrorState message={friendlyError(data.error)} onRetry={data.reload} />
        : rows.length === 0 ? <Empty title="Жазба жоқ" />
        : (
          <div className="card table-wrap">
            <table className="table tch-audit-table">
              <thead>
                <tr><th>Уақыт</th><th>Әрекет</th><th>Нысан</th><th>Орындаған</th><th>Өзгеріс</th></tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="muted small">{fmtDateTime(r.created_at)}</td>
                    <td><b>{ACTION_LABEL[r.action] ?? r.action}</b></td>
                    <td>{ENTITY_LABEL[r.entity] ?? r.entity}</td>
                    <td>{r.actor || '—'}</td>
                    <td className="muted small">{detailsSummary(r) || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}
