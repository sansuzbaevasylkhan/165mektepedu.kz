import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Empty, ErrorState, Field, Modal, Spinner, useAsync, useConfirm } from '../../components/ui';
import { Icon } from '../../components/Icons';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import {
  ASSIGNMENT_STATUS_CLASS, ASSIGNMENT_STATUS_LABEL, SUBMISSION_STATUS_CLASS,
  SUBMISSION_STATUS_LABEL, TERM_LABEL, fileSize,
} from '../../lib/assignments';
import { friendlyError } from '../../lib/errors';
import { useRealtime } from '../../lib/useRealtime';
import { fmtDateTime } from '../../lib/util';
import type { AssignmentFile, SubmissionRow } from '../../types';

const ACTIONS: Record<string, string> = {
  SAVED: 'Сақталды', PUBLISHED: 'Жарияланды', CLOSED: 'Жабылды',
  UPDATED: 'Жаңартылды', CHECKED: 'Тексерілді', RETURNED: 'Қайтаруға жіберілді',
  SUBMITTED: 'Оқушы тапсырды', FILE_ADDED: 'Файл қосылды', FILE_REMOVED: 'Файл жойылды',
  CREATED: 'Құрылды', DELETED: 'Жойылды',
};

export default function TeacherAssignmentDetail() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const data = useAsync(() => api.assignments.detail(id), [id]);
  const history = useAsync(() => api.assignments.history(id), [id]);
  const [review, setReview] = useState<SubmissionRow | null>(null);
  const [busy, setBusy] = useState(false);

  useRealtime(['assignment_submissions', 'assignment_files', 'assignments'], () => {
    data.reload(); history.reload();
  });

  const d = data.data;

  const act = async (kind: 'publish' | 'close' | 'delete') => {
    if (kind === 'delete' && !confirm('Бұл жобаны жоясыз ба? Әрекет қайтарылмайды.')) return;
    setBusy(true);
    try {
      if (kind === 'publish') await api.assignments.publish(id);
      else if (kind === 'close') await api.assignments.close(id);
      else { await api.assignments.remove(id); toast.show('Тапсырма жойылды', 'success'); nav('/teacher/assignments'); return; }
      toast.show(kind === 'publish' ? 'Жарияланды' : 'Жабылды', 'success');
      data.reload();
    } catch (err) { toast.show(friendlyError(err), 'error'); }
    finally { setBusy(false); }
  };

  const openFile = async (path: string) => {
    try { const url = await api.assignments.signedUrl(path); window.open(url, '_blank', 'noopener'); }
    catch (err) { toast.show(friendlyError(err), 'error'); }
  };

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    let failed = 0;
    for (const f of Array.from(files)) {
      try { await api.assignments.uploadFile(id, f, f.type.startsWith('video/') ? 'video' : 'material'); }
      catch { failed += 1; }
    }
    setBusy(false);
    toast.show(failed ? `${failed} файл жүктелмеді` : 'Файл қосылды', failed ? 'error' : 'success');
    data.reload();
  };

  const removeFile = async (f: AssignmentFile) => {
    if (!confirm(`«${f.file_name}» файлын жоясыз ба?`)) return;
    try { await api.assignments.removeFile(f.id); data.reload(); }
    catch (err) { toast.show(friendlyError(err), 'error'); }
  };

  if (data.loading && !d) return <div className="tch-page"><Spinner /></div>;
  if (data.error) return <div className="tch-page"><ErrorState message={friendlyError(data.error)} onRetry={data.reload} /></div>;
  if (!d) return <div className="tch-page"><Empty title="Тапсырма табылмады" /></div>;

  const pending = d.submissions.filter((s) => s.status === 'submitted' || s.status === 'late');

  return (
    <div className="tch-page">
      <div className="tch-hero">
        <div>
          <Link to="/teacher/assignments" className="tch-back"><Icon name="history" size={15} /> Тізімге</Link>
          <span className="tch-eyebrow">{d.subject_title} · {TERM_LABEL[d.term] ?? d.term}</span>
          <h1>{d.title}</h1>
          <div className="tch-badges">
            <span className={`badge ${ASSIGNMENT_STATUS_CLASS[d.status]}`}>{ASSIGNMENT_STATUS_LABEL[d.status]}</span>
            <span className="badge adm-badge-muted">{d.class_names.join(', ') || `${d.targets.length} оқушы`}</span>
            <span className="badge adm-badge-muted">Макс: {d.max_score}</span>
            <span className="badge adm-badge-muted">{d.due_at ? fmtDateTime(d.due_at) : 'мерзімсіз'}</span>
          </div>
        </div>
        <div className="tch-assign-actions">
          {d.status === 'draft' && <>
            <button className="btn btn-gold" disabled={busy} onClick={() => void act('publish')}>
              <Icon name="check" size={16} /> Жариялау
            </button>
            <Link to={`/teacher/assignments?edit=${d.id}`} className="btn btn-ghost">
              <Icon name="edit" size={16} /> Өңдеу
            </Link>
            <button className="btn btn-ghost" disabled={busy} onClick={() => void act('delete')}>
              <Icon name="trash" size={16} />
            </button>
          </>}
          {d.status === 'published' && (
            <button className="btn btn-ghost" disabled={busy} onClick={() => void act('close')}>
              <Icon name="close" size={16} /> Жабу
            </button>
          )}
        </div>
      </div>

      <div className="tch-detail-grid">
        <section className="card pad">
          <h2 className="tch-card-title">Сипаттама</h2>
          <p className="tch-pre">{d.description || 'Сипаттама енгізілмеген.'}</p>
          {d.criteria && <>
            <h3 className="tch-card-title">Бағалау критерийлері</h3>
            <p className="tch-pre">{d.criteria}</p>
          </>}
          {d.video_url && (
            <a className="btn btn-ghost btn-sm" href={d.video_url} target="_blank" rel="noreferrer">
              <Icon name="play" size={15} /> Бейне сабақ
            </a>
          )}
          {d.targets.length > 0 && (
            <div className="tch-targets">
              <span className="tch-eyebrow">Жеке оқушылар</span>
              <div className="tch-chips">{d.targets.map((t) => <span className="tch-chip" key={t.student_id}>{t.name}</span>)}</div>
            </div>
          )}
        </section>

        <section className="card pad">
          <div className="tch-card-head">
            <h2 className="tch-card-title"><Icon name="file" size={17} /> Материалдар</h2>
            <label className="btn btn-ghost btn-sm">
              <Icon name="plus" size={14} /> Файл қосу
              <input type="file" hidden multiple
                accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.mp4,.webm,.mov"
                onChange={(e) => { void upload(e.target.files); e.target.value = ''; }} />
            </label>
          </div>
          {d.files.length === 0 ? <Empty title="Файл жоқ" /> : (
            <div className="tch-file-list">
              {d.files.map((f) => (
                <div className="tch-file-row" key={f.id}>
                  <button type="button" className="tch-file-open" onClick={() => void openFile(f.storage_path)}>
                    <Icon name={f.kind === 'video' ? 'play' : 'file'} size={16} />
                    <span>{f.file_name}</span>
                    <span className="muted small">{fileSize(f.size_bytes)}</span>
                  </button>
                  <button className="icon-btn" aria-label="Файлды жою" onClick={() => void removeFile(f)}>
                    <Icon name="trash" size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="card pad">
        <div className="tch-card-head">
          <h2 className="tch-card-title"><Icon name="users" size={17} /> Оқушы жұмыстары</h2>
          <span className="badge adm-badge-warn">{pending.length} тексеру күтіп тұр</span>
        </div>
        {d.submissions.length === 0 ? (
          <Empty title="Әзірге тапсыру жоқ" text="Оқушылар жұмыс тапсырғанда осында пайда болады." />
        ) : (
          <div className="table-wrap">
            <table className="tch-table">
              <thead>
                <tr><th>Оқушы</th><th>Күйі</th><th>Тапсырылды</th><th>Балл</th><th /></tr>
              </thead>
              <tbody>
                {d.submissions.map((s) => (
                  <tr key={s.id}>
                    <td><b>{s.student_name}</b></td>
                    <td><span className={`badge ${SUBMISSION_STATUS_CLASS[s.status]}`}>{SUBMISSION_STATUS_LABEL[s.status]}</span></td>
                    <td className="muted small">{s.submitted_at ? fmtDateTime(s.submitted_at) : '—'}</td>
                    <td>{s.score != null ? `${s.score}/${d.max_score}` : '—'}</td>
                    <td className="tch-row-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => setReview(s)}
                        disabled={s.status === 'assigned' || s.status === 'in_progress'}>
                        <Icon name="check" size={14} /> Тексеру
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card pad">
        <h2 className="tch-card-title"><Icon name="history" size={17} /> Өзгерістер тарихы</h2>
        {history.loading && !history.data ? <Spinner />
          : history.error ? <ErrorState message={friendlyError(history.error)} onRetry={history.reload} />
          : (history.data?.length ?? 0) === 0 ? <Empty title="Тарих бос" />
          : (
            <div className="tch-history">
              {history.data!.map((h) => (
                <div className="tch-history-row" key={h.id}>
                  <span className="badge adm-badge-muted">{ACTIONS[h.action] ?? h.action}</span>
                  <span>{h.actor}</span>
                  <span className="muted small">{fmtDateTime(h.created_at)}</span>
                </div>
              ))}
            </div>
          )}
      </section>

      {review && (
        <ReviewModal submission={review} maxScore={d.max_score} onClose={() => setReview(null)}
          onSaved={() => { setReview(null); data.reload(); history.reload(); }} />
      )}
    </div>
  );
}

function ReviewModal({ submission, maxScore, onClose, onSaved }: {
  submission: SubmissionRow; maxScore: number; onClose: () => void; onSaved: () => void;
}) {
  const toast = useToast();
  const [score, setScore] = useState(submission.score != null ? String(submission.score) : '');
  const [feedback, setFeedback] = useState(submission.feedback ?? '');
  const [busy, setBusy] = useState(false);

  const openFile = async (path: string) => {
    try { const url = await api.assignments.signedUrl(path); window.open(url, '_blank', 'noopener'); }
    catch (err) { toast.show(friendlyError(err), 'error'); }
  };

  const submit = async (action: 'check' | 'return') => {
    const num = Number(score);
    if (action === 'check' && (!Number.isFinite(num) || num < 0 || num > maxScore)) {
      toast.show(`Балл 0–${maxScore} аралығында болуы керек`, 'error'); return;
    }
    setBusy(true);
    try {
      await api.assignments.review(submission.id, action === 'check' ? num : null, feedback, action);
      toast.show(action === 'check' ? 'Жұмыс тексерілді' : 'Қайтаруға жіберілді', 'success');
      onSaved();
    } catch (err) { toast.show(friendlyError(err), 'error'); }
    finally { setBusy(false); }
  };

  return (
    <Modal title={`${submission.student_name} — жұмысты тексеру`} onClose={onClose} wide>
      <div className="stack">
        <div className="tch-sub-meta">
          <span className={`badge ${SUBMISSION_STATUS_CLASS[submission.status]}`}>
            {SUBMISSION_STATUS_LABEL[submission.status]}
          </span>
          <span className="muted small">Тапсырылды: {submission.submitted_at ? fmtDateTime(submission.submitted_at) : '—'}</span>
        </div>
        {submission.text_answer && (
          <div className="tch-sub-text">
            <span className="tch-eyebrow">Оқушы жауабы</span>
            <p className="tch-pre">{submission.text_answer}</p>
          </div>
        )}
        {submission.files.length > 0 && (
          <div className="tch-file-list">
            {submission.files.map((f) => (
              <button type="button" className="tch-file-open" key={f.id} onClick={() => void openFile(f.storage_path)}>
                <Icon name="file" size={16} /><span>{f.file_name}</span>
                <span className="muted small">{fileSize(f.size_bytes)}</span>
              </button>
            ))}
          </div>
        )}
        <div className="tch-form-grid">
          <Field label={`Балл (0–${maxScore})`}>
            <input className="input" type="number" min={0} max={maxScore} value={score}
              onChange={(e) => setScore(e.target.value)} />
          </Field>
          <Field label="Мұғалім түсіндірмесі">
            <textarea className="input" rows={3} value={feedback} onChange={(e) => setFeedback(e.target.value)} />
          </Field>
        </div>
        <div className="tch-modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Болдырмау</button>
          <button className="btn btn-ghost" disabled={busy} onClick={() => void submit('return')}>
            <Icon name="history" size={15} /> Қайтаруға жіберу
          </button>
          <button className="btn btn-gold" disabled={busy} onClick={() => void submit('check')}>
            <Icon name="check" size={15} /> Тексерілді
          </button>
        </div>
      </div>
    </Modal>
  );
}
