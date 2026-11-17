import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Empty, ErrorState, Modal, Spinner, useAsync } from '../../components/ui';
import { Icon } from '../../components/Icons';
import AdmissionsPage from './AdmissionsPage';
import { LangSwitch, RequirementMeta } from '../../components/admission/ui';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import {
  admissionErrorText, CATEGORY_LABEL, pickLang, type AdmissionLang,
} from '../../lib/admission';
import { useRealtime } from '../../lib/useRealtime';
import type { AdmissionCategory, AdmissionDashboardData, AdmissionDocumentType, AdmissionDocumentTypeInput } from '../../types';

type Tab = 'overview' | 'required' | 'review' | 'manage';

const TABS: { key: Tab; label: string }[] = [
  { key: 'overview', label: 'Құжат талаптары' },
  { key: 'required', label: 'Міндетті құжаттар' },
  { key: 'review', label: 'Тексеру' },
  { key: 'manage', label: 'Басқару' },
];

const CATEGORIES: AdmissionCategory[] = ['application', 'identity', 'medical', 'address', 'additional', 'general'];
const FORMATS = ['PDF', 'JPG', 'JPEG', 'PNG'];
const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

export default function DocumentsCenter() {
  const [params, setParams] = useSearchParams();
  const raw = params.get('tab') as Tab | null;
  const tab: Tab = raw && TABS.some((t) => t.key === raw) ? raw : 'overview';
  const setTab = (t: Tab) => setParams(t === 'overview' ? {} : { tab: t }, { replace: true });

  const types = useAsync(() => api.admission.documentTypes(), []);
  const stats = useAsync<AdmissionDashboardData | null>(() => api.admission.dashboard().catch(() => null), []);
  useRealtime(['admission_document_types', 'admission_applications', 'admission_documents'], () => {
    types.reload(); stats.reload();
  });

  const [lang, setLang] = useState<AdmissionLang>('kk');
  const [editing, setEditing] = useState<AdmissionDocumentType | null | undefined>(undefined);
  const [busyId, setBusyId] = useState<string | null>(null);
  const toast = useToast();

  const all = types.data ?? [];
  const sorted = useMemo(() => [...all].sort((a, b) => a.sort_order - b.sort_order), [all]);
  const required = sorted.filter((t) => t.required);
  const grouped = useMemo(() => {
    const map = new Map<AdmissionCategory, AdmissionDocumentType[]>();
    sorted.forEach((t) => { map.set(t.category, [...(map.get(t.category) ?? []), t]); });
    return [...map.entries()];
  }, [sorted]);

  const toggle = async (t: AdmissionDocumentType) => {
    setBusyId(t.id);
    try {
      await api.admission.toggleDocumentType(t.id, !t.active);
      toast.show(t.active ? 'Құжат түрі өшірілді' : 'Құжат түрі қосылды', 'success');
      types.reload();
    } catch (e) { toast.show(admissionErrorText(e), 'error'); }
    finally { setBusyId(null); }
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const next = [...sorted];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    setBusyId('reorder');
    try {
      await api.admission.reorderDocumentTypes(next.map((t) => t.id));
      types.reload();
    } catch (e) { toast.show(admissionErrorText(e), 'error'); }
    finally { setBusyId(null); }
  };

  const d = stats.data;

  return (
    <div className="stack-lg">
      <div className="section-row">
        <div>
          <h1>Құжаттар орталығы</h1>
          <p className="muted small">Құжат талаптары, міндетті құжаттар, тексеру және басқару — барлығы серверлік деректермен.</p>
        </div>
        <div className="row">
          <LangSwitch lang={lang} onChange={setLang} />
          <span className="badge badge-open">{all.length} құжат түрі</span>
        </div>
      </div>

      <div className="adm-stats four">
        <div className="adm-stat"><span className="adm-stat-icon"><Icon name="file" size={20} /></span><div><span className="adm-stat-value">{d?.total ?? '—'}</span><span className="adm-stat-label">Барлық өтініш</span></div></div>
        <div className="adm-stat"><span className="adm-stat-icon"><Icon name="clock" size={20} /></span><div><span className="adm-stat-value">{d?.under_review ?? '—'}</span><span className="adm-stat-label">Тексерілуде</span></div></div>
        <div className="adm-stat"><span className="adm-stat-icon"><Icon name="shield" size={20} /></span><div><span className="adm-stat-value">{d?.incomplete ?? '—'}</span><span className="adm-stat-label">Құжаты толық емес</span></div></div>
        <div className="adm-stat"><span className="adm-stat-icon"><Icon name="check" size={20} /></span><div><span className="adm-stat-value">{d?.accepted ?? '—'}</span><span className="adm-stat-label">Қабылданды</span></div></div>
      </div>

      <div className="tabs" role="tablist" aria-label="Құжаттар орталығы бөлімдері">
        {TABS.map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} className={`tab ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>

      {tab === 'review' ? <AdmissionsPage embedded /> : (
        types.loading && !types.data ? <Spinner />
          : types.error ? <ErrorState message={admissionErrorText(types.error)} onRetry={types.reload} />
          : (
            <>
              {tab === 'overview' && (
                grouped.length === 0 ? <Empty title="Құжат түрлері жоқ" />
                  : grouped.map(([cat, items]) => (
                    <section key={cat} className="adm-group">
                      <h3 className="adm-group-title">{CATEGORY_LABEL[cat]}</h3>
                      <div className="adm-type-grid">
                        {items.map((t) => <TypeCard key={t.id} t={t} lang={lang} />)}
                      </div>
                    </section>
                  ))
              )}

              {tab === 'required' && (
                required.length === 0 ? <Empty title="Міндетті құжат жоқ" />
                  : (
                    <div className="adm-type-grid">
                      {required.map((t) => <TypeCard key={t.id} t={t} lang={lang} showState />)}
                    </div>
                  )
              )}

              {tab === 'manage' && (
                <>
                  <div className="toolbar">
                    <p className="muted small">Жаңа өтініштер ашылғанда ағымдағы талаптардың көшірмесі сақталады — ескі өтініштердің талаптары өзгермейді.</p>
                    <button className="btn btn-gold" onClick={() => setEditing(null)}><Icon name="plus" size={18} /> Жаңа құжат түрі</button>
                  </div>
                  {sorted.length === 0 ? <Empty title="Құжат түрі жоқ" />
                    : (
                      <div className="card table-wrap">
                        <table className="table">
                          <thead><tr><th>Рет</th><th>Атауы</th><th>Санат</th><th>Формат</th><th>Өлшем</th><th>Міндетті</th><th>Күйі</th><th /></tr></thead>
                          <tbody>
                            {sorted.map((t, idx) => (
                              <tr key={t.id}>
                                <td>
                                  <div className="adm-move">
                                    <button className="icon-btn" aria-label="Жоғары" disabled={idx === 0 || busyId === 'reorder'} onClick={() => void move(idx, -1)}>↑</button>
                                    <button className="icon-btn" aria-label="Төмен" disabled={idx === sorted.length - 1 || busyId === 'reorder'} onClick={() => void move(idx, 1)}>↓</button>
                                  </div>
                                </td>
                                <td><b>{pickLang(t, lang)}</b><div className="muted small">{t.code}</div></td>
                                <td>{CATEGORY_LABEL[t.category]}</td>
                                <td className="muted small">{t.formats.join(' · ')}</td>
                                <td className="muted small">{t.max_mb} MB</td>
                                <td><span className={`badge ${t.required ? 'badge-open' : 'badge-locked'}`}>{t.required ? 'Иә' : 'Жоқ'}</span></td>
                                <td><span className={`badge ${t.active ? 'badge-done' : 'badge-locked'}`}>{t.active ? 'Белсенді' : 'Өшірулі'}</span></td>
                                <td className="actions">
                                  <button className="btn btn-ghost btn-sm" onClick={() => setEditing(t)}>Өңдеу</button>
                                  <button className={`btn btn-sm ${t.active ? 'btn-danger' : 'btn-gold'}`} disabled={busyId === t.id}
                                    onClick={() => void toggle(t)}>{t.active ? 'Өшіру' : 'Қосу'}</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                </>
              )}
            </>
          )
      )}

      {editing !== undefined && (
        <TypeForm row={editing} onClose={() => setEditing(undefined)} onSaved={() => { setEditing(undefined); types.reload(); }} />
      )}
    </div>
  );
}

function TypeCard({ t, lang, showState }: { t: AdmissionDocumentType; lang: AdmissionLang; showState?: boolean }) {
  return (
    <article className="adm-type-card">
      <div className="adm-type-head">
        <b>{pickLang(t, lang)}</b>
        <div className="row">
          <span className={`badge ${t.required ? 'badge-open' : 'badge-locked'}`}>{t.required ? 'Міндетті' : 'Қосымша'}</span>
          {showState && <span className={`badge ${t.active ? 'badge-done' : 'badge-locked'}`}>{t.active ? 'Белсенді' : 'Өшірулі'}</span>}
        </div>
      </div>
      {pickLang(t, lang, 'description') && <p className="muted small">{pickLang(t, lang, 'description')}</p>}
      <RequirementMeta row={t} />
      <div className="adm-type-foot">
        <span className="muted small">{CATEGORY_LABEL[t.category]}</span>
        <span className="muted small">{t.grades?.length ? `${t.grades.join(', ')}-сынып` : 'Барлық сыныптар'}</span>
      </div>
    </article>
  );
}

function TypeForm({ row, onClose, onSaved }: {
  row: AdmissionDocumentType | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [code, setCode] = useState(row?.code ?? '');
  const [nameKk, setNameKk] = useState(row?.name_kk ?? '');
  const [nameRu, setNameRu] = useState(row?.name_ru ?? '');
  const [nameEn, setNameEn] = useState(row?.name_en ?? '');
  const [descKk, setDescKk] = useState(row?.description_kk ?? '');
  const [descRu, setDescRu] = useState(row?.description_ru ?? '');
  const [descEn, setDescEn] = useState(row?.description_en ?? '');
  const [category, setCategory] = useState<AdmissionCategory>(row?.category ?? 'general');
  const [required, setRequired] = useState(row?.required ?? true);
  const [multiple, setMultiple] = useState(row?.multiple ?? false);
  const [active, setActive] = useState(row?.active ?? true);
  const [formats, setFormats] = useState<string[]>(row?.formats ?? ['PDF', 'JPG', 'PNG']);
  const [maxMb, setMaxMb] = useState(row?.max_mb ?? 10);
  const [grades, setGrades] = useState<number[]>(row?.grades ?? []);
  const [sortOrder, setSortOrder] = useState(row?.sort_order ?? 100);
  const [busy, setBusy] = useState(false);
  const [lang, setLang] = useState<AdmissionLang>('kk');

  const toggleFormat = (f: string) => {
    setFormats((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]));
  };
  const toggleGrade = (g: number) => {
    setGrades((cur) => (cur.includes(g) ? cur.filter((x) => x !== g) : [...cur, g].sort((a, b) => a - b)));
  };

  const save = async () => {
    if (!nameKk.trim()) { toast.show('Қазақша атауын енгізіңіз', 'error'); return; }
    if (formats.length === 0) { toast.show('Кемінде бір формат таңдаңыз', 'error'); return; }
    const payload: AdmissionDocumentTypeInput = {
      id: row?.id,
      code: code.trim(),
      name_kk: nameKk.trim(), name_ru: nameRu.trim(), name_en: nameEn.trim(),
      description_kk: descKk.trim(), description_ru: descRu.trim(), description_en: descEn.trim(),
      category, required, formats, max_mb: maxMb, grades: grades.length ? grades : null,
      multiple, active, sort_order: sortOrder,
    };
    setBusy(true);
    try {
      await api.admission.saveDocumentType(payload);
      toast.show('Құжат түрі сақталды', 'success');
      onSaved();
    } catch (e) { toast.show(admissionErrorText(e), 'error'); }
    finally { setBusy(false); }
  };

  const nameValue = lang === 'kk' ? nameKk : lang === 'ru' ? nameRu : nameEn;
  const setNameValue = lang === 'kk' ? setNameKk : lang === 'ru' ? setNameRu : setNameEn;
  const descValue = lang === 'kk' ? descKk : lang === 'ru' ? descRu : descEn;
  const setDescValue = lang === 'kk' ? setDescKk : lang === 'ru' ? setDescRu : setDescEn;

  return (
    <Modal title={row ? 'Құжат түрін өңдеу' : 'Жаңа құжат түрі'} onClose={onClose} wide>
      <div className="adm-form">
        <div className="adm-form-grid">
          <div className="field">
            <span className="field-label">Код (ағылшын әріптері)</span>
            <input className="input" value={code} placeholder="мысалы: vaccination_card"
              onChange={(e) => setCode(e.target.value)} />
            <span className="field-hint">Бос қалдырсаңыз, автоматты жасалады.</span>
          </div>
          <div className="field">
            <span className="field-label">Санат</span>
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value as AdmissionCategory)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
            </select>
          </div>
        </div>

        <div className="adm-section-head">
          <h4>Атауы мен сипаттамасы</h4>
          <LangSwitch lang={lang} onChange={setLang} />
        </div>
        <div className="field">
          <span className="field-label">{lang === 'kk' ? 'Атауы (қазақша)' : lang === 'ru' ? 'Название (русский)' : 'Name (English)'}</span>
          <input className="input" value={nameValue} onChange={(e) => setNameValue(e.target.value)} />
        </div>
        <div className="field">
          <span className="field-label">{lang === 'kk' ? 'Сипаттама (қазақша)' : lang === 'ru' ? 'Описание (русский)' : 'Description (English)'}</span>
          <textarea className="input" rows={3} value={descValue} onChange={(e) => setDescValue(e.target.value)} />
        </div>

        <div className="adm-form-grid">
          <div className="field">
            <span className="field-label">Максималды өлшем (MB)</span>
            <input className="input" type="number" min={1} max={50} value={maxMb}
              onChange={(e) => setMaxMb(Math.max(1, Math.min(50, Number(e.target.value) || 1)))} />
          </div>
          <div className="field">
            <span className="field-label">Реттік нөмір</span>
            <input className="input" type="number" value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value) || 0)} />
          </div>
        </div>

        <div className="field">
          <span className="field-label">Рұқсат етілген форматтар</span>
          <div className="adm-checks">
            {FORMATS.map((f) => (
              <label key={f} className={`adm-check ${formats.includes(f) ? 'active' : ''}`}>
                <input type="checkbox" checked={formats.includes(f)} onChange={() => toggleFormat(f)} /> {f}
              </label>
            ))}
          </div>
        </div>

        <div className="field">
          <span className="field-label">Сыныптар</span>
          <div className="adm-checks">
            <label className={`adm-check ${grades.length === 0 ? 'active' : ''}`}>
              <input type="checkbox" checked={grades.length === 0} onChange={() => setGrades([])} /> Барлық сыныптар
            </label>
            {GRADES.map((g) => (
              <label key={g} className={`adm-check ${grades.includes(g) ? 'active' : ''}`}>
                <input type="checkbox" checked={grades.includes(g)} onChange={() => toggleGrade(g)} /> {g}
              </label>
            ))}
          </div>
        </div>

        <div className="adm-checks">
          <label className="adm-check"><input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} /> Міндетті құжат</label>
          <label className="adm-check"><input type="checkbox" checked={multiple} onChange={(e) => setMultiple(e.target.checked)} /> Бірнеше файл рұқсат</label>
          <label className="adm-check"><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Белсенді</label>
        </div>

        <div className="row end">
          <button className="btn btn-ghost" onClick={onClose}>Болдырмау</button>
          <button className="btn btn-gold" disabled={busy} onClick={() => void save()}>{busy ? 'Сақталуда…' : 'Сақтау'}</button>
        </div>
      </div>
    </Modal>
  );
}
