import { useEffect, useState } from 'react';
import { Modal, Spinner, ErrorState, useConfirm } from '../ui';
import { Icon } from '../Icons';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { useRealtime } from '../../lib/useRealtime';
import { fmtDateTime } from '../../lib/util';
import { prettyFromE164 } from '../../lib/phone';
import { admissionErrorText, formatBytes, pickLang, type AdmissionLang } from '../../lib/admission';
import { AppBadge, DocBadge, LangSwitch, RequiredProgress, RequirementMeta } from './ui';
import type {
  AdmissionApplication, AdmissionApplicationStatus, AdmissionDocument, AdmissionRequirement,
} from '../../types';

const STATUS_OPTIONS: AdmissionApplicationStatus[] = [
  'new', 'under_review', 'documents_incomplete', 'documents_complete', 'accepted', 'rejected',
];
const STATUS_TEXT: Record<AdmissionApplicationStatus, string> = {
  new: 'Жаңа өтініш',
  under_review: 'Тексерілуде',
  documents_incomplete: 'Құжаттары толық емес',
  documents_complete: 'Құжаттары толық',
  accepted: 'Қабылданды',
  rejected: 'Қабылданбады',
};
const EVENT_TEXT: Record<string, string> = {
  APPLICATION_CREATED: 'Өтініш құрылды',
  DOCUMENT_UPLOADED: 'Құжат жүктелді',
  DOCUMENT_REPLACED: 'Құжат ауыстырылды',
  DOCUMENT_DELETED: 'Құжат жойылды',
  DOCUMENT_REVIEWED: 'Құжат тексерілді',
  STATUS_CHANGED: 'Статус өзгертілді',
  COMMENT_ADDED: 'Түсініктеме қосылды',
};

function mimeAccept(formats: string[]): string {
  const map: Record<string, string> = {
    PDF: 'application/pdf', JPG: 'image/jpeg', JPEG: 'image/jpeg', PNG: 'image/png',
  };
  return formats.map((f) => map[f.toUpperCase()]).filter(Boolean).join(',');
}

function eventDetail(action: string, details: Record<string, unknown>): string {
  if (action === 'STATUS_CHANGED') {
    const to = details.to as AdmissionApplicationStatus | undefined;
    return to && STATUS_TEXT[to] ? `→ ${STATUS_TEXT[to]}` : '';
  }
  if (details.comment) return String(details.comment);
  if (details.file) return String(details.file);
  return '';
}

function StaffDocReview({ doc, onDone }: { doc: AdmissionDocument; onDone: () => void }) {
  const toast = useToast();
  const [status, setStatus] = useState<string>(
    ['UNDER_REVIEW', 'VERIFIED', 'NEEDS_CORRECTION', 'REJECTED'].includes(doc.status) ? doc.status : 'VERIFIED',
  );
  const [comment, setComment] = useState(doc.review_comment || '');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await api.admission.reviewDocument(doc.id, status, comment);
      toast.show('Құжат мәртебесі жаңартылды', 'success');
      onDone();
    } catch (e) { toast.show(admissionErrorText(e), 'error'); }
    finally { setBusy(false); }
  };

  return (
    <div className="adm-review">
      <select className="input" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Құжат мәртебесі">
        <option value="UNDER_REVIEW">Тексерілуде</option>
        <option value="VERIFIED">Расталды</option>
        <option value="NEEDS_CORRECTION">Түзетуге қайтару</option>
        <option value="REJECTED">Қабылдамау</option>
      </select>
      <input className="input" placeholder="Түсініктеме (міндетті емес)" value={comment}
        onChange={(e) => setComment(e.target.value)} />
      <button className="btn btn-gold btn-sm" disabled={busy} onClick={() => void save()}>
        {busy ? 'Сақталуда…' : 'Сақтау'}
      </button>
    </div>
  );
}

