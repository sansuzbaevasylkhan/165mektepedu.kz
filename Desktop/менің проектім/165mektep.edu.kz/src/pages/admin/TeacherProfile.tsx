import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Empty, ErrorState, Field, Modal, Spinner, useAsync } from '../../components/ui';
import { Icon, type IconName } from '../../components/Icons';
import {
  AssignmentEditor, EmploymentBadge, TeacherAvatar, fromDrafts, toDrafts, type AssignmentDraft,
} from '../../components/teacher/ui';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { friendlyError } from '../../lib/errors';
import { prettyFromE164 } from '../../lib/phone';
import { useRealtime } from '../../lib/useRealtime';
import {
  ATTENDANCE_CLASS, ATTENDANCE_LABEL, DOC_KIND_LABEL, EMPLOYMENT_LABEL, REPORT_CLASS, REPORT_LABEL,
  TASK_PRIORITY_LABEL, TASK_STATUS_CLASS, TASK_STATUS_LABEL, WEEKDAYS, WORKLOG_LABEL,
  fmtBytes, fmtTime, inputDate, teacherName,
} from '../../lib/teacher';
import { fmtDate, fmtDateTime } from '../../lib/util';
import type {
  TeacherAttendance, TeacherDetail, TeacherDocument, TeacherTaskStatus,
} from '../../types';

type Tab = 'profile' | 'subjects' | 'work' | 'documents' | 'tasks' | 'account' | 'audit';
type AccountAction = 'block' | 'unblock' | 'archive' | 'restore' | 'reset_password';

const TABS: { key: Tab; label: string; icon: IconName }[] = [
  { key: 'profile', label: 'Профиль', icon: 'user' },
  { key: 'subjects', label: 'Пәндер және жүктеме', icon: 'layers' },
  { key: 'work', label: 'Жұмыс журналы', icon: 'calendar' },
  { key: 'documents', label: 'Құжаттар', icon: 'file' },
  { key: 'tasks', label: 'Тапсырмалар', icon: 'clipboard' },
  { key: 'account', label: 'Аккаунт', icon: 'key' },
  { key: 'audit', label: 'Audit', icon: 'history' },
];

function MiniStat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="tch-mini-stat">
      <b>{value}</b>
      <span>{label}</span>
      {hint && <span className="muted small">{hint}</span>}
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="tch-info-row">
      <span className="muted small">{label}</span>
      <span>{children || <span className="muted">—</span>}</span>
    </div>
  );
}

/* ------------------------------- PROFILE ------------------------------- */

