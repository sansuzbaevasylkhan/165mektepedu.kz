export type Role = 'admin' | 'director' | 'teacher' | 'student' | 'parent';

export interface Profile {
  id: string;
  role: Role;
  first_name: string;
  last_name: string;
  phone: string;
  is_blocked: boolean;
  last_seen_at: string | null;
  created_at: string;
}

export interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  image_url: string | null;
  published: boolean;
  published_at: string | null;
  created_at: string;
}

export interface Subject {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  sort_order: number;
  is_active?: boolean;
  archived_at?: string | null;
}

export interface LessonStatus {
  lesson_id: string;
  subject_id: string;
  subject_title: string;
  title: string;
  description: string;
  sort_order: number;
  duration_seconds: number;
  has_test: boolean;
  video_percent: number;
  video_completed: boolean;
  test_passed: boolean;
  best_score: number;
  completed: boolean;
  unlocked: boolean;
}

export interface Catalog {
  subjects: Subject[];
  lessons: LessonStatus[];
}

export interface LessonDetail {
  id: string;
  subject_id: string;
  subject_title: string;
  title: string;
  description: string;
  video_kind: 'url' | 'upload';
  video_url: string | null;
  video_path: string | null;
  duration_seconds: number;
  next_lesson_id: string | null;
  has_test: boolean;
  start_position: number;
  video_percent: number;
  video_completed: boolean;
  test_passed: boolean;
  best_score: number;
  completed: boolean;
}

export interface TestOption {
  id: string;
  text: string;
}
export interface TestQuestion {
  id: string;
  text: string;
  points: number;
  options: TestOption[];
}
export interface TestPublic {
  id: string;
  title: string;
  pass_percent: number;
  questions: TestQuestion[];
}
export interface TestResult {
  score: number;
  max_score: number;
  percent: number;
  passed: boolean;
  pass_percent: number;
  correct_count: number;
  question_count: number;
}

export interface Attempt {
  id: string;
  lesson_id: string;
  lesson_title: string;
  percent: number;
  passed: boolean;
  created_at: string;
}

export interface Overview {
  profile: { id: string; first_name: string; last_name: string; phone: string; role: Role };
  lessons: LessonStatus[];
  attempts: Attempt[];
}

export interface LinkRow {
  link_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string;
}

export interface SocialLink {
  platform: 'instagram' | 'tiktok' | 'youtube' | 'facebook' | 'telegram';
  url: string;
  is_active: boolean;
  sort_order: number;
}

export type ContentKind = 'teacher' | 'achievement' | 'student_achievement' | 'gallery';
export interface ContentItem {
  id: string;
  kind: ContentKind;
  title: string;
  subtitle: string;
  image_url: string | null;
  sort_order: number;
}

export interface AdminStats {
  students: number;
  parents: number;
  news: number;
  lessons: number;
  tests: number;
  active_24h: number;
  logs: { id: number; action: string; entity: string; created_at: string; actor: string }[];
}

export interface AdminLesson {
  id: string;
  subject_id: string;
  title: string;
  description: string;
  video_kind: 'url' | 'upload';
  video_url: string | null;
  video_path: string | null;
  thumbnail_url: string | null;
  published: boolean;
  duration_seconds: number;
  sort_order: number;
}

export interface AdminOption {
  id: string;
  question_id: string;
  text: string;
  is_correct: boolean;
  sort_order: number;
}
export interface AdminQuestion {
  id: string;
  test_id: string;
  text: string;
  explanation: string;
  points: number;
  sort_order: number;
  answer_options: AdminOption[];
}
export interface AdminTest {
  id: string;
  lesson_id: string;
  title: string;
  pass_percent: number;
  questions: AdminQuestion[];
}

export interface StudentProgress {
  lessons_total: number;
  lessons_done: number;
  video_done: number;
  tests_passed: number;
  avg_score: number;
  percent: number;
}

