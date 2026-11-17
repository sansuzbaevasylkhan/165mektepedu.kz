import { createClient } from '@supabase/supabase-js';
import { supabase, phoneToEmail, SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase';
import { toE164 } from './phone';
import type {
  AdminLogs, AdminPerson, AdminStats, AdminTest, AdmissionApplication, AdmissionApplicationList,
  AdmissionDashboardData, AdmissionDocumentType, AdmissionDocumentTypeInput,
  AdmissionDocumentTypePreviews, AdmissionPermissions, AdmissionTeacher,
  AcademicAnalytics, AcademicYear, AssignmentDetail, AssignmentFile, AssignmentHistoryRow,
  AssignmentInput, AssignmentTeacherRow, AssignmentAudience, AppNotification, Catalog,
  ClassCatalogRow, ClassRoster, ContentItem, DashboardData, DirectorAdminRow,
  JournalData, JournalKind, LessonAttendanceStatus, LessonDetail, LinkRow, MySubject,
  NewsItem, Overview, SocialLink, StudentAssignment, StudentProgress,
  SubjectAdminRow, SubmissionRow, TeacherAdminPermissions, TeacherAuditRow, TeacherClassStudent,
  TeacherCreateInput, TeacherDashboardData, TeacherDetail, TeacherListItem,
  TeacherMessage, TeacherPanelDashboard, TeacherProfileInput, TeacherReportRow,
  TeacherTask, TeacherTaskStatus, TeacherWorkloadRow, TestPublic, TestResult,
  TimetableCatalog, TimetableEntry, TimetableHistoryRow, MessageAudience,
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

  // ---- мектепке қабылдау / құжаттар орталығы ----
  admission: {
    myPermissions: () => rpc<AdmissionPermissions>('admission_my_permissions'),
    myApplications: () => rpc<{ permissions: AdmissionPermissions; applications: AdmissionApplication[] }>('admission_my_applications'),
    requirementsPreview: (grade: number) => rpc<AdmissionDocumentTypePreviews>('admission_requirements_preview', { p_grade: grade }),
    createApplication: (p: {
      firstName: string; lastName: string; grade: number;
      birthDate?: string | null; iin?: string | null; note?: string;
    }) => rpc<string>('admission_create_application', {
      p_first_name: p.firstName, p_last_name: p.lastName, p_grade: p.grade,
      p_birth_date: p.birthDate || null, p_iin: p.iin || null, p_note: p.note ?? '',
    }),
    uploadDocument: (application: string, requirement: string, fileName: string, storagePath: string) =>
      rpc<string>('admission_upload_document', {
        p_application: application, p_requirement: requirement,
        p_file_name: fileName, p_storage_path: storagePath,
      }),
    replaceDocument: (document: string, fileName: string, storagePath: string) =>
      rpc<string>('admission_replace_document', {
        p_document: document, p_file_name: fileName, p_storage_path: storagePath,
      }),
    deleteDocument: (document: string) => rpc<void>('admission_delete_document', { p_document: document }),
    applications: (status = '', search = '') =>
      rpc<AdmissionApplicationList>('admission_applications_list', { p_status: status, p_search: search }),
    application: (id: string) => rpc<AdmissionApplication>('admission_application_detail', { p_id: id }),
    updateStatus: (id: string, status: string, comment = '') =>
      rpc<void>('admission_update_status', { p_id: id, p_status: status, p_comment: comment }),
    addComment: (id: string, comment: string) =>
      rpc<void>('admission_add_comment', { p_id: id, p_comment: comment }),
    reviewDocument: (document: string, status: string, comment = '') =>
      rpc<void>('admission_review_document', { p_document: document, p_status: status, p_comment: comment }),
    dashboard: () => rpc<AdmissionDashboardData>('admission_dashboard'),
    documentTypes: () => rpc<AdmissionDocumentType[]>('admission_document_types_list'),
    saveDocumentType: (p: AdmissionDocumentTypeInput) =>
      rpc<string>('admission_save_document_type', {
        p_id: p.id || null, p_code: p.code,
        p_name_kk: p.name_kk, p_name_ru: p.name_ru, p_name_en: p.name_en,
        p_description_kk: p.description_kk, p_description_ru: p.description_ru, p_description_en: p.description_en,
        p_category: p.category, p_required: p.required, p_formats: p.formats, p_max_mb: p.max_mb,
        p_grades: p.grades && p.grades.length ? p.grades : null, p_multiple: p.multiple,
        p_active: p.active, p_sort_order: p.sort_order,
      }),
    toggleDocumentType: (id: string, active: boolean) =>
      rpc<void>('admission_toggle_document_type', { p_id: id, p_active: active }),
    reorderDocumentTypes: (ids: string[]) =>
      rpc<void>('admission_reorder_document_types', { p_ids: ids }),
    teachers: () => rpc<AdmissionTeacher[]>('admission_teachers'),
    setPermission: (user: string, key: string, allowed: boolean) =>
      rpc<void>('admission_set_permission', { p_user: user, p_key: key, p_allowed: allowed }),
    signedUrl: async (path: string) => {
      const { data, error } = await supabase.storage.from('admission-documents').createSignedUrl(path, 60 * 30);
      if (error || !data) throw error ?? new Error('NO_URL');
      return data.signedUrl;
    },
    uploadFile: async (applicationId: string, file: File): Promise<{ path: string; name: string }> => {
      const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
      const path = `${applicationId}/${crypto.randomUUID()}.${ext || 'bin'}`;
      const { error } = await supabase.storage.from('admission-documents').upload(path, file, {
        cacheControl: '3600', contentType: file.type || undefined,
      });
      if (error) throw error;
      return { path, name: file.name };
    },
  },

  // ---- мұғалімдерді басқару (ADMIN + DIRECTOR) ----
  teacher: {
    permissions: () => rpc<TeacherAdminPermissions>('teacher_admin_my_permissions'),
    dashboard: () => rpc<TeacherDashboardData>('teacher_dashboard'),
    list: (p: { search?: string; subject?: string | null; klass?: string | null; status?: string } = {}) =>
      rpc<TeacherListItem[]>('teacher_list', {
        p_search: p.search ?? '', p_subject: p.subject || null,
        p_class: p.klass || null, p_status: p.status ?? '',
      }),
    detail: (id: string) => rpc<TeacherDetail>('teacher_detail', { p_id: id }),
    mySubjects: () => rpc<MySubject[]>('teacher_my_subjects'),
    panelDashboard: () => rpc<TeacherPanelDashboard>('teacher_panel_dashboard'),
    classStudents: (subject: string, klass: string) =>
      rpc<TeacherClassStudent[]>('teacher_class_students', { p_subject: subject, p_class: klass }),
    saveProfile: (id: string, data: TeacherProfileInput) =>
      rpc<void>('teacher_save_profile', { p_id: id, p_data: data }),
    setAccount: (id: string, action: 'block' | 'unblock' | 'archive' | 'restore' | 'reset_password', opts: {
      reason?: string; until?: string | null; password?: string;
    } = {}) => rpc<void>('teacher_set_account', {
      p_id: id, p_action: action, p_reason: opts.reason ?? '',
      p_until: opts.until ?? null, p_password: opts.password ?? '',
    }),

    async create(input: TeacherCreateInput): Promise<string> {
      // Бөлек anon клиент — әкімшінің сессиясына әсер етпейді, service_role қолданылмайды.
      const temp = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      });
      const digits = input.phone.replace(/\D/g, '').slice(-10);
      const { data, error } = await temp.auth.signUp({
        email: phoneToEmail(digits),
        password: input.password,
        options: {
          data: {
            role: 'student',
            first_name: input.first_name.trim(),
            last_name: input.last_name.trim(),
            phone: toE164(digits),
          },
        },
      });
      if (error) throw error;
      const userId = data.user?.id;
      if (!userId) throw new Error('SIGNUP_FAILED');
      await rpc<void>('teacher_finalize_account', {
        p_user: userId,
        p_data: {
          first_name: input.first_name.trim(),
          last_name: input.last_name.trim(),
          phone: toE164(digits),
          email: input.email ?? '',
          photo_url: input.photo_url ?? '',
          hired_at: input.hired_at ?? '',
          birth_date: input.birth_date ?? '',
          qualification: input.qualification ?? '',
          address: input.address ?? '',
          notes: input.notes ?? '',
          employment_status: input.employment_status ?? 'active',
          assignments: input.assignments ?? [],
        },
      });
      return userId;
    },

    tasks: (status = '', teacher: string | null = null) =>
      rpc<TeacherTask[]>('teacher_task_list', { p_status: status, p_teacher: teacher }),
    myTasks: () => rpc<TeacherTask[]>('teacher_my_tasks'),
    createTask: (p: { teacher: string; title: string; description?: string; priority?: string; due?: string | null }) =>
      rpc<string>('teacher_task_create', {
        p_teacher: p.teacher, p_title: p.title, p_description: p.description ?? '',
        p_priority: p.priority ?? 'normal', p_due: p.due || null,
      }),
    setTaskStatus: (task: string, status: TeacherTaskStatus) =>
      rpc<void>('teacher_task_set_status', { p_task: task, p_status: status }),

    async uploadDocument(teacher: string, p: {
      kind: string; title: string; file: File;
    }): Promise<string> {
      const ext = (p.file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
      const path = `${teacher}/${crypto.randomUUID()}.${ext || 'bin'}`;
      const { error } = await supabase.storage.from('teacher-documents').upload(path, p.file, {
        cacheControl: '3600', contentType: p.file.type || undefined,
      });
      if (error) throw error;
      return rpc<string>('teacher_add_document', {
        p_teacher: teacher, p_kind: p.kind, p_title: p.title,
        p_file_name: p.file.name, p_storage_path: path,
        p_mime: p.file.type || null, p_size: p.file.size,
      });
    },
    signedDocumentUrl: async (path: string) => {
      const { data, error } = await supabase.storage.from('teacher-documents').createSignedUrl(path, 60 * 15);
      if (error || !data) throw error ?? new Error('NO_URL');
      return data.signedUrl;
    },
    reviewDocument: (doc: string, verified: boolean, note = '') =>
      rpc<void>('teacher_review_document', { p_doc: doc, p_verified: verified, p_note: note }),
    async deleteDocument(doc: string): Promise<void> {
      const path = await rpc<string>('teacher_delete_document', { p_doc: doc });
      if (path) await supabase.storage.from('teacher-documents').remove([path]);
    },
    attendanceAdd: (p: {
      teacher: string; date: string; checkIn?: string | null; checkOut?: string | null;
      status?: string; late?: number; note?: string;
    }) => rpc<void>('teacher_attendance_add', {
      p_teacher: p.teacher, p_date: p.date, p_check_in: p.checkIn || null,
      p_check_out: p.checkOut || null, p_status: p.status ?? 'present',
      p_late: p.late ?? 0, p_note: p.note ?? '',
    }),
    workLogAdd: (p: {
      teacher: string; date: string; subject: string | null; klass: string;
      topic: string; status?: string; note?: string;
    }) => rpc<void>('teacher_work_log_add', {
      p_teacher: p.teacher, p_date: p.date, p_subject: p.subject || null,
      p_class: p.klass, p_topic: p.topic, p_status: p.status ?? 'conducted', p_note: p.note ?? '',
    }),
    reportAdd: (p: { teacher: string; start: string; end: string; title: string; content?: string }) =>
      rpc<string>('teacher_report_add', {
        p_teacher: p.teacher, p_start: p.start, p_end: p.end,
        p_title: p.title, p_content: p.content ?? '',
      }),
    reportReview: (report: string, status: 'submitted' | 'approved' | 'revision') =>
      rpc<void>('teacher_report_review', { p_report: report, p_status: status }),
    audit: (limit = 100) => rpc<TeacherAuditRow[]>('teacher_audit_list', { p_limit: limit }),
  },

  // ---- пәндер, оқу жылдары, жүктеме, сыныптар ----
  academics: {
    subjects: {
      list: (search = '', includeArchived = true) =>
        rpc<SubjectAdminRow[]>('subjects_admin_list', {
          p_search: search, p_include_archived: includeArchived,
        }),
      save: (p: { id?: string | null; title: string; description?: string; sort_order?: number | null }) =>
        rpc<string>('subject_save', {
          p_id: p.id ?? null, p_title: p.title,
          p_description: p.description ?? '', p_sort_order: p.sort_order ?? null,
        }),
      setActive: (id: string, active: boolean) =>
        rpc<void>('subject_set_active', { p_id: id, p_active: active }),
      remove: (id: string) => rpc<string>('subject_delete', { p_id: id }),
    },
    years: {
      list: () => rpc<AcademicYear[]>('academic_year_list'),
      save: (p: { id?: string | null; name: string; starts: string; ends: string; current?: boolean }) =>
        rpc<string>('academic_year_save', {
          p_id: p.id ?? null, p_name: p.name, p_starts: p.starts,
          p_ends: p.ends, p_current: p.current ?? false,
        }),
      setCurrent: (id: string) => rpc<void>('academic_year_set_current', { p_id: id }),
    },
    workload: {
      teachers: () => rpc<TeacherWorkloadRow[]>('teacher_workload_list'),
      saveAssignment: (p: {
        teacher: string; subject: string; classes: string[];
        hours: number; year?: string | null; term?: string;
      }) => rpc<string>('teacher_assignment_save', {
        p_teacher: p.teacher, p_subject: p.subject, p_classes: p.classes,
        p_hours: p.hours, p_year: p.year ?? null, p_term: p.term ?? 'year',
      }),
      removeAssignment: (id: string) => rpc<void>('teacher_assignment_remove', { p_id: id }),
      removeClass: (id: string, klass: string) =>
        rpc<void>('teacher_assignment_remove_class', { p_id: id, p_class: klass }),
    },
    classes: {
      catalog: () => rpc<ClassCatalogRow[]>('class_catalog'),
      roster: (klass: string, year?: string | null) =>
        rpc<ClassRoster>('class_roster_get', { p_class: klass, p_year: year ?? null }),
      setRoster: (klass: string, students: string[], year?: string | null) =>
        rpc<void>('class_roster_set', {
          p_class: klass, p_student_ids: students, p_year: year ?? null,
        }),
    },
    analytics: () => rpc<AcademicAnalytics>('academic_analytics'),
  },

  // ---- тапсырмалар (мұғалім ↔ оқушы) ----
  assignments: {
    teacherList: (p: { subject?: string | null; klass?: string; status?: string } = {}) =>
      rpc<AssignmentTeacherRow[]>('assignment_teacher_list', {
        p_subject: p.subject || null, p_class: p.klass ?? '', p_status: p.status ?? '',
      }),
    detail: (id: string) => rpc<AssignmentDetail>('assignment_detail', { p_id: id }),
    save: (input: AssignmentInput) => rpc<string>('assignment_save', { p_data: input }),
    publish: (id: string) => rpc<void>('assignment_publish', { p_id: id }),
    close: (id: string) => rpc<void>('assignment_close', { p_id: id }),
    async remove(id: string): Promise<void> {
      const paths = await rpc<string[]>('assignment_delete', { p_id: id });
      if (paths?.length) await supabase.storage.from('assignment-files').remove(paths);
    },
    uploadFile: async (assignment: string, file: File, kind: 'material' | 'attachment' | 'video' = 'material') => {
      const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
      const path = `${assignment}/material/${crypto.randomUUID()}.${ext || 'bin'}`;
      const { error } = await supabase.storage.from('assignment-files').upload(path, file, {
        cacheControl: '3600', contentType: file.type || undefined,
      });
      if (error) throw error;
      return rpc<string>('assignment_file_add', {
        p_assignment: assignment, p_kind: kind, p_file_name: file.name,
        p_storage_path: path, p_mime: file.type || null, p_size: file.size,
      });
    },
    async removeFile(file: string): Promise<void> {
      const path = await rpc<string>('assignment_file_remove', { p_file: file });
      if (path) await supabase.storage.from('assignment-files').remove([path]);
    },
    signedUrl: async (path: string) => {
      const { data, error } = await supabase.storage.from('assignment-files').createSignedUrl(path, 60 * 15);
      if (error || !data) throw error ?? new Error('NO_URL');
      return data.signedUrl;
    },
    submit: (id: string, text: string) =>
      rpc<string>('assignment_submit', { p_id: id, p_text: text }),
    uploadSubmissionFile: async (assignment: string, submission: string, file: File) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('NO_USER');
      const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
      const path = `${assignment}/submission/${user.id}/${crypto.randomUUID()}.${ext || 'bin'}`;
      const { error } = await supabase.storage.from('assignment-files').upload(path, file, {
        cacheControl: '3600', contentType: file.type || undefined,
      });
      if (error) throw error;
      return rpc<string>('submission_file_add', {
        p_submission: submission, p_file_name: file.name,
        p_storage_path: path, p_mime: file.type || null, p_size: file.size,
      });
    },
    review: (submission: string, score: number | null, feedback: string, action: 'check' | 'return') =>
      rpc<void>('submission_review', {
        p_submission: submission, p_score: score ?? 0,
        p_feedback: feedback, p_action: action,
      }),
    studentList: () => rpc<StudentAssignment[]>('assignment_student_list'),
    history: (assignment: string) =>
      rpc<AssignmentHistoryRow[]>('assignment_history_list', { p_assignment: assignment }),
  },

  // ---- электронды журнал ----
  journal: {
    get: (p: { subject: string; klass: string; term: string; date?: string }) =>
      rpc<JournalData>('journal_get', {
        p_subject: p.subject, p_class: p.klass, p_term: p.term,
        p_date: p.date ?? new Date().toISOString().slice(0, 10),
      }),
    saveGrade: (p: {
      student: string; subject: string; klass: string; term: string;
      kind: JournalKind; score: number; max?: number; date?: string; comment?: string;
    }) => rpc<string>('journal_grade_save', {
      p_student: p.student, p_subject: p.subject, p_class: p.klass, p_term: p.term,
      p_kind: p.kind, p_score: p.score, p_max: p.max ?? 100,
      p_date: p.date ?? new Date().toISOString().slice(0, 10), p_comment: p.comment ?? '',
    }),
    deleteGrade: (id: string) => rpc<void>('journal_grade_delete', { p_id: id }),
    saveAttendance: (p: {
      subject: string; klass: string; date: string; start?: string | null;
      entries: { student_id: string; status: LessonAttendanceStatus; note?: string }[];
    }) => rpc<void>('lesson_attendance_save', {
      p_subject: p.subject, p_class: p.klass, p_date: p.date,
      p_start: p.start ?? null, p_entries: p.entries,
    }),
    progress: (student: string) => rpc<StudentProgress>('student_progress', { p_student: student }),
  },

  // ---- хабарламалар ----
  messages: {
    send: (p: {
      audience: MessageAudience; title: string; body: string;
      recipient?: string | null; klass?: string; subject?: string | null;
      important?: boolean; student?: string | null;
    }) => rpc<number>('teacher_message_send', {
      p_audience: p.audience, p_recipient: p.recipient ?? null, p_class: p.klass ?? '',
      p_subject: p.subject ?? null, p_title: p.title, p_body: p.body,
      p_important: p.important ?? false, p_student: p.student ?? null,
    }),
    mine: (limit = 50) => rpc<TeacherMessage[]>('my_messages', { p_limit: limit }),
    markRead: (id: string) => rpc<void>('message_mark_read', { p_id: id }),
    unread: () => rpc<number>('message_unread_count'),
  },

  // ---- есептер ----
  reports: {
    generate: (start: string, end: string) =>
      rpc<string>('teacher_report_generate', { p_start: start, p_end: end }),
    directorList: (status = '') =>
      rpc<TeacherReportRow[]>('director_reports_list', { p_status: status }),
    async mine(): Promise<TeacherReportRow[]> {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('NO_USER');
      const { data, error } = await supabase
        .from('teacher_reports')
        .select('id,teacher_id,period_start,period_end,title,status,metrics,created_at,reviewed_at')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as TeacherReportRow[];
    },
  },

  // ---- директор: әкімші рұқсаттары ----
  director: {
    admins: () => rpc<DirectorAdminRow[]>('director_admin_list'),
    setAdminPermission: (admin: string, key: 'view' | 'documents' | 'edit' | 'accounts', allowed: boolean) =>
      rpc<void>('director_set_admin_permission', { p_admin: admin, p_key: key, p_allowed: allowed }),
  },

  // ---- хабарламалар (Realtime + браузер push) ----
  notifications: {
    async mine(limit = 40): Promise<AppNotification[]> {
      const { data, error } = await supabase
        .from('notifications').select('*')
        .order('created_at', { ascending: false }).limit(limit);
      if (error) throw error;
      return (data ?? []) as AppNotification[];
    },
    async markRead(id: string): Promise<void> {
      const { error } = await supabase.from('notifications')
        .update({ read_at: new Date().toISOString() }).eq('id', id).is('read_at', null);
      if (error) throw error;
    },
    async markAllRead(): Promise<void> {
      const { error } = await supabase.from('notifications')
        .update({ read_at: new Date().toISOString() }).is('read_at', null);
      if (error) throw error;
    },
  },

  // ---- сабақ кестесі (жазу — тек director, RLS серверде тексереді) ----
  timetable: () => rpc<TimetableEntry[]>('timetable_list'),  timetableCatalog: () => rpc<TimetableCatalog>('timetable_catalog'),
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
