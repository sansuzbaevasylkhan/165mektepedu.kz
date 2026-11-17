import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Empty, ErrorState, Field, Modal, Spinner, useAsync, useConfirm } from '../../components/ui';
import { Icon } from '../../components/Icons';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import {
  ASSIGNMENT_STATUS_CLASS, ASSIGNMENT_STATUS_LABEL, TERM_LABEL, fromLocalInput, toLocalInput,
} from '../../lib/assignments';
import { friendlyError } from '../../lib/errors';
import { useRealtime } from '../../lib/useRealtime';
import { fmtDateTime } from '../../lib/util';
import type {
  AssignmentAudience, AssignmentDetail, AssignmentTeacherRow, MySubject,
} from '../../types';

type StatusFilter = '' | 'draft' | 'published' | 'closed';

interface Draft {
  id?: string;
  subject_id: string;
  audience: AssignmentAudience;
  classes: string[];
  classForTargets: string;
  students: string[];
  title: string;
  description: string;
  criteria: string;
  due: string;
  max_score: string;
  video_url: string;
  status: 'draft' | 'published';
  term: string;
}

const EMPTY_DRAFT: Draft = {
  subject_id: '', audience: 'class', classes: [], classForTargets: '', students: [],
  title: '', description: '', criteria: '', due: '', max_score: '100', video_url: '',
  status: 'draft', term: 'year',
};