export interface ParentStudentLink {
  link_id: string;
  student_id: string;
  status: 'pending' | 'approved' | 'rejected';
  first_name: string;
  last_name: string;
  phone: string;
  progress: StudentProgress;
}

export interface AdminPerson {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: Role;
  is_blocked: boolean;
  created_at: string;
  last_seen_at: string | null;
  progress: StudentProgress;
  students: ParentStudentLink[];
}

export interface DashboardStats {
  students: number;
  parents: number;
  admins: number;
  blocked: number;
  active_24h: number;
  new_7d: number;
  news: number;
  news_published: number;
  subjects: number;
  lessons: number;
  lessons_published: number;
  tests: number;
  questions: number;
  attempts: number;
  completed_lessons: number;
  avg_progress: number;
  avg_score: number;
}

export interface DayPoint {
  day: string;
  students?: number;
  parents?: number;
  attempts?: number;
  completed?: number;
}

export interface SubjectStat {
  id: string;
  title: string;
  lessons: number;
  completions: number;
  avg_video: number;
  avg_score: number;
}

export interface ScoreBucket {
  range: string;
  count: number;
}

export interface TopStudent {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  percent: number;
  lessons_done: number;
  avg_score: number;
}

export interface RecentStudent {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  is_blocked: boolean;
  created_at: string;
  percent: number;
  lessons_done: number;
}

export interface RecentNews {
  id: string;
  title: string;
  published: boolean;
  image_url: string | null;
  created_at: string;
}

export interface ActivityLogRow {
  id: number;
  action: string;
  entity: string;
  entity_id?: string | null;
  created_at: string;
  actor: string;
  actor_id?: string | null;
}

export interface DashboardData {
  days: number;
  stats: DashboardStats;
  registrations: DayPoint[];
  activity: DayPoint[];
  subjects: SubjectStat[];
  scores: ScoreBucket[];
  top_students: TopStudent[];
  recent_students: RecentStudent[];
  recent_news: RecentNews[];
  recent_logs: ActivityLogRow[];
  system: { database: boolean; storage: boolean; auth: boolean; server_time: string };
}

export interface AdminLogs {
  entities: string[];
  logs: ActivityLogRow[];
}

export interface TimetableEntry {
  id: string;
  teacher_id: string;
  teacher_name: string;
  subject_id: string;
  subject_title: string;
  class_name: string;
  weekday: number;
  start_time: string;
  end_time: string | null;
  room: string;
  created_at: string;
  updated_at: string;
}

export interface TimetableCatalog {
  teachers: { id: string; first_name: string; last_name: string }[];
  subjects: { id: string; title: string }[];
}

export interface TimetableHistoryRow {
  id: number;
  timetable_id: string | null;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  actor_name: string;
  data: {
    teacher_name?: string;
    subject_title?: string;
    class_name?: string;
    weekday?: number;
    start_time?: string;
    end_time?: string | null;
    room?: string;
  };
  created_at: string;
}

// ---- Мектепке қабылдау / Құжаттар орталығы ----
export type AdmissionApplicationStatus =
  | 'new' | 'under_review' | 'documents_incomplete' | 'documents_complete' | 'accepted' | 'rejected';
export type AdmissionDocumentStatus =
  | 'NOT_UPLOADED' | 'UPLOADED' | 'UNDER_REVIEW' | 'VERIFIED' | 'NEEDS_CORRECTION' | 'REJECTED';
export type AdmissionCategory = 'application' | 'identity' | 'medical' | 'address' | 'additional' | 'general';
export type AdmissionPermissionKey =
  | 'admission_view' | 'admission_documents_view' | 'admission_details_view'
  | 'admission_status_update' | 'admission_comment';

export interface AdmissionPermissions {
  role: Role;
  admission_view: boolean;
  admission_documents_view: boolean;
  admission_details_view: boolean;
  admission_status_update: boolean;
  admission_comment: boolean;
}

export interface AdmissionDocument {
  id: string;
  file_name: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  version: number;
  status: AdmissionDocumentStatus;
  review_comment: string;
  reviewed_at: string | null;
  created_at: string;
}

