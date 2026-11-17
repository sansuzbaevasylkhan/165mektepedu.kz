import { useMemo, useState } from 'react';
import { Empty, ErrorState, Spinner, useAsync } from '../../components/ui';
import { Icon } from '../../components/Icons';
import ApplicationDetail from '../../components/admission/ApplicationDetail';
import { AppBadge, LangSwitch, RequirementMeta, RequiredProgress } from '../../components/admission/ui';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { admissionErrorText, pickLang, type AdmissionLang } from '../../lib/admission';
import { useRealtime } from '../../lib/useRealtime';
import { fmtDateTime } from '../../lib/util';
import { useSeo } from '../../lib/seo';
import type { AdmissionDocumentTypePreviews } from '../../types';

const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

function CreateForm({ onCreated }: { onCreated: (id: string) => void }) {
  const toast = useToast();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [grade, setGrade] = useState<number | ''>('');
  const [birthDate, setBirthDate] = useState('');
  const [iin, setIin] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [lang, setLang] = useState<AdmissionLang>('kk');
  const preview = useAsync<AdmissionDocumentTypePreviews>(
    () => (grade ? api.admission.requirementsPreview(Number(grade)) : Promise.resolve([])),
    [grade],
  );

  const submit = async () => {
    if (!firstName.trim() || !lastName.trim()) { toast.show('Оқушының аты-жөнін енгізіңіз', 'error'); return; }
    if (!grade) { toast.show('Сыныпты таңдаңыз', 'error'); return; }
    if (iin && !/^\d{12}$/.test(iin)) { toast.show('ЖСН 12 цифрдан тұруы керек', 'error'); return; }
    setBusy(true);
    try {
      const id = await api.admission.createApplication({
        firstName: firstName.trim(), lastName: lastName.trim(), grade: Number(grade),
        birthDate: birthDate || null, iin: iin || null, note: note.trim(),
      });
      toast.show('Өтініш құрылды. Енді құжаттарды жүктеңіз.', 'success');
      setFirstName(''); setLastName(''); setGrade(''); setBirthDate(''); setIin(''); setNote('');
      onCreated(id);
    } catch (e) { toast.show(admissionErrorText(e), 'error'); }
    finally { setBusy(false); }
  };

  return (
    <div className="card pad adm-create">
      <h3><Icon name="cap" size={20} /> Жаңа өтініш</h3>
      <p className="muted small">Баланың деректерін толтырыңыз. Өтініш құрылған соң қажет құжаттардың тізімі автоматты түрде жасалады.</p>
      <div className="adm-form-grid">
        <div className="field">
          <span className="field-label">Оқушының тегі</span>
          <input className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
        <div className="field">
          <span className="field-label">Оқушының аты</span>
          <input className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </div>
        <div className="field">
          <span className="field-label">Сынып</span>
          <select className="input" value={grade} onChange={(e) => setGrade(e.target.value ? Number(e.target.value) : '')}>
            <option value="">Таңдаңыз</option>
            {GRADES.map((g) => <option key={g} value={g}>{g}-сынып</option>)}
          </select>
        </div>
        <div className="field">
          <span className="field-label">Туған күні (міндетті емес)</span>
          <input className="input" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
        </div>
        <div className="field">
          <span className="field-label">ЖСН (міндетті емес)</span>
          <input className="input" inputMode="numeric" maxLength={12} value={iin}
            onChange={(e) => setIin(e.target.value.replace(/\D/g, ''))} />
        </div>
      </div>
      <div className="field">
        <span className="field-label">Ата-ана ескертпесі (міндетті емес)</span>
        <textarea className="input" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
      </div>

      <div className="adm-section-head">
        <h4>Сынып бойынша қажет құжаттар</h4>
        <LangSwitch lang={lang} onChange={setLang} />
      </div>
      {!grade ? <p className="muted small">Сынып таңдалғанда талаптар көрсетіледі.</p>
        : preview.loading ? <Spinner />
        : preview.error ? <p className="muted small">Талаптарды жүктеу мүмкін болмады.</p>
        : !preview.data?.length ? <p className="muted small">Бұл сынып үшін қосымша талап жоқ.</p>
        : (
          <div className="adm-type-grid">
            {preview.data.map((t) => (
              <div key={t.id} className="adm-type-card">
                <div className="adm-type-head">
                  <b>{pickLang(t, lang)}</b>
                  <span className={`badge ${t.required ? 'badge-open' : 'badge-locked'}`}>{t.required ? 'Міндетті' : 'Қосымша'}</span>
                </div>
                {pickLang(t, lang, 'description') && <p className="muted small">{pickLang(t, lang, 'description')}</p>}
                <RequirementMeta row={t} />
              </div>
            ))}
          </div>
        )}

      <div className="row end">
        <button className="btn btn-gold" disabled={busy} onClick={() => void submit()}>
          {busy ? 'Жіберілуде…' : 'Өтініш жіберу'}
        </button>
      </div>
    </div>
  );
}

