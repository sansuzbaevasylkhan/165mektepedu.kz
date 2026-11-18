import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ErrorState, Modal, Spinner, useAsync } from '../components/ui';
import { PhoneInput } from '../components/PhoneInput';
import { Icon } from '../components/Icons';
import { StudentSnapshot } from '../components/cabinet/StudentSnapshot';
import { api } from '../lib/api';
import { friendlyError } from '../lib/errors';
import { useRealtime } from '../lib/useRealtime';
import { isValidPhone, prettyFromE164, toE164 } from '../lib/phone';
import { useSeo } from '../lib/seo';
import { useT } from '../i18n';
import type { LinkRow, ParentChildSummary, Profile, SnapshotTeacher, StudentDashboard } from '../types';

function Avatar({ path, first, last, size = 64 }: {
  path?: string | null; first: string; last: string; size?: number;
}) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    if (!path) { setUrl(null); return; }
    api.profile.signedUrl(path)
      .then((u) => alive && setUrl(u))
      .catch(() => alive && setUrl(null));
    return () => { alive = false; };
  }, [path]);
  return url
    ? <img className="cab-avatar" src={url} alt="" style={{ width: size, height: size }} />
    : (
      <span className="avatar big" style={{ width: size, height: size, fontSize: size * 0.34 }}>
        {first.charAt(0)}{last.charAt(0)}
      </span>
    );
}

function DashboardHeader({ profile, snapshot, showStudentContext = false }: {
  profile: Profile; snapshot?: StudentDashboard | null; showStudentContext?: boolean;
}) {
  const t = useT();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [path, setPath] = useState<string | null>(profile.avatar_path ?? null);
  useEffect(() => { setPath(snapshot?.profile.avatar_path ?? profile.avatar_path ?? null); }, [snapshot?.profile.avatar_path, profile.avatar_path]);

  const upload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.show('Тек сурет файлын таңдаңыз', 'error'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.show('Файл өлшемі 5 МБ-тан аспауы керек', 'error'); return; }
    setBusy(true);
    try {
      const p = await api.profile.uploadAvatar(file);
      setPath(p);
      toast.show('Аватар жаңартылды', 'success');
    } catch (err) { toast.show(friendlyError(err), 'error'); }
    finally { setBusy(false); }
  };

  return (
    <div className="card pad cab-header">
      <div className="cab-header-main">
        <Avatar path={path} first={profile.first_name} last={profile.last_name} />
        <div>
          <h2>{profile.last_name} {profile.first_name}</h2>
          <p className="muted small">
            {t(`role.${profile.role}`)}
            {showStudentContext && snapshot?.class_name ? ` · ${snapshot.class_name} сынып` : ''}
            {showStudentContext && snapshot?.academic_year ? ` · ${snapshot.academic_year}` : ''}
          </p>
          <p className="small">{t('auth.phone')}: <b>{prettyFromE164(profile.phone)}</b></p>
        </div>
      </div>
      <div className="cab-header-actions">
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => void upload(e)} />
        <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => fileRef.current?.click()}>
          <Icon name="user" size={15} /> {busy ? 'Жүктелуде…' : 'Аватар өзгерту'}
        </button>
      </div>
    </div>
  );
}

