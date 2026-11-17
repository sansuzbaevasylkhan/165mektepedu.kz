import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Empty, ErrorState, Modal, Spinner, useAsync } from '../components/ui';
import { Icon } from '../components/Icons';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import {
  SUBMISSION_STATUS_CLASS, SUBMISSION_STATUS_LABEL, fileSize,
} from '../lib/assignments';
import { friendlyError } from '../lib/errors';
import { useRealtime } from '../lib/useRealtime';
import { fmtDateTime } from '../lib/util';
import { useSeo } from '../lib/seo';
import type { AssignmentDetail, StudentAssignment } from '../types';

type Tab = 'active' | 'done' | 'all';

export default function StudentAssignments() {
  useSeo('Менің тапсырмаларым', undefined, '/cabinet/assignments');
  const { profile } = useAuth();
  const toast = useToast();
  const list = useAsync(() => api.assignments.studentList(), []);
  useRealtime(['assignments', 'assignment_submissions', 'assignment_grades'], list.reload);
  const [tab, setTab] = useState<Tab>('active');
  const [openId, setOpenId] = useState<string | null>(null);

  const rows = list.data ?? [];
  const shown = rows.filter((a) => {
    const s = a.my_submission?.status;
    if (tab === 'done') return s === 'submitted' || s === 'late' || s === 'checked';
    if (tab === 'active') return !s || s === 'returned';
    return true;
  });

  return (
    <section className="container page narrow-lg stack-lg">
      <div className="section-row">
        <div>
          <span className="tch-eyebrow">Оқушы кабинеті</span>
          <h1>Менің тапсырмаларым</h1>
          <p className="muted small">{profile?.last_name} {profile?.first_name} — мұғалім берген тапсырмалар.</p>
        </div>
        <Link to="/cabinet" className="btn btn-ghost"><Icon name="home" size={16} /> Кабинет</Link>
      </div>

      <div className="tch-tabs tch-tabs-inline" role="tablist" aria-label="Сүзгі">
        {([['active', 'Орындау керек'], ['done', 'Тапсырылған'], ['all', 'Барлығы']] as [Tab, string][])
          .map(([k, label]) => (
            <button key={k} type="button" role="tab" aria-selected={tab === k}
              className={`tch-tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{label}</button>
          ))}
      </div>

      {list.loading && !list.data ? <Spinner />
        : list.error ? <ErrorState message={friendlyError(list.error)} onRetry={list.reload} />
        : shown.length === 0 ? <Empty title="Тапсырма жоқ" text="Мұғалім тапсырма бергенде осында көрінеді." />
        : (
          <div className="tch-assign-list">
            {shown.map((a) => <StudentCard key={a.id} a={a} onOpen={() => setOpenId(a.id)} />)}
          </div>
        )}

      {openId && <SubmitModal id={openId} onClose={() => setOpenId(null)} onSaved={list.reload} />}
    </section>
  );
}

function StudentCard({ a, onOpen }: { a: StudentAssignment; onOpen: () => void }) {
  const sub = a.my_submission;
  const status = sub?.status;
  const late = a.due_at && new Date(a.due_at) < new Date() && !sub;
  return (
    <div className="card pad tch-assign-card">
      <div className="tch-assign-head">
        <div>
          <div className="tch-badges">
            <span className="badge adm-badge-muted">{a.subject_title}</span>
            <span className={`badge ${status ? SUBMISSION_STATUS_CLASS[status] : late ? 'adm-badge-bad' : 'adm-badge-warn'}`}>
              {status ? SUBMISSION_STATUS_LABEL[status] : late ? 'Мерзімі өтті' : 'Орындау керек'}
            </span>
            {sub?.score != null && <span className="badge adm-badge-ok">{sub.score}/{a.max_score} балл</span>}
          </div>
          <h3>{a.title}</h3>
          <p className="muted small">
            Мұғалім: {a.teacher_name} · Мерзімі: {a.due_at ? fmtDateTime(a.due_at) : 'мерзімсіз'}
            {a.class_names.length > 0 ? ` · ${a.class_names.join(', ')}` : ''}
          </p>
        </div>
        <button className="btn btn-gold btn-sm" onClick={onOpen}>
          <Icon name="eye" size={15} /> Ашу
        </button>
      </div>
      {a.description && <p className="tch-assign-desc">{a.description}</p>}
      {sub?.feedback && <p className="tch-feedback"><b>Мұғалім пікірі:</b> {sub.feedback}</p>}
      <div className="tch-assign-stats">
        <span><b>{a.files.length}</b> материал</span>
        <span><b>{sub?.files?.length ?? 0}</b> жүктелген файл</span>
        {sub?.submitted_at && <span>Тапсырылды: {fmtDateTime(sub.submitted_at)}</span>}
      </div>
    </div>
  );
}

function SubmitModal({ id, onClose, onSaved }: { id: string; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const detail = useAsync(() => api.assignments.detail(id), [id]);
  const [text, setText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const d: AssignmentDetail | null = detail.data;
  const sub = d?.my_submission ?? null;
  const locked = sub?.status === 'checked';

  useEffect(() => { if (sub) setText(sub.text_answer ?? ''); }, [sub?.id, sub?.text_answer]);

  const openFile = async (path: string) => {
    try { const url = await api.assignments.signedUrl(path); window.open(url, '_blank', 'noopener'); }
    catch (err) { toast.show(friendlyError(err), 'error'); }
  };

  const send = async () => {
    if (!text.trim() && files.length === 0) { toast.show('Жауап мәтінін жазыңыз немесе файл тіркеңіз', 'error'); return; }
    setBusy(true);
    try {
      const submission = await api.assignments.submit(id, text.trim());
      let failed = 0;
      for (const f of files) {
        try { await api.assignments.uploadSubmissionFile(id, submission, f); }
        catch { failed += 1; }
      }
      toast.show(failed ? `Тапсырылды, бірақ ${failed} файл жүктелмеді` : 'Жұмыс тапсырылды', failed ? 'error' : 'success');
      setFiles([]);
      detail.reload();
      onSaved();
    } catch (err) { toast.show(friendlyError(err), 'error'); }
    finally { setBusy(false); }
  };

  return (
    <Modal title={d?.title ?? 'Тапсырма'} onClose={onClose} wide>
      {detail.loading && !d ? <Spinner />
        : detail.error ? <ErrorState message={friendlyError(detail.error)} onRetry={detail.reload} />
        : !d ? <Empty title="Тапсырма табылмады" />
        : (
          <div className="stack">
            <div className="tch-badges">
              <span className="badge adm-badge-muted">{d.subject_title}</span>
              <span className={`badge ${sub ? SUBMISSION_STATUS_CLASS[sub.status] : 'adm-badge-warn'}`}>
                {sub ? SUBMISSION_STATUS_LABEL[sub.status] : 'Орындау керек'}
              </span>
              <span className="badge adm-badge-muted">Макс: {d.max_score}</span>
              <span className="badge adm-badge-muted">{d.due_at ? fmtDateTime(d.due_at) : 'мерзімсіз'}</span>
            </div>
            <p className="tch-pre">{d.description || 'Сипаттама жоқ.'}</p>
            {d.criteria && <div><span className="tch-eyebrow">Критерийлер</span><p className="tch-pre">{d.criteria}</p></div>}
            {d.video_url && (
              <a className="btn btn-ghost btn-sm" href={d.video_url} target="_blank" rel="noreferrer">
                <Icon name="play" size={15} /> Бейне сабақ
              </a>
            )}

            {d.files.length > 0 && (
              <div className="tch-file-list">
                {d.files.map((f) => (
                  <button type="button" className="tch-file-open" key={f.id} onClick={() => void openFile(f.storage_path)}>
                    <Icon name={f.kind === 'video' ? 'play' : 'file'} size={16} />
                    <span>{f.file_name}</span>
                    <span className="muted small">{fileSize(f.size_bytes)}</span>
                  </button>
                ))}
              </div>
            )}

            {sub?.score != null && (
              <div className="tch-result">
                <b>{sub.score}/{d.max_score} балл</b>
                {sub.feedback && <p className="muted">{sub.feedback}</p>}
              </div>
            )}

            {sub?.files && sub.files.length > 0 && (
              <div className="tch-file-list">
                {sub.files.map((f) => (
                  <button type="button" className="tch-file-open" key={f.id} onClick={() => void openFile(f.storage_path)}>
                    <Icon name="file" size={16} /><span>{f.file_name}</span>
                  </button>
                ))}
              </div>
            )}

            {d.status !== 'published' ? (
              <p className="muted small">Бұл тапсырма жабылған, жауап қабылданбайды.</p>
            ) : locked ? (
              <p className="muted small">Жұмыс тексерілді. Қайта өзгерту мүмкін емес.</p>
            ) : (
              <>
                <label className="field">
                  <span className="field-label">Жауап мәтіні</span>
                  <textarea className="input" rows={6} value={text} maxLength={10000}
                    onChange={(e) => setText(e.target.value)} placeholder="Жауабыңызды жазыңыз..." />
                </label>
                <label className="field">
                  <span className="field-label">Файлдар</span>
                  <input className="input" type="file" multiple
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.mp4,.webm,.mov"
                    onChange={(e) => setFiles(Array.from(e.target.files ?? []))} />
                  {files.length > 0 && <span className="muted small">{files.length} файл таңдалды</span>}
                </label>
                <div className="tch-modal-actions">
                  <button className="btn btn-ghost" onClick={onClose}>Жабу</button>
                  <button className="btn btn-gold" disabled={busy} onClick={() => void send()}>
                    <Icon name="check" size={16} /> {sub?.status === 'returned' ? 'Қайта тапсыру' : 'Тапсыру'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
    </Modal>
  );
}