export default function ParentAdmission() {
  useSeo('Оқушыны мектепке қабылдау', undefined, '/cabinet/admission');
  const list = useAsync(() => api.admission.myApplications(), []);
  useRealtime(
    ['admission_applications', 'admission_documents', 'admission_document_requirements', 'admission_events'],
    list.reload,
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const apps = useMemo(() => list.data?.applications ?? [], [list.data]);
  const showForm = creating || apps.length === 0;

  return (
    <section className="page">
      <div className="container stack-lg">
        <div className="section-row">
          <div>
            <h1>Оқушыны мектепке қабылдау</h1>
            <p className="muted small">Талаптарды қарап, құжаттарды жүктеңіз. Мәртебелер серверден нақты уақытта жаңарады.</p>
          </div>
          {apps.length > 0 && !showForm && (
            <button className="btn btn-gold" onClick={() => setCreating(true)}><Icon name="plus" size={18} /> Жаңа өтініш</button>
          )}
        </div>

        <p className="adm-note"><Icon name="lock" size={15} /> Жүктелген құжаттар жеке сақталады. Оларды тек мектеп әкімшілігі және рұқсат берілген қызметкерлер көреді. Ашық сілтеме жасалмайды.</p>

        {list.loading && !list.data ? <Spinner />
          : list.error ? <ErrorState message={admissionErrorText(list.error)} onRetry={list.reload} />
          : (
            <>
              {apps.length > 0 && (
                <div className="adm-app-grid">
                  {apps.map((a) => (
                    <button type="button" key={a.id} className="adm-app-card" onClick={() => setSelected(a.id)}>
                      <div className="adm-app-head">
                        <span className="adm-avatar">{a.student_last_name.charAt(0)}{a.student_first_name.charAt(0)}</span>
                        <div className="adm-app-title">
                          <b>{a.student_last_name} {a.student_first_name}</b>
                          <span className="muted small">{a.grade}-сынып · {fmtDateTime(a.created_at)}</span>
                        </div>
                        <AppBadge status={a.status} />
                      </div>
                      <div className="adm-app-foot">
                        <RequiredProgress done={a.required_done} total={a.required_total} />
                        <span className="adm-open-hint">Құжаттар <Icon name="arrow" size={15} /></span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {apps.length === 0 && !list.loading && (
                <Empty title="Өтініш әлі жоқ" text="Балаңызды мектепке қабылдау үшін төмендегі форманы толтырыңыз." />
              )}

              {showForm && (
                <>
                  <CreateForm onCreated={(id) => { setCreating(false); list.reload(); setSelected(id); }} />
                  {creating && apps.length > 0 && (
                    <button className="btn btn-ghost" onClick={() => setCreating(false)}>Болдырмау</button>
                  )}
                </>
              )}
            </>
          )}

        {selected && (
          <ApplicationDetail applicationId={selected} mode="parent"
            onClose={() => setSelected(null)}
            onChanged={list.reload} />
        )}
      </div>
    </section>
  );
}
