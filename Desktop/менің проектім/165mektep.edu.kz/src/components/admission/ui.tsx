import type { ReactNode } from 'react';
import { Icon, type IconName } from '../Icons';
import type {
  AdmissionApplicationStatus, AdmissionDocumentStatus,
} from '../../types';
import {
  ADMISSION_LANGS, APP_STATUS_CLASS, APP_STATUS_LABEL, DOC_STATUS_CLASS, DOC_STATUS_LABEL,
  pickLang, type AdmissionLang,
} from '../../lib/admission';

export function LangSwitch({ lang, onChange }: { lang: AdmissionLang; onChange: (l: AdmissionLang) => void }) {
  return (
    <div className="adm-lang" role="group" aria-label="Құжат тілі">
      {ADMISSION_LANGS.map((l) => (
        <button key={l.key} type="button" className={`adm-lang-btn ${lang === l.key ? 'active' : ''}`}
          aria-pressed={lang === l.key} onClick={() => onChange(l.key)}>{l.label}</button>
      ))}
    </div>
  );
}

export function AppBadge({ status }: { status: AdmissionApplicationStatus }) {
  return <span className={`badge ${APP_STATUS_CLASS[status]}`}>{APP_STATUS_LABEL[status]}</span>;
}

export function DocBadge({ status }: { status: AdmissionDocumentStatus }) {
  return <span className={`badge ${DOC_STATUS_CLASS[status]}`}>{DOC_STATUS_LABEL[status]}</span>;
}

interface RequirementMetaShape { formats: string[]; max_mb: number; multiple: boolean }
interface RequirementNameShape extends RequirementMetaShape { name_kk: string; name_ru: string; name_en: string }

export function RequirementMeta({ row }: { row: RequirementMetaShape }) {
  return (
    <div className="adm-meta">
      <span>{row.formats.join(' · ')}</span>
      <span>≤ {row.max_mb} MB</span>
      {row.multiple && <span>Бірнеше файл</span>}
    </div>
  );
}

export function RequirementTitle({ row, lang }: { row: RequirementNameShape; lang: AdmissionLang }) {
  return <span className="adm-req-title">{pickLang(row, lang)}</span>;
}

export function StatCard({ icon, label, value, hint, accent }: {
  icon: IconName;
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div className={`adm-stat ${accent ? 'accent' : ''}`}>
      <span className="adm-stat-icon"><Icon name={icon} size={20} /></span>
      <div>
        <span className="adm-stat-value">{value}</span>
        <span className="adm-stat-label">{label}</span>
        {hint && <span className="adm-stat-hint">{hint}</span>}
      </div>
    </div>
  );
}

export function RequiredProgress({ done, total }: { done: number; total: number }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div className="adm-progress" aria-label={`Міндетті құжаттар: ${done}/${total}`}>
      <div className="adm-progress-track"><span style={{ width: `${pct}%` }} /></div>
      <span className="adm-progress-text">{done}/{total}</span>
    </div>
  );
}
