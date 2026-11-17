import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Empty, ErrorState, Spinner, useAsync } from '../../components/ui';
import { Icon } from '../../components/Icons';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { friendlyError } from '../../lib/errors';
import { TASK_PRIORITY_LABEL, TASK_STATUS_CLASS, TASK_STATUS_LABEL } from '../../lib/teacher';
import { useRealtime } from '../../lib/useRealtime';
import { fmtDateTime } from '../../lib/util';
import type { TeacherTaskStatus } from '../../types';

type Filter = 'active' | 'done' | 'all';

export default function TeacherTasks() {
  const { profile } = useAuth();
  const toast = useToast();
  const data = useAsync(() => api.teacher.myTasks(), []);
  useRealtime(['teacher_tasks'], data.reload);
  const [filter, setFilter] = useState<Filter>('active');

  const tasks = data.data ?? [];
  const counts = useMemo(() => ({
    active: tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress').length,
    done: tasks.filter((t) => t.status === 'done').length,
    overdue: tasks.filter((t) => t.overdue).length,
  }), [tasks]);

  const shown = tasks.filter((t) => {
    if (filter === 'active') return t.status === 'pending' || t.status === 'in_progress';
    if (filter === 'done') return t.status === 'done';
    return true;
  });

  const change = async (id: string, status: TeacherTaskStatus) => {
    try {
      await api.teacher.setTaskStatus(id, status);
      toast.show(status === 'done' ? 'Тапсырма орындалды деп белгіленді' : 'Тапсырма басталды', 'success');
      data.reload();
    } catch (err) { toast.show(friendlyError(err), 'error'); }
  };

  return (
    <div className="tch-page tch-teacher-tasks">
      <div className="section-row">
        <div>
          <span className="tch-eyebrow">Мұғалім кабинеті</span>
          <h1>Менің тапсырмаларым</h1>
          <p className="muted small">{profile?.last_name} {profile?.first_name} — әкімшіліктен берілген тапсырмалар.</p>
        </div>
        <Link to="/timetable" className="btn btn-ghost"><Icon name="clock" size={16} /> Сабақ кестесі</Link>
      </div>

      <div className="tch-mini-stats">
        <div className="tch-mini-stat accent"><b>{counts.active}</b><span>Ашық тапсырма</span></div>
        <div className="tch-mini-stat"><b>{counts.done}</b><span>Орындалды</span></div>
        <div className="tch-mini-stat"><b>{counts.overdue}</b><span>Мерзімі өткен</span></div>
      </div>

      <div className="tch-tabs tch-tabs-inline" role="tablist" aria-label="Тапсырма сүзгісі">
        {([
          ['active', 'Ашық'],
          ['done', 'Орындалған'],
          ['all', 'Барлығы'],
        ] as [Filter, string][]).map(([k, label]) => (
          <button key={k} type="button" role="tab" aria-selected={filter === k}
            className={`tch-tab ${filter === k ? 'active' : ''}`} onClick={() => setFilter(k)}>
            {label}
          </button>
        ))}
      </div>

      {data.loading && !data.data ? <Spinner />
        : data.error ? <ErrorState message={friendlyError(data.error)} onRetry={data.reload} />
        : shown.length === 0 ? (
          <Empty title={filter === 'done' ? 'Орындалған тапсырма жоқ' : 'Тапсырма жоқ'}
            text={filter === 'active' ? 'Қазіргі уақытта белсенді тапсырма жоқ. Жаңа тапсырма келгенде хабарлама келеді.' : undefined} />
        ) : (
          <div className="tch-task-list">
            {shown.map((t) => (
              <div className={`tch-task ${t.overdue ? 'overdue' : ''}`} key={t.id}>
                <div className="tch-task-head">
                  <b>{t.title}</b>
                  <div className="tch-badges">
                    <span className={`badge ${TASK_STATUS_CLASS[t.status]}`}>{TASK_STATUS_LABEL[t.status]}</span>
                    <span className={`badge ${t.priority === 'urgent' || t.priority === 'high' ? 'adm-badge-bad' : 'adm-badge-muted'}`}>
                      {TASK_PRIORITY_LABEL[t.priority]}
                    </span>
                    {t.overdue && <span className="badge adm-badge-warn">Мерзімі өткен</span>}
                  </div>
                </div>
                {t.description && <p>{t.description}</p>}
                <div className="tch-task-meta muted small">
                  <span><Icon name="clock" size={14} /> {t.due_at ? fmtDateTime(t.due_at) : 'мерзімсіз'}</span>
                  <span>Берген: {t.created_by_name || 'Әкімшілік'}</span>
                  {t.completed_at && <span>Орындалды: {fmtDateTime(t.completed_at)}</span>}
                </div>
                {(t.status === 'pending' || t.status === 'in_progress') && (
                  <div className="tch-task-actions">
                    {t.status === 'pending' && (
                      <button className="btn btn-ghost btn-sm" onClick={() => void change(t.id, 'in_progress')}>
                        <Icon name="play" size={15} /> Бастау
                      </button>
                    )}
                    <button className="btn btn-gold btn-sm" onClick={() => void change(t.id, 'done')}>
                      <Icon name="check" size={15} /> Орындалды
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
