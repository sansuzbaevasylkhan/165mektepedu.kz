import { useEffect, useState, type FormEvent } from 'react';
import { Empty, ErrorState, Field, Modal, Spinner, useAsync, useConfirm } from '../../components/ui';
import { ImageUpload } from '../../components/ImageUpload';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { friendlyError } from '../../lib/errors';
import { fmtDuration, isHttpUrl, readVideoDuration, safeFileName } from '../../lib/util';
import type { AdminLesson, AdminQuestion, AdminTest, Subject } from '../../types';

type Tab = 'subjects' | 'lessons' | 'tests';

async function fetchSubjects(): Promise<Subject[]> {
  const { data, error } = await supabase.from('subjects').select('*').order('sort_order').order('title');
  if (error) throw error;
  return (data ?? []) as Subject[];
}

/* ---------------------------- ПӘНДЕР ---------------------------- */
function SubjectsTab({ subjects, reload }: { subjects: Subject[]; reload: () => void }) {
  const toast = useToast();
  const confirm = useConfirm();
  const list = { data: subjects, loading: false, error: null as unknown, reload };
  const [draft, setDraft] = useState<{ id?: string; title: string; description: string; image_url: string | null; sort_order: number } | null>(null);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!draft || !draft.title.trim()) { toast.show('Пән атауын енгізіңіз', 'error'); return; }
    const payload = {
      title: draft.title.trim(), description: draft.description.trim(),
      image_url: draft.image_url, sort_order: Number(draft.sort_order) || 0,
    };
    const { error } = draft.id
      ? await supabase.from('subjects').update(payload).eq('id', draft.id)
      : await supabase.from('subjects').insert(payload);
    if (error) { toast.show(friendlyError(error), 'error'); return; }
    toast.show('Сақталды', 'success'); setDraft(null); list.reload();
  };
  const remove = async (s: Subject) => {
    if (!confirm('Пән және оның барлық сабақтары, тесттері өшеді. Жалғастырасыз ба?')) return;
    const { error } = await supabase.from('subjects').delete().eq('id', s.id);
    if (error) toast.show(friendlyError(error), 'error'); else { toast.show('Өшірілді', 'success'); list.reload(); }
  };

  return (
    <div className="stack-lg">
      <div className="section-row">
        <h2>Пәндер</h2>
        <button className="btn btn-gold" onClick={() => setDraft({ title: '', description: '', image_url: null, sort_order: (list.data?.length ?? 0) + 1 })}>Пән қосу</button>
      </div>
      {list.loading && !list.data ? <Spinner /> : list.error ? <ErrorState message={friendlyError(list.error)} onRetry={list.reload} />
        : !list.data?.length ? <Empty title="Пәндер жоқ" /> : (
          <div className="card table-wrap"><table className="table">
            <thead><tr><th>Реті</th><th>Атауы</th><th /></tr></thead>
            <tbody>{list.data.map((s) => (
              <tr key={s.id}>
                <td>{s.sort_order}</td>
                <td><div className="row">{s.image_url && <img src={s.image_url} alt="" className="thumb" />}<b>{s.title}</b></div></td>
                <td className="actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => setDraft({ id: s.id, title: s.title, description: s.description, image_url: s.image_url, sort_order: s.sort_order })}>Өзгерту</button>
                  <button className="btn btn-danger btn-sm" onClick={() => remove(s)}>Өшіру</button>
                </td>
              </tr>))}</tbody>
          </table></div>)}
      {draft && (
        <Modal title={draft.id ? 'Пәнді өзгерту' : 'Жаңа пән'} onClose={() => setDraft(null)}>
          <form className="form" onSubmit={save} noValidate>
            <Field label="Атауы"><input className="input" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></Field>
            <Field label="Сипаттамасы"><textarea className="input" rows={3} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></Field>
            <ImageUpload bucket="site-media" label="Пән суреті" value={draft.image_url} onChange={(u) => setDraft({ ...draft, image_url: u })} />
            <Field label="Реті"><input className="input" type="number" value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} /></Field>
            <div className="row end"><button type="button" className="btn btn-ghost" onClick={() => setDraft(null)}>Бас тарту</button><button className="btn btn-gold">Сақтау</button></div>
          </form>
        </Modal>)}
    </div>
  );
}