export interface AdmissionRequirement {
  id: string;
  code: string;
  name_kk: string;
  name_ru: string;
  name_en: string;
  description_kk: string;
  description_ru: string;
  description_en: string;
  required: boolean;
  formats: string[];
  max_mb: number;
  multiple: boolean;
  sort_order: number;
  status: AdmissionDocumentStatus;
  documents: AdmissionDocument[];
}

export interface AdmissionEvent {
  id: number;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
  actor: string;
}

export interface AdmissionApplication {
  id: string;
  student_first_name: string;
  student_last_name: string;
  grade: number;
  status: AdmissionApplicationStatus;
  created_at: string;
  updated_at: string;
  parent_note: string;
  staff_comment: string;
  birth_date: string | null;
  iin: string | null;
  decided_at: string | null;
  parent: { id: string; first_name: string; last_name: string; phone: string } | null;
  required_total: number;
  required_done: number;
  documents_uploaded: number;
  requirements: AdmissionRequirement[];
  events: AdmissionEvent[];
  permissions?: AdmissionPermissions;
  parent_view?: boolean;
}

export interface AdmissionApplicationList {
  permissions: AdmissionPermissions;
  applications: AdmissionApplication[];
}

export interface AdmissionDocumentType {
  id: string;
  code: string;
  name_kk: string;
  name_ru: string;
  name_en: string;
  description_kk: string;
  description_ru: string;
  description_en: string;
  category: AdmissionCategory;
  required: boolean;
  formats: string[];
  max_mb: number;
  grades: number[] | null;
  multiple: boolean;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type AdmissionDocumentTypePreview = Pick<AdmissionDocumentType,
  'id' | 'code' | 'name_kk' | 'name_ru' | 'name_en' | 'description_kk' | 'description_ru' |
  'description_en' | 'required' | 'formats' | 'max_mb' | 'multiple' | 'sort_order'>;
export type AdmissionDocumentTypePreviews = AdmissionDocumentTypePreview[];

export type AdmissionDocumentTypeInput = Omit<AdmissionDocumentType, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  grades: number[] | null;
};

export interface AdmissionTeacher {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  is_blocked: boolean;
  admission_view: boolean;
  admission_documents_view: boolean;
  admission_details_view: boolean;
  admission_status_update: boolean;
  admission_comment: boolean;
}

export interface AdmissionDashboardData {
  total: number;
  new: number;
  under_review: number;
  incomplete: number;
  complete: number;
  accepted: number;
  pending_documents: number;
  recent: AdmissionApplication[];
}

// ---- Мұғалімдерді басқару (ADMIN) ----
export type TeacherEmploymentStatus = 'active' | 'probation' | 'on_leave' | 'terminated' | 'archived';
export type TeacherTaskStatus = 'pending' | 'in_progress' | 'done' | 'cancelled';
export type TeacherTaskPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface TeacherAdminPermissions {
  role: Role | null;
  director: boolean;
  view: boolean;
  documents: boolean;
  edit: boolean;
  accounts: boolean;
}

export interface TeacherAssignment {
  id: string;
  subject_id: string;
  subject_title: string;
  classes: string[];
  weekly_hours: number;
  academic_year_id?: string | null;
  academic_year?: string;
  term?: string;
}

export interface TeacherListItem {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  photo_url: string | null;
  employment_status: TeacherEmploymentStatus;
  is_blocked: boolean;
  hired_at: string | null;
  created_at: string;
  last_seen_at: string | null;
  archived_at: string | null;
  block_reason: string;
  blocked_until: string | null;
  assignments: TeacherAssignment[];
  classes: string[];
  weekly_lessons: number;
  pending_tasks: number;
  documents_count: number;
  subjects_text: string;
}

export interface TeacherTimetableEntry {
  id: string;
  subject_title: string;
  class_name: string;
  weekday: number;
  start_time: string;
  end_time: string | null;
  room: string;
}

