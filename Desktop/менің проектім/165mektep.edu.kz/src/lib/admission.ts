import type {
  AdmissionApplicationStatus, AdmissionCategory, AdmissionDocumentStatus, AdmissionPermissionKey,
} from '../types';

export type AdmissionLang = 'kk' | 'ru' | 'en';

export const ADMISSION_LANGS: { key: AdmissionLang; label: string }[] = [
  { key: 'kk', label: 'ҚАЗ' },
  { key: 'ru', label: 'РУС' },
  { key: 'en', label: 'ENG' },
];

export function pickLang(row: object, lang: AdmissionLang, base = 'name'): string {
  const r = row as Record<string, unknown>;
  const suffix = lang === 'kk' ? 'kk' : lang;
  return (r[`${base}_${suffix}`] as string) || (r[`${base}_kk`] as string) || '';
}

export const APP_STATUS_LABEL: Record<AdmissionApplicationStatus, string> = {
  new: 'Жаңа өтініш',
  under_review: 'Тексерілуде',
  documents_incomplete: 'Құжаттары толық емес',
  documents_complete: 'Құжаттары толық',
  accepted: 'Қабылданды',
  rejected: 'Қабылданбады',
};

export const APP_STATUS_ORDER: AdmissionApplicationStatus[] = [
  'new', 'under_review', 'documents_incomplete', 'documents_complete', 'accepted', 'rejected',
];

export const APP_STATUS_CLASS: Record<AdmissionApplicationStatus, string> = {
  new: 'adm-badge-new',
  under_review: 'adm-badge-review',
  documents_incomplete: 'adm-badge-warn',
  documents_complete: 'adm-badge-ok',
  accepted: 'adm-badge-done',
  rejected: 'adm-badge-bad',
};

export const DOC_STATUS_LABEL: Record<AdmissionDocumentStatus, string> = {
  NOT_UPLOADED: 'Жүктелмеген',
  UPLOADED: 'Жүктелді',
  UNDER_REVIEW: 'Тексерілуде',
  VERIFIED: 'Тексерілді',
  NEEDS_CORRECTION: 'Қайта жүктеу қажет',
  REJECTED: 'Қабылданбады',
};

export const DOC_STATUS_CLASS: Record<AdmissionDocumentStatus, string> = {
  NOT_UPLOADED: 'adm-badge-muted',
  UPLOADED: 'adm-badge-new',
  UNDER_REVIEW: 'adm-badge-review',
  VERIFIED: 'adm-badge-ok',
  NEEDS_CORRECTION: 'adm-badge-warn',
  REJECTED: 'adm-badge-bad',
};

export const CATEGORY_LABEL: Record<AdmissionCategory, string> = {
  application: 'Өтініш',
  identity: 'Жеке бас',
  medical: 'Медицина',
  address: 'Мекенжай',
  additional: 'Қосымша',
  general: 'Жалпы',
};

export const PERMISSION_LABEL: Record<AdmissionPermissionKey, { title: string; hint: string }> = {
  admission_view: { title: 'Өтініштерді көру', hint: 'Өтініштер тізімі мен негізгі ақпарат' },
  admission_documents_view: { title: 'Құжаттарды көру', hint: 'Құжаттарды ашу, тексеру және қабылдау' },
  admission_details_view: { title: 'Толық мәліметтер', hint: 'Ата-ана байланысы, туған күні, тарих' },
  admission_status_update: { title: 'Статусты өзгерту', hint: 'Соңғы шешімді қабылдау' },
  admission_comment: { title: 'Түсініктеме', hint: 'Ішкі түсініктеме қалдыру' },
};

export const PERMISSION_KEYS: AdmissionPermissionKey[] = [
  'admission_view', 'admission_documents_view', 'admission_details_view',
  'admission_status_update', 'admission_comment',
];

export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function admissionErrorText(e: unknown): string {
  const raw = (e as { message?: string })?.message ?? '';
  const map: Record<string, string> = {
    FORBIDDEN: 'Бұл әрекетке рұқсатыңыз жоқ.',
    NOT_FOUND: 'Жазба табылмады.',
    DOCUMENTS_INCOMPLETE: 'Барлық міндетті құжаттар тексерілмейінше өтінішті қабылдау мүмкін емес.',
    BAD_FORMAT: 'Файл форматы бұл құжат үшін рұқсат етілмеген.',
    FILE_TOO_LARGE: 'Файл көлемі рұқсат етілген мөлшерден үлкен.',
    USE_REPLACE: 'Бұл құжат бұрын жүктелген. Оны ауыстыру батырмасын қолданыңыз.',
    FILE_NOT_FOUND: 'Файл жүктелмеді. Қайталап көріңіз.',
    EMPTY_COMMENT: 'Түсініктеме мәтінін енгізіңіз.',
    BAD_STATUS: 'Статус дұрыс емес.',
    BAD_GRADE: 'Сыныпты таңдаңыз.',
    BAD_NAME: 'Аты-жөні дұрыс енгізілмеген.',
    BAD_IIN: 'ЖСН 12 цифрдан тұруы керек.',
    BAD_BIRTH_DATE: 'Туған күні дұрыс емес.',
    NOT_TEACHER: 'Пайдаланушы мұғалім емес.',
    BAD_PERMISSION: 'Рұқсат түрі белгісіз.',
    BAD_CODE: 'Код тек латын әріптері, цифрлар және _ болуы керек.',
    BAD_CATEGORY: 'Санат дұрыс емес.',
    BAD_FORMATS: 'Кемінде бір формат таңдаңыз.',
    BAD_SIZE: 'Файл көлемі 1–50 MB аралығында болуы керек.',
    BAD_GRADES: 'Сыныптар қате таңдалған.',
  };
  for (const [key, text] of Object.entries(map)) if (raw.includes(key)) return text;
  return raw || 'Қате пайда болды.';
}