/* --------------------------- САБАҚТАР --------------------------- */
interface LessonDraft {
  id?: string; subject_id: string; title: string; description: string; sort_order: number;
  source: 'url' | 'upload'; url: string; path: string | null; file: File | null; minutes: number; seconds: number;
  thumbnail_url: string | null; published: boolean;
}

function SubjectSelect({ subjects, value, onChange }: { subjects: Subject[]; value: string; onChange: (v: string) => void }) {
  return (
    <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
      {subjects.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
    </select>
  );
}

async function fetchLessons(subjectId: string): Promise<AdminLesson[]> {
  const { data, error } = await supabase.from('lessons').select('*').eq('subject_id', subjectId).order('sort_order').order('created_at');
  if (error) throw error;
  return (data ?? []) as AdminLesson[];
}

function LessonsTab({ subjects, subjectId, setSubjectId }: { subjects: Subject[]; subjectId: string; setSubjectId: (v: string) => void }) {
  const toast = useToast();
  const confirm = useConfirm();
  const list = useAsync(() => (subjectId ? fetchLessons(subjectId) : Promise.resolve([] as AdminLesson[])), [subjectId]);
  const [draft, setDraft] = useState<LessonDraft | null>(null);
  const [busy, setBusy] = useState(false);

  const openNew = () => setDraft({
    subject_id: subjectId, title: '', description: '', sort_order: (list.data?.length ?? 0) + 1,
    source: 'url', url: '', path: null, file: null, minutes: 0, seconds: 0,
    thumbnail_url: null, published: true,
  });
  const openEdit = (l: AdminLesson) => setDraft({
    id: l.id, subject_id: l.subject_id, title: l.title, description: l.description, sort_order: l.sort_order,
    source: l.video_kind, url: l.video_url ?? '', path: l.video_path, file: null,
    minutes: Math.floor(l.duration_seconds / 60), seconds: l.duration_seconds % 60,
    thumbnail_url: l.thumbnail_url, published: l.published,
  });

  const pickFile = async (file: File | null) => {
    if (!draft) return;
    if (!file) { setDraft({ ...draft, file: null }); return; }
    let next = { ...draft, file };
    try {
      const d = await readVideoDuration(file);
      if (d > 0) next = { ...next, minutes: Math.floor(d / 60), seconds: d % 60 };
    } catch { toast.show('Видео ұзақтығы анықталмады — қолмен енгізіңіз', 'info'); }
    setDraft(next);
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    const duration = Math.round(Number(draft.minutes) * 60 + Number(draft.seconds));
    if (!draft.title.trim()) { toast.show('Сабақ атауын енгізіңіз', 'error'); return; }
    if (!(duration > 0)) { toast.show('Видеоның ұзақтығын енгізіңіз', 'error'); return; }
    if (draft.source === 'url' && !isHttpUrl(draft.url.trim())) { toast.show('Видео сілтемесі https:// бастап жазылуы керек', 'error'); return; }
    if (draft.source === 'upload' && !draft.file && !draft.path) { toast.show('Видео файлын таңдаңыз', 'error'); return; }

    setBusy(true);
    try {
      let path = draft.source === 'upload' ? draft.path : null;
      const oldPath = draft.path;
      if (draft.source === 'upload' && draft.file) {
        path = `${crypto.randomUUID()}-${safeFileName(draft.file.name)}`;
        const up = await supabase.storage.from('lesson-videos').upload(path, draft.file, { contentType: draft.file.type || undefined });
        if (up.error) throw up.error;
      }
      const payload = {
        subject_id: draft.subject_id, title: draft.title.trim(), description: draft.description.trim(),
        sort_order: Number(draft.sort_order) || 0, duration_seconds: duration,
        video_kind: draft.source, video_url: draft.source === 'url' ? draft.url.trim() : null, video_path: path,
        thumbnail_url: draft.thumbnail_url, published: draft.published,
      };
      const { error } = draft.id
        ? await supabase.from('lessons').update(payload).eq('id', draft.id)
        : await supabase.from('lessons').insert(payload);
      if (error) throw error;
      if (oldPath && oldPath !== path) void supabase.storage.from('lesson-videos').remove([oldPath]);
      toast.show('Сақталды', 'success'); setDraft(null); list.reload();
    } catch (err) {
      toast.show(friendlyError(err), 'error');
    } finally { setBusy(false); }
  };

  const remove = async (l: AdminLesson) => {
    if (!confirm('Сабақ және оның тесті, оқушылардың прогресі өшеді. Жалғастырасыз ба?')) return;
    const { error } = await supabase.from('lessons').delete().eq('id', l.id);
    if (error) { toast.show(friendlyError(error), 'error'); return; }
    if (l.video_path) void supabase.storage.from('lesson-videos').remove([l.video_path]);
    toast.show('Өшірілді', 'success'); list.reload();
  };

  const togglePublish = async (l: AdminLesson) => {
    const { error } = await supabase.from('lessons').update({ published: !l.published }).eq('id', l.id);
    if (error) toast.show(friendlyError(error), 'error'); else { toast.show(l.published ? 'Жасырылды' : 'Жарияланды', 'success'); list.reload(); }
  };

  return (
    <div className="stack-lg">
      <div className="section-row">
        <h2>Видеосабақтар</h2>
        <div className="row">
          <SubjectSelect subjects={subjects} value={subjectId} onChange={setSubjectId} />
          <button className="btn btn-gold" disabled={!subjectId} onClick={openNew}>Сабақ қосу</button>
        </div>
      </div>
      {list.loading && !list.data ? <Spinner /> : list.error ? <ErrorState message={friendlyError(list.error)} onRetry={list.reload} />
        : !list.data?.length ? <Empty title="Бұл пәнде сабақ жоқ" /> : (
          <div className="card table-wrap"><table className="table">
            <thead><tr><th>Реті</th><th>Атауы</th><th>Ұзақтығы</th><th>Көзі</th><th>Күйі</th><th /></tr></thead>
            <tbody>{list.data.map((l) => (
              <tr key={l.id}>
                <td>{l.sort_order}</td>
                <td><div className="row">{l.thumbnail_url && <img src={l.thumbnail_url} alt="" className="thumb" />}<b>{l.title}</b></div></td>
                <td>{fmtDuration(l.duration_seconds)}</td>
                <td><span className="badge badge-open">{l.video_kind === 'upload' ? 'Жүктелген' : 'URL'}</span></td>
                <td><button className={`badge ${l.published ? 'badge-done' : 'badge-locked'}`} onClick={() => void togglePublish(l)} title="Күйді ауыстыру">{l.published ? 'Жарияланған' : 'Жасырын'}</button></td>
                <td className="actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(l)}>Өзгерту</button>
                  <button className="btn btn-danger btn-sm" onClick={() => remove(l)}>Өшіру</button>
                </td>
              </tr>))}</tbody>
          </table></div>)}

      {draft && (
        <Modal title={draft.id ? 'Сабақты өзгерту' : 'Жаңа сабақ'} onClose={() => setDraft(null)} wide>
          <form className="form" onSubmit={save} noValidate>
            <Field label="Пән"><SubjectSelect subjects={subjects} value={draft.subject_id} onChange={(v) => setDraft({ ...draft, subject_id: v })} /></Field>
            <Field label="Сабақ атауы"><input className="input" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></Field>
            <Field label="Сабақ сипаттамасы"><textarea className="input" rows={3} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></Field>
            <Field label="Реті (кіші сан — ертерек)"><input className="input" type="number" value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} /></Field>
            <ImageUpload bucket="site-media" label="Сабақ суреті (thumbnail)" value={draft.thumbnail_url} onChange={(u) => setDraft({ ...draft, thumbnail_url: u })} />
            <label className="check-row"><input type="checkbox" checked={draft.published} onChange={(e) => setDraft({ ...draft, published: e.target.checked })} /> Сабақты жариялау (оқушыларға көрінеді)</label>

            <div className="tabs small">
              <button type="button" className={`tab ${draft.source === 'url' ? 'active' : ''}`} onClick={() => setDraft({ ...draft, source: 'url' })}>Видео URL</button>
              <button type="button" className={`tab ${draft.source === 'upload' ? 'active' : ''}`} onClick={() => setDraft({ ...draft, source: 'upload' })}>Видео жүктеу</button>
            </div>
            {draft.source === 'url' ? (
              <Field label="YouTube немесе тікелей .mp4 сілтемесі" hint="Мысалы: https://www.youtube.com/watch?v=...">
                <input className="input" value={draft.url} onChange={(e) => setDraft({ ...draft, url: e.target.value })} placeholder="https://" />
              </Field>
            ) : (
              <Field label="Видео файл" hint={draft.path && !draft.file ? 'Қазір жүктелген видео бар. Жаңа файл таңдасаңыз — ауыстырылады.' : 'MP4/WebM. Supabase жоспарыңыздағы файл өлшемі шегін ескеріңіз.'}>
                <input className="input" type="file" accept="video/*" onChange={(e) => void pickFile(e.target.files?.[0] ?? null)} />
              </Field>
            )}
            <div className="grid grid-2 tight">
              <Field label="Ұзақтығы — минут"><input className="input" type="number" min={0} value={draft.minutes} onChange={(e) => setDraft({ ...draft, minutes: Number(e.target.value) })} /></Field>
              <Field label="секунд"><input className="input" type="number" min={0} max={59} value={draft.seconds} onChange={(e) => setDraft({ ...draft, seconds: Number(e.target.value) })} /></Field>
            </div>
            <p className="muted small">Ұзақтық прогресті есептеу үшін қажет, оны дәл енгізіңіз.</p>
            <div className="row end">
              <button type="button" className="btn btn-ghost" onClick={() => setDraft(null)}>Бас тарту</button>
              <button className="btn btn-gold" disabled={busy}>{busy ? 'Сақталуда...' : 'Сақтау'}</button>
            </div>
          </form>
        </Modal>)}
    </div>
  );
}

