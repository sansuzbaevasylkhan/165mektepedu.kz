import type {
  TeacherEmploymentStatus, TeacherTaskPriority, TeacherTaskStatus,
  TeacherDocument, TeacherAttendance, TeacherReport,
} from '../types';

export const EMPLOYMENT_LABEL: Record<TeacherEmploymentStatus, string> = {
  active: 'Жұмыс істеп жүр',
  probation: 'Сынақ мерзімі',
  on_leave: 'Демалыста',
  terminated: 'Жұмыстан шыққан',
  archived: 'Мұрағатта',
};

export const EMPLOYMENT_CLASS: Record<TeacherEmploymentStatus, string> = {
  active: 'adm-badge-ok',
  probation: 'adm-badge-warn',
  on_leave: 'adm-badge-review',
  terminated: 'adm-badge-bad',
  archived: 'adm-badge-muted',
};

export const TASK_STATUS_LABEL: Record<TeacherTaskStatus, string> = {
  pending: 'Күтуде',
  in_progress: 'Орындалуда',
  done: 'Орындалды',
  cancelled: 'Бас тартылды',
};

export const TASK_STATUS_CLASS: Record<TeacherTaskStatus, string> = {
  pending: 'adm-badge-warn',
  in_progress: 'adm-badge-review',
  done: 'adm-badge-ok',
  cancelled: 'adm-badge-muted',
};

export const TASK_PRIORITY_LABEL: Record<TeacherTaskPriority, string> = {
  low: 'Төмен',
  normal: 'Қалыпты',
  high: 'Жоғары',
  urgent: 'Шұғыл',
};

export const ATTENDANCE_LABEL: Record<TeacherAttendance['status'], string> = {
  present: 'Келді',
  late: 'Кешікті',
  absent: 'Келмеді',
  leave: 'Демалыс',
};

export const ATTENDANCE_CLASS: Record<TeacherAttendance['status'], string> = {
  present: 'adm-badge-ok',
  late: 'adm-badge-warn',
  absent: 'adm-badge-bad',
  leave: 'adm-badge-review',
};

export const DOC_KIND_LABEL: Record<TeacherDocument['kind'], string> = {
  diploma: 'Диплом',
  certificate: 'Сертификат',
  medical: 'Медициналық',
  contract: 'Келісімшарт',
  identity: 'Жеке куәлік',
  other: 'Басқа',
};

export const WORKLOG_LABEL: Record<'conducted' | 'missed' | 'substituted', string> = {
  conducted: 'Өткізілді',
  missed: 'Өткізілмеді',
  substituted: 'Ауыстырылды',
};

export const REPORT_LABEL: Record<TeacherReport['status'], string> = {
  submitted: 'Тексеруде',
  approved: 'Бекітілді',
  revision: 'Қайта өңдеуге',
};

export const REPORT_CLASS: Record<TeacherReport['status'], string> = {
  submitted: 'adm-badge-warn',
  approved: 'adm-badge-ok',
  revision: 'adm-badge-bad',
};

export const WEEKDAYS = ['', 'Дүйсенбі', 'Сейсенбі', 'Сәрсенбі', 'Бейсенбі', 'Жұма', 'Сенбі', 'Жексенбі'];

export const teacherName = (t: { last_name: string; first_name: string }) =>
  `${t.last_name} ${t.first_name}`.trim();

export const teacherInitials = (t: { last_name: string; first_name: string }) =>
  `${(t.last_name || '').charAt(0)}${(t.first_name || '').charAt(0)}`.toUpperCase();

export function parseClasses(raw: string): string[] {
  return Array.from(new Set(
    raw.split(/[,;\s]+/).map((c) => c.trim()).filter(Boolean),
  )).slice(0, 30);
}

export function fmtBytes(n: number | null): string {
  if (!n) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function fmtTime(t: string | null): string {
  return t ? t.slice(0, 5) : '—';
}

export function inputDate(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 10) : '';
}
