import { useEffect, useMemo, useState } from 'react';
import { Empty, ErrorState, Field, Modal, Spinner, useAsync, useConfirm } from '../../components/ui';
import { Icon } from '../../components/Icons';
import { EmploymentBadge, TeacherAvatar } from '../../components/teacher/ui';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { friendlyError } from '../../lib/errors';
import { parseClasses, teacherName } from '../../lib/teacher';
import { useRealtime } from '../../lib/useRealtime';
import type {
  AcademicAnalytics, AcademicYear, ClassCatalogRow, ClassRoster, SubjectAdminRow,
  TeacherReportRow, TeacherWorkloadRow, WorkloadAssignment,
} from '../../types';

type Tab = 'subjects' | 'workload' | 'classes' | 'analytics' | 'reports';

const TABS: { id: Tab; label: string; icon: 'book' | 'users' | 'grid' | 'chart' | 'file' }[] = [
  { id: 'subjects', label: 'Пәндер', icon: 'book' },
  { id: 'workload', label: 'Жүктеме', icon: 'users' },
  { id: 'classes', label: 'Сыныптар', icon: 'grid' },
  { id: 'analytics', label: 'Аналитика', icon: 'chart' },
  { id: 'reports', label: 'Мұғалім есептері', icon: 'file' },
];

const TERM_LABEL: Record<string, string> = {
  year: 'Оқу жылы', '1': '1-тоқсан', '2': '2-тоқсан', '3': '3-тоқсан', '4': '4-тоқсан',
};

interface SubjectDraft { id?: string; title: string; description: string; sort_order: string }
interface WorkloadDraft { subject: string; classes: string; hours: string; year: string; term: string }

