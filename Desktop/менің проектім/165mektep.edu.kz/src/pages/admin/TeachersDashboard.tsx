import { Link } from 'react-router-dom';
import { Empty, ErrorState, Spinner, useAsync } from '../../components/ui';
import { Icon } from '../../components/Icons';
import { StatCard } from '../../components/admission/ui';
import { EmploymentBadge, TeacherAvatar } from '../../components/teacher/ui';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { friendlyError } from '../../lib/errors';
import { teacherName } from '../../lib/teacher';
import { useRealtime } from '../../lib/useRealtime';
import { fmtDate } from '../../lib/util';

export default function TeachersDashboard() {
  const { profile } = useAuth();
  const data = useAsync(() => api.teacher.dashboard(), []);
  useRealtime(
    ['profiles', 'teacher_profiles', 'teacher_tasks', 'teacher_documents', 'teacher_assignments'],
    data.reload,
  );
  const d = data.data;
  const p = d?.permissions;
  const maxSubject = d?.subjects?.length ? Math.max(...d.subjects.map((s) => s.count)) : 1;

  return (
    <div className="stack-lg tch-page">
      <div className="section-row">
        <div>
          <span className="tch-eyebrow">ADMIN · Мұғалімдерді басқару</span>
          <h1>Мұғалімдер панелі</h1>
          <p className="muted small">{profile?.last_name} {profile?.first_name} — мектеп мұғалімдерінің есебі, тапсырмалары және құжаттары.</p>
        </div>
        {p?.accounts && (
          <Link to="/admin/teachers/new" className="btn btn-gold">
            <Icon name="plus" size={17} /> Жаңа мұғалім
          </Link>
        )}
      </div>

      <div className="tch-note">
        <Icon name="shield" size={16} />
        <span>
          Бұл панель тек мұғалімдерге арналған. Оқушылар мен ата-аналардың жеке кабинеттеріне кіру мүмкіндігі жоқ.
          Рұқсаттарды DIRECTOR анықтайды, барлық әрекеттер audit журналына жазылады.
        </span>
      </div>

      {data.loading && !d ? <Spinner />
        : data.error ? <ErrorState message={friendlyError(data.error)} onRetry={data.reload} />
        : !d ? <Empty title="Деректер жоқ" />
        : (
          <>
            {p && !p.view && (
              <div className="tch-alert">
                <Icon name="lock" size={17} /> Сізге мұғалімдер тізімін көру рұқсаты берілмеген. DIRECTOR-қа хабарласыңыз.
              </div>
            )}

            <div className="adm-stats">
              <StatCard icon="users" label="Барлық мұғалім" value={d.total} accent />
              <StatCard icon="check" label="Белсенді" value={d.active} />
              <StatCard icon="lock" label="Бұғатталған" value={d.blocked} />
              <StatCard icon="spark" label="Соңғы 30 күнде" value={d.new_30d} hint="жаңа тіркелген" />
              {p?.documents && (
                <StatCard icon="file" label="Құжаттар" value={d.documents}
                  hint={`${d.unverified_documents} тексерілмеген`} />
              )}
              <StatCard icon="clipboard" label="Ашық тапсырма" value={d.tasks_pending}
                hint={d.tasks_overdue ? `${d.tasks_overdue} мерзімі өткен` : `${d.tasks_done_30d} орындалды`} />
            </div>

            <div className="tch-quick">
              <Link to="/admin/teachers" className="adm-quick-card">
                <Icon name="users" size={22} />
                <b>Мұғалімдер тізімі</b>
                <span className="muted small">Іздеу, сүзгілеу, профильдер</span>
              </Link>
              <Link to="/admin/tasks" className="adm-quick-card">
                <Icon name="clipboard" size={22} />
                <b>Тапсырмалар</b>
                <span className="muted small">Берілген тапсырмалар және хабарламалар</span>
              </Link>
              <Link to="/admin/teacher-audit" className="adm-quick-card">
                <Icon name="history" size={22} />
                <b>Audit журналы</b>
                <span className="muted small">Мұғалім деректеріне қатысты әрекеттер</span>
              </Link>
            </div>

            <div className="tch-grid-2">
              <section className="card pad">
                <div className="section-row">
                  <h3>Пәндер бойынша мұғалімдер</h3>
                  <span className="badge adm-badge-muted">{d.subjects.length} пән</span>
                </div>
                {d.subjects.length === 0 ? <Empty title="Пән тағайындалмаған" />
                  : (
                    <div className="tch-bars">
                      {d.subjects.slice(0, 8).map((s) => (
                        <div className="tch-bar" key={s.title}>
                          <span className="tch-bar-label">{s.title}</span>
                          <span className="tch-bar-track">
                            <span style={{ width: `${Math.max(8, Math.round((s.count / maxSubject) * 100))}%` }} />
                          </span>
                          <b>{s.count}</b>
                        </div>
                      ))}
                    </div>
                  )}
              </section>

              <section className="card pad">
                <div className="section-row">
                  <h3>Соңғы қосылғандар</h3>
                  <Link to="/admin/teachers" className="link-gold small">Барлығы <Icon name="arrow" size={14} /></Link>
                </div>
                {d.recent.length === 0 ? <Empty title="Мұғалім жоқ" text="Жаңа мұғалім қосылғанда осы жерде көрінеді." />
                  : (
                    <div className="tch-recent">
                      {d.recent.map((t) => (
                        <Link to={`/admin/teachers/${t.id}`} key={t.id} className="tch-recent-row">
                          <TeacherAvatar t={t} size={40} />
                          <span className="tch-recent-main">
                            <b>{teacherName(t)}</b>
                            <span className="muted small">{t.email || t.phone} · {fmtDate(t.created_at)}</span>
                          </span>
                          <EmploymentBadge status={t.employment_status} />
                          {t.is_blocked && <span className="badge adm-badge-bad">Бұғатталған</span>}
                        </Link>
                      ))}
                    </div>
                  )}
              </section>
            </div>
          </>
        )}
    </div>
  );
}
