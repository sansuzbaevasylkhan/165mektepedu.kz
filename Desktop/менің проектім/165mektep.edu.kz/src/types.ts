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