export default function TeacherAssignments() {
  const toast = useToast();
  const confirm = useConfirm();
  const [params, setParams] = useSearchParams();
  const subjects = useAsync(() => api.teacher.mySubjects(), []);
  const [subjectFilter, setSubjectFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [status, setStatus] = useState<StatusFilter>('');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);

  const list = useAsync(
    () => api.assignments.teacherList({
      subject: subjectFilter || null, klass: classFilter, status,
    }),
    [subjectFilter, classFilter, status],
  );
  useRealtime(['assignments', 'assignment_submissions', 'assignment_files'], list.reload);

  const mySubjects = subjects.data ?? [];
  const subjectOptions = useMemo(() => {
    const map = new Map<string, { id: string; title: string; classes: string[] }>();
    for (const s of mySubjects) {
      const cur = map.get(s.subject_id);
      if (cur) cur.classes = [...new Set([...cur.classes, ...s.classes])];
      else map.set(s.subject_id, { id: s.subject_id, title: s.subject_title, classes: [...s.classes] });
    }
    return [...map.values()];
  }, [mySubjects]);

  const classOptions = useMemo(() => {
    const set = new Set<string>();
    for (const s of mySubjects) if (!subjectFilter || s.subject_id === subjectFilter) s.classes.forEach((c) => set.add(c));
    return [...set].sort();
  }, [mySubjects, subjectFilter]);

  useEffect(() => {
    if (classFilter && !classOptions.includes(classFilter)) setClassFilter('');
  }, [classOptions, classFilter]);

  useEffect(() => {
    if (params.get('new') === '1' && subjectOptions.length > 0) {
      setDraft({ ...EMPTY_DRAFT, subject_id: subjectOptions[0].id });
      setParams({}, { replace: true });
    }
    const edit = params.get('edit');
    if (edit) {
      setParams({}, { replace: true });
      void openEdit(edit);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, subjectOptions.length]);

  const openEdit = async (id: string) => {
    setLoadingEdit(true);
    try {
      const d = await api.assignments.detail(id);
      setDraft(detailToDraft(d, subjectOptions));
    } catch (err) { toast.show(friendlyError(err), 'error'); }
    finally { setLoadingEdit(false); }
  };

  const quick = async (row: AssignmentTeacherRow, action: 'publish' | 'close') => {
    try {
      if (action === 'publish') await api.assignments.publish(row.id);
      else await api.assignments.close(row.id);
      toast.show(action === 'publish' ? 'Тапсырма жарияланды' : 'Тапсырма жабылды', 'success');
      list.reload();
    } catch (err) { toast.show(friendlyError(err), 'error'); }
  };

  const remove = async (row: AssignmentTeacherRow) => {
    if (!confirm(`«${row.title}» тапсырмасын жоясыз ба?`)) return;
    try {
      await api.assignments.remove(row.id);
      toast.show('Тапсырма жойылды', 'success');
      list.reload();
    } catch (err) { toast.show(friendlyError(err), 'error'); }
  };

  const rows = list.data ?? [];

  return (
    <div className="tch-page">
      <div className="tch-hero">
        <div>
          <span className="tch-eyebrow">Мұғалім кабинеті</span>
          <h1>Тапсырмалар</h1>
          <p className="muted small">Тапсырма құру, файл тіркеу, оқушы жұмыстарын тексеру.</p>
        </div>
        <button className="btn btn-gold" disabled={subjectOptions.length === 0}
          onClick={() => setDraft({ ...EMPTY_DRAFT, subject_id: subjectOptions[0]?.id ?? '' })}>
          <Icon name="plus" size={16} /> Жаңа тапсырма
        </button>
      </div>

      <div className="card pad tch-assign-filters">
        <div className="tch-filter-grid">
          <Field label="Пән">
            <select className="input" value={subjectFilter}
              onChange={(e) => { setSubjectFilter(e.target.value); setClassFilter(''); }}>
              <option value="">Барлық пән</option>
              {subjectOptions.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
          </Field>
          <Field label="Сынып">
            <select className="input" value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
              <option value="">Барлық сынып</option>
              {classOptions.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        </div>
        <div className="tch-tabs tch-tabs-inline" role="tablist" aria-label="Мәртебе">
          {([['', 'Барлығы'], ['draft', 'Жоба'], ['published', 'Жарияланған'], ['closed', 'Жабылған']] as [StatusFilter, string][])
            .map(([k, label]) => (
              <button key={k || 'all'} type="button" role="tab" aria-selected={status === k}
                className={`tch-tab ${status === k ? 'active' : ''}`} onClick={() => setStatus(k)}>{label}</button>
            ))}
        </div>
      </div>

      {loadingEdit && <Spinner />}
      {list.loading && !list.data ? <Spinner />
        : list.error ? <ErrorState message={friendlyError(list.error)} onRetry={list.reload} />
        : rows.length === 0 ? (
          <Empty title="Тапсырма жоқ"
            text="Жаңа тапсырма құрып, сыныпқа немесе жеке оқушыларға жіберіңіз." />
        ) : (
          <div className="tch-assign-list">
            {rows.map((a) => {
              const progress = a.submissions > 0 ? Math.round((a.checked / a.submissions) * 100) : 0;
              return (
                <div className="card pad tch-assign-card" key={a.id}>
                  <div className="tch-assign-head">
                    <div>
                      <div className="tch-badges">
                        <span className={`badge ${ASSIGNMENT_STATUS_CLASS[a.status]}`}>{ASSIGNMENT_STATUS_LABEL[a.status]}</span>
                        <span className="badge adm-badge-muted">{a.subject_title}</span>
                        {a.audience === 'students' && <span className="badge adm-badge-muted">Жеке оқушылар</span>}
                      </div>
                      <h3>{a.title}</h3>
                      <p className="muted small">
                        {a.class_names.join(', ') || (a.targets ? `${a.targets} оқушы` : '—')}
                        {' · '}Мерзімі: {a.due_at ? fmtDateTime(a.due_at) : 'мерзімсіз'}
                        {' · '}Макс: {a.max_score}
                      </p>
                    </div>
                    <div className="tch-assign-actions">
                      <Link to={`/teacher/assignments/${a.id}`} className="btn btn-gold btn-sm">
                        <Icon name="eye" size={15} /> Ашу
                      </Link>
                      {a.status === 'draft' && (
                        <>
                          <button className="btn btn-ghost btn-sm" onClick={() => void openEdit(a.id)}>
                            <Icon name="edit" size={15} /> Өңдеу
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={() => void quick(a, 'publish')}>
                            <Icon name="check" size={15} /> Жариялау
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={() => void remove(a)}>
                            <Icon name="trash" size={15} />
                          </button>
                        </>
                      )}
                      {a.status === 'published' && (
                        <button className="btn btn-ghost btn-sm" onClick={() => void quick(a, 'close')}>
                          <Icon name="close" size={15} /> Жабу
                        </button>
                      )}
                    </div>
                  </div>
                  {a.description && <p className="tch-assign-desc">{a.description}</p>}
                  <div className="tch-assign-stats">
                    <span><b>{a.submitted}</b> тапсырылды</span>
                    <span><b>{a.checked}</b> тексерілді</span>
                    <span><b>{a.files}</b> файл</span>
                    <span><b>{a.avg_score ?? '—'}</b> орташа балл</span>
                  </div>
                  <div className="tch-bar-track"><span style={{ width: `${progress}%` }} /></div>
                </div>
              );
            })}
          </div>
        )}

      {draft && subjectOptions.length > 0 && (
        <AssignmentComposer
          draft={draft}
          subjects={mySubjects}
          onChange={setDraft}
          onClose={() => setDraft(null)}
          onSaved={() => { setDraft(null); list.reload(); }}
        />
      )}
    </div>
  );
}

function detailToDraft(d: AssignmentDetail, options: { id: string; title: string; classes: string[] }[]): Draft {
  const option = options.find((o) => o.id === d.subject_id);
  return {
    id: d.id,
    subject_id: d.subject_id,
    audience: d.audience,
    classes: d.class_names,
    classForTargets: d.class_names[0] ?? option?.classes[0] ?? '',
    students: d.targets.map((t) => t.student_id),
    title: d.title,
    description: d.description,
    criteria: d.criteria,
    due: toLocalInput(d.due_at),
    max_score: String(d.max_score),
    video_url: d.video_url ?? '',
    status: d.status === 'published' ? 'published' : 'draft',
    term: d.term || 'year',
  };
}

function AssignmentComposer({ draft, subjects, onChange, onClose, onSaved }: {
  draft: Draft;
  subjects: MySubject[];
  onChange: (d: Draft) => void;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);

  const options = useMemo(() => {
    const map = new Map<string, { id: string; title: string; classes: string[] }>();
    for (const s of subjects) {
      const cur = map.get(s.subject_id);
      if (cur) cur.classes = [...new Set([...cur.classes, ...s.classes])];
      else map.set(s.subject_id, { id: s.subject_id, title: s.subject_title, classes: [...s.classes] });
    }
    return [...map.values()];
  }, [subjects]);

  const subject = options.find((o) => o.id === draft.subject_id);
  const roster = useAsync(
    () => (draft.audience === 'students' && draft.classForTargets && draft.subject_id
      ? api.teacher.classStudents(draft.subject_id, draft.classForTargets)
      : Promise.resolve([])),
    [draft.audience, draft.classForTargets, draft.subject_id],
  );

  const set = (patch: Partial<Draft>) => onChange({ ...draft, ...patch });

  const toggleClass = (c: string) => {
    const has = draft.classes.includes(c);
    set({ classes: has ? draft.classes.filter((x) => x !== c) : [...draft.classes, c] });
  };

  const toggleStudent = (id: string) => {
    const has = draft.students.includes(id);
    set({ students: has ? draft.students.filter((x) => x !== id) : [...draft.students, id] });
  };

  const save = async () => {
    if (!draft.title.trim()) { toast.show('Тапсырма тақырыбын енгізіңіз', 'error'); return; }
    if (!draft.subject_id) { toast.show('Пәнді таңдаңыз', 'error'); return; }
    if (draft.audience === 'class' && draft.classes.length === 0) {
      toast.show('Кемінде бір сынып таңдаңыз', 'error'); return;
    }
    if (draft.audience === 'students' && draft.students.length === 0) {
      toast.show('Кемінде бір оқушы таңдаңыз', 'error'); return;
    }
    const max = Number(draft.max_score);
    if (!Number.isFinite(max) || max < 1 || max > 1000) { toast.show('Макс. балл 1–1000 аралығында болуы керек', 'error'); return; }
    setBusy(true);
    try {
      const id = await api.assignments.save({
        id: draft.id,
        subject_id: draft.subject_id,
        class_names: draft.audience === 'class' ? draft.classes : [],
        student_ids: draft.audience === 'students' ? draft.students : [],
        audience: draft.audience,
        title: draft.title.trim(),
        description: draft.description,
        criteria: draft.criteria,
        video_url: draft.video_url.trim() || null,
        due_at: fromLocalInput(draft.due),
        max_score: max,
        status: draft.status,
        term: draft.term,
      });
      let failed = 0;
      for (const f of files) {
        try { await api.assignments.uploadFile(id, f, f.type.startsWith('video/') ? 'video' : 'material'); }
        catch { failed += 1; }
      }
      toast.show(failed ? `Сақталды, бірақ ${failed} файл жүктелмеді` : 'Тапсырма сақталды',
        failed ? 'error' : 'success');
      onSaved();
    } catch (err) {
      toast.show(friendlyError(err), 'error');
    } finally { setBusy(false); }
  };

  return (
    <Modal title={draft.id ? 'Тапсырманы өңдеу' : 'Жаңа тапсырма'} onClose={onClose} wide>
      <div className="stack">
        <div className="tch-form-grid">
          <Field label="Пән">
            <select className="input" value={draft.subject_id}
              onChange={(e) => set({ subject_id: e.target.value, classes: [], students: [], classForTargets: '' })}>
              <option value="">Таңдаңыз</option>
              {options.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
            </select>
          </Field>
          <Field label="Тоқсан">
            <select className="input" value={draft.term} onChange={(e) => set({ term: e.target.value })}>
              {Object.entries(TERM_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Кімге арналған">
          <div className="tch-segmented">
            <button type="button" className={draft.audience === 'class' ? 'active' : ''}
              onClick={() => set({ audience: 'class' })}><Icon name="users" size={15} /> Бүкіл сынып</button>
            <button type="button" className={draft.audience === 'students' ? 'active' : ''}
              onClick={() => set({ audience: 'students' })}><Icon name="users" size={15} /> Жеке оқушылар</button>
          </div>
        </Field>

        {draft.audience === 'class' ? (
          <Field label="Сыныптар" hint="Бірнеше сынып таңдауға болады">
            <div className="tch-chips">
              {(subject?.classes ?? []).map((c) => (
                <button type="button" key={c} className={`tch-chip ${draft.classes.includes(c) ? 'active' : ''}`}
                  onClick={() => toggleClass(c)}>{c}</button>
              ))}
              {(subject?.classes.length ?? 0) === 0 && <span className="muted small">Пәнге сынып бекітілмеген.</span>}
            </div>
          </Field>
        ) : (
          <>
            <Field label="Сынып (оқушыларды таңдау үшін)">
              <select className="input" value={draft.classForTargets}
                onChange={(e) => set({ classForTargets: e.target.value, students: [] })}>
                <option value="">Таңдаңыз</option>
                {(subject?.classes ?? []).map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label={`Оқушылар (${draft.students.length} таңдалды)`}>
              {roster.loading ? <Spinner />
                : roster.error ? <ErrorState message={friendlyError(roster.error)} onRetry={roster.reload} />
                : (roster.data?.length ?? 0) === 0 ? <span className="muted small">Оқушы құрамы бос.</span>
                : (
                  <div className="tch-check-list">
                    {roster.data!.map((st) => (
                      <label className="check" key={st.student_id}>
                        <input type="checkbox" checked={draft.students.includes(st.student_id)}
                          onChange={() => toggleStudent(st.student_id)} />
                        <span>{st.last_name} {st.first_name}</span>
                      </label>
                    ))}
                  </div>
                )}
            </Field>
          </>
        )}

        <Field label="Тақырып">
          <input className="input" value={draft.title} maxLength={200}
            onChange={(e) => set({ title: e.target.value })} placeholder="Мысалы: 12-тақырып бойынша жаттығулар" />
        </Field>
        <Field label="Сипаттама">
          <textarea className="input" rows={3} value={draft.description}
            onChange={(e) => set({ description: e.target.value })} placeholder="Орындау шарттары..." />
        </Field>
        <Field label="Бағалау критерийлері">
          <textarea className="input" rows={2} value={draft.criteria}
            onChange={(e) => set({ criteria: e.target.value })} placeholder="Мысалы: дұрыс жауап — 2 балл..." />
        </Field>
        <div className="tch-form-grid">
          <Field label="Мерзімі (соңғы уақыт)">
            <input className="input" type="datetime-local" value={draft.due}
              onChange={(e) => set({ due: e.target.value })} />
          </Field>
          <Field label="Максималды балл">
            <input className="input" type="number" min={1} max={1000} value={draft.max_score}
              onChange={(e) => set({ max_score: e.target.value })} />
          </Field>
        </div>
        <Field label="Бейне сілтемесі (міндетті емес)">
          <input className="input" value={draft.video_url} onChange={(e) => set({ video_url: e.target.value })}
            placeholder="https://..." />
        </Field>
        <Field label="Файлдар (PDF, DOCX, PPTX, JPG, PNG, видео)">
          <input className="input" type="file" multiple
            accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.mp4,.webm,.mov"
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))} />
          {files.length > 0 && <span className="muted small">{files.length} файл таңдалды</span>}
        </Field>

        <Field label="Күйі">
          <div className="tch-segmented">
            <button type="button" className={draft.status === 'draft' ? 'active' : ''}
              onClick={() => set({ status: 'draft' })}><Icon name="file" size={15} /> Жоба</button>
            <button type="button" className={draft.status === 'published' ? 'active' : ''}
              onClick={() => set({ status: 'published' })}><Icon name="check" size={15} /> Жариялау</button>
          </div>
        </Field>

        <div className="tch-modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Болдырмау</button>
          <button className="btn btn-gold" disabled={busy} onClick={() => void save()}>
            <Icon name="check" size={16} /> {busy ? 'Сақталуда...' : 'Сақтау'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