export default function SubjectsAdmin() {
  const toast = useToast();
  const confirm = useConfirm();
  const [tab, setTab] = useState<Tab>('subjects');
  const [q, setQ] = useState('');
  const [dq, setDq] = useState('');
  const [subjectDraft, setSubjectDraft] = useState<SubjectDraft | null>(null);
  const [wlTeacher, setWlTeacher] = useState<TeacherWorkloadRow | null>(null);
  const [wlDraft, setWlDraft] = useState<WorkloadDraft>({ subject: '', classes: '', hours: '0', year: '', term: 'year' });
  const [rosterClass, setRosterClass] = useState<string | null>(null);
  const [roster, setRoster] = useState<ClassRoster | null>(null);
  const [rosterSearch, setRosterSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [reportStatus, setReportStatus] = useState('');

  useEffect(() => {
    const id = setTimeout(() => setDq(q.trim()), 300);
    return () => clearTimeout(id);
  }, [q]);

  const perms = useAsync(() => api.teacher.permissions(), []);
  const subjects = useAsync(() => api.academics.subjects.list(dq, true), [dq]);
  const workload = useAsync(() => api.academics.workload.teachers(), []);
  const years = useAsync(() => api.academics.years.list(), []);
  const classes = useAsync(() => api.academics.classes.catalog(), []);
  const analytics = useAsync(() => api.academics.analytics(), []);
  const reports = useAsync(
    () => (perms.data && (perms.data.director || perms.data.view)
      ? api.reports.directorList(reportStatus)
      : Promise.resolve([])),
    [reportStatus, perms.data?.director, perms.data?.view],
  );

  const reloadAll = () => {
    subjects.reload(); workload.reload(); classes.reload(); analytics.reload(); years.reload();
  };
  useRealtime(
    ['subjects', 'teacher_assignments', 'class_members', 'academic_years', 'profiles', 'timetable'],
    reloadAll,
  );

  const canEdit = perms.data?.edit ?? false;
  const currentYear = years.data?.find((y) => y.is_current) ?? years.data?.[0] ?? null;

  const openSubject = (row?: SubjectAdminRow) => {
    setSubjectDraft(row
      ? { id: row.id, title: row.title, description: row.description, sort_order: String(row.sort_order) }
      : { title: '', description: '', sort_order: '' });
  };

  const saveSubject = async () => {
    if (!subjectDraft) return;
    const title = subjectDraft.title.trim();
    if (title.length < 1) { toast.show('Пән атауын енгізіңіз', 'error'); return; }
    setBusy(true);
    try {
      await api.academics.subjects.save({
        id: subjectDraft.id ?? null,
        title,
        description: subjectDraft.description,
        sort_order: subjectDraft.sort_order === '' ? null : Number(subjectDraft.sort_order),
      });
      toast.show(subjectDraft.id ? 'Пән өзгертілді' : 'Жаңа пән қосылды', 'success');
      setSubjectDraft(null);
      reloadAll();
    } catch (err) { toast.show(friendlyError(err), 'error'); }
    finally { setBusy(false); }
  };

  const toggleSubject = async (row: SubjectAdminRow) => {
    try {
      await api.academics.subjects.setActive(row.id, !row.is_active);
      toast.show(row.is_active ? 'Пән өшірілді (белсенді емес)' : 'Пән белсендірілді', 'success');
      reloadAll();
    } catch (err) { toast.show(friendlyError(err), 'error'); }
  };

  const deleteSubject = async (row: SubjectAdminRow) => {
    if (!confirm(`«${row.title}» пәнін өшіру керек пе? Пайдаланылып жатқан пән мұрағатқа жіберіледі.`)) return;
    try {
      const result = await api.academics.subjects.remove(row.id);
      toast.show(result === 'archived'
        ? 'Пәнде сабақ/баға тарихы бар — мұрағатқа жіберілді'
        : 'Пән өшірілді', 'success');
      reloadAll();
    } catch (err) { toast.show(friendlyError(err), 'error'); }
  };

  const openWorkload = (t: TeacherWorkloadRow) => {
    setWlTeacher(t);
    setWlDraft({
      subject: '', classes: t.classes.join(', '), hours: '0',
      year: currentYear?.id ?? '', term: 'year',
    });
  };

  const addAssignment = async () => {
    if (!wlTeacher) return;
    if (!wlDraft.subject) { toast.show('Пәнді таңдаңыз', 'error'); return; }
    const hours = Math.max(0, Math.min(40, Number(wlDraft.hours) || 0));
    const nextTotal = wlTeacher.total_hours + hours;
    if (nextTotal > 40) { toast.show('Апталық жүктеме 40 сағаттан аспауы керек', 'error'); return; }
    setBusy(true);
    try {
      await api.academics.workload.saveAssignment({
        teacher: wlTeacher.id,
        subject: wlDraft.subject,
        classes: parseClasses(wlDraft.classes),
        hours,
        year: wlDraft.year || null,
        term: wlDraft.term,
      });
      toast.show('Пән мен сыныптар бекітілді', 'success');
      const rows = await api.academics.workload.teachers();
      setWlTeacher(rows.find((r) => r.id === wlTeacher.id) ?? null);
      reloadAll();
    } catch (err) { toast.show(friendlyError(err), 'error'); }
    finally { setBusy(false); }
  };

  const removeAssignment = async (a: WorkloadAssignment) => {
    if (!wlTeacher || !confirm(`«${a.subject_title}» пәнін мұғалімнен алып тастау керек пе?`)) return;
    try {
      await api.academics.workload.removeAssignment(a.id);
      const rows = await api.academics.workload.teachers();
      setWlTeacher(rows.find((r) => r.id === wlTeacher.id) ?? null);
      toast.show('Пән алып тасталды', 'success');
      reloadAll();
    } catch (err) { toast.show(friendlyError(err), 'error'); }
  };

  const removeClass = async (a: WorkloadAssignment, klass: string) => {
    try {
      await api.academics.workload.removeClass(a.id, klass);
      const rows = await api.academics.workload.teachers();
      setWlTeacher(rows.find((r) => r.id === wlTeacher?.id) ?? null);
      toast.show(`${klass} сыныбы алып тасталды`, 'success');
      reloadAll();
    } catch (err) { toast.show(friendlyError(err), 'error'); }
  };

  const openRoster = async (klass: string) => {
    setRosterClass(klass);
    setRoster(null);
    setRosterSearch('');
    try {
      const data = await api.academics.classes.roster(klass, currentYear?.id ?? null);
      setRoster(data);
      setSelected(new Set(data.members.map((m) => m.student_id)));
    } catch (err) { toast.show(friendlyError(err), 'error'); }
  };

  const saveRoster = async () => {
    if (!rosterClass) return;
    setBusy(true);
    try {
      await api.academics.classes.setRoster(rosterClass, Array.from(selected), roster?.academic_year_id ?? null);
      toast.show('Сынып құрамы сақталды', 'success');
      setRosterClass(null);
      reloadAll();
    } catch (err) { toast.show(friendlyError(err), 'error'); }
    finally { setBusy(false); }
  };

  const filteredAvailable = useMemo(() => {
    const list = roster?.available ?? [];
    const needle = rosterSearch.trim().toLowerCase();
    if (!needle) return list;
    return list.filter((s) =>
      `${s.last_name} ${s.first_name} ${s.phone}`.toLowerCase().includes(needle));
  }, [roster, rosterSearch]);

  const toggleStudent = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const reviewReport = async (id: string, status: 'approved' | 'revision') => {
    try {
      await api.teacher.reportReview(id, status);
      toast.show(status === 'approved' ? 'Есеп бекітілді' : 'Қайта қарауға жіберілді', 'success');
      reports.reload();
    } catch (err) { toast.show(friendlyError(err), 'error'); }
  };

  return (
    <div className="stack-lg tch-page tch-subjects-admin">
      <div className="section-row">
        <div>
          <span className="tch-eyebrow">ADMIN · Оқу үдерісі</span>
          <h1>Пәндер мен мұғалімдер</h1>
          <p className="muted small">
            Пәндер каталогы, мұғалімдердің пән/сынып жүктемесі, сынып құрамы және оқу аналитикасы.
          </p>
        </div>
        <div className="tch-head-actions">
          {currentYear && <span className="badge adm-badge-muted">{currentYear.name} оқу жылы</span>}
          {tab === 'subjects' && canEdit && (
            <button className="btn btn-gold" onClick={() => openSubject()}>
              <Icon name="plus" size={17} /> Жаңа пән
            </button>
          )}
        </div>
      </div>

      <div className="tch-tabs" role="tablist" aria-label="Пәндер мен мұғалімдер бөлімдері">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id}
            className={`tch-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}>
            <Icon name={t.icon} size={16} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'subjects' && (
        <div className="stack-lg">
          <div className="card pad tch-filters">
            <div className="tch-filter-grid">
              <label className="field tch-search">
                <span className="field-label">Пән іздеу</span>
                <span className="tch-input-icon">
                  <Icon name="search" size={17} />
                  <input className="input" value={q} onChange={(e) => setQ(e.target.value)}
                    placeholder="Пән атауы" aria-label="Пән іздеу" />
                </span>
              </label>
              <p className="muted small tch-filter-note">
                Белсенді емес пәндер тізімде көрсетіледі, бірақ оқушыларға жаңа тапсырма берілмейді.
              </p>
            </div>
          </div>

          {subjects.loading && !subjects.data ? <Spinner />
            : subjects.error ? <ErrorState message={friendlyError(subjects.error)} onRetry={subjects.reload} />
            : (subjects.data ?? []).length === 0 ? (
              <Empty title="Пән табылмады" text="Жаңа пән қосыңыз."
                action={canEdit ? <button className="btn btn-gold" onClick={() => openSubject()}>Пән қосу</button> : undefined} />
            ) : (
              <div className="card table-wrap">
                <table className="table tch-table">
                  <thead>
                    <tr>
                      <th>Пән</th><th>Мұғалім</th><th>Сынып</th><th>Сағат/апта</th>
                      <th>Қолданыс</th><th>Күйі</th><th aria-label="Әрекет" />
                    </tr>
                  </thead>
                  <tbody>
                    {(subjects.data ?? []).map((s) => (
                      <tr key={s.id} className={s.is_active ? '' : 'tch-row-muted'}>
                        <td>
                          <b>{s.title}</b>
                          {s.description && <span className="muted small tch-email">{s.description}</span>}
                        </td>
                        <td>{s.teachers}</td>
                        <td>{s.classes}</td>
                        <td>{s.weekly_hours}</td>
                        <td className="muted small">
                          {s.lessons} сабақ · {s.tests} тест · {s.timetable} кесте
                        </td>
                        <td>
                          {s.archived_at
                            ? <span className="badge adm-badge-muted">Мұрағатта</span>
                            : s.is_active
                              ? <span className="badge adm-badge-ok">Белсенді</span>
                              : <span className="badge adm-badge-warn">Белсенді емес</span>}
                        </td>
                        <td>
                          <div className="tch-row-actions">
                            {canEdit && (
                              <>
                                <button className="icon-btn" aria-label="Өңдеу" title="Өңдеу" onClick={() => openSubject(s)}>
                                  <Icon name="edit" size={16} />
                                </button>
                                <button className="icon-btn" aria-label={s.is_active ? 'Өшіру' : 'Белсендіру'}
                                  title={s.is_active ? 'Белсенді емес ету' : 'Белсендіру'} onClick={() => void toggleSubject(s)}>
                                  <Icon name={s.is_active ? 'eyeOff' : 'eye'} size={16} />
                                </button>
                                <button className="icon-btn tch-danger" aria-label="Жою" title="Жою" onClick={() => void deleteSubject(s)}>
                                  <Icon name="trash" size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </div>
      )}

      {tab === 'workload' && (
        <div className="stack-lg">
          {workload.loading && !workload.data ? <Spinner />
            : workload.error ? <ErrorState message={friendlyError(workload.error)} onRetry={workload.reload} />
            : (workload.data ?? []).length === 0 ? <Empty title="Мұғалім жоқ" text="Алдымен мұғалім тіркеңіз." />
            : (
              <div className="tch-load-grid">
                {(workload.data ?? []).map((t) => (
                  <div className="card pad tch-load-card" key={t.id}>
                    <div className="tch-load-head">
                      <TeacherAvatar t={t} size={44} />
                      <div>
                        <b>{teacherName(t)}</b>
                        <span className="muted small">{t.subjects_count} пән · {t.classes.length} сынып</span>
                      </div>
                      <EmploymentBadge status={t.employment_status} />
                    </div>
                    <div className="tch-load-bar">
                      <span style={{ width: `${Math.min(100, (t.total_hours / 40) * 100)}%` }} />
                    </div>
                    <div className="tch-load-meta">
                      <b>{t.total_hours} / 40 сағ</b>
                      <span className="muted small">{t.assignments.reduce((n, a) => n + a.students, 0)} оқушы</span>
                    </div>
                    <div className="tch-load-subjects">
                      {t.assignments.length === 0 && <span className="muted small">Пән бекітілмеген</span>}
                      {t.assignments.slice(0, 4).map((a) => (
                        <span className="tch-chip" key={a.id}>{a.subject_title}</span>
                      ))}
                      {t.assignments.length > 4 && <span className="tch-chip">+{t.assignments.length - 4}</span>}
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => openWorkload(t)}>
                      <Icon name="edit" size={15} /> Жүктемені басқару
                    </button>
                  </div>
                ))}
              </div>
            )}
        </div>
      )}

      {tab === 'classes' && (
        <div className="stack-lg">
          {classes.loading && !classes.data ? <Spinner />
            : classes.error ? <ErrorState message={friendlyError(classes.error)} onRetry={classes.reload} />
            : (classes.data ?? []).length === 0 ? (
              <Empty title="Сынып деректері жоқ"
                text="Сыныптар мұғалім жүктемесі, кесте немесе сынып құрамы қосылғанда пайда болады." />
            ) : (
              <div className="tch-class-grid">
                {(classes.data ?? []).map((c) => (
                  <div className="card pad tch-class-card" key={c.class_name}>
                    <div className="tch-class-head">
                      <span className="tch-class-name">{c.class_name}</span>
                      {c.teachers === 0 && <span className="badge adm-badge-bad">Мұғалім жоқ</span>}
                    </div>
                    <div className="tch-class-stats">
                      <span><b>{c.students}</b> оқушы</span>
                      <span><b>{c.teachers}</b> мұғалім</span>
                      <span><b>{c.subjects}</b> пән</span>
                      <span><b>{c.lessons}</b> сабақ</span>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => void openRoster(c.class_name)}>
                      <Icon name="users" size={15} /> Сынып құрамы
                    </button>
                  </div>
                ))}
              </div>
            )}
        </div>
      )}

      {tab === 'analytics' && (
        <Analytics analytics={analytics.data} loading={analytics.loading} error={analytics.error}
          onRetry={analytics.reload} />
      )}

      {tab === 'reports' && (
        <div className="stack-lg">
          <div className="tch-tabs tch-tabs-inline" role="tablist" aria-label="Есеп мәртебесі">
            {[['', 'Барлығы'], ['submitted', 'Тексеруде'], ['approved', 'Бекітілген'], ['revision', 'Қайта қарау']]
              .map(([k, label]) => (
                <button key={k || 'all'} type="button" role="tab" aria-selected={reportStatus === k}
                  className={`tch-tab ${reportStatus === k ? 'active' : ''}`}
                  onClick={() => setReportStatus(k)}>{label}</button>
              ))}
          </div>
          {!perms.data || (!perms.data.director && !perms.data.view) ? (
            <Empty title="Рұқсат жоқ" text="Мұғалім есептерін көру үшін директор немесе көру рұқсаты қажет." />
          ) : reports.loading && !reports.data ? <Spinner />
            : reports.error ? <ErrorState message={friendlyError(reports.error)} onRetry={reports.reload} />
            : (reports.data?.length ?? 0) === 0 ? <Empty title="Есеп жоқ" />
            : (
              <div className="tch-report-list">
                {reports.data!.map((r) => (
                  <ReportRow key={r.id} report={r}
                    canReview={!!perms.data?.documents && r.status === 'submitted'}
                    onReview={reviewReport} />
                ))}
              </div>
            )}
        </div>
      )}

      {subjectDraft && (
        <Modal title={subjectDraft.id ? 'Пәнді өңдеу' : 'Жаңа пән'} onClose={() => setSubjectDraft(null)}>
          <div className="stack">
            <Field label="Пән атауы">
              <input className="input" value={subjectDraft.title} autoFocus
                onChange={(e) => setSubjectDraft({ ...subjectDraft, title: e.target.value })}
                placeholder="Мысалы: Математика" />
            </Field>
            <Field label="Сипаттама (міндетті емес)">
              <textarea className="input" rows={3} value={subjectDraft.description}
                onChange={(e) => setSubjectDraft({ ...subjectDraft, description: e.target.value })} />
            </Field>
            <Field label="Реттік нөмір (міндетті емес)">
              <input className="input" type="number" value={subjectDraft.sort_order}
                onChange={(e) => setSubjectDraft({ ...subjectDraft, sort_order: e.target.value })} />
            </Field>
            <div className="tch-modal-actions">
              <button className="btn btn-ghost" onClick={() => setSubjectDraft(null)}>Болдырмау</button>
              <button className="btn btn-gold" disabled={busy} onClick={() => void saveSubject()}>
                <Icon name="check" size={16} /> Сақтау
              </button>
            </div>
          </div>
        </Modal>
      )}

      {wlTeacher && (
        <Modal title={`${teacherName(wlTeacher)} — жүктеме`} onClose={() => setWlTeacher(null)} wide>
          <div className="stack">
            <div className="tch-load-summary">
              <span className="badge adm-badge-muted">{wlTeacher.total_hours} / 40 сағат</span>
              <span className="muted small">{wlTeacher.subjects_count} пән · {wlTeacher.classes.length} сынып</span>
            </div>

            <div className="tch-assign-list">
              {wlTeacher.assignments.length === 0 && <p className="muted small">Пән бекітілмеген.</p>}
              {wlTeacher.assignments.map((a) => (
                <div className="tch-assign-item" key={a.id}>
                  <div>
                    <b>{a.subject_title}</b>
                    <span className="muted small">
                      {a.academic_year || '—'} · {TERM_LABEL[a.term] ?? a.term} · {a.weekly_hours} сағ/апта · {a.students} оқушы
                    </span>
                    <div className="tch-chips">
                      {a.classes.length === 0 && <span className="muted small">Сынып жоқ</span>}
                      {a.classes.map((c) => (
                        <span className="tch-chip" key={c}>
                          {c}
                          {canEdit && (
                            <button type="button" aria-label={`${c} сыныбын алу`}
                              onClick={() => void removeClass(a, c)}>
                              <Icon name="close" size={12} />
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                  {canEdit && (
                    <button className="icon-btn tch-danger" aria-label="Пәнді алу"
                      onClick={() => void removeAssignment(a)}>
                      <Icon name="trash" size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {canEdit && (
              <div className="tch-assign-new">
                <h4>Пән/сынып бекіту</h4>
                <div className="tch-assign-form">
                  <Field label="Пән">
                    <select className="input" value={wlDraft.subject}
                      onChange={(e) => setWlDraft({ ...wlDraft, subject: e.target.value })}>
                      <option value="">— таңдау —</option>
                      {(subjects.data ?? []).filter((s) => s.is_active).map((s) => (
                        <option key={s.id} value={s.id}>{s.title}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Сыныптар" hint="Үтір арқылы: 5А, 5Б, 6А">
                    <input className="input" value={wlDraft.classes}
                      onChange={(e) => setWlDraft({ ...wlDraft, classes: e.target.value })} />
                  </Field>
                  <Field label="Апталық сағат">
                    <input className="input" type="number" min={0} max={40} value={wlDraft.hours}
                      onChange={(e) => setWlDraft({ ...wlDraft, hours: e.target.value })} />
                  </Field>
                  <Field label="Оқу жылы">
                    <select className="input" value={wlDraft.year}
                      onChange={(e) => setWlDraft({ ...wlDraft, year: e.target.value })}>
                      {(years.data ?? []).map((y: AcademicYear) => (
                        <option key={y.id} value={y.id}>{y.name}{y.is_current ? ' (ағымдағы)' : ''}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Мерзім">
                    <select className="input" value={wlDraft.term}
                      onChange={(e) => setWlDraft({ ...wlDraft, term: e.target.value })}>
                      {Object.entries(TERM_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </Field>
                  <div className="tch-assign-add">
                    <button className="btn btn-gold btn-sm" disabled={busy} onClick={() => void addAssignment()}>
                      <Icon name="plus" size={15} /> Бекіту
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {rosterClass && (
        <Modal title={`${rosterClass} сынып құрамы`} onClose={() => setRosterClass(null)} wide>
          {!roster ? <Spinner />
            : (
              <div className="stack">
                <div className="tch-roster-head">
                  <span className="badge adm-badge-ok">{selected.size} оқушы таңдалды</span>
                  <input className="input" placeholder="Оқушы іздеу" value={rosterSearch}
                    onChange={(e) => setRosterSearch(e.target.value)} />
                </div>
                {roster.available.length === 0 ? (
                  <p className="muted small">Барлық оқушылар тізімі тек әкімші үшін қолжетімді.</p>
                ) : (
                  <div className="tch-roster-list">
                    {filteredAvailable.map((s) => (
                      <label className="tch-roster-row" key={s.student_id}>
                        <input type="checkbox" checked={selected.has(s.student_id)}
                          onChange={() => toggleStudent(s.student_id)} />
                        <span><b>{s.last_name} {s.first_name}</b>
                          <span className="muted small">{s.phone}</span>
                        </span>
                      </label>
                    ))}
                    {filteredAvailable.length === 0 && <p className="muted small">Оқушы табылмады.</p>}
                  </div>
                )}
                <div className="tch-modal-actions">
                  <button className="btn btn-ghost" onClick={() => setRosterClass(null)}>Болдырмау</button>
                  <button className="btn btn-gold" disabled={busy || !canEdit} onClick={() => void saveRoster()}>
                    <Icon name="check" size={16} /> Сақтау
                  </button>
                </div>
              </div>
            )}
        </Modal>
      )}
    </div>
  );
}

const REPORT_STATUS: Record<string, { label: string; cls: string }> = {
  submitted: { label: 'Тексеруде', cls: 'adm-badge-warn' },
  approved: { label: 'Бекітілді', cls: 'adm-badge-ok' },
  revision: { label: 'Қайта қарау', cls: 'adm-badge-bad' },
};

function ReportRow({ report, canReview, onReview }: {
  report: TeacherReportRow; canReview: boolean;
  onReview: (id: string, status: 'approved' | 'revision') => void;
}) {
  const st = REPORT_STATUS[report.status] ?? { label: report.status, cls: 'adm-badge-muted' };
  const m = report.metrics ?? {};
  const att = m.attendance ?? {};
  return (
    <div className="card pad tch-report-card">
      <div className="tch-report-head">
        <div>
          <b>{report.teacher_name}</b>
          <span className="muted small">{report.period_start} — {report.period_end} · {report.title}</span>
        </div>
        <span className={`badge ${st.cls}`}>{st.label}</span>
      </div>
      <div className="tch-report-metrics">
        <span><b>{m.lessons ?? 0}</b> сабақ</span>
        <span><b>{m.assignments ?? 0}</b> тапсырма</span>
        <span><b>{m.checked ?? 0}</b> тексерілді</span>
        <span><b>{m.students ?? 0}</b> оқушы</span>
        <span><b>{m.avg_score ?? 0}</b> орташа</span>
      </div>
      <div className="tch-report-att">
        <span className="badge adm-badge-ok">Келді: {att.present ?? 0}</span>
        <span className="badge adm-badge-warn">Кешікті: {att.late ?? 0}</span>
        <span className="badge adm-badge-muted">Дәлелді: {att.excused ?? 0}</span>
        <span className="badge adm-badge-bad">Келмеді: {att.absent ?? 0}</span>
      </div>
      {canReview && (
        <div className="tch-row-actions">
          <button className="btn btn-gold btn-sm" onClick={() => onReview(report.id, 'approved')}>
            <Icon name="check" size={15} /> Бекіту
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => onReview(report.id, 'revision')}>
            <Icon name="history" size={15} /> Қайта қарау
          </button>
        </div>
      )}
    </div>
  );
}

function Analytics({ analytics, loading, error, onRetry }: {
  analytics?: AcademicAnalytics | null; loading: boolean; error: unknown; onRetry: () => void;
}) {
  if (loading && !analytics) return <Spinner />;
  if (error) return <ErrorState message={friendlyError(error)} onRetry={onRetry} />;
  if (!analytics) return <Empty title="Аналитика жоқ" />;

  const cards = [
    { label: 'Пәндер', value: analytics.subjects_total, sub: `${analytics.subjects_active} белсенді` },
    { label: 'Мұғалімдер', value: analytics.teachers_total, sub: `орташа ${analytics.avg_weekly_hours} сағ/апта` },
    { label: 'Бекітілмеген пән', value: analytics.subjects_unassigned.length, sub: 'мұғалім жоқ' },
    { label: 'Мұғалімі жоқ сынып', value: analytics.classes_without_teacher.length, sub: 'назар аударыңыз' },
    { label: 'Сабақ (30 күн)', value: analytics.lessons_30d, sub: 'өткізілген' },
  ];

  return (
    <div className="stack-lg">
      <div className="tch-mini-stats tch-mini-stats-wide">
        {cards.map((c) => (
          <div className="tch-mini-stat" key={c.label}>
            <b>{c.value}</b><span>{c.label}</span><small>{c.sub}</small>
          </div>
        ))}
      </div>

      <div className="tch-grid-2">
        <section className="card pad">
          <div className="section-row"><h3>Бекітілмеген пәндер</h3>
            <span className="badge adm-badge-warn">{analytics.subjects_unassigned.length}</span></div>
          {analytics.subjects_unassigned.length === 0
            ? <p className="muted small">Барлық белсенді пәнге мұғалім бекітілген.</p>
            : <div className="tch-chips">{analytics.subjects_unassigned.map((s) => (
              <span className="tch-chip" key={s.id}>{s.title}</span>
            ))}</div>}
        </section>

        <section className="card pad">
          <div className="section-row"><h3>Мұғалімі жоқ сыныптар</h3>
            <span className="badge adm-badge-bad">{analytics.classes_without_teacher.length}</span></div>
          {analytics.classes_without_teacher.length === 0
            ? <p className="muted small">Барлық сыныпқа мұғалім бекітілген.</p>
            : <div className="tch-chips">{analytics.classes_without_teacher.map((c) => (
              <span className="tch-chip" key={c.class_name}>{c.class_name}</span>
            ))}</div>}
        </section>
      </div>

      <div className="card table-wrap">
        <table className="table tch-table">
          <thead>
            <tr><th>Пән</th><th>Мұғалім</th><th>Сынып</th><th>Сағат/апта</th><th>Кесте</th><th>30 күн</th><th>Күйі</th></tr>
          </thead>
          <tbody>
            {analytics.subject_stats.map((s) => (
              <tr key={s.id}>
                <td><b>{s.title}</b></td>
                <td>{s.teachers}</td>
                <td>{s.classes}</td>
                <td>{s.weekly_hours}</td>
                <td>{s.lessons}</td>
                <td>{s.conducted_30d}</td>
                <td>{s.is_active
                  ? <span className="badge adm-badge-ok">Белсенді</span>
                  : <span className="badge adm-badge-muted">Мұрағатта</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