export interface TeacherTask {
  id: string;
  teacher_id: string;
  teacher_name?: string;
  title: string;
  description: string;
  priority: TeacherTaskPriority;
  status: TeacherTaskStatus;
  due_at: string | null;
  created_at: string;
  updated_at?: string;
  completed_at: string | null;
  created_by_name: string;
  overdue: boolean;
}

export interface TeacherDocument {
  id: string;
  kind: 'diploma' | 'certificate' | 'medical' | 'contract' | 'identity' | 'other';
  title: string;
  file_name: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  verified: boolean;
  verified_at: string | null;
  note: string;
  created_at: string;
}

export interface TeacherAttendance {
  id: string;
  work_date: string;
  check_in: string | null;
  check_out: string | null;
  status: 'present' | 'late' | 'absent' | 'leave';
  late_minutes: number;
  note: string;
  created_at: string;
}

export interface TeacherWorkLog {
  id: string;
  work_date: string;
  subject_title: string;
  class_name: string;
  topic: string;
  status: 'conducted' | 'missed' | 'substituted';
  note: string;
  created_at: string;
}

export interface TeacherReport {
  id: string;
  period_start: string;
  period_end: string;
  title: string;
  content: string;
  status: 'submitted' | 'approved' | 'revision';
  created_at: string;
  reviewed_at: string | null;
}

export interface TeacherAuditRow {
  id: number;
  action: string;
  entity: string;
  entity_id?: string | null;
  created_at: string;
  actor: string;
  details?: Record<string, unknown>;
}

export interface TeacherDetail {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  photo_url: string | null;
  employment_status: TeacherEmploymentStatus;
  hired_at: string | null;
  birth_date: string | null;
  qualification: string;
  address: string;
  notes: string;
  is_blocked: boolean;
  block_reason: string;
  blocked_until: string | null;
  archived_at: string | null;
  created_at: string;
  last_seen_at: string | null;
  assignments: TeacherAssignment[];
  timetable: TeacherTimetableEntry[];
  workload: { lessons: number; hours: number };
  tasks: TeacherTask[];
  documents: TeacherDocument[];
  documents_hidden: boolean;
  attendance: TeacherAttendance[];
  attendance_stats: { present: number; late: number; absent: number; leave: number };
  work_logs: TeacherWorkLog[];
  reports: TeacherReport[];
  audit: { id: number; action: string; entity: string; created_at: string; actor: string }[];
  permissions: TeacherAdminPermissions;
}

export interface TeacherRecent {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  photo_url: string | null;
  employment_status: TeacherEmploymentStatus;
  is_blocked: boolean;
  hired_at: string | null;
  created_at: string;
}

export interface TeacherDashboardData {
  total: number;
  active: number;
  blocked: number;
  archived: number;
  new_30d: number;
  documents: number;
  unverified_documents: number;
  tasks_pending: number;
  tasks_overdue: number;
  tasks_done_30d: number;
  subjects: { title: string; count: number }[];
  recent: TeacherRecent[];
  permissions: TeacherAdminPermissions;
}

export interface TeacherProfileInput {
  first_name?: string;
  last_name?: string;
  email?: string;
  photo_url?: string | null;
  hired_at?: string | null;
  birth_date?: string | null;
  qualification?: string;
  address?: string;
  notes?: string;
  employment_status?: TeacherEmploymentStatus;
  assignments?: { subject_id: string; classes: string[]; weekly_hours: number }[];
}

export interface TeacherCreateInput extends TeacherProfileInput {
  first_name: string;
  last_name: string;
  phone: string;
  password: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  kind: 'task' | 'account' | 'system';
  link: string;
  read_at: string | null;
  created_at: string;
}

export interface DirectorAdminRow {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  is_blocked: boolean;
  created_at: string;
  last_seen_at: string | null;
  view: boolean;
  documents: boolean;
  edit: boolean;
  accounts: boolean;
  updated_at: string | null;
}

// =====================================================================
// Пәндер мен мұғалімдер + TEACHER PANEL
// =====================================================================

