export type Role = 'admin' | 'student' | 'parent';

export interface Profile {
  id: string;
  role: Role;
  first_name: string;
  last_name: string;
  phone: string;
  is_active: boolean;
  last_seen_at: string | null;
  created_at: string;
}

export interface News {
  id: string;
  title: string;
  summary: string | null;
  content: string;
  image_url: string | null;
  published: boolean;
  published_at: string | null;
  created_at: string;
}

export interface Subject {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  position: number;
}

export interface SubjectOverview {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  total: number;
  completed: number;
}

export interface LessonListItem {
  id: string;
  title: string;
  description: string | null;
  position: number;
  duration_seconds: number;
  completed: boolean;
  video_completed: boolean;
  test_passed: boolean;
  video_percent: number;
  best_percent: number | null;
  has_test: boolean;
  locked: boolean;
}

export interface LessonFull {
  id: string;
  subject_id: string;
  subject_title: string | null;
  title: string;
  description: string | null;
  video_url: string | null;
  video_path: string | null;
  duration_seconds: number;
  last_position: number;
  video_percent: number;
  video_completed: boolean;
  test_passed: boolean;
  completed: boolean;
  best_percent: number | null;
  has_test: boolean;
}

export interface VideoProgress {
  video_percent: number;
  video_completed: boolean;
  test_passed: boolean;
  completed: boolean;
  has_test: boolean;
}

export interface TestPublic {
  id: string;
  title: string;
  pass_percent: number;
  questions: { id: string; text: string; points: number; options: { id: string; text: string }[] }[];
}

export interface TestResult {
  score: number;
  max_score: number;
  percent: number;
  passed: boolean;
  pass_percent: number;
  results: Record<string, boolean>;
  lesson_completed: boolean;
}

export interface ProgressOverview {
  profile: { id: string; first_name: string; last_name: string; phone: string; role: Role };
  total_lessons: number;
  completed_lessons: number;
  percent: number;
  lessons: {
    id: string;
    title: string;
    subject_title: string;
    video_percent: number;
    video_completed: boolean;
    test_passed: boolean;
    best_percent: number | null;
    completed: boolean;
  }[];
  attempts: {
    lesson_title: string;
    percent: number;
    passed: boolean;
    score: number;
    max_score: number;
    created_at: string;
  }[];
}

export interface SocialLink {
  id: string;
  platform: 'instagram' | 'tiktok' | 'youtube' | 'facebook';
  url: string;
  enabled: boolean;
}
