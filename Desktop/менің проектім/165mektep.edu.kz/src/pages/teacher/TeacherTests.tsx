import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Empty, ErrorState, Field, Modal, Spinner, useAsync, useConfirm } from '../../components/ui';
import { Icon } from '../../components/Icons';
import { api } from '../../lib/api';
import { friendlyError } from '../../lib/errors';
import { useToast } from '../../context/ToastContext';
import { useRealtime } from '../../lib/useRealtime';
import { fmtDateTime } from '../../lib/util';
import { useSeo } from '../../lib/seo';
import type {
  ClassTestDetail, ClassTestQuestionInput, ClassTestResults, ClassTestRow, ClassTestStatus, MySubject,
} from '../../types';

const STATUS_LABEL: Record<ClassTestStatus, string> = { draft: 'Жоба', published: 'Белсенді', closed: 'Жабық' };
const STATUS_CLASS: Record<ClassTestStatus, string> = {
  draft: 'adm-badge-warn', published: 'adm-badge-ok', closed: 'adm-badge-muted',
};
const TERMS: [string, string][] = [['1', '1-тоқсан'], ['2', '2-тоқсан'], ['3', '3-тоқсан'], ['4', '4-тоқсан'], ['year', 'Оқу жылы']];

const emptyQuestion = (): ClassTestQuestionInput => ({
  text: '', explanation: '', points: 1,
  options: [{ text: '' }, { text: '' }],
});

export default function TeacherTests() {
  useSeo('Онлайн тесттер', undefined, '/teacher/tests');
  const toast = useToast();
  const confirm = useConfirm();
  const subjects = useAsync(() => api.teacher.mySubjects(), []);
  const list = useAsync(() => api.tests.teacherList(), []);
  useRealtime(['class_tests', 'class_test_attempts'], list.reload);
  const [editor, setEditor] = useState<{ detail: ClassTestDetail | null } | null>(null);
  const [resultsId, setResultsId] = useState<string | null>(null);

  const rows = list.data ?? [];

  const changeStatus = async (r: ClassTestRow, status: ClassTestStatus) => {
    try { await api.tests.setStatus(r.id, status); toast.show('Мәртебе жаңартылды', 'success'); list.reload(); }
    catch (e) { toast.show(friendlyError(e), 'error'); }
  };
  const remove = async (r: ClassTestRow) => {
    if (!confirm(`«${r.title}» тестін жою керек пе?`)) return;
    try { await api.tests.remove(r.id); toast.show('Тест жойылды', 'success'); list.reload(); }
    catch (e) { toast.show(friendlyError(e), 'error'); }
  };
  const openEdit = async (id: string) => {
    try { setEditor({ detail: await api.tests.detail(id) }); }
    catch (e) { toast.show(friendlyError(e), 'error'); }
  };

  return (
    <div className="tch-page">
      <div className="tch-hero">
        <div>
          <span className="tch-eyebrow">Оқу процесі</span>
          <h1>Онлайн тесттер</h1>
          <p className="muted small">Мұғалім бекітілген пәндер мен сыныптарға тест құрастырып, нәтижелерді қадағалайды.</p>
        </div>
        <button className="btn btn-gold" onClick={() => setEditor({ detail: null })}>
          <Icon name="plus" size={16} /> Жаңа тест
        </button>
      </div>

      <div className="tch-mini-stats">
        <div className="tch-mini-stat"><b>{rows.length}</b><span>Барлық тест</span></div>
        <div className="tch-mini-stat"><b>{rows.filter((r) => r.status === 'published').length}</b><span>Белсенді</span></div>
        <div className="tch-mini-stat"><b>{rows.reduce((n, r) => n + r.attempts, 0)}</b><span>Тапсыру</span></div>
        <div className="tch-mini-stat accent"><b>{rows.reduce((n, r) => n + r.questions, 0)}</b><span>Сұрақ</span></div>
      </div>

      {list.loading && !list.data ? <Spinner />
        : list.error ? <ErrorState message={friendlyError(list.error)} onRetry={list.reload} />
        : rows.length === 0 ? (
          <Empty title="Тест әзірге жоқ"
            text="«Жаңа тест» түймесін басып, пән мен сынып үшін алғашқы тестіңізді құрастырыңыз." />
        ) : (
          <div className="tch-test-list">
            {rows.map((r) => (
              <div key={r.id} className="card pad tch-test-card">
                <div className="tch-test-head">
                  <div>
                    <div className="tch-badges">
                      <span className="badge adm-badge-muted">{r.subject_title}</span>
                      <span className="badge adm-badge-muted">{r.class_name}</span>
                      <span className={`badge ${STATUS_CLASS[r.status]}`}>{STATUS_LABEL[r.status]}</span>
                    </div>
                    <h3>{r.title}</h3>
                    <p className="muted small">
                      {r.questions} сұрақ · {r.time_limit_minutes} мин · өту шегі {r.pass_percent}% ·
                      әрекет {r.attempts}/{r.max_attempts} · {fmtDateTime(r.created_at)}
                    </p>
                  </div>
                  <div className="tch-row-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => void openEdit(r.id)}>
                      <Icon name="edit" size={14} /> Өңдеу
                    </button>
                    {r.status !== 'published'
                      ? <button className="btn btn-gold btn-sm" onClick={() => void changeStatus(r, 'published')}>
                          <Icon name="check" size={14} /> Жариялау
                        </button>
                      : <button className="btn btn-ghost btn-sm" onClick={() => void changeStatus(r, 'closed')}>
                          <Icon name="lock" size={14} /> Жабу
                        </button>}
                    <button className="btn btn-ghost btn-sm" onClick={() => setResultsId(r.id)}>
                      <Icon name="chart" size={14} /> Нәтижелер
                    </button>
                    <button className="icon-btn tch-remove" aria-label="Жою" onClick={() => void remove(r)}>
                      <Icon name="trash" size={16} />
                    </button>
                  </div>
                </div>
                {r.description && <p className="muted small">{r.description}</p>}
              </div>
            ))}
          </div>
        )}

      <p className="tch-note">
        <Icon name="shield" size={16} />
        <span>Тест жауаптары серверде бағаланады. Оқушыға дұрыс жауаптар алдын ала жіберілмейді — нәтиже тапсырған соң ғана есептеледі.</span>
      </p>

      {editor && (
        <TestEditorModal
          subjects={subjects.data ?? []}
          detail={editor.detail}
          onClose={() => setEditor(null)}
          onSaved={() => { setEditor(null); list.reload(); }}
        />
      )}
      {resultsId && <ResultsModal id={resultsId} onClose={() => setResultsId(null)} />}
    </div>
  );
}