/* ---------------------------- ТЕСТТЕР ---------------------------- */
interface QDraft { id?: string; text: string; explanation: string; points: number; sort_order: number; options: { id?: string; text: string; is_correct: boolean }[] }

function emptyQ(order: number): QDraft {
  return { text: '', explanation: '', points: 1, sort_order: order, options: [0, 1, 2, 3].map((i) => ({ text: '', is_correct: i === 0 })) };
}

function TestsTab({ subjects, subjectId, setSubjectId }: { subjects: Subject[]; subjectId: string; setSubjectId: (v: string) => void }) {
  const toast = useToast();
  const confirm = useConfirm();
  const lessons = useAsync(() => (subjectId ? fetchLessons(subjectId) : Promise.resolve([] as AdminLesson[])), [subjectId]);
  const [lessonId, setLessonId] = useState('');
  useEffect(() => {
    if (lessons.data && !lessons.data.some((l) => l.id === lessonId)) setLessonId(lessons.data[0]?.id ?? '');
  }, [lessons.data, lessonId]);

  const test = useAsync<AdminTest | null>(() => (lessonId ? api.adminTest(lessonId) : Promise.resolve(null)), [lessonId]);
  const [head, setHead] = useState<{ title: string; pass: number } | null>(null);
  const [q, setQ] = useState<QDraft | null>(null);

  const saveHead = async (e: FormEvent) => {
    e.preventDefault();
    if (!head) return;
    const pass = Math.min(100, Math.max(1, Number(head.pass) || 70));
    const payload = { title: head.title.trim() || 'Тест', pass_percent: pass };
    const { error } = test.data
      ? await supabase.from('tests').update(payload).eq('id', test.data.id)
      : await supabase.from('tests').insert({ ...payload, lesson_id: lessonId });
    if (error) { toast.show(friendlyError(error), 'error'); return; }
    toast.show('Сақталды', 'success'); setHead(null); test.reload();
  };

  const removeTest = async () => {
    if (!test.data || !confirm('Тест және оның барлық сұрақтары өшеді. Жалғастырасыз ба?')) return;
    const { error } = await supabase.from('tests').delete().eq('id', test.data.id);
    if (error) toast.show(friendlyError(error), 'error'); else { toast.show('Өшірілді', 'success'); test.reload(); }
  };

  const saveQ = async (e: FormEvent) => {
    e.preventDefault();
    if (!q || !test.data) return;
    try {
      await api.saveQuestion(test.data.id, q);
      toast.show('Сақталды', 'success'); setQ(null); test.reload();
    } catch (err) { toast.show(friendlyError(err), 'error'); }
  };

  const removeQ = async (x: AdminQuestion) => {
    if (!confirm()) return;
    const { error } = await supabase.from('questions').delete().eq('id', x.id);
    if (error) toast.show(friendlyError(error), 'error'); else { toast.show('Өшірілді', 'success'); test.reload(); }
  };

  const editQ = (x: AdminQuestion) => setQ({
    id: x.id, text: x.text, explanation: x.explanation ?? '', points: x.points, sort_order: x.sort_order,
    options: x.answer_options.map((o) => ({ id: o.id, text: o.text, is_correct: o.is_correct })),
  });

  return (
    <div className="stack-lg">
      <div className="section-row">
        <h2>Тесттер</h2>
        <div className="row">
          <SubjectSelect subjects={subjects} value={subjectId} onChange={setSubjectId} />
          <select className="input" value={lessonId} onChange={(e) => setLessonId(e.target.value)} disabled={!lessons.data?.length}>
            {(lessons.data ?? []).map((l) => <option key={l.id} value={l.id}>{l.sort_order}. {l.title}</option>)}
          </select>
        </div>
      </div>

      {!lessonId ? <Empty title="Алдымен пән таңдап, сабақ қосыңыз" />
        : test.loading && test.data === null ? <Spinner />
        : test.error ? <ErrorState message={friendlyError(test.error)} onRetry={test.reload} />
        : !test.data ? (
          <Empty title="Бұл сабақта тест жоқ" text="Тест қоссаңыз, сабақ тестті тапсырғаннан кейін ғана аяқталады."
            action={<button className="btn btn-gold" onClick={() => setHead({ title: 'Тест', pass: 70 })}>Тест қосу</button>} />
        ) : (
          <>
            <div className="card pad section-row">
              <div><h3>{test.data.title}</h3><p className="muted">Өту шегі: {test.data.pass_percent}% · Сұрақтар: {test.data.questions.length}</p></div>
              <div className="row">
                <button className="btn btn-ghost btn-sm" onClick={() => setHead({ title: test.data!.title, pass: test.data!.pass_percent })}>Өзгерту</button>
                <button className="btn btn-danger btn-sm" onClick={removeTest}>Өшіру</button>
                <button className="btn btn-gold btn-sm" onClick={() => setQ(emptyQ(test.data!.questions.length + 1))}>Сұрақ қосу</button>
              </div>
            </div>
            {test.data.questions.length === 0 ? <Empty title="Сұрақтар жоқ" /> : (
              <ol className="admin-questions">
                {test.data.questions.map((x) => (
                  <li key={x.id} className="card pad">
                    <div className="section-row">
                      <b>{x.text} <span className="muted small">({x.points} балл)</span></b>
                      <div className="row">
                        <button className="btn btn-ghost btn-sm" onClick={() => editQ(x)}>Өзгерту</button>
                        <button className="btn btn-danger btn-sm" onClick={() => removeQ(x)}>Өшіру</button>
                      </div>
                    </div>
                    <ul className="opt-list">
                      {x.answer_options.map((o) => <li key={o.id} className={o.is_correct ? 'correct' : ''}>{o.is_correct ? '✓ ' : '• '}{o.text}</li>)}
                    </ul>
                    {x.explanation && <p className="muted small">Түсіндірме: {x.explanation}</p>}
                  </li>
                ))}
              </ol>)}
          </>)}

      {head && (
        <Modal title="Тест баптаулары" onClose={() => setHead(null)}>
          <form className="form" onSubmit={saveHead}>
            <Field label="Тест атауы"><input className="input" value={head.title} onChange={(e) => setHead({ ...head, title: e.target.value })} /></Field>
            <Field label="Өту шегі (%)"><input className="input" type="number" min={1} max={100} value={head.pass} onChange={(e) => setHead({ ...head, pass: Number(e.target.value) })} /></Field>
            <div className="row end"><button type="button" className="btn btn-ghost" onClick={() => setHead(null)}>Бас тарту</button><button className="btn btn-gold">Сақтау</button></div>
          </form>
        </Modal>)}

      {q && (
        <Modal title={q.id ? 'Сұрақты өзгерту' : 'Жаңа сұрақ'} onClose={() => setQ(null)} wide>
          <form className="form" onSubmit={saveQ} noValidate>
            <Field label="Сұрақ"><textarea className="input" rows={3} value={q.text} onChange={(e) => setQ({ ...q, text: e.target.value })} /></Field>
            <Field label="Түсіндірме (дұрыс жауаптан кейін көрсетіледі)" hint="Міндетті емес. Оқушыға жауаптың неге дұрыс екенін түсіндіріңіз.">
              <textarea className="input" rows={2} value={q.explanation} onChange={(e) => setQ({ ...q, explanation: e.target.value })} />
            </Field>
            <div className="grid grid-2 tight">
              <Field label="Балл"><input className="input" type="number" min={1} value={q.points} onChange={(e) => setQ({ ...q, points: Number(e.target.value) })} /></Field>
              <Field label="Реті"><input className="input" type="number" value={q.sort_order} onChange={(e) => setQ({ ...q, sort_order: Number(e.target.value) })} /></Field>
            </div>
            <span className="field-label">Жауап нұсқалары (дұрыс жауапты белгілеңіз)</span>
            {q.options.map((o, i) => (
              <div key={i} className="opt-edit">
                <input type="radio" name="correct" aria-label="Дұрыс жауап" checked={o.is_correct}
                  onChange={() => setQ({ ...q, options: q.options.map((x, j) => ({ ...x, is_correct: j === i })) })} />
                <input className="input" value={o.text} placeholder={`Нұсқа ${i + 1}`}
                  onChange={(e) => setQ({ ...q, options: q.options.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)) })} />
                <button type="button" className="icon-btn" aria-label="Нұсқаны өшіру" disabled={q.options.length <= 2}
                  onClick={() => setQ({ ...q, options: q.options.filter((_, j) => j !== i) })}>✕</button>
              </div>
            ))}
            <button type="button" className="btn btn-ghost btn-sm" disabled={q.options.length >= 8}
              onClick={() => setQ({ ...q, options: [...q.options, { text: '', is_correct: false }] })}>Нұсқа қосу</button>
            <div className="row end"><button type="button" className="btn btn-ghost" onClick={() => setQ(null)}>Бас тарту</button><button className="btn btn-gold">Сақтау</button></div>
          </form>
        </Modal>)}
    </div>
  );
}

