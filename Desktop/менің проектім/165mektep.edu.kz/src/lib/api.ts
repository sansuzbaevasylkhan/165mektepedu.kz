import { supabase } from './supabase';
import type {
  AdminLogs, AdminPerson, AdminStats, AdminTest, Catalog, ContentItem, DashboardData,
  LessonDetail, LinkRow, NewsItem, Overview, SocialLink, TestPublic, TestResult,
  TimetableCatalog, TimetableEntry, TimetableHistoryRow,
} from '../types';

async function rpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw error;
  return data as T;
}

export const api = {
  // ---- ҰБТ ----
  catalog: () => rpc<Catalog>('ubt_catalog'),
  lesson: (id: string) => rpc<LessonDetail>('get_lesson', { p_lesson: id }),
  reportProgress: (id: string, position: number) =>
    rpc<{ video_percent: number; video_completed: boolean; completed: boolean }>('report_video_progress', {
      p_lesson: id, p_position: position,
    }),
  test: (lessonId: string) => rpc<TestPublic | null>('get_test', { p_lesson: lessonId }),
  submitTest: (lessonId: string, answers: Record<string, string>) =>
    rpc<TestResult>('submit_test', { p_lesson: lessonId, p_answers: answers }),
  overview: (studentId?: string) => rpc<Overview>('student_overview', { p_student: studentId ?? null }),
  signedVideoUrl: async (path: string) => {
    const { data, error } = await supabase.storage.from('lesson-videos').createSignedUrl(path, 60 * 60 * 3);
    if (error || !data) throw error ?? new Error('NO_URL');
    return data.signedUrl;
  },

  // ---- ата-ана байланысы ----
  myLinks: () => rpc<LinkRow[]>('my_links'),
  requestLink: (phone: string) => rpc<void>('request_student_link', { p_phone: phone }),
  respondLink: (id: string, approve: boolean) => rpc<void>('respond_link', { p_link: id, p_approve: approve }),
  removeLink: (id: string) => rpc<void>('remove_link', { p_link: id }),

  // ---- қоғамдық ----
  async news(limit?: number): Promise<NewsItem[]> {
    let q = supabase.from('news').select('*').eq('published', true).order('published_at', { ascending: false });
    if (limit) q = q.limit(limit);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as NewsItem[];
  },
  async newsItem(id: string): Promise<NewsItem | null> {
    const { data, error } = await supabase.from('news').select('*').eq('id', id).eq('published', true).maybeSingle();
    if (error) throw error;
    return data as NewsItem | null;
  },
  async content(kind: ContentItem['kind'], limit?: number): Promise<ContentItem[]> {
    let q = supabase.from('content_items').select('*').eq('kind', kind)
      .order('sort_order', { ascending: true }).order('created_at', { ascending: false });
    if (limit) q = q.limit(limit);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as ContentItem[];
  },
  async siteData(): Promise<{ settings: Record<string, string>; social: SocialLink[] }> {
    const [s, l] = await Promise.all([
      supabase.from('site_settings').select('key,value'),
      supabase.from('social_links').select('*').order('sort_order'),
    ]);
    if (s.error) throw s.error;
    if (l.error) throw l.error;
    const settings: Record<string, string> = {};
    (s.data ?? []).forEach((r: { key: string; value: string }) => { settings[r.key] = r.value; });
    return { settings, social: (l.data ?? []) as SocialLink[] };
  },

  // ---- admin ----
  adminStats: () => rpc<AdminStats>('admin_stats'),
  dashboard: (days = 14) => rpc<DashboardData>('admin_dashboard', { p_days: days }),
  people: (role: 'student' | 'parent' | 'admin', search = '') =>
    rpc<AdminPerson[]>('admin_people', { p_role: role, p_search: search }),
  logs: (limit = 100, entity = '') => rpc<AdminLogs>('admin_logs', { p_limit: limit, p_entity: entity }),
  saveQuestion: (testId: string, q: unknown) => rpc<string>('admin_save_question', { p_test: testId, p_question: q }),

  // ---- сабақ кестесі (жазу — тек director, RLS серверде тексереді) ----
  timetable: () => rpc<TimetableEntry[]>('timetable_list'),
  timetableCatalog: () => rpc<TimetableCatalog>('timetable_catalog'),
  timetableHistory: (limit = 100) => rpc<TimetableHistoryRow[]>('timetable_history', { p_limit: limit }),
  async adminTest(lessonId: string): Promise<AdminTest | null> {
    const { data, error } = await supabase
      .from('tests')
      .select('*, questions(*, answer_options(*))')
      .eq('lesson_id', lessonId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const t = data as AdminTest;
    t.questions = [...(t.questions ?? [])].sort((a, b) => a.sort_order - b.sort_order);
    t.questions.forEach((q) => {
      q.answer_options = [...(q.answer_options ?? [])].sort((a, b) => a.sort_order - b.sort_order);
    });
    return t;
  },
};

export async function uploadPublic(bucket: 'news-images' | 'site-media', file: File): Promise<string> {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const path = `${crypto.randomUUID()}.${ext || 'jpg'}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '31536000', contentType: file.type || undefined,
  });
  if (error) throw error;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