export interface SubjectAdminRow {
  id: string;
  title: string;
  description: string;
  sort_order: number;
  is_active: boolean;
  archived_at: string | null;
  teachers: number;
  classes: number;
  weekly_hours: number;
  lessons: number;
  tests: number;
  timetable: number;
}

export interface AcademicYear {
  id: string;
  name: string;
  starts_on: string;
  ends_on: string;
  is_current: boolean;
}

export interface WorkloadAssignment {
  id: string;
  subject_id: string;
  subject_title: string;
  subject_active: boolean;
  classes: string[];
  weekly_hours: number;
  academic_year_id: string | null;
  academic_year: string;
  term: string;
  students: number;
}

export interface TeacherWorkloadRow {
  id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  is_blocked: boolean;
  employment_status: TeacherEmploymentStatus;
  assignments: WorkloadAssignment[];
  classes: string[];
  total_hours: number;
  subjects_count: number;
}

export interface ClassCatalogRow {
  class_name: string;
  students: number;
  subjects: number;
  teachers: number;
  lessons: number;
}

export interface RosterStudent {
  student_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  class_name?: string;
  is_blocked?: boolean;
}

export interface ClassRoster {
  class_name: string;
  academic_year_id: string | null;
  members: RosterStudent[];
  available: RosterStudent[];
}

export interface AnalyticsSubject {
  id: string;
  title: string;
  is_active: boolean;
  teachers: number;
  classes: number;
  weekly_hours: number;
  lessons: number;
  conducted_30d: number;
}

export interface AcademicAnalytics {
  subjects_total: number;
  subjects_active: number;
  subjects_archived: number;
  subjects_unassigned: { id: string; title: string }[];
  classes_without_teacher: { class_name: string }[];
  teachers_total: number;
  avg_weekly_hours: number;
  lessons_30d: number;
  subject_stats: AnalyticsSubject[];
}

export interface MySubjectClass {
  class_name: string;
  students: number;
}

export interface MySubject {
  id: string;
  subject_id: string;
  subject_title: string;
  subject_active: boolean;
  classes: string[];
  weekly_hours: number;
  academic_year_id: string | null;
  academic_year: string;
  term: string;
  class_students: MySubjectClass[];
  lessons_week: number;
}

export interface TeacherClassStudent {
  student_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  class_name: string;
}

// ---- Тапсырмалар ----
export type AssignmentStatus = 'draft' | 'published' | 'closed' | 'archived';
export type AssignmentAudience = 'class' | 'students';
export type SubmissionStatus =
  | 'assigned' | 'in_progress' | 'submitted' | 'late' | 'checked' | 'returned';

export interface AssignmentFile {
  id: string;
  kind: 'material' | 'attachment' | 'video';
  file_name: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
}

export interface MySubmission {
  id: string;
  status: SubmissionStatus;
  text_answer: string;
  submitted_at: string | null;
  checked_at?: string | null;
  score: number | null;
  feedback: string | null;
  files: AssignmentFile[];
}

export interface SubmissionRow {
  id: string;
  student_id: string;
  student_name: string;
  status: SubmissionStatus;
  text_answer: string;
  submitted_at: string | null;
  checked_at: string | null;
  score: number | null;
  feedback: string | null;
  files: AssignmentFile[];
}

export interface AssignmentTeacherRow {
  id: string;
  subject_id: string;
  subject_title: string;
  title: string;
  description: string;
  class_names: string[];
  audience: AssignmentAudience;
  status: AssignmentStatus;
  video_url: string | null;
  due_at: string | null;
  max_score: number;
  criteria: string;
  created_at: string;
  published_at: string | null;
  files: number;
  targets: number;
  submissions: number;
  submitted: number;
  checked: number;
  avg_score: number | null;
}