function RequirementBlock({ app, req, lang, mode, canDocs, onChanged }: {
  app: AdmissionApplication;
  req: AdmissionRequirement;
  lang: AdmissionLang;
  mode: 'staff' | 'parent';
  canDocs: boolean;
  onChanged: () => void;
}) {
  const toast = useToast();
  const confirm = useConfirm();
  const [uploading, setUploading] = useState(false);
  const auto = req.code === 'electronic_application';

  const openFile = async (path: string) => {
    try {
      const url = await api.admission.signedUrl(path);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (e) { toast.show(admissionErrorText(e), 'error'); }
  };

  const upload = async (doc: AdmissionDocument | null, file: File) => {
    const ext = (file.name.split('.').pop() || '').toUpperCase();
    if (!req.formats.map((f) => f.toUpperCase()).includes(ext)) {
      toast.show(`Рұқсат етілген форматтар: ${req.formats.join(', ')}`, 'error'); return;
    }
    if (file.size > req.max_mb * 1024 * 1024) {
      toast.show(`Файл көлемі ${req.max_mb} MB-тан аспауы керек`, 'error'); return;
    }
    setUploading(true);
    try {
      const saved = await api.admission.uploadFile(app.id, file);
      if (doc) await api.admission.replaceDocument(doc.id, saved.name, saved.path);
      else await api.admission.uploadDocument(app.id, req.id, saved.name, saved.path);
      toast.show(doc ? 'Құжат ауыстырылды' : 'Құжат жүктелді', 'success');
      onChanged();
    } catch (e) { toast.show(admissionErrorText(e), 'error'); }
    finally { setUploading(false); }
  };

  const remove = async (doc: AdmissionDocument) => {
    if (!confirm('Бұл құжатты жоюды растайсыз ба?')) return;
    try {
      await api.admission.deleteDocument(doc.id);
      toast.show('Құжат жойылды', 'success');
      onChanged();
    } catch (e) { toast.show(admissionErrorText(e), 'error'); }
  };

  const canAdd = mode === 'parent' && !auto && (req.multiple || req.documents.length === 0);

  return (
    <div className={`adm-req ${req.status === 'NEEDS_CORRECTION' ? 'attention' : ''}`}>
      <div className="adm-req-head">
        <div>
          <RequirementTitleRow req={req} lang={lang} />
          <RequirementMeta row={req} />
        </div>
        <div className="adm-req-badges">
          <span className={`badge ${req.required ? 'badge-open' : 'badge-locked'}`}>{req.required ? 'Міндетті' : 'Қосымша'}</span>
          <DocBadge status={req.status} />
        </div>
      </div>
      {pickLang(req, lang, 'description') && <p className="muted small adm-req-desc">{pickLang(req, lang, 'description')}</p>}

      {auto ? (
        <p className="adm-note"><Icon name="check" size={15} /> Портал арқылы автоматты түрде расталады — жүктеу қажет емес.</p>
      ) : null}

      {req.documents.length > 0 && (
        <div className="adm-docs">
          {req.documents.map((doc) => (
            <div key={doc.id} className="adm-doc">
              <div className="adm-doc-main">
                <a href="#" className="adm-doc-name" onClick={(e) => { e.preventDefault(); void openFile(doc.storage_path); }}>
                  <Icon name="file" size={16} /> {doc.file_name}
                </a>
                <span className="muted small">v{doc.version} · {formatBytes(doc.size_bytes)} · {fmtDateTime(doc.created_at)}</span>
                {doc.review_comment && <span className="adm-doc-comment">{doc.review_comment}</span>}
              </div>
              <div className="adm-doc-actions">
                <DocBadge status={doc.status} />
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => void openFile(doc.storage_path)}>
                  <Icon name="eye" size={15} /> Ашу
                </button>
                {mode === 'parent' && (
                  <>
                    <label className={`btn btn-ghost btn-sm ${uploading ? 'disabled' : ''}`}>
                      Ауыстыру
                      <input type="file" hidden accept={mimeAccept(req.formats)} disabled={uploading}
                        onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void upload(doc, f); }} />
                    </label>
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => void remove(doc)}>
                      <Icon name="trash" size={15} />
                    </button>
                  </>
                )}
              </div>
              {mode === 'staff' && canDocs && (
                <StaffDocReview key={`${doc.id}-${doc.status}-${doc.review_comment}`} doc={doc} onDone={onChanged} />
              )}
            </div>
          ))}
        </div>
      )}

      {!auto && req.documents.length === 0 && req.status === 'NOT_UPLOADED' && (
        <p className="muted small">Құжат әлі жүктелмеген.</p>
      )}

      {canAdd && (
        <label className={`btn ${req.status === 'NEEDS_CORRECTION' ? 'btn-gold' : 'btn-ghost'} btn-sm adm-upload`}>
          <Icon name="plus" size={15} /> {uploading ? 'Жүктелуде…' : req.documents.length ? 'Тағы жүктеу' : 'Құжат жүктеу'}
          <input type="file" hidden accept={mimeAccept(req.formats)} disabled={uploading}
            onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void upload(null, f); }} />
        </label>
      )}
    </div>
  );
}