function ParentLinkRequests({ links, onChanged }: { links: LinkRow[]; onChanged: () => void }) {
  const t = useT();
  const toast = useToast();
  const respond = async (l: LinkRow, ok: boolean) => {
    try { await api.respondLink(l.link_id, ok); onChanged(); }
    catch (e) { toast.show(friendlyError(e), 'error'); }
  };
  const remove = async (l: LinkRow) => {
    try { await api.removeLink(l.link_id); onChanged(); }
    catch (e) { toast.show(friendlyError(e), 'error'); }
  };
  return (
    <div className="lines">
      {links.map((l) => (
        <div key={l.link_id} className="line">
          <div><b>{l.last_name} {l.first_name}</b><span className="muted small"> · {prettyFromE164(l.phone)}</span></div>
          <div className="row">
            {l.status === 'pending' ? (
              <>
                <button className="btn btn-gold btn-sm" onClick={() => void respond(l, true)}>{t('cabinet.approve')}</button>
                <button className="btn btn-ghost btn-sm" onClick={() => void respond(l, false)}>{t('cabinet.reject')}</button>
              </>
            ) : (
              <>
                <span className={`badge ${l.status === 'approved' ? 'badge-done' : 'badge-locked'}`}>
                  {l.status === 'approved' ? t('cabinet.approved') : t('cabinet.rejected')}
                </span>
                <button className="btn btn-ghost btn-sm" onClick={() => void remove(l)}>{t('common.delete')}</button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function StudentCabinet({ profile }: { profile: Profile }) {
  const t = useT();
  const dashboard = useAsync(() => api.student.dashboard(), []);
  const links = useAsync(() => api.myLinks(), []);
  useRealtime(
    ['journal_entries', 'lesson_attendance', 'assignment_submissions', 'class_tests', 'student_achievements', 'certificates', 'profiles'],
    () => { dashboard.reload(); },
  );
  useRealtime(['parent_student_links'], () => { links.reload(); });

  return (
    <>
      <DashboardHeader profile={profile} snapshot={dashboard.data} showStudentContext />
      {dashboard.loading && !dashboard.data ? <Spinner />
        : dashboard.error || !dashboard.data ? <ErrorState message={friendlyError(dashboard.error)} onRetry={dashboard.reload} />
        : <StudentSnapshot data={dashboard.data} mode="student" />}

      <div className="card pad">
        <h3>{t('cabinet.parentRequests')}</h3>
        {links.loading ? <Spinner />
          : !links.data?.length ? <p className="muted">Ата-ана сұранысы жоқ</p>
          : <ParentLinkRequests links={links.data} onChanged={links.reload} />}
      </div>
    </>
  );
}

function MessageTeacherModal({ teacher, student, onClose }: {
  teacher: SnapshotTeacher; student: { id: string; name: string }; onClose: () => void;
}) {
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [important, setImportant] = useState(false);
  const [busy, setBusy] = useState(false);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) { toast.show('Тақырып пен мәтінді толтырыңыз', 'error'); return; }
    setBusy(true);
    try {
      await api.parent.messageTeacher({ teacher: teacher.teacher_id, student: student.id, title, body, important });
      toast.show('Хабарлама жіберілді', 'success');
      onClose();
    } catch (err) { toast.show(friendlyError(err), 'error'); }
    finally { setBusy(false); }
  };

  return (
    <Modal title={`${teacher.teacher_name} — хабарлама`} onClose={onClose}>
      <form className="form" onSubmit={(e) => void send(e)}>
        <p className="muted small">{student.name} бойынша · {teacher.subject_title}</p>
        <label className="field">
          <span className="field-label">Тақырып</span>
          <input className="input" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className="field">
          <span className="field-label">Мәтін</span>
          <textarea className="input" rows={5} value={body} maxLength={4000} onChange={(e) => setBody(e.target.value)} />
        </label>
        <label className="tch-check">
          <input type="checkbox" checked={important} onChange={(e) => setImportant(e.target.checked)} />
          <span>Маңызды деп белгілеу</span>
        </label>
        <div className="tch-modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Болдырмау</button>
          <button type="submit" className="btn btn-gold" disabled={busy}>{busy ? 'Жіберілуде…' : 'Жіберу'}</button>
        </div>
      </form>
    </Modal>
  );
}

function ChildCard({ c, active, onSelect }: { c: ParentChildSummary; active: boolean; onSelect: () => void }) {
  return (
    <button type="button" className={`cab-child ${active ? 'active' : ''}`} onClick={onSelect}>
      <Avatar path={c.avatar_path} first={c.first_name} last={c.last_name} size={44} />
      <span className="cab-child-main">
        <b>{c.last_name} {c.first_name}</b>
        <span className="muted small">{c.class_name ?? 'Сынып тағайындалмаған'}</span>
      </span>
      <span className="cab-child-stats">
        <span><b>{c.gpa.toFixed(2)}</b> GPA</span>
        <span><b>{c.attendance_percent.toFixed(0)}%</b> қатысым</span>
      </span>
    </button>
  );
}

function ParentCabinet({ profile }: { profile: Profile }) {
  const t = useT();
  const toast = useToast();
  const children = useAsync(() => api.parent.children(), []);
  const links = useAsync(() => api.myLinks(), []);
  const [selected, setSelected] = useState<string | null>(null);
  const [msg, setMsg] = useState<SnapshotTeacher | null>(null);
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!selected && children.data?.length) setSelected(children.data[0].student_id);
  }, [children.data, selected]);

  const child = useAsync(
    () => (selected ? api.parent.childDashboard(selected) : Promise.resolve(null)),
    [selected],
  );
  useRealtime(
    ['journal_entries', 'lesson_attendance', 'assignment_submissions', 'class_tests', 'student_achievements', 'certificates'],
    () => { child.reload(); },
  );
  useRealtime(['parent_student_links'], () => { links.reload(); children.reload(); });

  const sendRequest = async (e: FormEvent) => {
    e.preventDefault();
    if (!isValidPhone(phone)) { toast.show(t('auth.phoneInvalid'), 'error'); return; }
    setBusy(true);
    try {
      await api.requestLink(toE164(phone));
      toast.show(t('cabinet.requestSent'), 'success');
      setPhone('');
      links.reload();
    } catch (err) { toast.show(friendlyError(err), 'error'); }
    finally { setBusy(false); }
  };

  const remove = async (l: LinkRow) => {
    try {
      await api.removeLink(l.link_id);
      if (selected === l.user_id) setSelected(null);
      links.reload(); children.reload();
    } catch (e) { toast.show(friendlyError(e), 'error'); }
  };

  const kids = children.data ?? [];
  const pending = (links.data ?? []).filter((l) => l.status !== 'approved');
  const current = kids.find((k) => k.student_id === selected);
  const childName = current ? `${current.last_name} ${current.first_name}` : '';

  return (
    <>
      <DashboardHeader profile={profile} />

      <Link to="/cabinet/admission" className="adm-quick-card">
        <Icon name="cap" size={22} />
        <b>Оқушыны мектепке қабылдау</b>
        <span className="muted small">Өтініш беру, құжаттарды жүктеу және мәртебелерді бақылау</span>
      </Link>

      <section className="card pad stack">
        <div className="section-row">
          <h3>{t('cabinet.children')}</h3>
          <span className="badge adm-badge-muted">{kids.length}</span>
        </div>
        {children.loading && !children.data ? <Spinner />
          : kids.length === 0 ? <p className="muted">{t('cabinet.noChildren')}</p>
          : <div className="cab-child-list">
              {kids.map((k) => (
                <ChildCard key={k.student_id} c={k} active={k.student_id === selected} onSelect={() => setSelected(k.student_id)} />
              ))}
            </div>}

        {pending.length > 0 && (
          <div className="stack">
            <h4 className="small-heading">Басқа сұраныстар</h4>
            <div className="lines">
              {pending.map((l) => (
                <div key={l.link_id} className="line">
                  <div><b>{l.last_name} {l.first_name}</b><span className="muted small"> · {prettyFromE164(l.phone)}</span></div>
                  <div className="row">
                    <span className={`badge ${l.status === 'pending' ? 'badge-open' : 'badge-locked'}`}>
                      {l.status === 'pending' ? t('cabinet.pending') : t('cabinet.rejected')}
                    </span>
                    <button className="btn btn-ghost btn-sm" onClick={() => void remove(l)}>{t('common.delete')}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={(e) => void sendRequest(e)} className="form" noValidate>
          <h4 className="small-heading">{t('cabinet.addChild')}</h4>
          <p className="muted small">{t('cabinet.addChildHint')}</p>
          <div className="form-row">
            <PhoneInput id="child-phone" label={t('auth.phone')} value={phone} onChange={setPhone} />
            <button className="btn btn-gold" disabled={busy}>{busy ? 'Жіберілуде…' : t('cabinet.sendRequest')}</button>
          </div>
        </form>
      </section>

      {!selected ? <p className="muted center">{t('cabinet.selectChild')}</p>
        : child.loading && !child.data ? <Spinner />
        : child.error || !child.data ? <ErrorState message={friendlyError(child.error)} onRetry={child.reload} />
        : (
          <>
            <h2 className="section-title left">{childName}</h2>
            <StudentSnapshot data={child.data} mode="parent" onMessageTeacher={setMsg} />
          </>
        )}

      {msg && selected && (
        <MessageTeacherModal
          teacher={msg}
          student={{ id: selected, name: childName }}
          onClose={() => setMsg(null)}
        />
      )}
    </>
  );
}

export default function Cabinet() {
  const t = useT();
  const { profile } = useAuth();
  useSeo(t('cabinet.title'), undefined, '/cabinet');
  if (!profile) return <Spinner />;
  if (profile.role === 'admin') return <Navigate to="/admin" replace />;
  if (profile.role === 'director') return <Navigate to="/direktor-admin" replace />;
  if (profile.role === 'teacher') return <Navigate to="/teacher" replace />;
  return (
    <section className="container page narrow-lg stack-lg">
      <h1>{t('cabinet.title')}</h1>
      {profile.role === 'parent' ? <ParentCabinet profile={profile} /> : <StudentCabinet profile={profile} />}
    </section>
  );
}
