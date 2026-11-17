import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ErrorState, Field, PasswordInput, Spinner, useAsync } from '../../components/ui';
import { Icon } from '../../components/Icons';
import { ImageUpload } from '../../components/ImageUpload';
import { PhoneInput } from '../../components/PhoneInput';
import { AssignmentEditor, NoPermission, fromDrafts, type AssignmentDraft } from '../../components/teacher/ui';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { friendlyError } from '../../lib/errors';
import { isValidPhone } from '../../lib/phone';
import { EMPLOYMENT_LABEL } from '../../lib/teacher';
import type { TeacherEmploymentStatus } from '../../types';

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

export default function TeacherNew() {
  const nav = useNavigate();
  const toast = useToast();
  const perm = useAsync(() => api.teacher.permissions(), []);
  const catalog = useAsync(() => api.catalog(), []);
  const [busy, setBusy] = useState(false);

  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [hiredAt, setHiredAt] = useState('');
  const [status, setStatus] = useState<TeacherEmploymentStatus>('active');
  const [qualification, setQualification] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [assignments, setAssignments] = useState<AssignmentDraft[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (perm.loading && !perm.data) return <Spinner />;
  if (perm.error) return <ErrorState message={friendlyError(perm.error)} onRetry={perm.reload} />;
  if (perm.data && !perm.data.accounts) {
    return (
      <div className="stack-lg tch-page">
        <h1>Жаңа мұғалім</h1>
        <NoPermission>
          Мұғалім аккаунтын ашу үшін сізге «Аккаунтты басқару» рұқсаты қажет. Бұл рұқсатты тек DIRECTOR береді.
        </NoPermission>
        <Link to="/admin/teachers" className="btn btn-ghost">← Тізімге қайту</Link>
      </div>
    );
  }

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!first.trim()) e.first = 'Атын енгізіңіз';
    if (!last.trim()) e.last = 'Тегін енгізіңіз';
    if (!isValidPhone(phone)) e.phone = '10 таңбалы телефон нөмірі қажет';
    if (password.length < 8) e.password = 'Кемінде 8 таңба';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setBusy(true);
    try {
      const id = await api.teacher.create({
        first_name: first.trim(),
        last_name: last.trim(),
        phone,
        password,
        email: email.trim(),
        photo_url: photo,
        hired_at: hiredAt || null,
        employment_status: status,
        qualification: qualification.trim(),
        address: address.trim(),
        notes: notes.trim(),
        assignments: fromDrafts(assignments),
      });
      toast.show('Мұғалім тіркелді және аккаунт ашылды', 'success');
      nav(`/admin/teachers/${id}`, { replace: true });
    } catch (err) {
      toast.show(friendlyError(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stack-lg tch-page tch-narrow">
      <div>
        <Link to="/admin/teachers" className="link-gold small"><Icon name="arrow" size={14} /> Тізімге қайту</Link>
        <h1>Жаңа мұғалім тіркеу</h1>
        <p className="muted small">Мұғалімге жеке аккаунт ашылады. Телефон нөмірі логин ретінде қолданылады.</p>
      </div>

      <form className="stack-lg" onSubmit={(e) => void submit(e)}>
        <section className="card pad">
          <h3>Жеке ақпарат</h3>
          <div className="tch-form-grid">
            <Field label="Тегі *" error={errors.last}>
              <input className="input" value={last} onChange={(e) => setLast(e.target.value)} autoComplete="family-name" />
            </Field>
            <Field label="Аты *" error={errors.first}>
              <input className="input" value={first} onChange={(e) => setFirst(e.target.value)} autoComplete="given-name" />
            </Field>
            <PhoneInput label="Телефон *" value={phone} onChange={setPhone} error={errors.phone} />
            <Field label="Email">
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </Field>
            <PasswordInput
              id="tch-new-password"
              label="Уақытша құпиясөз *"
              showLabel="Құпиясөзді көрсету"
              autoComplete="new-password"
              value={password}
              onChange={setPassword}
              error={errors.password}
            />
            <div className="field">
              <span className="field-label">Құпиясөз жасау</span>
              <button type="button" className="btn btn-ghost"
                onClick={() => setPassword(generatePassword())}>
                <Icon name="key" size={16} /> Кездейсоқ құпиясөз
              </button>
            </div>
            <ImageUpload bucket="site-media" value={photo} onChange={setPhoto} label="Фотосурет" />
          </div>
        </section>

        <section className="card pad">
          <h3>Жұмыс ақпараты</h3>
          <div className="tch-form-grid">
            <Field label="Жұмысқа қабылданған күн">
              <input className="input" type="date" value={hiredAt} onChange={(e) => setHiredAt(e.target.value)} />
            </Field>
            <Field label="Жұмыс мәртебесі">
              <select className="input" value={status} onChange={(e) => setStatus(e.target.value as TeacherEmploymentStatus)}>
                {(['active', 'probation', 'on_leave', 'terminated'] as TeacherEmploymentStatus[]).map((k) => (
                  <option key={k} value={k}>{EMPLOYMENT_LABEL[k]}</option>
                ))}
              </select>
            </Field>
            <Field label="Біліктілігі">
              <input className="input" value={qualification} onChange={(e) => setQualification(e.target.value)}
                placeholder="Мысалы: математика мұғалімі, жоғары санат" />
            </Field>
            <Field label="Мекенжайы">
              <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} />
            </Field>
          </div>
          <Field label="Қосымша ескертпе">
            <textarea className="input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
        </section>

        <section className="card pad">
          <h3>Пәндер мен сыныптар</h3>
          <p className="muted small tch-hint">Мұғалімнің қай пәнді, қай сыныптарда жүргізетінін және апталық сағатын көрсетіңіз.</p>
          <AssignmentEditor value={assignments} subjects={catalog.data?.subjects ?? []}
            onChange={setAssignments} disabled={busy} />
        </section>

        <div className="tch-note">
          <Icon name="shield" size={16} />
          <span>Аккаунт қауіпсіз әдіспен ашылады: service_role кілті қолданылмайды, рөл сервердегі RPC арқылы беріледі.</span>
        </div>

        <div className="tch-form-actions">
          <Link to="/admin/teachers" className="btn btn-ghost">Бас тарту</Link>
          <button className="btn btn-gold" type="submit" disabled={busy}>
            {busy ? 'Тіркелуде…' : 'Мұғалімді тіркеу'}
          </button>
        </div>
      </form>
    </div>
  );
}