function TestEditorModal({ detail, subjects, onClose, onSaved }: {
  detail: ClassTestDetail | null;
  subjects: MySubject[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [subjectId, setSubjectId] = useState(detail?.subject_id ?? subjects[0]?.subject_id ?? '');
  const [klass, setKlass] = useState(detail?.class_name ?? subjects[0]?.classes[0] ?? '');
  const [term, setTerm] = useState(detail?.term ?? '1');
  const [title, setTitle] = useState(detail?.title ?? '');
  const [description, setDescription] = useState(detail?.description ?? '');
  const [timeLimit, setTimeLimit] = useState(detail?.time_limit_minutes ?? 20);
  const [passPercent, setPassPercent] = useState(detail?.pass_percent ?? 50);
  const [maxAttempts, setMaxAttempts] = useState(detail?.max_attempts ?? 1);
  const [questions, setQuestions] = useState<ClassTestQuestionInput[]>(
    detail?.questions.map((q) => ({
      id: q.id, text: q.text, explanation: q.explanation, points: q.points,
      options: q.options.map((o) => ({ id: o.id, text: o.text, is_correct: o.is_correct })),
    })) ?? [],
  );
  const [busy, setBusy] = useState(false);

  const subject = subjects.find((s) => s.subject_id === subjectId) ?? subjects[0];

  useEffect(() => {
    if (subject && !subject.classes.includes(klass)) setKlass(subject.classes[0] ?? '');
  }, [subject, klass]);

  const patchQ = (qi: number, patch: Partial<ClassTestQuestionInput>) =>
    setQuestions((qs) => qs.map((q, i) => (i === qi ? { ...q, ...patch } : q)));

  const patchOpt = (qi: number, oi: number, text: string) =>
    setQuestions((qs) => qs.map((q, i) => (i !== qi ? q : { ...q, options: q.options.map((o, j) => (j === oi ? { ...o, text } : o)) })));

  const markCorrect = (qi: number, oi: number) =>
    setQuestions((qs) => qs.map((q, i) => (i !== qi ? q : { ...q, options: q.options.map((o, j) => ({ ...o, is_correct: j === oi })) })));

  const addOption = (qi: number) =>
    setQuestions((qs) => qs.map((q, i) => (i !== qi ? q : { ...q, options: [...q.options, { text: '' }] })));

  const removeOption = (qi: number, oi: number) =>
    setQuestions((qs) => qs.map((q, i) => (i !== qi ? q : { ...q, options: q.options.filter((_, j) => j !== oi) })));

  const save = async () => {
    if (!subjectId || !klass) { toast.show('Пән мен сыныпты таңдаңыз', 'error'); return; }
    if (!title.trim()) { toast.show('Тест атауын жазыңыз', 'error'); return; }
    if (questions.length === 0) { toast.show('Кемінде бір сұрақ қосыңыз', 'error'); return; }
    for (const [i, q] of questions.entries()) {
      if (!q.text.trim()) { toast.show(`${i + 1}-сұрақтың мәтіні бос`, 'error'); return; }
      if (q.options.length < 2) { toast.show(`${i + 1}-сұрақта кемінде 2 нұсқа керек`, 'error'); return; }
      if (q.options.some((o) => !o.text.trim())) { toast.show(`${i + 1}-сұрақта бос нұсқа бар`, 'error'); return; }
      if (!q.options.some((o) => o.is_correct)) { toast.show(`${i + 1}-сұрақта дұрыс жауап белгіленбеген`, 'error'); return; }
    }
    setBusy(true);
    try {
      await api.tests.save({
        id: detail?.id ?? null,
        subject_id: subjectId, class_name: klass, term,
        title: title.trim(), description: description.trim(),
        time_limit_minutes: Math.max(1, Math.min(180, Number(timeLimit) || 20)),
        pass_percent: Math.max(0, Math.min(100, Number(passPercent) || 50)),
        max_attempts: Math.max(1, Math.min(10, Number(maxAttempts) || 1)),
        questions: questions.map((q) => ({
          id: q.id, text: q.text.trim(), explanation: q.explanation?.trim() || '',
          points: Math.max(1, Math.min(20, Number(q.points) || 1)),
          options: q.options.map((o) => ({ id: o.id, text: o.text.trim(), is_correct: Boolean(o.is_correct) })),
        })),
      });
      toast.show(detail ? 'Тест жаңартылды' : 'Тест құрылды', 'success');
      onSaved();
    } catch (e) { toast.show(friendlyError(e), 'error'); }
    finally { setBusy(false); }
  };

  return (
    <Modal title={detail ? 'Тестті өңдеу' : 'Жаңа тест'} onClose={onClose} wide>
      <div className="form stack-lg">
        <div className="tch-form-grid">
          <Field label="Пән">
            <select className="input" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              <option value="">— таңдау —</option>
              {subjects.map((s) => <option key={s.id} value={s.subject_id}>{s.subject_title}</option>)}
            </select>
          </Field>
          <Field label="Сынып">
            <select className="input" value={klass} onChange={(e) => setKlass(e.target.value)}>
              <option value="">— таңдау —</option>
              {(subject?.classes ?? []).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Тоқсан">
            <select className="input" value={term} onChange={(e) => setTerm(e.target.value)}>
              {TERMS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          <Field label="Уақыт (минут)">
            <input className="input" type="number" min={1} max={180} value={timeLimit} onChange={(e) => setTimeLimit(Number(e.target.value))} />
          </Field>
          <Field label="Өту шегі (%)">
            <input className="input" type="number" min={0} max={100} value={passPercent} onChange={(e) => setPassPercent(Number(e.target.value))} />
          </Field>
          <Field label="Әрекет саны">
            <input className="input" type="number" min={1} max={10} value={maxAttempts} onChange={(e) => setMaxAttempts(Number(e.target.value))} />
          </Field>
        </div>

        <Field label="Тест атауы">
          <input className="input" value={title} maxLength={160} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Сипаттама" hint="Міндетті емес">
          <textarea className="input" rows={2} value={description} maxLength={1000} onChange={(e) => setDescription(e.target.value)} />
        </Field>

        <div className="stack">
          <div className="section-row">
            <h3>Сұрақтар ({questions.length})</h3>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setQuestions((qs) => [...qs, emptyQuestion()])}>
              <Icon name="plus" size={15} /> Сұрақ қосу
            </button>
          </div>
          {questions.length === 0 && <p className="muted small">Сұрақ қосылмаған.</p>}
          {questions.map((q, qi) => (
            <div className="card pad tch-q-card" key={qi}>
              <div className="tch-q-head">
                <b>{qi + 1}-сұрақ</b>
                <div className="row">
                  <label className="tch-inline-field">
                    <span>Балл</span>
                    <input className="input" type="number" min={1} max={20} value={q.points}
                      onChange={(e) => patchQ(qi, { points: Number(e.target.value) })} />
                  </label>
                  <button type="button" className="icon-btn tch-remove" aria-label="Сұрақты жою"
                    onClick={() => setQuestions((qs) => qs.filter((_, i) => i !== qi))}>
                    <Icon name="trash" size={16} />
                  </button>
                </div>
              </div>
              <Field label="Сұрақ мәтіні">
                <textarea className="input" rows={2} value={q.text} onChange={(e) => patchQ(qi, { text: e.target.value })} />
              </Field>
              <div className="tch-options">
                {q.options.map((o, oi) => (
                  <div className="tch-option-row" key={oi}>
                    <label className="tch-radio">
                      <input type="radio" name={`q-${qi}`} checked={Boolean(o.is_correct)} onChange={() => markCorrect(qi, oi)} />
                      <span>дұрыс</span>
                    </label>
                    <input className="input" value={o.text} placeholder={`${oi + 1}-нұсқа`}
                      onChange={(e) => patchOpt(qi, oi, e.target.value)} />
                    <button type="button" className="icon-btn tch-remove" aria-label="Нұсқаны жою"
                      disabled={q.options.length <= 2} onClick={() => removeOption(qi, oi)}>
                      <Icon name="close" size={15} />
                    </button>
                  </div>
                ))}
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => addOption(qi)}>
                  <Icon name="plus" size={14} /> Нұсқа қосу
                </button>
              </div>
              <Field label="Түсіндірме" hint="Оқушыға нәтижеден кейін көрсетіледі">
                <input className="input" value={q.explanation ?? ''} onChange={(e) => patchQ(qi, { explanation: e.target.value })} />
              </Field>
            </div>
          ))}
        </div>

        <div className="tch-modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Болдырмау</button>
          <button type="button" className="btn btn-gold" disabled={busy} onClick={() => void save()}>
            {busy ? 'Сақталуда…' : 'Сақтау'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function ResultsModal({ id, onClose }: { id: string; onClose: () => void }) {
  const results = useAsync(() => api.tests.results(id), [id]);
  useRealtime(['class_test_attempts'], results.reload);
  const r: ClassTestResults | null = results.data;

  return (
    <Modal title={r ? `Нәтижелер — ${r.test.title}` : 'Нәтижелер'} onClose={onClose} wide>
      {results.loading && !r ? <Spinner />
        : results.error ? <ErrorState message={friendlyError(results.error)} onRetry={results.reload} />
        : !r ? <Empty title="Деректер жоқ" />
        : r.attempts.length === 0 ? <Empty title="Әзірге тапсырған оқушы жоқ" />
        : (
          <div className="table-wrap">
            <table className="tch-table">
              <thead>
                <tr><th>#</th><th>Оқушы</th><th>Тапсырылды</th><th>Балл</th><th>Пайыз</th><th>Мәртебе</th></tr>
              </thead>
              <tbody>
                {r.attempts.map((a, i) => (
                  <tr key={a.id}>
                    <td className="muted">{i + 1}</td>
                    <td><b>{a.student_name}</b></td>
                    <td className="muted small">{a.finished_at ? fmtDateTime(a.finished_at) : '—'}</td>
                    <td>{a.score}/{a.max_score}</td>
                    <td><b>{a.percent.toFixed(0)}%</b></td>
                    <td>
                      {a.status === 'in_progress'
                        ? <span className="badge adm-badge-warn">Орындалуда</span>
                        : <span className={`badge ${a.passed ? 'adm-badge-ok' : 'adm-badge-bad'}`}>
                            {a.passed ? 'Өтті' : 'Өтпеді'}
                          </span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      <div className="tch-modal-actions">
        <button className="btn btn-ghost" onClick={onClose}>Жабу</button>
      </div>
    </Modal>
  );
}