function RequirementTitleRow({ req, lang }: { req: AdmissionRequirement; lang: AdmissionLang }) {
  return <b className="adm-req-title">{pickLang(req, lang) || req.code}</b>;
}

export default function ApplicationDetail({ applicationId, mode, onClose, onChanged }: {
  applicationId: string;
  mode: 'staff' | 'parent';
  onClose: () => void;
  onChanged?: () => void;
}) {
  const toast = useToast();
  const [lang, setLang] = useState<AdmissionLang>('kk');
  const detail = useAsyncDetail(applicationId);
  const app = detail.data;
  const perms = app?.permissions;
  const canDocs = mode === 'parent' || Boolean(perms?.admission_documents_view);
  const canDetails = mode === 'parent' || Boolean(perms?.admission_details_view);
  const canStatus = Boolean(perms?.admission_status_update);
  const canComment = Boolean(perms?.admission_comment);

  const [nextStatus, setNextStatus] = useState<AdmissionApplicationStatus>('new');
  const [statusComment, setStatusComment] = useState('');
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (app) setNextStatus(app.status);
  }, [app?.id, app?.status]);

  const refresh = () => { detail.reload(); onChanged?.(); };

  const applyStatus = async () => {
    if (!app) return;
    setBusy(true);
    try {
      await api.admission.updateStatus(app.id, nextStatus, statusComment);
      setStatusComment('');
      toast.show('Өтініш мәртебесі жаңартылды', 'success');
      refresh();
    } catch (e) { toast.show(admissionErrorText(e), 'error'); }
    finally { setBusy(false); }
  };

  const addComment = async () => {
    if (!app) return;
    setBusy(true);
    try {
      await api.admission.addComment(app.id, comment);
      setComment('');
      toast.show('Түсініктеме қосылды', 'success');
      refresh();
    } catch (e) { toast.show(admissionErrorText(e), 'error'); }
    finally { setBusy(false); }
  };

  const title = app ? `Өтініш — ${app.student_last_name} ${app.student_first_name}` : 'Өтініш';
  const events = app ? (mode === 'parent' ? app.events.filter((ev) => ev.action !== 'COMMENT_ADDED') : app.events) : [];

  return (
    <Modal title={title} onClose={onClose} wide>
      {detail.loading && !app ? <Spinner />
        : detail.error ? <ErrorState message={admissionErrorText(detail.error)} onRetry={detail.reload} />
        : !app ? <ErrorState message="Өтініш табылмады." onRetry={detail.reload} />
        : (
          <div className="adm-detail">
            <div className="adm-detail-top">
              <div className="adm-detail-id">
                <div className="adm-avatar">{app.student_last_name.charAt(0)}{app.student_first_name.charAt(0)}</div>
                <div>
                  <h3>{app.student_last_name} {app.student_first_name}</h3>
                  <p className="muted small">{app.grade}-сынып · Өтініш берілді: {fmtDateTime(app.created_at)}</p>
                </div>
              </div>
              <div className="adm-detail-side">
                <AppBadge status={app.status} />
                <div className="adm-lang-wrap"><LangSwitch lang={lang} onChange={setLang} /></div>
              </div>
            </div>

            <div className="adm-detail-grid">
              <div className="adm-kv"><span>Міндетті құжаттар</span><RequiredProgress done={app.required_done} total={app.required_total} /></div>
              <div className="adm-kv"><span>Жүктелген құжаттар</span><b>{app.documents_uploaded}</b></div>
              <div className="adm-kv"><span>Соңғы өзгеріс</span><b>{fmtDateTime(app.updated_at)}</b></div>
              {app.decided_at && <div className="adm-kv"><span>Шешім қабылданды</span><b>{fmtDateTime(app.decided_at)}</b></div>}
            </div>

            {canDetails && app.parent && (
              <div className="adm-panel">
                <h4><Icon name="users" size={17} /> Ата-ана</h4>
                <div className="adm-detail-grid">
                  <div className="adm-kv"><span>Аты-жөні</span><b>{app.parent.last_name} {app.parent.first_name}</b></div>
                  <div className="adm-kv"><span>Телефон</span><b>{prettyFromE164(app.parent.phone)}</b></div>
                  {app.birth_date && <div className="adm-kv"><span>Туған күні</span><b>{app.birth_date}</b></div>}
                  {app.iin && <div className="adm-kv"><span>ЖСН</span><b className="mono">{app.iin}</b></div>}
                </div>
                {app.parent_note && <p className="adm-quote">«{app.parent_note}»</p>}
                {mode === 'staff' && app.staff_comment && <p className="adm-staff-comment"><b>Ішкі түсініктеме:</b> {app.staff_comment}</p>}
              </div>
            )}

            {canDocs && app.requirements.length > 0 && (
              <div className="adm-panel">
                <h4><Icon name="file" size={17} /> Құжаттар</h4>
                <div className="adm-req-list">
                  {app.requirements.map((req) => (
                    <RequirementBlock key={req.id} app={app} req={req} lang={lang} mode={mode}
                      canDocs={canDocs} onChanged={refresh} />
                  ))}
                </div>
              </div>
            )}

            {mode === 'staff' && !canDocs && (
              <p className="adm-note warn"><Icon name="lock" size={15} /> Құжаттарды көру рұқсаты берілмеген. Тек негізгі ақпарат көрсетіледі.</p>
            )}

            {canStatus && (
              <div className="adm-panel">
                <h4><Icon name="shield" size={17} /> Шешім және мәртебе</h4>
                <div className="adm-status-form">
                  <select className="input" value={nextStatus} onChange={(e) => setNextStatus(e.target.value as AdmissionApplicationStatus)}>
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_TEXT[s]}</option>)}
                  </select>
                  <input className="input" placeholder="Түсініктеме (міндетті емес)" value={statusComment}
                    onChange={(e) => setStatusComment(e.target.value)} />
                  <button className="btn btn-gold" disabled={busy} onClick={() => void applyStatus()}>Қолдану</button>
                </div>
                <p className="field-hint">«Қабылданды» мәртебесі барлық міндетті құжаттар расталғанда ғана қолжетімді.</p>
              </div>
            )}

            {canComment && (
              <div className="adm-panel">
                <h4><Icon name="edit" size={17} /> Түсініктеме қалдыру</h4>
                <div className="adm-status-form">
                  <input className="input" placeholder="Ішкі түсініктеме" value={comment}
                    onChange={(e) => setComment(e.target.value)} />
                  <button className="btn btn-ghost" disabled={busy || !comment.trim()} onClick={() => void addComment()}>Қосу</button>
                </div>
              </div>
            )}

            {canDetails && events.length > 0 && (
              <div className="adm-panel">
                <h4><Icon name="history" size={17} /> Әрекеттер тарихы</h4>
                <ol className="adm-timeline">
                  {events.map((ev) => (
                    <li key={ev.id}>
                      <span className="adm-dot" />
                      <div>
                        <b>{EVENT_TEXT[ev.action] ?? ev.action}</b>
                        <span className="muted small"> · {fmtDateTime(ev.created_at)} · {ev.actor}</span>
                        {eventDetail(ev.action, ev.details) && <p className="muted small">{eventDetail(ev.action, ev.details)}</p>}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {mode === 'staff' && !canDetails && (
              <p className="adm-note"><Icon name="lock" size={15} /> Толық мәліметтер мен тарих жабық.</p>
            )}
          </div>
        )}
    </Modal>
  );
}

function useAsyncDetail(applicationId: string) {
  const [data, setData] = useState<AdmissionApplication | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    api.admission.application(applicationId)
      .then((d) => { if (alive) setData(d); })
      .catch((e) => { if (alive) setError(e); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [applicationId, tick]);

  useRealtime(
    ['admission_applications', 'admission_documents', 'admission_document_reviews', 'admission_events'],
    () => setTick((x) => x + 1),
  );

  return { data, error, loading, reload: () => setTick((x) => x + 1) };
}