export interface AssignmentDetail {
  id: string;
  subject_id: string;
  subject_title: string;
  title: string;
  description: string;
  class_names: string[];
  audience: AssignmentAudience;
  status: AssignmentStatus;
  video_url: string | null;
  due_at: string | null;
  max_score: number;
  criteria: string;
  term: string;
  academic_year_id: string | null;
  created_at: string;
  published_at: string | null;
  files: AssignmentFile[];
  targets: { student_id: string; name: string }[];
  my_submission: MySubmission | null;
  submissions: SubmissionRow[];
}

export interface AssignmentInput {
  id?: string;
  subject_id: string;
  class_names: string[];
  student_ids?: string[];
  audience: AssignmentAudience;
  title: string;
  description?: string;
  video_url?: string | null;
  due_at?: string | null;
  max_score?: number;
  criteria?: string;
  status: 'draft' | 'published';
  academic_year_id?: string | null;
  term?: string;
}

export interface StudentAssignment {
  id: string;
  subject_title: string;
  teacher_name: string;
  title: string;
  description: string;
  class_names: string[];
  due_at: string | null;
  max_score: number;
  criteria: string;
  video_url: string | null;
  status: AssignmentStatus;
  files: AssignmentFile[];
  my_submission: MySubmission | null;
}

export interface AssignmentHistoryRow {
  id: number;
  action: string;
  details: Record<string, unknown>;
  actor: string;
  created_at: string;
}

// ---- Журнал ----
export type JournalKind = 'daily' | 'sor' | 'soch' | 'term';

export interface JournalGrade {
  id: string;
  kind: JournalKind;
  score: number;
  max_score: number;
  date: string;
  comment: string;
  teacher_id: string;
}

export interface JournalStudent {
  student_id: string;
  first_name: string;
  last_name: string;
  grades: JournalGrade[];
  average: number | null;
  attendance: { status: string; note: string } | null;
}

export interface JournalData {
  subject_id: string;
  class_name: string;
  term: string;
  date: string;
  students: JournalStudent[];
}

export type LessonAttendanceStatus = 'present' | 'late' | 'excused' | 'absent';

// ---- Хабарламалар ----
export type MessageAudience = 'individual' | 'class' | 'parents' | 'director';

export interface TeacherMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  audience: MessageAudience;
  class_name: string;
  title: string;
  body: string;
  important: boolean;
  read_at: string | null;
  created_at: string;
  is_mine: boolean;
  sender_name: string;
  recipient_name: string;
}

// ---- Мұғалім панелі ----
export interface TeacherPanelDashboard {
  lessons_today: {
    id: string; subject: string; class_name: string;
    start_time: string; end_time: string | null; room: string;
  }[];
  classes: string[];
  subjects: number;
  students: number;
  pending_submissions: number;
  today_attendance: { present: number; late: number; excused: number; absent: number };
  upcoming: { id: string; title: string; subject: string; due_at: string | null; status: AssignmentStatus }[];
  messages: { id: string; title: string; body: string; is_mine: boolean; important: boolean; read_at: string | null; created_at: string }[];
  unread_messages: number;
  director_messages: { id: string; title: string; body: string; read_at: string | null; created_at: string }[];
}

export interface TeacherReportMetrics {
  lessons?: number;
  assignments?: number;
  checked?: number;
  students?: number;
  avg_score?: number;
  attendance?: { present?: number; late?: number; excused?: number; absent?: number };
}

export interface TeacherReportRow {
  id: string;
  teacher_id: string;
  teacher_name: string;
  period_start: string;
  period_end: string;
  title: string;
  status: 'submitted' | 'approved' | 'revision';
  metrics: TeacherReportMetrics;
  created_at: string;
  reviewed_at: string | null;
}

export interface StudentProgress {
  student: { id: string; first_name: string; last_name: string; class_name: string | null } | null;
  subjects: {
    subject_id: string; title: string; average: number | null; grades: number;
    attendance_present: number; attendance_total: number;
  }[];
  assignments: { total: number; checked: number; avg_score: number | null };
  recent_grades: {
    id: string; subject: string; kind: JournalKind; score: number;
    max_score: number; date: string; comment: string;
  }[];
}
