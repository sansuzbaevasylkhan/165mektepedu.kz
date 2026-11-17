import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Empty, ErrorState, Modal, Spinner, useAsync } from '../../components/ui';
import { Icon } from '../../components/Icons';
import { api } from '../../lib/api';
import { friendlyError } from '../../lib/errors';
import { useRealtime } from '../../lib/useRealtime';
import type { MySubject, StudentProgress, TeacherClassStudent } from '../../types';

const TERM_LABEL: Record<string, string> = {
  year: 'Оқу жылы', '1': '1-тоқсан', '2': '2-тоқсан', '3': '3-тоқсан', '4': '4-тоқсан',
};

export default function MySubjects() {
  const [params] = useSearchParams();
  const subjects = useAsync(() => api.teacher.mySubjects(), []);
  useRealtime(['teacher_assignments', 'class_members', 'subjects'], subjects.reload);

  const [subjectId, setSubjectId] = useState(params.get('subject') ?? '');
  const [klass, setKlass] = useState(params.get('class') ?? '');
  const [student, setStudent] = useState<TeacherClassStudent | null>(null);

  const list = subjects.data ?? [];
  const subject: MySubject | undefined = list.find((s) => s.subject_id === subjectId) ?? list[0];

  useEffect(() => {
    if (!subjectId && list.length > 0) setSubjectId(list[0].subject_id);
  }, [list, subjectId]);

  useEffect(() => {
    if (subject && !subject.classes.includes(klass)) setKlass(subject.classes[0] ?? '');
  }, [subject, klass]);

  const roster = useAsync(
    () => (subject && klass ? api.teacher.classStudents(subject.subject_id, klass) : Promise.resolve([])),
    [subject?.subject_id, klass],
  );

  const progress = useAsync(
    () => (student ? api.journal.progress(student.student_id) : Promise.resolve(null)),
    [student?.student_id],
  );

  if (subjects.loading && !subjects.data) return <Spinner />;
  if (subjects.error) return <ErrorState message={friendlyError(subjects.error)} onRetry={subjects.reload} />;

  return (
    <div className="tch-page tch-my-subjects">
      <div className="tch-hero">
        <div>
          <span className="tch-eyebrow">Мұғалім кабинеті</span>
          <h1>Менің пәндерім</h1>
          <p className="muted small">Әр пән бойынша сыныптарды таңдап, оқушылар тізімін қараңыз.</p>
        </div>
        <Link to="/timetable" className="btn btn-ghost"><Icon name="clock" size={16} /> Сабақ кестесі</Link>
      </div>

      {list.length === 0 ? (
        <Empty title="Пән бекітілмеген"
          text="Әкімшілік сізге пән мен сыныптарды бекіткен соң, олар осы бетте пайда болады." />
      ) : (
        <div className="tch-subjects-layout">
          <div className="tch-subject-list">
            {list.map((s) => (
              <button key={s.id} type="button"
                className={`tch-subject-card ${subject?.id === s.id ? 'active' : ''}`}
                onClick={() => { setSubjectId(s.subject_id); setKlass(s.classes[0] ?? ''); }}>
                <div className="tch-subject-top">
                  <b>{s.subject_title}</b>
                  {!s.subject_active && <span className="badge adm-badge-warn">Мұрағатта</span>}
                </div>
                <span className="muted small">{s.classes.join(', ') || 'сынып жоқ'}</span>
                <div className="tch-subject-meta">
                  <span><Icon name="clock" size={14} /> {s.weekly_hours} сағат/апта</span>
                  <span><Icon name="layers" size={14} /> {s.class_students.reduce((n, c) => n + c.students, 0)} оқушы</span>
                  <span className="badge adm-badge-muted">{TERM_LABEL[s.term] ?? s.term}</span>
                </div>
                {s.academic_year && <span className="tch-subject-year muted small">{s.academic_year}</span>}
              </button>
            ))}
          </div>

          <div className="card pad tch-subject-detail">
            {!subject ? null : (
              <>
                <div className="tch-card-head">
                  <div>
                    <h2>{subject.subject_title}</h2>
                    <p className="muted small">
                      {subject.academic_year || 'Оқу жылы'} · {TERM_LABEL[subject.term] ?? subject.term} · {subject.weekly_hours} сағат/апта
                    </p>
                  </div>
                  <Link className="btn btn-gold btn-sm"
                    to={`/teacher/journal?subject=${subject.subject_id}&class=${encodeURIComponent(klass)}`}>
                    <Icon name="grid" size={15} /> Журнал
                  </Link>
                </div>

                <div className="tch-classes" role="tablist" aria-label="Сыныптар">
                  {subject.classes.map((c) => (
                    <button key={c} type="button" role="tab" aria-selected={klass === c}
                      className={`tch-class-pill ${klass === c ? 'active' : ''}`} onClick={() => setKlass(c)}>
                      {c}
                      <span>{subject.class_students.find((x) => x.class_name === c)?.students ?? 0}</span>
                    </button>
                  ))}
                </div>

                {subject.classes.length === 0 ? (
                  <Empty title="Сынып бекітілмеген" />
                ) : roster.loading && !roster.data ? <Spinner />
                  : roster.error ? <ErrorState message={friendlyError(roster.error)} onRetry={roster.reload} />
                  : (roster.data?.length ?? 0) === 0 ? (
                    <Empty title="Оқушы табылмады" text="Бұл сыныпта оқушы құрамы әлі толтырылмаған." />
                  ) : (
                    <div className="table-wrap">
                      <table className="tch-table">
                        <thead>
                          <tr><th>#</th><th>Оқушы</th><th>Сынып</th><th /></tr>
                        </thead>
                        <tbody>
                          {roster.data!.map((st, i) => (
                            <tr key={st.student_id}>
                              <td className="muted">{i + 1}</td>
                              <td><b>{st.last_name} {st.first_name}</b></td>
                              <td>{st.class_name}</td>
                              <td className="tch-row-actions">
                                <button className="btn btn-ghost btn-sm" onClick={() => setStudent(st)}>
                                  <Icon name="chart" size={14} /> Үлгерім
                                </button>
                                <Link className="btn btn-ghost btn-sm"
                                  to={`/teacher/journal?subject=${subject.subject_id}&class=${encodeURIComponent(klass)}&student=${st.student_id}`}>
                                  Бағалар
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
              </>
            )}
          </div>
        </div>
      )}

      {student && (
        <Modal title={`${student.last_name} ${student.first_name} — үлгерім`} onClose={() => setStudent(null)}>
          {progress.loading && !progress.data ? <Spinner />
            : progress.error ? <ErrorState message={friendlyError(progress.error)} onRetry={progress.reload} />
            : !progress.data ? <Empty title="Деректер жоқ" />
            : <ProgressBody p={progress.data} />}
        </Modal>
      )}
    </div>
  );
}

function ProgressBody({ p }: { p: StudentProgress }) {
  return (
    <div className="stack">
      <div className="tch-progress-ring">
        <b>{Math.round(p.percent)}%</b>
        <span>Жалпы үлгерім</span>
      </div>
      <div className="tch-mini-stats">
        <div className="tch-mini-stat"><b>{p.lessons_done}/{p.lessons_total}</b><span>Сабақ</span></div>
        <div className="tch-mini-stat"><b>{p.video_done}</b><span>Видео</span></div>
        <div className="tch-mini-stat"><b>{p.tests_passed}</b><span>Тест</span></div>
        <div className="tch-mini-stat accent"><b>{p.avg_score}</b><span>Орташа балл</span></div>
      </div>
    </div>
  );
}
