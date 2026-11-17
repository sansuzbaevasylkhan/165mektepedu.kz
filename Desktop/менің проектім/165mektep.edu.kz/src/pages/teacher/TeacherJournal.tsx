import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Empty, ErrorState, Field, Modal, Spinner, useAsync, useConfirm } from '../../components/ui';
import { Icon } from '../../components/Icons';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { friendlyError } from '../../lib/errors';
import { useRealtime } from '../../lib/useRealtime';
import type {
  JournalGrade, JournalKind, JournalStudent, LessonAttendanceStatus, MySubject,
} from '../../types';

const TERMS = [['1', '1-тоқсан'], ['2', '2-тоқсан'], ['3', '3-тоқсан'], ['4', '4-тоқсан']];
const KIND_LABEL: Record<JournalKind, string> = {
  daily: 'Күнделікті', sor: 'БЖБ', soch: 'ТЖБ', term: 'Тоқсандық',
};
const KIND_SHORT: Record<JournalKind, string> = { daily: 'К', sor: 'БЖБ', soch: 'ТЖБ', term: 'Т' };
const ATT_LABEL: Record<LessonAttendanceStatus, string> = {
  present: 'Келді', late: 'Кешікті', excused: 'Дәлелді', absent: 'Келмеді',
};
const ATT_CLASS: Record<LessonAttendanceStatus, string> = {
  present: 'adm-badge-ok', late: 'adm-badge-warn', excused: 'adm-badge-muted', absent: 'adm-badge-bad',
};