/* ----------------------------- ТҮБІР ----------------------------- */
export default function UbtAdmin({ initialTab = 'subjects' }: { initialTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const subjects = useAsync(fetchSubjects, []);
  const [subjectId, setSubjectId] = useState('');
  useEffect(() => {
    if (subjects.data && !subjects.data.some((s) => s.id === subjectId)) setSubjectId(subjects.data[0]?.id ?? '');
  }, [subjects.data, subjectId]);

  return (
    <div className="stack-lg">
      <h1>ҰБТ басқару</h1>
      <div className="tabs">
        {([['subjects', 'Пәндер'], ['lessons', 'Видеосабақтар'], ['tests', 'Тесттер']] as const).map(([id, label]) => (
          <button key={id} className={`tab ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>
      {subjects.loading && !subjects.data ? <Spinner />
        : subjects.error ? <ErrorState message={friendlyError(subjects.error)} onRetry={subjects.reload} />
        : tab === 'subjects' ? <SubjectsTab subjects={subjects.data ?? []} reload={subjects.reload} />
        : tab === 'lessons' ? <LessonsTab subjects={subjects.data ?? []} subjectId={subjectId} setSubjectId={setSubjectId} />
        : <TestsTab subjects={subjects.data ?? []} subjectId={subjectId} setSubjectId={setSubjectId} />}
    </div>
  );
}
