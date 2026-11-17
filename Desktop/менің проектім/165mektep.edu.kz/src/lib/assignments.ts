import type { AssignmentStatus, SubmissionStatus } from '../types';

export const ASSIGNMENT_STATUS_LABEL: Record<AssignmentStatus, string> = {
  draft: 'Жоба', published: 'Жарияланды', closed: 'Жабылды', archived: 'Мұрағат',
};

export const ASSIGNMENT_STATUS_CLASS: Record<AssignmentStatus, string> = {
  draft: 'adm-badge-muted', published: 'adm-badge-ok',
  closed: 'adm-badge-warn', archived: 'adm-badge-muted',
};

export const SUBMISSION_STATUS_LABEL: Record<SubmissionStatus, string> = {
  assigned: 'Берілді', in_progress: 'Орындалып жатыр', submitted: 'Тапсырылды',
  late: 'Кешіктірілді', checked: 'Тексерілді', returned: 'Қайтаруға жіберілді',
};

export const SUBMISSION_STATUS_CLASS: Record<SubmissionStatus, string> = {
  assigned: 'adm-badge-muted', in_progress: 'adm-badge-warn', submitted: 'adm-badge-ok',
  late: 'adm-badge-bad', checked: 'adm-badge-ok', returned: 'adm-badge-bad',
};

export const TERM_LABEL: Record<string, string> = {
  year: 'Оқу жылы', '1': '1-тоқсан', '2': '2-тоқсан', '3': '3-тоқсан', '4': '4-тоқсан',
};

export function fileSize(n: number | null | undefined): string {
  if (!n) return '—';
  if (n < 1024) return `${n} Б`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} КБ`;
  return `${(n / 1024 / 1024).toFixed(1)} МБ`;
}

export function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromLocalInput(v: string): string | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