function ProfileTab({ d, onEdit, onAccount }: {
  d: TeacherDetail; onEdit: () => void; onAccount: (a: AccountAction) => void;
}) {
  const p = d.permissions;
  return (
    <div className="tch-grid-2">
      <section className="card pad">
        <div className="section-row">
          <h3>Жеке ақпарат</h3>
          {p.edit && <button className="btn btn-ghost btn-sm" onClick={onEdit}><Icon name="edit" size={15} /> Өңдеу</button>}
        </div>
        <div className="tch-info-grid">
          <InfoRow label="Телефон">{prettyFromE164(d.phone)}</InfoRow>
          <InfoRow label="Email">{d.email}</InfoRow>
          <InfoRow label="Туған күні">{fmtDate(d.birth_date)}</InfoRow>
          <InfoRow label="Жұмысқа қабылданған">{fmtDate(d.hired_at)}</InfoRow>
          <InfoRow label="Біліктілігі">{d.qualification}</InfoRow>
          <InfoRow label="Мекенжайы">{d.address}</InfoRow>
          <InfoRow label="Тіркелген">{fmtDate(d.created_at)}</InfoRow>
          <InfoRow label="Соңғы белсенділік">{fmtDateTime(d.last_seen_at)}</InfoRow>
        </div>
        {d.notes && <p className="tch-notes">{d.notes}</p>}
      </section>

      <section className="card pad">
        <h3>Аккаунт күйі</h3>
        <div className="tch-account-state">
          <EmploymentBadge status={d.employment_status} />
          {d.is_blocked
            ? <span className="badge adm-badge-bad">Бұғатталған</span>
            : <span className="badge adm-badge-ok">Белсенді</span>}
          {d.archived_at && <span className="badge adm-badge-muted">Мұрағат: {fmtDate(d.archived_at)}</span>}
        </div>

        {d.is_blocked && (d.block_reason || d.blocked_until) && (
          <div className="tch-alert">
            <Icon name="lock" size={16} />
            <span>
              {d.block_reason || 'Себебі көрсетілмеген'}
              {d.blocked_until && ` · ${fmtDate(d.blocked_until)} дейін`}
            </span>
          </div>
        )}

        {!p.accounts ? (
          <p className="muted small">Аккаунтты басқару рұқсаты жоқ. Бұғаттау, мұрағаттау және құпиясөзді ауыстыру тек рұқсат берілген әкімшіге қолжетімді.</p>
        ) : (
          <div className="tch-account-actions">
            {d.employment_status === 'archived'
              ? <button className="btn btn-ghost btn-sm" onClick={() => onAccount('restore')}><Icon name="history" size={15} /> Қалпына келтіру</button>
              : <button className="btn btn-ghost btn-sm" onClick={() => onAccount('archive')}><Icon name="trash" size={15} /> Мұрағаттау</button>}
            {d.is_blocked
              ? <button className="btn btn-ghost btn-sm" onClick={() => onAccount('unblock')}><Icon name="check" size={15} /> Бұғаттаудан шығару</button>
              : <button className="btn btn-ghost btn-sm" onClick={() => onAccount('block')}><Icon name="lock" size={15} /> Уақытша бұғаттау</button>}
            <button className="btn btn-ghost btn-sm" onClick={() => onAccount('reset_password')}><Icon name="key" size={15} /> Құпиясөзді ауыстыру</button>
          </div>
        )}

        <div className="tch-account-summary">
          <MiniStat label="Ашық тапсырма" value={d.tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress').length} />
          <MiniStat label="Құжат" value={p.documents ? d.documents.length : '—'} hint={p.documents ? `${d.documents.filter((x) => !x.verified).length} тексерілмеген` : 'рұқсат жоқ'} />
          <MiniStat label="Есеп" value={d.reports.length} />
          <MiniStat label="Сабақ/апта" value={d.workload.lessons} hint={`${d.workload.hours} сағат`} />
        </div>
      </section>
    </div>
  );
}

/* ------------------------------- SUBJECTS ------------------------------ */

function SubjectsTab({ d, onEdit }: { d: TeacherDetail; onEdit: () => void }) {
  const classes = useMemo(() => Array.from(new Set(d.assignments.flatMap((a) => a.classes))), [d.assignments]);
  return (
    <div className="stack-lg">
      <div className="tch-mini-stats">
        <MiniStat label="Пән" value={d.assignments.length} />
        <MiniStat label="Сынып" value={classes.length} hint={classes.join(', ')} />
        <MiniStat label="Апталық сабақ" value={d.workload.lessons} />
        <MiniStat label="Апталық сағат" value={d.workload.hours} />
      </div>

      <section className="card pad">
        <div className="section-row">
          <h3>Пән тағайындау</h3>
          {d.permissions.edit && <button className="btn btn-ghost btn-sm" onClick={onEdit}><Icon name="edit" size={15} /> Өңдеу</button>}
        </div>
        {d.assignments.length === 0 ? <Empty title="Пән тағайындалмаған" text="Профильді өңдеу арқылы пән мен сынып қосыңыз." />
          : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Пән</th><th>Сыныптар</th><th>Апталық сағат</th></tr></thead>
                <tbody>
                  {d.assignments.map((a) => (
                    <tr key={a.id}>
                      <td><b>{a.subject_title}</b></td>
                      <td><span className="tch-chips">{a.classes.map((c) => <span key={c} className="tch-chip">{c}</span>)}</span></td>
                      <td>{a.weekly_hours} сағат</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </section>

      <section className="card pad">
        <div className="section-row">
          <h3>Сабақ кестесі</h3>
          <span className="badge adm-badge-muted">{d.timetable.length} сабақ</span>
        </div>
        {d.timetable.length === 0 ? <Empty title="Кестеде сабақ жоқ" text="Сабақ кестесі DIRECTOR бөлімінде толтырылады." />
          : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Күн</th><th>Уақыт</th><th>Пән</th><th>Сынып</th><th>Кабинет</th></tr></thead>
                <tbody>
                  {d.timetable.map((t) => (
                    <tr key={t.id}>
                      <td>{WEEKDAYS[t.weekday] ?? t.weekday}</td>
                      <td>{fmtTime(t.start_time)}–{fmtTime(t.end_time)}</td>
                      <td>{t.subject_title}</td>
                      <td>{t.class_name}</td>
                      <td>{t.room || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </section>
    </div>
  );
}

/* -------------------------------- WORK --------------------------------- */

const today = () => new Date().toISOString().slice(0, 10);

function WorkTab({ d, reload }: { d: TeacherDetail; reload: () => void }) {
  const toast = useToast();
  const p = d.permissions;
  const subjects = useAsync(() => api.catalog(), []);
  const [busy, setBusy] = useState(false);

  const [aDate, setADate] = useState(today());
  const [aStatus, setAStatus] = useState<TeacherAttendance['status']>('present');
  const [aIn, setAIn] = useState('');
  const [aOut, setAOut] = useState('');
  const [aLate, setALate] = useState(0);
  const [aNote, setANote] = useState('');

  const [wDate, setWDate] = useState(today());
  const [wSubject, setWSubject] = useState('');
  const [wClass, setWClass] = useState('');
  const [wTopic, setWTopic] = useState('');
  const [wStatus, setWStatus] = useState('conducted');
  const [wNote, setWNote] = useState('');

  const [rStart, setRStart] = useState(today());
  const [rEnd, setREnd] = useState(today());
  const [rTitle, setRTitle] = useState('');
  const [rContent, setRContent] = useState('');

  const addAttendance = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.teacher.attendanceAdd({
        teacher: d.id, date: aDate, checkIn: aIn || null, checkOut: aOut || null,
        status: aStatus, late: aLate, note: aNote,
      });
      toast.show('Қатысу жазылды', 'success');
      setANote(''); setALate(0);
      reload();
    } catch (err) { toast.show(friendlyError(err), 'error'); }
    finally { setBusy(false); }
  };

  const addWork = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.teacher.workLogAdd({
        teacher: d.id, date: wDate, subject: wSubject || null, klass: wClass,
        topic: wTopic, status: wStatus, note: wNote,
      });
      toast.show('Сабақ журналға жазылды', 'success');
      setWTopic(''); setWNote('');
      reload();
    } catch (err) { toast.show(friendlyError(err), 'error'); }
    finally { setBusy(false); }
  };

  const addReport = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.teacher.reportAdd({
        teacher: d.id, start: rStart, end: rEnd, title: rTitle, content: rContent,
      });
      toast.show('Есеп қосылды', 'success');
      setRTitle(''); setRContent('');
      reload();
    } catch (err) { toast.show(friendlyError(err), 'error'); }
    finally { setBusy(false); }
  };

  const review = async (id: string, status: 'submitted' | 'approved' | 'revision') => {
    try {
      await api.teacher.reportReview(id, status);
      toast.show('Есеп мәртебесі жаңартылды', 'success');
      reload();
    } catch (err) { toast.show(friendlyError(err), 'error'); }
  };

  return (
    <div className="stack-lg">
      <div className="tch-mini-stats">
        <MiniStat label="Келді" value={d.attendance_stats.present} />
        <MiniStat label="Кешікті" value={d.attendance_stats.late} />
        <MiniStat label="Келмеді" value={d.attendance_stats.absent} />
        <MiniStat label="Демалыс" value={d.attendance_stats.leave} />
      </div>

      <section className="card pad">
        <h3>Қатысу мен кешігу</h3>
        {!p.edit ? <p className="muted small">Қатысуды тіркеу үшін өңдеу рұқсаты қажет.</p>
          : (
            <form className="tch-inline-form" onSubmit={(e) => void addAttendance(e)}>
              <Field label="Күн"><input className="input" type="date" value={aDate} onChange={(e) => setADate(e.target.value)} required /></Field>
              <Field label="Мәртебе">
                <select className="input" value={aStatus} onChange={(e) => setAStatus(e.target.value as TeacherAttendance['status'])}>
                  {Object.entries(ATTENDANCE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </Field>
              <Field label="Кіру"><input className="input" type="time" value={aIn} onChange={(e) => setAIn(e.target.value)} /></Field>
              <Field label="Шығу"><input className="input" type="time" value={aOut} onChange={(e) => setAOut(e.target.value)} /></Field>
              <Field label="Кешігу (мин)"><input className="input" type="number" min={0} max={600} value={aLate} onChange={(e) => setALate(Number(e.target.value))} /></Field>
              <Field label="Ескертпе"><input className="input" value={aNote} onChange={(e) => setANote(e.target.value)} /></Field>
              <button className="btn btn-gold btn-sm" type="submit" disabled={busy}>Қосу</button>
            </form>
          )}
        {d.attendance.length === 0 ? <p className="muted small">Жазба жоқ.</p>
          : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Күн</th><th>Кіру</th><th>Шығу</th><th>Мәртебе</th><th>Кешігу</th><th>Ескертпе</th></tr></thead>
                <tbody>
                  {d.attendance.map((r) => (
                    <tr key={r.id}>
                      <td>{fmtDate(r.work_date)}</td>
                      <td>{fmtTime(r.check_in)}</td>
                      <td>{fmtTime(r.check_out)}</td>
                      <td><span className={`badge ${ATTENDANCE_CLASS[r.status]}`}>{ATTENDANCE_LABEL[r.status]}</span></td>
                      <td>{r.late_minutes ? `${r.late_minutes} мин` : '—'}</td>
                      <td className="muted small">{r.note || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </section>

      <section className="card pad">
        <h3>Өткізілген сабақтар журналы</h3>
        {!p.edit ? <p className="muted small">Журналға жазу үшін өңдеу рұқсаты қажет.</p>
          : (
            <form className="tch-inline-form" onSubmit={(e) => void addWork(e)}>
              <Field label="Күн"><input className="input" type="date" value={wDate} onChange={(e) => setWDate(e.target.value)} required /></Field>
              <Field label="Пән">
                <select className="input" value={wSubject} onChange={(e) => setWSubject(e.target.value)}>
                  <option value="">—</option>
                  {(subjects.data?.subjects ?? []).map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
              </Field>
              <Field label="Сынып"><input className="input" value={wClass} onChange={(e) => setWClass(e.target.value)} placeholder="5А" /></Field>
              <Field label="Тақырып"><input className="input" value={wTopic} onChange={(e) => setWTopic(e.target.value)} required /></Field>
              <Field label="Күйі">
                <select className="input" value={wStatus} onChange={(e) => setWStatus(e.target.value)}>
                  {Object.entries(WORKLOG_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </Field>
              <Field label="Ескертпе"><input className="input" value={wNote} onChange={(e) => setWNote(e.target.value)} /></Field>
              <button className="btn btn-gold btn-sm" type="submit" disabled={busy}>Қосу</button>
            </form>
          )}
        {d.work_logs.length === 0 ? <p className="muted small">Жазба жоқ.</p>
          : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Күн</th><th>Пән</th><th>Сынып</th><th>Тақырып</th><th>Күйі</th></tr></thead>
                <tbody>
                  {d.work_logs.map((r) => (
                    <tr key={r.id}>
                      <td>{fmtDate(r.work_date)}</td>
                      <td>{r.subject_title || '—'}</td>
                      <td>{r.class_name || '—'}</td>
                      <td>{r.topic}</td>
                      <td>{WORKLOG_LABEL[r.status]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </section>

      <section className="card pad">
        <h3>Жұмыс есептері</h3>
        {p.edit && (
          <form className="tch-report-form" onSubmit={(e) => void addReport(e)}>
            <div className="tch-inline-form">
              <Field label="Басталуы"><input className="input" type="date" value={rStart} onChange={(e) => setRStart(e.target.value)} required /></Field>
              <Field label="Аяқталуы"><input className="input" type="date" value={rEnd} onChange={(e) => setREnd(e.target.value)} required /></Field>
              <Field label="Атауы"><input className="input" value={rTitle} onChange={(e) => setRTitle(e.target.value)} required /></Field>
            </div>
            <Field label="Мазмұны">
              <textarea className="input" rows={3} value={rContent} onChange={(e) => setRContent(e.target.value)} />
            </Field>
            <button className="btn btn-gold btn-sm" type="submit" disabled={busy}>Есеп қосу</button>
          </form>
        )}
        {d.reports.length === 0 ? <p className="muted small">Есеп жоқ.</p>
          : (
            <div className="tch-report-list">
              {d.reports.map((r) => (
                <div className="tch-report" key={r.id}>
                  <div className="tch-report-head">
                    <b>{r.title}</b>
                    <span className={`badge ${REPORT_CLASS[r.status]}`}>{REPORT_LABEL[r.status]}</span>
                  </div>
                  <span className="muted small">{fmtDate(r.period_start)} – {fmtDate(r.period_end)}</span>
                  {r.content && <p>{r.content}</p>}
                  {p.documents && r.status !== 'approved' && (
                    <div className="tch-report-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => void review(r.id, 'approved')}>Бекіту</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => void review(r.id, 'revision')}>Қайта өңдеуге</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
      </section>
    </div>
  );
}

/* ------------------------------ DOCUMENTS ------------------------------ */

function DocsTab({ d, reload }: { d: TeacherDetail; reload: () => void }) {
  const toast = useToast();
  const p = d.permissions;
  const [kind, setKind] = useState<TeacherDocument['kind']>('diploma');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<Record<string, string>>({});

  const upload = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) { toast.show('Файл таңдаңыз', 'error'); return; }
    setBusy(true);
    try {
      await api.teacher.uploadDocument(d.id, { kind, title: title || file.name, file });
      toast.show('Құжат жүктелді', 'success');
      setTitle(''); setFile(null);
      reload();
    } catch (err) { toast.show(friendlyError(err), 'error'); }
    finally { setBusy(false); }
  };

  const openDoc = async (doc: TeacherDocument) => {
    try {
      const url = await api.teacher.signedDocumentUrl(doc.storage_path);
      window.open(url, '_blank', 'noopener');
    } catch (err) { toast.show(friendlyError(err), 'error'); }
  };

  const review = async (doc: TeacherDocument, verified: boolean) => {
    try {
      await api.teacher.reviewDocument(doc.id, verified, note[doc.id] ?? doc.note ?? '');
      toast.show('Құжат тексерілді', 'success');
      reload();
    } catch (err) { toast.show(friendlyError(err), 'error'); }
  };

  const remove = async (doc: TeacherDocument) => {
    if (!window.confirm(`«${doc.title}» құжатын өшіру керек пе?`)) return;
    try {
      await api.teacher.deleteDocument(doc.id);
      toast.show('Құжат өшірілді', 'success');
      reload();
    } catch (err) { toast.show(friendlyError(err), 'error'); }
  };

  if (d.documents_hidden) {
    return <Empty title="Құжаттарға рұқсат жоқ" text="Мұғалім құжаттарын көру рұқсатын DIRECTOR береді." />;
  }

  return (
    <div className="stack-lg">
      {p.edit && (
        <section className="card pad">
          <h3>Құжат жүктеу</h3>
          <form className="tch-inline-form" onSubmit={(e) => void upload(e)}>
            <Field label="Түрі">
              <select className="input" value={kind} onChange={(e) => setKind(e.target.value as TeacherDocument['kind'])}>
                {Object.entries(DOC_KIND_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <Field label="Атауы"><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Диплом көшірмесі" /></Field>
            <Field label="Файл (PDF/JPEG/PNG, ≤10 МБ)">
              <input className="input" type="file" accept="application/pdf,image/jpeg,image/png"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </Field>
            <button className="btn btn-gold btn-sm" type="submit" disabled={busy}>{busy ? 'Жүктелуде…' : 'Жүктеу'}</button>
          </form>
          <p className="muted small">Құжаттар жеке (private) қоймада сақталады, сілтеме 15 минутқа ғана жасалады.</p>
        </section>
      )}

      <section className="card table-wrap">
        {d.documents.length === 0 ? <Empty title="Құжат жоқ" text="Мұғалім құжаттары осы жерде сақталады." />
          : (
            <table className="table">
              <thead><tr><th>Атауы</th><th>Түрі</th><th>Өлшемі</th><th>Мәртебе</th><th>Жүктелген</th><th aria-label="Әрекет" /></tr></thead>
              <tbody>
                {d.documents.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <b>{doc.title}</b>
                      <div className="muted small">{doc.file_name}</div>
                    </td>
                    <td>{DOC_KIND_LABEL[doc.kind]}</td>
                    <td className="muted small">{fmtBytes(doc.size_bytes)}</td>
                    <td>
                      {doc.verified
                        ? <span className="badge adm-badge-ok">Тексерілді</span>
                        : <span className="badge adm-badge-warn">Тексерілмеген</span>}
                      {doc.note && <div className="muted small">{doc.note}</div>}
                    </td>
                    <td className="muted small">{fmtDate(doc.created_at)}</td>
                    <td>
                      <div className="tch-row-actions">
                        <button className="icon-btn" title="Ашу" onClick={() => void openDoc(doc)}><Icon name="eye" size={17} /></button>
                        {p.documents && !doc.verified && (
                          <button className="icon-btn" title="Тексерілді деп белгілеу" onClick={() => void review(doc, true)}><Icon name="check" size={17} /></button>
                        )}
                        {p.edit && (
                          <button className="icon-btn" title="Өшіру" onClick={() => void remove(doc)}><Icon name="trash" size={17} /></button>
                        )}
                      </div>
                      {p.documents && (
                        <input className="input tch-doc-note" placeholder="Ескертпе (міндетті емес)" value={note[doc.id] ?? doc.note ?? ''}
                          onChange={(e) => setNote((prev) => ({ ...prev, [doc.id]: e.target.value }))} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </section>
    </div>
  );
}

/* -------------------------------- TASKS -------------------------------- */

function TasksTab({ d, reload }: { d: TeacherDetail; reload: () => void }) {
  const toast = useToast();
  const p = d.permissions;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('normal');
  const [due, setDue] = useState('');
  const [busy, setBusy] = useState(false);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.teacher.createTask({
        teacher: d.id, title, description, priority,
        due: due ? new Date(due).toISOString() : null,
      });
      toast.show('Тапсырма берілді және хабарлама жіберілді', 'success');
      setTitle(''); setDescription(''); setDue('');
      reload();
    } catch (err) { toast.show(friendlyError(err), 'error'); }
    finally { setBusy(false); }
  };

  const change = async (task: string, status: TeacherTaskStatus) => {
    try {
      await api.teacher.setTaskStatus(task, status);
      toast.show('Тапсырма мәртебесі жаңартылды', 'success');
      reload();
    } catch (err) { toast.show(friendlyError(err), 'error'); }
  };

  return (
    <div className="stack-lg">
      {p.edit && (
        <section className="card pad">
          <h3>Жаңа тапсырма беру</h3>
          <form className="tch-task-form" onSubmit={(e) => void create(e)}>
            <div className="tch-inline-form">
              <Field label="Тақырып"><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required /></Field>
              <Field label="Басымдық">
                <select className="input" value={priority} onChange={(e) => setPriority(e.target.value)}>
                  {Object.entries(TASK_PRIORITY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </Field>
              <Field label="Мерзімі"><input className="input" type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} /></Field>
            </div>
            <Field label="Сипаттама">
              <textarea className="input" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
            </Field>
            <button className="btn btn-gold btn-sm" type="submit" disabled={busy}>Тапсырма беру</button>
          </form>
        </section>
      )}

      {d.tasks.length === 0 ? <Empty title="Тапсырма жоқ" text="Берілген тапсырмалар осы жерде көрінеді." />
        : (
          <div className="tch-task-list">
            {d.tasks.map((t) => (
              <div className={`tch-task ${t.overdue ? 'overdue' : ''}`} key={t.id}>
                <div className="tch-task-head">
                  <b>{t.title}</b>
                  <div className="tch-badges">
                    <span className={`badge ${TASK_STATUS_CLASS[t.status]}`}>{TASK_STATUS_LABEL[t.status]}</span>
                    <span className={`badge ${t.priority === 'urgent' || t.priority === 'high' ? 'adm-badge-bad' : 'adm-badge-muted'}`}>
                      {TASK_PRIORITY_LABEL[t.priority]}
                    </span>
                    {t.overdue && <span className="badge adm-badge-warn">Мерзімі өткен</span>}
                  </div>
                </div>
                {t.description && <p>{t.description}</p>}
                <div className="tch-task-meta muted small">
                  <span><Icon name="clock" size={14} /> {t.due_at ? fmtDateTime(t.due_at) : 'мерзімсіз'}</span>
                  <span>Берген: {t.created_by_name || '—'}</span>
                  <span>Құрылған: {fmtDateTime(t.created_at)}</span>
                </div>
                {p.edit && (
                  <div className="tch-task-actions">
                    <select className="input tch-status-select" value={t.status}
                      onChange={(e) => void change(t.id, e.target.value as TeacherTaskStatus)}>
                      {Object.entries(TASK_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

/* ------------------------------- ACCOUNT ------------------------------- */

function AccountTab({ d, onAccount }: { d: TeacherDetail; onAccount: (a: AccountAction) => void }) {
  const p = d.permissions;
  return (
    <div className="tch-grid-2">
      <section className="card pad">
        <h3>Аккаунт мәліметтері</h3>
        <div className="tch-info-grid">
          <InfoRow label="Логин (телефон)">{prettyFromE164(d.phone)}</InfoRow>
          <InfoRow label="Рөлі">Мұғалім</InfoRow>
          <InfoRow label="Жұмыс мәртебесі">{EMPLOYMENT_LABEL[d.employment_status]}</InfoRow>
          <InfoRow label="Күйі">{d.is_blocked ? 'Бұғатталған' : 'Белсенді'}</InfoRow>
          <InfoRow label="Бұғаттау себебі">{d.block_reason}</InfoRow>
          <InfoRow label="Бұғаттау мерзімі">{fmtDate(d.blocked_until)}</InfoRow>
          <InfoRow label="Мұрағатталған">{fmtDate(d.archived_at)}</InfoRow>
          <InfoRow label="Тіркелген">{fmtDateTime(d.created_at)}</InfoRow>
          <InfoRow label="Соңғы кіру">{fmtDateTime(d.last_seen_at)}</InfoRow>
        </div>
      </section>

      <section className="card pad">
        <h3>Қауіпсіздік әрекеттері</h3>
        {!p.accounts ? <p className="muted small">Бұл әрекеттер үшін «Аккаунтты басқару» рұқсаты қажет.</p>
          : (
            <div className="tch-account-actions vertical">
              {d.employment_status === 'archived'
                ? <button className="btn btn-ghost" onClick={() => onAccount('restore')}><Icon name="history" size={16} /> Мұрағаттан қалпына келтіру</button>
                : <button className="btn btn-ghost" onClick={() => onAccount('archive')}><Icon name="trash" size={16} /> Мұрағаттау (қауіпсіз өшіру)</button>}
              {d.is_blocked
                ? <button className="btn btn-ghost" onClick={() => onAccount('unblock')}><Icon name="check" size={16} /> Бұғаттаудан шығару</button>
                : <button className="btn btn-ghost" onClick={() => onAccount('block')}><Icon name="lock" size={16} /> Уақытша бұғаттау</button>}
              <button className="btn btn-ghost" onClick={() => onAccount('reset_password')}><Icon name="key" size={16} /> Құпиясөзді қалпына келтіру</button>
            </div>
          )}
        <p className="muted small tch-hint">
          Барлық әрекеттер audit журналына жазылады. ADMIN рөлді өзгерте алмайды және DIRECTOR құқығын бере алмайды.
        </p>
      </section>
    </div>
  );
}

/* -------------------------------- AUDIT -------------------------------- */

function AuditTab({ d }: { d: TeacherDetail }) {
  if (d.audit.length === 0) return <Empty title="Жазба жоқ" text="Осы мұғалімге қатысты әрекеттер осы жерде көрінеді." />;
  return (
    <div className="card table-wrap">
      <table className="table">
        <thead><tr><th>Уақыт</th><th>Әрекет</th><th>Нысан</th><th>Орындаған</th></tr></thead>
        <tbody>
          {d.audit.map((a) => (
            <tr key={a.id}>
              <td className="muted small">{fmtDateTime(a.created_at)}</td>
              <td><b>{a.action}</b></td>
              <td>{a.entity}</td>
              <td>{a.actor || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------ EDIT MODAL ----------------------------- */

function EditModal({ d, onClose, onSaved }: { d: TeacherDetail; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [first, setFirst] = useState(d.first_name);
  const [last, setLast] = useState(d.last_name);
  const [email, setEmail] = useState(d.email);
  const [photo, setPhoto] = useState(d.photo_url);
  const [hired, setHired] = useState(inputDate(d.hired_at));
  const [birth, setBirth] = useState(inputDate(d.birth_date));
  const [qualification, setQualification] = useState(d.qualification);
  const [address, setAddress] = useState(d.address);
  const [notes, setNotes] = useState(d.notes);
  const [status, setStatus] = useState(d.employment_status);
  const [assignments, setAssignments] = useState<AssignmentDraft[]>(toDrafts(d.assignments));
  const catalog = useAsync(() => api.catalog(), []);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.teacher.saveProfile(d.id, {
        first_name: first.trim(), last_name: last.trim(), email: email.trim(),
        photo_url: photo || '', hired_at: hired || null, birth_date: birth || null,
        qualification, address, notes, employment_status: status,
        assignments: fromDrafts(assignments),
      });
      toast.show('Профиль жаңартылды', 'success');
      onSaved();
    } catch (err) { toast.show(friendlyError(err), 'error'); }
    finally { setBusy(false); }
  };

  return (
    <Modal title="Профильді өңдеу" onClose={onClose} wide>
      <form className="stack-lg" onSubmit={(e) => void save(e)}>
        <div className="tch-form-grid">
          <Field label="Тегі"><input className="input" value={last} onChange={(e) => setLast(e.target.value)} /></Field>
          <Field label="Аты"><input className="input" value={first} onChange={(e) => setFirst(e.target.value)} /></Field>
          <Field label="Email"><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          <Field label="Фото URL"><input className="input" value={photo ?? ''} onChange={(e) => setPhoto(e.target.value)} /></Field>
          <Field label="Жұмысқа қабылданған"><input className="input" type="date" value={hired} onChange={(e) => setHired(e.target.value)} /></Field>
          <Field label="Туған күні"><input className="input" type="date" value={birth} onChange={(e) => setBirth(e.target.value)} /></Field>
          <Field label="Жұмыс мәртебесі">
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value as TeacherDetail['employment_status'])}>
              {Object.entries(EMPLOYMENT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="Біліктілігі"><input className="input" value={qualification} onChange={(e) => setQualification(e.target.value)} /></Field>
          <Field label="Мекенжайы"><input className="input" value={address} onChange={(e) => setAddress(e.target.value)} /></Field>
        </div>
        <Field label="Ескертпе"><textarea className="input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
        <div>
          <h4>Пәндер мен сыныптар</h4>
          <AssignmentEditor value={assignments} subjects={catalog.data?.subjects ?? []}
            onChange={setAssignments} disabled={busy} />
        </div>
        <div className="tch-form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Бас тарту</button>
          <button type="submit" className="btn btn-gold" disabled={busy}>{busy ? 'Сақталуда…' : 'Сақтау'}</button>
        </div>
      </form>
    </Modal>
  );
}

/* --------------------------------- PAGE -------------------------------- */

export default function TeacherProfile() {
  const { id = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const toast = useToast();
  const data = useAsync(() => api.teacher.detail(id), [id]);
  useRealtime(
    ['profiles', 'teacher_profiles', 'teacher_assignments', 'timetable',
      'teacher_tasks', 'teacher_documents', 'teacher_attendance', 'teacher_work_logs', 'teacher_reports'],
    data.reload,
  );

  const rawTab = (params.get('tab') || 'profile') as Tab;
  const tab: Tab = TABS.some((t) => t.key === rawTab) ? rawTab : 'profile';
  const setTab = (t: Tab) => setParams({ tab: t }, { replace: true });

  const [editOpen, setEditOpen] = useState(false);
  const [acct, setAcct] = useState<AccountAction | null>(null);
  const [reason, setReason] = useState('');
  const [until, setUntil] = useState('');
  const [newPass, setNewPass] = useState('');
  const [resetDone, setResetDone] = useState('');
  const [busy, setBusy] = useState(false);

  const d = data.data;

  const openAccount = (a: AccountAction) => {
    setAcct(a); setReason(''); setUntil(''); setNewPass(''); setResetDone('');
  };

  const submitAccount = async (e: FormEvent) => {
    e.preventDefault();
    if (!acct) return;
    setBusy(true);
    try {
      await api.teacher.setAccount(d ? d.id : id, acct, {
        reason, until: until ? new Date(`${until}T23:59:59`).toISOString() : null, password: newPass,
      });
      if (acct === 'reset_password') {
        setResetDone(newPass);
        toast.show('Құпиясөз жаңартылды', 'success');
      } else {
        toast.show('Аккаунт күйі жаңартылды', 'success');
        setAcct(null);
      }
      data.reload();
    } catch (err) { toast.show(friendlyError(err), 'error'); }
    finally { setBusy(false); }
  };

  if (data.loading && !d) return <Spinner />;
  if (data.error) return <ErrorState message={friendlyError(data.error)} onRetry={data.reload} />;
  if (!d) return <Empty title="Мұғалім табылмады" />;

  const titleMap: Record<AccountAction, string> = {
    block: 'Аккаунтты уақытша бұғаттау',
    unblock: 'Бұғаттаудан шығару',
    archive: 'Мұғалімді мұрағаттау',
    restore: 'Мұрағаттан қалпына келтіру',
    reset_password: 'Құпиясөзді қалпына келтіру',
  };

  return (
    <div className="stack-lg tch-page">
      <div>
        <Link to="/admin/teachers" className="link-gold small"><Icon name="arrow" size={14} /> Тізімге қайту</Link>
      </div>

      <div className="card pad tch-profile-head">
        <TeacherAvatar t={d} size={80} />
        <div className="tch-profile-main">
          <h1>{teacherName(d)}</h1>
          <div className="tch-badges">
            <EmploymentBadge status={d.employment_status} />
            {d.is_blocked
              ? <span className="badge adm-badge-bad">Бұғатталған</span>
              : <span className="badge adm-badge-ok">Белсенді</span>}
            {d.assignments.length > 0 && <span className="badge adm-badge-muted">{d.assignments.length} пән</span>}
            <span className="badge adm-badge-review">{d.workload.lessons} сабақ/апта</span>
          </div>
          <p className="muted small">{prettyFromE164(d.phone)}{d.email ? ` · ${d.email}` : ''}</p>
        </div>
        {d.permissions.edit && (
          <button className="btn btn-gold" onClick={() => setEditOpen(true)}>
            <Icon name="edit" size={16} /> Профильді өңдеу
          </button>
        )}
      </div>

      <div className="tch-tabs" role="tablist" aria-label="Мұғалім бөлімдері">
        {TABS.map((t) => (
          <button key={t.key} type="button" role="tab" aria-selected={tab === t.key}
            className={`tch-tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            <Icon name={t.icon} size={16} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && <ProfileTab d={d} onEdit={() => setEditOpen(true)} onAccount={openAccount} />}
      {tab === 'subjects' && <SubjectsTab d={d} onEdit={() => setEditOpen(true)} />}
      {tab === 'work' && <WorkTab d={d} reload={data.reload} />}
      {tab === 'documents' && <DocsTab d={d} reload={data.reload} />}
      {tab === 'tasks' && <TasksTab d={d} reload={data.reload} />}
      {tab === 'account' && <AccountTab d={d} onAccount={openAccount} />}
      {tab === 'audit' && <AuditTab d={d} />}

      {editOpen && <EditModal d={d} onClose={() => setEditOpen(false)} onSaved={() => { setEditOpen(false); data.reload(); }} />}

      {acct && (
        <Modal title={titleMap[acct]} onClose={() => setAcct(null)}>
          {resetDone ? (
            <div className="stack-lg">
              <p>Жаңа құпиясөз сәтті орнатылды. Оны мұғалімге қауіпсіз жолмен жеткізіңіз — бұл ақпарат қайта көрсетілмейді.</p>
              <div className="tch-password-box"><code>{resetDone}</code></div>
              <button className="btn btn-gold" onClick={() => { void navigator.clipboard.writeText(resetDone); toast.show('Көшірілді', 'success'); }}>
                Көшіру
              </button>
              <button className="btn btn-ghost" onClick={() => setAcct(null)}>Жабу</button>
            </div>
          ) : (
            <form className="stack-lg" onSubmit={(e) => void submitAccount(e)}>
              {acct === 'block' && <p className="muted small">Мұғалім жүйеге кіре алмайды. Себебін көрсетіңіз (міндетті емес).</p>}
              {acct === 'archive' && <p className="muted small">Аккаунт бұғатталып, мұрағатқа жіберіледі. Деректер сақталады және кейін қалпына келтіруге болады.</p>}
              {acct === 'reset_password' && (
                <>
                  <Field label="Жаңа құпиясөз (кемінде 8 таңба)">
                    <input className="input" value={newPass} onChange={(e) => setNewPass(e.target.value)} minLength={8} required />
                  </Field>
                  <p className="muted small">Құпиясөз тек осы терезеде көрсетіледі. Оны мұғалімге қауіпсіз жолмен жеткізіңіз.</p>
                </>
              )}
              {(acct === 'block' || acct === 'archive') && (
                <>
                  <Field label="Себебі"><input className="input" value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
                  {acct === 'block' && (
                    <Field label="Мерзімі (міндетті емес)"><input className="input" type="date" value={until} onChange={(e) => setUntil(e.target.value)} /></Field>
                  )}
                </>
              )}
              <div className="tch-form-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setAcct(null)}>Бас тарту</button>
                <button type="submit" className="btn btn-gold" disabled={busy}>{busy ? 'Орындалуда…' : 'Растау'}</button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}
