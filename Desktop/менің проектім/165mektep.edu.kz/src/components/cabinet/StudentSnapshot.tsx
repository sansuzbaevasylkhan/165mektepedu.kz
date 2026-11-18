import { Link } from 'react-router-dom';
import { Icon, type IconName } from '../Icons';
import { ProgressBar, Ring } from '../ui';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { fileSize } from '../../lib/assignments';
import { friendlyError } from '../../lib/errors';
import { fmtDate } from '../../lib/util';
import type { SnapshotTeacher, StudentDashboard } from '../../types';

const ACH_ICONS: Record<string, IconName> = {
  trophy: 'trophy', star: 'star', check: 'check', clipboard: 'clipboard', chart: 'chart', cap: 'cap',
};

export function StudentSnapshot({ data, mode = 'student', onMessageTeacher }: {
  data: StudentDashboard;
  mode?: 'student' | 'parent';
  onMessageTeacher?: (t: SnapshotTeacher) => void;
}) {
  const toast = useToast();
  const a = data.attendance;

  const openMaterial = async (path: string) => {
    try { const url = await api.materials.signedUrl(path); window.open(url, '_blank', 'noopener'); }
    catch (e) { toast.show(friendlyError(e), 'error'); }
  };

  return (
    <div className="stack-lg tch-page">
      <div className="grid grid-2 tight">
        <div className="card pad">
          <div className="section-row">
            <div>
              <span className="tch-eyebrow">Орташа балл</span>
              <h3>GPA</h3>
            </div>
            <b className="tch-big-number">{data.gpa.toFixed(2)}</b>
          </div>
          <ProgressBar value={Math.min(100, (data.gpa / 5) * 100)} />
          <p className="muted small">{data.grades_count} баға · {data.academic_year ?? 'оқу жылы'}</p>
        </div>
        <div className="card pad">
          <div className="section-row">
            <div>
              <span className="tch-eyebrow">Сабаққа қатысу</span>
              <h3>Қатысым</h3>
            </div>
            <b className="tch-big-number">{data.attendance_percent.toFixed(1)}%</b>
          </div>
          <ProgressBar value={data.attendance_percent} />
          <div className="tch-att-mini">
            <span>Келді: <b>{a.present}</b></span>
            <span>Кешікті: <b>{a.late}</b></span>
            <span>Себепті: <b>{a.excused}</b></span>
            <span>Себепсіз: <b>{a.absent}</b></span>
          </div>
        </div>
      </div>

      <div className="tch-mini-stats">
        <div className="tch-mini-stat">
          <b>{data.class_name ?? '—'}</b><span>Сынып</span>
        </div>
        <div className="tch-mini-stat">
          <b>{data.assignments.pending}</b><span>Орындалмаған тапсырма</span>
        </div>
        <div className="tch-mini-stat">
          <b>{data.subjects.length}</b><span>Пән</span>
        </div>
        <div className="tch-mini-stat accent">
          <b>{data.achievements.filter((x) => x.got).length}</b><span>Марапат</span>
        </div>
      </div>

      <div className="tch-dash-grid">
        <section className="card pad">
          <div className="section-row">
            <h3>Бүгінгі сабақтар</h3>
            <span className="badge adm-badge-muted">{data.today_lessons.length}</span>
          </div>
          {data.today_lessons.length === 0 ? <p className="muted small">Бүгін сабақ жоқ.</p> : (
            <div className="tch-lessons">
              {data.today_lessons.map((l) => (
                <div className="tch-lesson" key={l.id}>
                  <span className="tch-lesson-time">{l.start_time.slice(0, 5)}{l.end_time ? `–${l.end_time.slice(0, 5)}` : ''}</span>
                  <div><b>{l.subject_title}</b><span className="muted small">{l.teacher_name}{l.room ? ` · ${l.room}` : ''}</span></div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card pad">
          <div className="section-row">
            <h3>Пәндер бойынша үлгерім</h3>
          </div>
          {data.subjects.length === 0 ? <p className="muted small">Баға әзірге жоқ.</p> : (
            <div className="tch-bars">
              {data.subjects.map((s) => (
                <div className="tch-bar" key={s.subject_id}>
                  <span className="tch-bar-label" title={s.subject_title}>{s.subject_title}</span>
                  <span className="tch-bar-track"><span style={{ width: `${Math.min(100, s.average ?? 0)}%` }} /></span>
                  <b>{s.average != null ? `${s.average}%` : '—'}</b>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="card pad">
        <div className="section-row">
          <h3>Соңғы бағалар</h3>
          {mode === 'student' && (
            <Link to="/cabinet/assignments" className="link-gold small">Тапсырмалар</Link>
          )}
        </div>
        {data.recent_grades.length === 0 ? <p className="muted small">Баға әзірге жоқ.</p> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Күні</th><th>Пән</th><th>Түрі</th><th>Баға</th><th>Пікір</th></tr></thead>
              <tbody>
                {data.recent_grades.map((g) => (
                  <tr key={g.id}>
                    <td className="muted">{fmtDate(g.lesson_date)}</td>
                    <td>{g.subject_title}</td>
                    <td className="muted small">{g.kind === 'daily' ? 'Күнделікті' : g.kind === 'sor' ? 'БЖБ' : g.kind === 'soch' ? 'ТЖБ' : 'Тоқсан'}</td>
                    <td><b>{g.score}</b>{g.max_score !== 100 ? `/${g.max_score}` : ''}</td>
                    <td className="muted small">{g.comment || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="tch-dash-grid">
        <section className="card pad">
          <h3>Марапаттар</h3>
          <div className="grid grid-2 tight">
            {data.achievements.map((x) => (
              <div key={x.code} className={`achv ${x.got ? 'got' : ''}`}>
                <Icon name={x.got ? (ACH_ICONS[x.icon] ?? 'star') : 'lock'} size={22} />
                <div>
                  <b>{x.title}</b>
                  <p className="muted small">{x.description}</p>
                  {x.awarded_at && <span className="badge adm-badge-ok">Берілді</span>}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card pad">
          <h3>Сертификаттар</h3>
          {data.certificates.length === 0 ? <p className="muted small">Сертификат әзірге жоқ.</p> : (
            <div className="lines">
              {data.certificates.map((c) => (
                <div className="line" key={c.id}>
                  <div><b>{c.title}</b><span className="muted small"> · {fmtDate(c.issued_at)}</span></div>
                  {c.number && <span className="badge adm-badge-muted">№ {c.number}</span>}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="card pad">
        <div className="section-row">
          <h3>Оқу материалдары</h3>
          <span className="badge adm-badge-muted">{data.materials.length}</span>
        </div>
        {data.materials.length === 0 ? <p className="muted small">Материал әзірге жоқ.</p> : (
          <div className="lines">
            {data.materials.map((m) => (
              <div className="line" key={m.id}>
                <div>
                  <b>{m.title}</b>
                  <span className="muted small"> · {m.subject_title} · {m.file_name} · {fileSize(m.size_bytes ?? 0)}</span>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => void openMaterial(m.storage_path)}>
                  <Icon name="file" size={15} /> Ашу
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {mode === 'parent' && data.teachers.length > 0 && (
        <section className="card pad">
          <h3>Мұғалімдермен байланыс</h3>
          <div className="lines">
            {data.teachers.map((t) => (
              <div className="line" key={`${t.teacher_id}-${t.subject_id}`}>
                <div><b>{t.teacher_name}</b><span className="muted small"> · {t.subject_title}</span></div>
                <button className="btn btn-gold btn-sm" onClick={() => onMessageTeacher?.(t)}>
                  <Icon name="mail" size={15} /> Жазу
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {mode === 'student' && (
        <div className="tch-quick">
          <Link to="/cabinet/assignments" className="adm-quick-card">
            <Icon name="clipboard" size={22} />
            <b>Менің тапсырмаларым</b>
            <span className="muted small">Үй тапсырмаларын орындау және жіберу</span>
          </Link>
          <Link to="/cabinet/tests" className="adm-quick-card">
            <Icon name="check" size={22} />
            <b>Онлайн тесттер</b>
            <span className="muted small">Мұғалім тесттерін тапсыру және нәтижелер</span>
          </Link>
          <Link to="/timetable" className="adm-quick-card">
            <Icon name="calendar" size={22} />
            <b>Сабақ кестесі</b>
            <span className="muted small">Апталық кестені көру</span>
          </Link>
        </div>
      )}

      {data.today_lessons.length === 0 && data.subjects.length === 0 && data.grades_count === 0 && (
        <p className="muted center small">Деректер әзірге жоқ — мұғалім баға мен кесте қосқанда осында көрінеді.</p>
      )}
      {mode === 'student' && data.assignments.pending > 0 && (
        <Link to="/cabinet/assignments" className="tch-note">
          <Icon name="clipboard" size={16} />
          <span><b>{data.assignments.pending}</b> орындалмаған тапсырма бар — ашып орындаңыз.</span>
        </Link>
      )}
    </div>
  );
}
