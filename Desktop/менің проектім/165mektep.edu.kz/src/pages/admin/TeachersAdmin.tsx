import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Empty, ErrorState, Spinner, useAsync } from '../../components/ui';
import { Icon } from '../../components/Icons';
import { EmploymentBadge, TeacherAvatar } from '../../components/teacher/ui';
import { api } from '../../lib/api';
import { friendlyError } from '../../lib/errors';
import { prettyFromE164 } from '../../lib/phone';
import { EMPLOYMENT_LABEL, teacherName } from '../../lib/teacher';
import { useRealtime } from '../../lib/useRealtime';
import { fmtDate } from '../../lib/util';
import type { TeacherEmploymentStatus } from '../../types';

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Барлық мәртебе' },
  { value: 'active', label: 'Белсенді (рұқсат берілген)' },
  { value: 'blocked', label: 'Бұғатталған' },
  ...(Object.keys(EMPLOYMENT_LABEL) as TeacherEmploymentStatus[]).map((k) => ({
    value: k, label: EMPLOYMENT_LABEL[k],
  })),
];

export default function TeachersAdmin() {
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [dq, setDq] = useState('');
  const [subject, setSubject] = useState('');
  const [klass, setKlass] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const id = setTimeout(() => setDq(q.trim()), 300);
    return () => clearTimeout(id);
  }, [q]);

  const catalog = useAsync(() => api.catalog(), []);
  const all = useAsync(() => api.teacher.list({}), []);
  const data = useAsync(
    () => api.teacher.list({ search: dq, subject: subject || null, klass, status }),
    [dq, subject, klass, status],
  );
  useRealtime(['profiles', 'teacher_profiles', 'teacher_assignments', 'teacher_tasks'], () => {
    data.reload(); all.reload();
  });

  const classes = useMemo(() => {
    const set = new Set<string>();
    (all.data ?? []).forEach((t) => (t.classes ?? []).forEach((c) => set.add(c)));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'kk'));
  }, [all.data]);

  const subjects = catalog.data?.subjects ?? [];

  const rows = data.data ?? [];
  const activeFilters = [subject, klass, status, dq].filter(Boolean).length;

  const reset = () => { setQ(''); setSubject(''); setKlass(''); setStatus(''); };

  return (
    <div className="stack-lg tch-page">
      <div className="section-row">
        <div>
          <span className="tch-eyebrow">ADMIN · Мұғалімдер</span>
          <h1>Мұғалімдер тізімі</h1>
          <p className="muted small">Аты-жөні, пәні, сыныбы, жүктемесі және аккаунт мәртебесі бойынша іздеу.</p>
        </div>
        <div className="tch-head-actions">
          <span className="badge adm-badge-muted">{rows.length} жазба</span>
          <Link to="/admin/teachers/new" className="btn btn-gold">
            <Icon name="plus" size={17} /> Жаңа мұғалім
          </Link>
        </div>
      </div>

      <div className="card pad tch-filters">
        <div className="tch-filter-grid">
          <label className="field tch-search">
            <span className="field-label">Іздеу</span>
            <span className="tch-input-icon">
              <Icon name="search" size={17} />
              <input className="input" value={q} onChange={(e) => setQ(e.target.value)}
                placeholder="Аты-жөні, телефон немесе email" aria-label="Мұғалім іздеу" />
            </span>
          </label>
          <label className="field">
            <span className="field-label">Пән</span>
            <select className="input" value={subject} onChange={(e) => setSubject(e.target.value)}>
              <option value="">Барлық пән</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
          </label>
          <label className="field">
            <span className="field-label">Сынып</span>
            <select className="input" value={klass} onChange={(e) => setKlass(e.target.value)}>
              <option value="">Барлық сынып</option>
              {classes.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="field">
            <span className="field-label">Мәртебе</span>
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          {activeFilters > 0 && (
            <button type="button" className="btn btn-ghost btn-sm tch-reset" onClick={reset}>
              <Icon name="close" size={15} /> Тазалау
            </button>
          )}
        </div>
      </div>

      {data.loading && !data.data ? <Spinner />
        : data.error ? <ErrorState message={friendlyError(data.error)} onRetry={data.reload} />
        : rows.length === 0 ? (
          <Empty title="Мұғалім табылмады"
            text={activeFilters ? 'Сүзгі шарттарын өзгертіп көріңіз.' : 'Әзірге мұғалім тіркелмеген.'}
            action={activeFilters ? <button className="btn btn-ghost" onClick={reset}>Сүзгіні тазалау</button> : undefined} />
        ) : (
          <div className="card table-wrap">
            <table className="table tch-table">
              <thead>
                <tr>
                  <th>Мұғалім</th>
                  <th>Пәндер / сыныптар</th>
                  <th>Жүктеме</th>
                  <th>Мәртебе</th>
                  <th>Құжат</th>
                  <th>Тапсырма</th>
                  <th>Тіркелген</th>
                  <th aria-label="Әрекет" />
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => {
                  const hours = (t.assignments ?? []).reduce((sum, a) => sum + (a.weekly_hours || 0), 0);
                  return (
                    <tr key={t.id} className="tch-row" onClick={() => nav(`/admin/teachers/${t.id}`)}>
                      <td>
                        <div className="tch-cell-user">
                          <TeacherAvatar t={t} size={42} />
                          <div>
                            <b>{teacherName(t)}</b>
                            <span className="muted small">{prettyFromE164(t.phone)}</span>
                            {t.email && <span className="muted small tch-email">{t.email}</span>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="tch-subjects">{t.subjects_text || <span className="muted">—</span>}</span>
                        {t.classes.length > 0 && <span className="muted small tch-classes">{t.classes.join(' · ')}</span>}
                      </td>
                      <td>
                        <b>{t.weekly_lessons}</b> <span className="muted small">сабақ</span>
                        <div className="muted small">{hours} сағ/апта</div>
                      </td>
                      <td>
                        <div className="tch-badges">
                          <EmploymentBadge status={t.employment_status} />
                          {t.is_blocked && <span className="badge adm-badge-bad">Бұғатталған</span>}
                        </div>
                      </td>
                      <td>{t.documents_count > 0 ? t.documents_count : <span className="muted">—</span>}</td>
                      <td>
                        {t.pending_tasks > 0
                          ? <span className="badge adm-badge-warn">{t.pending_tasks}</span>
                          : <span className="muted">—</span>}
                      </td>
                      <td className="muted small">{fmtDate(t.created_at)}</td>
                      <td>
                        <Link to={`/admin/teachers/${t.id}`} className="icon-btn" aria-label="Профильді ашу"
                          onClick={(e) => e.stopPropagation()}>
                          <Icon name="arrow" size={17} />
                        </Link>
                      </td>
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