function localToday() {
  const d = new Date();
  const p = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

interface GradeDraft {
  student: JournalStudent;
  kind: JournalKind;
  score: string;
  max: string;
  date: string;
  comment: string;
}

export default function TeacherJournal() {
  const { profile } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [params] = useSearchParams();
  const subjects = useAsync(() => api.teacher.mySubjects(), []);
  const [subjectId, setSubjectId] = useState(params.get('subject') ?? '');
  const [klass, setKlass] = useState(params.get('class') ?? '');
  const [term, setTerm] = useState(params.get('term') ?? '1');
  const [date, setDate] = useState(params.get('date') ?? localToday());
  const [att, setAtt] = useState<Record<string, LessonAttendanceStatus>>({});
  const [draft, setDraft] = useState<GradeDraft | null>(null);
  const [busy, setBusy] = useState(false);

  const list = subjects.data ?? [];
  const options = useMemo(() => {
    const map = new Map<string, { id: string; title: string; classes: string[] }>();
    for (const s of list) {
      const cur = map.get(s.subject_id);
      if (cur) cur.classes = [...new Set([...cur.classes, ...s.classes])];
      else map.set(s.subject_id, { id: s.subject_id, title: s.subject_title, classes: [...s.classes] });
    }
    return [...map.values()];
  }, [list]);

  const subject = options.find((o) => o.id === subjectId);

  useEffect(() => {
    if (!subjectId && options.length > 0) setSubjectId(options[0].id);
  }, [options, subjectId]);
  useEffect(() => {
    if (subject && !subject.classes.includes(klass)) setKlass(subject.classes[0] ?? '');
  }, [subject, klass]);

  const journal = useAsync(
    () => (subjectId && klass
      ? api.journal.get({ subject: subjectId, klass, term, date })
      : Promise.resolve(null)),
    [subjectId, klass, term, date],
  );
  useRealtime(['journal_entries', 'lesson_attendance', 'class_members'], journal.reload);

  useEffect(() => {
    if (!journal.data) return;
    const next: Record<string, LessonAttendanceStatus> = {};
    for (const s of journal.data.students) {
      next[s.student_id] = (s.attendance?.status as LessonAttendanceStatus) ?? 'present';
    }
    setAtt(next);
  }, [journal.data]);

  const saveAttendance = async () => {
    if (!journal.data) return;
    setBusy(true);
    try {
      await api.journal.saveAttendance({
        subject: subjectId, klass, date,
        entries: journal.data.students.map((s) => ({ student_id: s.student_id, status: att[s.student_id] ?? 'present' })),
      });
      toast.show('Қатысу сақталды', 'success');
      journal.reload();
    } catch (err) { toast.show(friendlyError(err), 'error'); }
    finally { setBusy(false); }
  };

  const setAll = (status: LessonAttendanceStatus) => {
    if (!journal.data) return;
    setAtt(Object.fromEntries(journal.data.students.map((s) => [s.student_id, status])));
  };

  const removeGrade = async (g: JournalGrade) => {
    if (!confirm('Бағаны жоясыз ба?')) return;
    try { await api.journal.deleteGrade(g.id); journal.reload(); }
    catch (err) { toast.show(friendlyError(err), 'error'); }
  };

  const students = journal.data?.students ?? [];
  const journalAverage = students.length
    ? students.reduce((n, s) => n + (s.average ?? 0), 0) / students.filter((s) => s.average != null).length
    : 0;

  if (subjects.loading && !subjects.data) return <div className="tch-page"><Spinner /></div>;
  if (subjects.error) return <div className="tch-page"><ErrorState message={friendlyError(subjects.error)} onRetry={subjects.reload} /></div>;

  return (
    <div className="tch-page">
      <div className="tch-hero">
        <div>
          <span className="tch-eyebrow">Мұғалім кабинеті</span>
          <h1>Электрондық журнал</h1>
          <p className="muted small">Бағалар, БЖБ/ТЖБ және сабаққа қатысуды осы жерден толтырыңыз.</p>
        </div>
        <button className="btn btn-gold" disabled={!journal.data}
          onClick={() => { const s = students[0]; if (s) setDraft(newDraft(s, date)); }}>
          <Icon name="plus" size={16} /> Баға қою
        </button>
      </div>

      {options.length === 0 ? (
        <Empty title="Пән бекітілмеген" text="Журнал тек сізге бекітілген пәндер мен сыныптар үшін ашылады." />
      ) : (
        <>
          <div className="card pad">
            <div className="tch-journal-controls">
              <Field label="Пән">
                <select className="input" value={subjectId}
                  onChange={(e) => { setSubjectId(e.target.value); setKlass(''); }}>
                  {options.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
                </select>
              </Field>
              <Field label="Сынып">
                <select className="input" value={klass} onChange={(e) => setKlass(e.target.value)}>
                  {(subject?.classes ?? []).map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Тоқсан">
                <select className="input" value={term} onChange={(e) => setTerm(e.target.value)}>
                  {TERMS.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </Field>
              <Field label="Күні">
                <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </Field>
            </div>
          </div>

          {journal.loading && !journal.data ? <Spinner />
            : journal.error ? <ErrorState message={friendlyError(journal.error)} onRetry={journal.reload} />
            : !journal.data ? <Empty title="Журнал жоқ" />
            : students.length === 0 ? (
              <Empty title="Оқушы құрамы бос"
                text="Сынып құрамы әкімшілік тарапынан толтырылған соң журнал ашылады." />
            ) : (
              <>
                <div className="tch-mini-stats">
                  <div className="tch-mini-stat"><b>{students.length}</b><span>Оқушы</span></div>
                  <div className="tch-mini-stat accent"><b>{Number.isFinite(journalAverage) ? journalAverage.toFixed(2) : '—'}</b><span>Орташа балл</span></div>
                  <div className="tch-mini-stat"><b>{students.reduce((n, s) => n + s.grades.length, 0)}</b><span>Баға саны</span></div>
                  <div className="tch-mini-stat"><b>{journal.data.date}</b><span>Сабақ күні</span></div>
                </div>

                <div className="card pad">
                  <div className="tch-card-head">
                    <h2 className="tch-card-title"><Icon name="users" size={17} /> Оқушылар мен бағалар</h2>
                    <div className="tch-att-quick">
                      {(Object.keys(ATT_LABEL) as LessonAttendanceStatus[]).map((s) => (
                        <button key={s} type="button" className={`badge ${ATT_CLASS[s]} tch-att-btn`}
                          onClick={() => setAll(s)}>{ATT_LABEL[s]}</button>
                      ))}
                    </div>
                  </div>
                  <div className="table-wrap">
                    <table className="tch-table tch-journal-table">
                      <thead>
                        <tr>
                          <th>Оқушы</th>
                          <th>Бағалар</th>
                          <th>Орташа</th>
                          <th>Қатысу ({date})</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((s) => {
                          const highlight = params.get('student') === s.student_id;
                          return (
                            <tr key={s.student_id} className={highlight ? 'tch-row-highlight' : ''}>
                              <td><b>{s.last_name} {s.first_name}</b></td>
                              <td>
                                <div className="tch-grade-chips">
                                  {s.grades.length === 0 && <span className="muted small">—</span>}
                                  {s.grades.map((g) => (
                                    <button key={g.id} type="button"
                                      className={`tch-grade tch-grade-${g.kind}`}
                                      title={`${KIND_LABEL[g.kind]} · ${g.date}${g.comment ? ` · ${g.comment}` : ''} (жою үшін басыңыз)`}
                                      onClick={() => { if (g.teacher_id === profile?.id) void removeGrade(g); }}>
                                      <span>{KIND_SHORT[g.kind]}</span>{g.score}
                                    </button>
                                  ))}
                                </div>
                              </td>
                              <td><b>{s.average ?? '—'}</b></td>
                              <td>
                                <select className="input tch-att-select"
                                  value={att[s.student_id] ?? 'present'}
                                  onChange={(e) => setAtt({ ...att, [s.student_id]: e.target.value as LessonAttendanceStatus })}>
                                  {(Object.keys(ATT_LABEL) as LessonAttendanceStatus[])
                                    .map((v) => <option key={v} value={v}>{ATT_LABEL[v]}</option>)}
                                </select>
                              </td>
                              <td>
                                <button className="btn btn-ghost btn-sm" onClick={() => setDraft(newDraft(s, date))}>
                                  <Icon name="plus" size={14} /> Баға
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="tch-journal-actions">
                    <button className="btn btn-gold" disabled={busy} onClick={() => void saveAttendance()}>
                      <Icon name="check" size={16} /> Қатысуды сақтау
                    </button>
                  </div>
                </div>
              </>
            )}
        </>
      )}

      {draft && (
        <GradeModal draft={draft} subject={subjectId} klass={klass} term={term}
          onClose={() => setDraft(null)}
          onSaved={() => { setDraft(null); journal.reload(); }} />
      )}
    </div>
  );
}

function newDraft(student: JournalStudent, date: string): GradeDraft {
  return { student, kind: 'daily', score: '', max: '5', date, comment: '' };
}

function GradeModal({ draft, subject, klass, term, onClose, onSaved }: {
  draft: GradeDraft; subject: string; klass: string; term: string;
  onClose: () => void; onSaved: () => void;
}) {
  const toast = useToast();
  const [kind, setKind] = useState<JournalKind>(draft.kind);
  const [score, setScore] = useState(draft.score);
  const [max, setMax] = useState(draft.max);
  const [date, setDate] = useState(draft.date);
  const [comment, setComment] = useState(draft.comment);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    const n = Number(score);
    const m = Number(max);
    if (!Number.isFinite(n) || !Number.isFinite(m) || m <= 0 || n < 0 || n > m) {
      toast.show(`Балл 0–${max} аралығында болуы керек`, 'error'); return;
    }
    setBusy(true);
    try {
      await api.journal.saveGrade({
        student: draft.student.student_id, subject, klass, term,
        kind, score: n, max: m, date, comment,
      });
      toast.show('Баға қойылды', 'success');
      onSaved();
    } catch (err) { toast.show(friendlyError(err), 'error'); }
    finally { setBusy(false); }
  };

  return (
    <Modal title={`${draft.student.last_name} ${draft.student.first_name} — баға`} onClose={onClose}>
      <div className="stack">
        <Field label="Баға түрі">
          <select className="input" value={kind} onChange={(e) => setKind(e.target.value as JournalKind)}>
            {(Object.keys(KIND_LABEL) as JournalKind[]).map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
          </select>
        </Field>
        <div className="tch-form-grid">
          <Field label="Балл">
            <input className="input" type="number" min={0} value={score} autoFocus
              onChange={(e) => setScore(e.target.value)} />
          </Field>
          <Field label="Максималды балл">
            <input className="input" type="number" min={1} value={max} onChange={(e) => setMax(e.target.value)} />
          </Field>
        </div>
        <Field label="Күні">
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Түсініктеме (міндетті емес)">
          <input className="input" maxLength={500} value={comment} onChange={(e) => setComment(e.target.value)} />
        </Field>
        <div className="tch-modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Болдырмау</button>
          <button className="btn btn-gold" disabled={busy} onClick={() => void save()}>
            <Icon name="check" size={16} /> Сақтау
          </button>
        </div>
      </div>
    </Modal>
  );
}
