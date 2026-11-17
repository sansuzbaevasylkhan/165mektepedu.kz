import { Link } from 'react-router-dom';
import { Empty, ErrorState, Spinner, useAsync } from '../../components/ui';
import { Icon } from '../../components/Icons';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { friendlyError } from '../../lib/errors';
import { useRealtime } from '../../lib/useRealtime';
import { fmtDateTime } from '../../lib/util';

const ASSIGN_STATUS: Record<string, { label: string; cls: string }> = {
  draft: { label: 'Жоба', cls: 'adm-badge-muted' },
  published: { label: 'Жарияланды', cls: 'adm-badge-ok' },
  closed: { label: 'Жабылды', cls: 'adm-badge-muted' },
  archived: { label: 'Мұрағат', cls: 'adm-badge-muted' },
};

export default function TeacherDashboard() {
  const { profile } = useAuth();
  const data = useAsync(() => api.teacher.panelDashboard(), []);
  const subjects = useAsync(() => api.teacher.mySubjects(), []);
  useRealtime(
    ['assignments', 'assignment_submissions', 'teacher_messages', 'lesson_attendance', 'teacher_assignments', 'class_members'],
    () => { data.reload(); subjects.reload(); },
  );

  const d = data.data;
  const today = new Date().toLocaleDateString('kk-KZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const attendance = d?.today_attendance;
  const attendanceTotal = attendance
    ? attendance.present + attendance.late + attendance.excused + attendance.absent : 0;

  return (
    <div className="tch-page tch-dashboard">
      <div className="tch-hero">
        <div>
          <span className="tch-eyebrow">Мұғалім кабинеті</span>
          <h1>Сәлеметсіз бе, {profile?.first_name}!</h1>
          <p className="muted small">{today}</p>
        </div>
        <div className="tch-head-actions">
          <Link to="/teacher/assignments" className="btn btn-gold"><Icon name="plus" size={16} /> Тапсырма беру</Link>
          <Link to="/teacher/journal" className="btn btn-ghost"><Icon name="grid" size={16} /> Журнал</Link>
        </div>
      </div>

      {data.loading && !d ? <Spinner />
        : data.error ? <ErrorState message={friendlyError(data.error)} onRetry={data.reload} />
        : !d ? <Empty title="Деректер жоқ" />
        : (
          <>
            <div className="tch-mini-stats tch-dashboard-stats">
              <div className="tch-mini-stat accent"><b>{d.subjects}</b><span>Пән</span></div>
              <div className="tch-mini-stat"><b>{d.classes.length}</b><span>Сынып</span></div>
              <div className="tch-mini-stat"><b>{d.students}</b><span>Оқушы</span></div>
              <div className="tch-mini-stat"><b>{d.pending_submissions}</b><span>Тексеру күтіп тұр</span></div>
              <div className="tch-mini-stat"><b>{d.unread_messages}</b><span>Оқылмаған хабарлама</span></div>
            </div>

            <div className="tch-dash-grid">
              <section className="card pad">
                <div className="tch-card-head">
                  <h2><Icon name="clock" size={18} /> Бүгінгі сабақтар</h2>
                  <Link to="/timetable" className="btn btn-ghost btn-sm">Толық кесте</Link>
                </div>
                {d.lessons_today.length === 0 ? (
                  <Empty title="Бүгін сабақ жоқ" text="Сабақ кестесінде бүгінгі күнге сабақ тіркелмеген." />
                ) : (
                  <div className="tch-lesson-list">
                    {d.lessons_today.map((l) => (
                      <div className="tch-lesson-row" key={l.id}>
                        <span className="tch-lesson-time">{l.start_time.slice(0, 5)}</span>
                        <div className="tch-lesson-main">
                          <b>{l.subject}</b>
                          <span className="muted small">{l.class_name}{l.room ? ` · ${l.room}` : ''}</span>
                        </div>
                        <span className="badge adm-badge-muted">{l.end_time ? `дейін ${l.end_time.slice(0, 5)}` : '—'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="card pad">
                <div className="tch-card-head">
                  <h2><Icon name="check" size={18} /> Бүгінгі қатысу</h2>
                  <Link to="/teacher/journal" className="btn btn-ghost btn-sm">Толтыру</Link>
                </div>
                {attendanceTotal === 0 ? (
                  <Empty title="Қатысу белгіленбеген" text="Журналдан сабаққа қатысуды белгілеңіз." />
                ) : (
                  <div className="tch-att-summary">
                    <div className="tch-att-item ok"><b>{attendance?.present ?? 0}</b><span>Келді</span></div>
                    <div className="tch-att-item warn"><b>{attendance?.late ?? 0}</b><span>Кешікті</span></div>
                    <div className="tch-att-item info"><b>{attendance?.excused ?? 0}</b><span>Дәлелді</span></div>
                    <div className="tch-att-item bad"><b>{attendance?.absent ?? 0}</b><span>Келмеді</span></div>
                  </div>
                )}
              </section>

              <section className="card pad">
                <div className="tch-card-head">
                  <h2><Icon name="clipboard" size={18} /> Жақын тапсырмалар</h2>
                  <Link to="/teacher/assignments" className="btn btn-ghost btn-sm">Барлығы</Link>
                </div>
                {d.upcoming.length === 0 ? (
                  <Empty title="Тапсырма жоқ" text="Жарияланған тапсырмалар осында көрінеді." />
                ) : (
                  <div className="tch-upcoming">
                    {d.upcoming.map((a) => (
                      <Link to={`/teacher/assignments/${a.id}`} className="tch-upcoming-row" key={a.id}>
                        <div>
                          <b>{a.title}</b>
                          <span className="muted small">{a.subject}</span>
                        </div>
                        <div className="tch-upcoming-meta">
                          <span className={`badge ${ASSIGN_STATUS[a.status]?.cls ?? 'adm-badge-muted'}`}>
                            {ASSIGN_STATUS[a.status]?.label ?? a.status}
                          </span>
                          <span className="muted small">{a.due_at ? fmtDateTime(a.due_at) : 'мерзімсіз'}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </section>

              <section className="card pad">
                <div className="tch-card-head">
                  <h2><Icon name="mail" size={18} /> Хабарламалар</h2>
                  <Link to="/teacher/messages" className="btn btn-ghost btn-sm">Ашу</Link>
                </div>
                {d.messages.length === 0 ? (
                  <Empty title="Хабарлама жоқ" />
                ) : (
                  <div className="tch-msg-preview">
                    {d.messages.map((m) => (
                      <Link to="/teacher/messages" className="tch-msg-row" key={m.id}>
                        <div className="tch-msg-main">
                          <b>{m.title}</b>
                          <span className="muted small">{m.is_mine ? 'Жіберілді' : 'Келді'} · {fmtDateTime(m.created_at)}</span>
                        </div>
                        {!m.is_mine && !m.read_at && <span className="tch-unread-dot" aria-label="Оқылмаған" />}
                      </Link>
                    ))}
                  </div>
                )}
                {d.director_messages.length > 0 && (
                  <div className="tch-dir-notes">
                    <span className="tch-eyebrow">Директордан</span>
                    {d.director_messages.map((m) => (
                      <div className="tch-dir-note" key={m.id}>
                        <b>{m.title}</b>
                        <p className="muted small">{m.body}</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <section className="card pad tch-quick">
              <h2><Icon name="book" size={18} /> Менің пәндерім</h2>
              {subjects.data && subjects.data.length > 0 ? (
                <div className="tch-subject-mini">
                  {subjects.data.map((s) => (
                    <Link to={`/teacher/subjects?subject=${s.subject_id}`} className="tch-subject-chip" key={s.id}>
                      <b>{s.subject_title}</b>
                      <span className="muted small">{s.classes.join(', ')}</span>
                      <span className="badge adm-badge-muted">{s.weekly_hours} сағат/апта</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <Empty title="Пән бекітілмеген" text="Әкімшілік пән мен сыныпты бекіткен соң осында көрінеді." />
              )}
            </section>
          </>
        )}
    </div>
  );
}
