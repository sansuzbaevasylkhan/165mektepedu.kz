-- =====================================================================
-- 165 MEKTEP — SMART SCHOOL кеңейтуі
-- Аватар, марапат/сертификат, оқу материалдары, мұғалім онлайн тесттері.
-- Additive migration: бар кестелерді қайта жазбайды.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. ПРОФИЛЬ: аватар
-- ---------------------------------------------------------------------
alter table public.profiles
  add column if not exists avatar_path text;

-- ---------------------------------------------------------------------
-- 2. МАРАПАТТАР ЖӘНЕ СЕРТИФИКАТТАР
-- ---------------------------------------------------------------------
create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (char_length(code) between 2 and 40),
  title text not null check (char_length(title) between 1 and 120),
  description text not null default '' check (char_length(description) <= 400),
  icon text not null default 'star',
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.achievements(code, title, description, icon, sort_order)
values
  ('excellent', 'Үздік оқушы', 'Орташа балл 4.5 және одан жоғары', 'trophy', 10),
  ('good', 'Жақсы үлгерім', 'Орташа балл 4.0 және одан жоғары', 'star', 20),
  ('attendance', 'Үлгілі қатысым', 'Сабаққа қатысу 95%-дан жоғары', 'check', 30),
  ('homework', 'Тапсырма шебері', 'Кемінде 5 тапсырма тексерілген', 'clipboard', 40),
  ('perfect-test', '100% нәтиже', 'Тестті 100%-ға тапсыру', 'chart', 50),
  ('active', 'Белсенді оқушы', 'Кемінде 10 баға алу', 'cap', 60)
on conflict (code) do nothing;

create table if not exists public.student_achievements (
  student_id uuid not null references public.profiles(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  awarded_by uuid references public.profiles(id) on delete set null,
  awarded_at timestamptz not null default now(),
  note text not null default '' check (char_length(note) <= 300),
  primary key (student_id, achievement_id)
);
create index if not exists student_achievements_student_idx
  on public.student_achievements(student_id, awarded_at desc);

create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  description text not null default '' check (char_length(description) <= 1000),
  number text unique,
  issued_by uuid references public.profiles(id) on delete set null,
  issued_at date not null default current_date,
  file_path text,
  revoked boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists certificates_student_idx
  on public.certificates(student_id, issued_at desc);

-- ---------------------------------------------------------------------
-- 3. ОҚУ МАТЕРИАЛДАРЫ
-- ---------------------------------------------------------------------
create table if not exists public.study_materials (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  academic_year_id uuid references public.academic_years(id) on delete set null,
  class_name text not null check (char_length(class_name) between 1 and 20),
  title text not null check (char_length(title) between 1 and 200),
  description text not null default '' check (char_length(description) <= 1000),
  file_name text not null check (char_length(file_name) between 1 and 260),
  storage_path text not null unique,
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes between 0 and 20971520),
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists study_materials_class_idx
  on public.study_materials(class_name, created_at desc);
create index if not exists study_materials_subject_idx
  on public.study_materials(subject_id, class_name);

drop trigger if exists study_materials_updated on public.study_materials;
create trigger study_materials_updated before update on public.study_materials
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 4. МҰҒАЛІМ ОНЛАЙН ТЕСТТЕРІ
-- ---------------------------------------------------------------------
create table if not exists public.class_tests (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  academic_year_id uuid references public.academic_years(id) on delete set null,
  class_name text not null check (char_length(class_name) between 1 and 20),
  term text not null default 'year' check (term in ('year','1','2','3','4')),
  title text not null check (char_length(title) between 1 and 200),
  description text not null default '' check (char_length(description) <= 2000),
  time_limit_minutes int not null default 0 check (time_limit_minutes between 0 and 300),
  pass_percent int not null default 60 check (pass_percent between 1 and 100),
  max_attempts int not null default 1 check (max_attempts between 1 and 10),
  status text not null default 'draft' check (status in ('draft','published','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists class_tests_teacher_idx
  on public.class_tests(teacher_id, created_at desc);
create index if not exists class_tests_class_idx
  on public.class_tests(class_name, status);

drop trigger if exists class_tests_updated on public.class_tests;
create trigger class_tests_updated before update on public.class_tests
  for each row execute function public.set_updated_at();

create table if not exists public.class_test_questions (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.class_tests(id) on delete cascade,
  text text not null check (char_length(text) between 1 and 2000),
  explanation text not null default '' check (char_length(explanation) <= 1000),
  points int not null default 1 check (points between 1 and 100),
  sort_order int not null default 0
);
create index if not exists class_test_questions_test_idx
  on public.class_test_questions(test_id, sort_order);

create table if not exists public.class_test_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.class_test_questions(id) on delete cascade,
  text text not null check (char_length(text) between 1 and 500),
  is_correct boolean not null default false,
  sort_order int not null default 0
);
create index if not exists class_test_options_question_idx
  on public.class_test_options(question_id, sort_order);

create table if not exists public.class_test_attempts (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.class_tests(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  score numeric(7,2) not null default 0,
  max_score numeric(7,2) not null default 0,
  percent numeric(5,1) not null default 0,
  passed boolean not null default false,
  status text not null default 'in_progress' check (status in ('in_progress','submitted')),
  created_at timestamptz not null default now()
);
create index if not exists class_test_attempts_test_idx
  on public.class_test_attempts(test_id, created_at desc);
create index if not exists class_test_attempts_student_idx
  on public.class_test_attempts(student_id, created_at desc);

create table if not exists public.class_test_answers (
  attempt_id uuid not null references public.class_test_attempts(id) on delete cascade,
  question_id uuid not null references public.class_test_questions(id) on delete cascade,
  option_id uuid references public.class_test_options(id) on delete set null,
  is_correct boolean not null default false,
  primary key (attempt_id, question_id)
);

-- ---------------------------------------------------------------------
-- 5. КӨМЕКШІ ФУНКЦИЯЛАР (RLS үшін)
-- ---------------------------------------------------------------------
create or replace function public.student_id_is_self(p_class text) returns boolean
language sql stable security definer set search_path = public as $$
  select p_class <> '' and public.student_class(auth.uid()) = p_class;
$$;

create or replace function public.is_parent_of_class(p_class text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.parent_student_links l
    join public.class_members cm on cm.student_id = l.student_id
    where l.parent_id = auth.uid() and l.status = 'approved'
      and cm.class_name = p_class
      and cm.academic_year_id = public.current_academic_year()
  );
$$;

-- ---------------------------------------------------------------------
-- 6. RLS
-- ---------------------------------------------------------------------
alter table public.achievements enable row level security;
alter table public.student_achievements enable row level security;
alter table public.certificates enable row level security;
alter table public.study_materials enable row level security;
alter table public.class_tests enable row level security;
alter table public.class_test_questions enable row level security;
alter table public.class_test_options enable row level security;
alter table public.class_test_attempts enable row level security;
alter table public.class_test_answers enable row level security;

drop policy if exists achievements_select on public.achievements;
create policy achievements_select on public.achievements
  for select to authenticated using (active or public.is_staff());

drop policy if exists student_achievements_select on public.student_achievements;
create policy student_achievements_select on public.student_achievements
  for select to authenticated
  using (
    student_id = auth.uid()
    or public.is_parent_of(student_id)
    or public.is_director()
    or public.teacher_admin_has('view')
  );

drop policy if exists certificates_select on public.certificates;
create policy certificates_select on public.certificates
  for select to authenticated
  using (
    student_id = auth.uid()
    or public.is_parent_of(student_id)
    or public.is_director()
    or public.teacher_admin_has('view')
  );

drop policy if exists study_materials_select on public.study_materials;
create policy study_materials_select on public.study_materials
  for select to authenticated
  using (
    public.is_director()
    or public.teacher_admin_has('view')
    or teacher_id = auth.uid()
    or (public.is_teacher() and public.teacher_can_teach(subject_id, class_name))
    or (student_id_is_self(class_name) and published)
    or (public.is_parent_of_class(class_name) and published)
  );

drop policy if exists class_tests_select on public.class_tests;
create policy class_tests_select on public.class_tests
  for select to authenticated
  using (
    teacher_id = auth.uid()
    or public.is_director()
    or public.teacher_admin_has('view')
    or (
      status in ('published','closed')
      and (
        class_name = public.student_class(auth.uid())
        or public.is_parent_of_class(class_name)
      )
    )
  );

drop policy if exists class_test_questions_select on public.class_test_questions;
create policy class_test_questions_select on public.class_test_questions
  for select to authenticated
  using (
    public.is_director()
    or public.teacher_admin_has('view')
    or exists (
      select 1 from public.class_tests t
      where t.id = test_id and t.teacher_id = auth.uid()
    )
  );

drop policy if exists class_test_options_select on public.class_test_options;
create policy class_test_options_select on public.class_test_options
  for select to authenticated
  using (
    public.is_director()
    or public.teacher_admin_has('view')
    or exists (
      select 1 from public.class_test_questions q
      join public.class_tests t on t.id = q.test_id
      where q.id = question_id and t.teacher_id = auth.uid()
    )
  );

drop policy if exists class_test_attempts_select on public.class_test_attempts;
create policy class_test_attempts_select on public.class_test_attempts
  for select to authenticated
  using (
    student_id = auth.uid()
    or public.is_parent_of(student_id)
    or public.is_director()
    or public.teacher_admin_has('view')
    or exists (select 1 from public.class_tests t where t.id = test_id and t.teacher_id = auth.uid())
  );

drop policy if exists class_test_answers_select on public.class_test_answers;
create policy class_test_answers_select on public.class_test_answers
  for select to authenticated
  using (
    public.is_director()
    or public.teacher_admin_has('view')
    or exists (
      select 1 from public.class_test_attempts a
      join public.class_tests t on t.id = a.test_id
      where a.id = attempt_id and t.teacher_id = auth.uid()
    )
  );

revoke insert, update, delete on public.achievements from authenticated, anon;
revoke insert, update, delete on public.student_achievements from authenticated, anon;
revoke insert, update, delete on public.certificates from authenticated, anon;
revoke insert, update, delete on public.study_materials from authenticated, anon;
revoke insert, update, delete on public.class_tests from authenticated, anon;
revoke insert, update, delete on public.class_test_questions from authenticated, anon;
revoke insert, update, delete on public.class_test_options from authenticated, anon;
revoke insert, update, delete on public.class_test_attempts from authenticated, anon;
revoke insert, update, delete on public.class_test_answers from authenticated, anon;

grant select on public.achievements to authenticated;
grant select on public.student_achievements to authenticated;
grant select on public.certificates to authenticated;
grant select on public.study_materials to authenticated;
grant select on public.class_tests to authenticated;
grant select on public.class_test_questions to authenticated;
grant select on public.class_test_options to authenticated;
grant select on public.class_test_attempts to authenticated;
grant select on public.class_test_answers to authenticated;

-- ---------------------------------------------------------------------
-- 7. КӨМЕКШІ ФУНКЦИЯЛАР: STUDENT SNAPSHOT
-- ---------------------------------------------------------------------
create or replace function public._student_snapshot(p_student uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_class text := public.student_class(p_student);
  v_gpa numeric := 0;
  v_att_pct numeric := 0;
  v_grades int := 0;
  v_checked int := 0;
  v_perfect boolean := false;
  v_achievements jsonb;
begin
  select coalesce(round(avg(j.score / nullif(j.max_score, 0)) * 5, 2), 0), count(*)
    into v_gpa, v_grades
    from public.journal_entries j where j.student_id = p_student;

  select coalesce(round(100.0 * count(*) filter (where status in ('present','late')) / nullif(count(*), 0), 1), 0)
    into v_att_pct
    from public.lesson_attendance where student_id = p_student;

  select count(*) into v_checked
    from public.assignment_submissions
    where student_id = p_student and status = 'checked';

  select exists (select 1 from public.class_test_attempts where student_id = p_student and status = 'submitted' and percent = 100)
      or exists (select 1 from public.test_attempts where user_id = p_student and percent = 100)
    into v_perfect;

  select coalesce(jsonb_agg(jsonb_build_object(
    'code', a.code,
    'title', a.title,
    'description', a.description,
    'icon', a.icon,
    'got', coalesce(
      (select true from public.student_achievements sa
        where sa.student_id = p_student and sa.achievement_id = a.id),
      case a.code
        when 'excellent' then v_gpa >= 4.5
        when 'good' then v_gpa >= 4
        when 'attendance' then v_att_pct >= 95
        when 'homework' then v_checked >= 5
        when 'perfect-test' then v_perfect
        when 'active' then v_grades >= 10
        else false end,
      false),
    'awarded_at', (select sa.awarded_at from public.student_achievements sa
                    where sa.student_id = p_student and sa.achievement_id = a.id)
  ) order by a.sort_order), '[]'::jsonb)
  into v_achievements
  from public.achievements a
  where a.active;

  return jsonb_build_object(
    'profile', (
      select jsonb_build_object(
        'id', p.id, 'first_name', p.first_name, 'last_name', p.last_name,
        'phone', p.phone, 'role', p.role, 'avatar_path', p.avatar_path
      ) from public.profiles p where p.id = p_student
    ),
    'class_name', v_class,
    'academic_year', (select name from public.academic_years where id = public.current_academic_year()),
    'gpa', v_gpa,
    'grades_count', v_grades,
    'attendance_percent', v_att_pct,
    'attendance', (
      select jsonb_build_object(
        'total', count(*),
        'present', count(*) filter (where status = 'present'),
        'late', count(*) filter (where status = 'late'),
        'excused', count(*) filter (where status = 'excused'),
        'absent', count(*) filter (where status = 'absent')
      ) from public.lesson_attendance where student_id = p_student
    ),
    'subjects', coalesce((
      select jsonb_agg(jsonb_build_object(
        'subject_id', x.subject_id, 'subject_title', x.title,
        'average', x.avg_pct, 'count', x.cnt
      ) order by x.title)
      from (
        select j.subject_id, s.title,
               round(avg(j.score / nullif(j.max_score, 0)) * 100, 1) avg_pct,
               count(*) cnt
        from public.journal_entries j
        join public.subjects s on s.id = j.subject_id
        where j.student_id = p_student
        group by j.subject_id, s.title
      ) x
    ), '[]'::jsonb),
    'recent_grades', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', g.id, 'subject_title', g.subject_title, 'kind', g.kind,
        'score', g.score, 'max_score', g.max_score,
        'lesson_date', g.lesson_date, 'comment', g.comment
      ) order by g.lesson_date desc, g.created_at desc)
      from (
        select j.id, s.title subject_title, j.kind, j.score, j.max_score,
               j.lesson_date, j.comment, j.created_at
        from public.journal_entries j
        join public.subjects s on s.id = j.subject_id
        where j.student_id = p_student
        order by j.lesson_date desc, j.created_at desc
        limit 10
      ) g
    ), '[]'::jsonb),
    'today_lessons', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', t.id, 'subject_title', coalesce(s.title, '—'),
        'teacher_name', coalesce(nullif(btrim(coalesce(tp.first_name,'') || ' ' || coalesce(tp.last_name,'')), ''), '—'),
        'start_time', t.start_time, 'end_time', t.end_time, 'room', t.room
      ) order by t.start_time)
      from public.timetable t
      left join public.subjects s on s.id = t.subject_id
      left join public.profiles tp on tp.id = t.teacher_id
      where v_class is not null and t.class_name = v_class
        and t.weekday = extract(isodow from current_date)
    ), '[]'::jsonb),
    'teachers', coalesce((
      select jsonb_agg(jsonb_build_object(
        'subject_id', x.subject_id, 'subject_title', x.subject_title,
        'teacher_id', x.teacher_id, 'teacher_name', x.teacher_name
      ) order by x.subject_title)
      from (
        select distinct ta.subject_id, s.title subject_title,
               ta.teacher_id,
               coalesce(nullif(btrim(coalesce(pr.first_name,'') || ' ' || coalesce(pr.last_name,'')), ''), '—') teacher_name
        from public.teacher_assignments ta
        join public.subjects s on s.id = ta.subject_id
        join public.profiles pr on pr.id = ta.teacher_id
        where v_class is not null and v_class = any(ta.classes)
      ) x
    ), '[]'::jsonb),
    'assignments', (
      select jsonb_build_object(
        'total', count(*),
        'pending', count(*) filter (
          where not exists (
            select 1 from public.assignment_submissions sub
            where sub.assignment_id = a.id and sub.student_id = p_student
              and sub.status in ('submitted','late','checked')
          )
        )
      )
      from public.assignments a
      where a.status = 'published'
        and (
          (v_class is not null and v_class = any(a.class_names))
          or exists (select 1 from public.assignment_targets t where t.assignment_id = a.id and t.student_id = p_student)
        )
    ),
    'achievements', v_achievements,
    'certificates', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', c.id, 'title', c.title, 'description', c.description,
        'number', c.number, 'issued_at', c.issued_at, 'file_path', c.file_path
      ) order by c.issued_at desc)
      from public.certificates c
      where c.student_id = p_student and not c.revoked
    ), '[]'::jsonb),
    'materials', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', m.id, 'subject_title', coalesce(s.title, '—'),
        'title', m.title, 'file_name', m.file_name,
        'storage_path', m.storage_path, 'mime_type', m.mime_type,
        'size_bytes', m.size_bytes, 'created_at', m.created_at
      ) order by m.created_at desc)
      from (
        select * from public.study_materials
        where published and v_class is not null and class_name = v_class
        order by created_at desc limit 10
      ) m
      left join public.subjects s on s.id = m.subject_id
    ), '[]'::jsonb)
  );
end $$;

-- ---------------------------------------------------------------------
-- 7. ОҚУШЫ / АТА-АНА DASHBOARD RPC
-- ---------------------------------------------------------------------
create or replace function public.student_dashboard() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_active() then raise exception 'FORBIDDEN'; end if;
  return public._student_snapshot(auth.uid());
end $$;

create or replace function public.parent_child_dashboard(p_student uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_active() then raise exception 'FORBIDDEN'; end if;
  if not (public.is_parent_of(p_student) or public.is_director()) then raise exception 'FORBIDDEN'; end if;
  return public._student_snapshot(p_student);
end $$;

create or replace function public.parent_children() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_active() then raise exception 'FORBIDDEN'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'student_id', p.id, 'first_name', p.first_name, 'last_name', p.last_name,
      'phone', p.phone, 'avatar_path', p.avatar_path,
      'class_name', public.student_class(p.id),
      'gpa', coalesce((select round(avg(j.score / nullif(j.max_score,0)) * 5, 2)
                       from public.journal_entries j where j.student_id = p.id), 0),
      'attendance_percent', coalesce((
        select round(100.0 * count(*) filter (where status in ('present','late')) / nullif(count(*),0), 1)
        from public.lesson_attendance where student_id = p.id), 0)
    ) order by p.last_name, p.first_name)
    from public.parent_student_links l
    join public.profiles p on p.id = l.student_id
    where l.parent_id = auth.uid() and l.status = 'approved' and not p.is_blocked
  ), '[]'::jsonb);
end $$;

-- Ата-ана → мұғалім хабарламасы (баланың сыныбындағы мұғалімге ғана)
create or replace function public.parent_message_send(
  p_teacher uuid, p_student uuid, p_title text, p_body text, p_important boolean default false
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_class text;
  v_title text := btrim(coalesce(p_title, ''));
  v_body text := coalesce(p_body, '');
begin
  if not public.is_active() then raise exception 'FORBIDDEN'; end if;
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'parent') then
    raise exception 'FORBIDDEN';
  end if;
  if not public.is_parent_of(p_student) then raise exception 'FORBIDDEN'; end if;
  if char_length(v_title) not between 1 and 200 then raise exception 'INVALID_TITLE'; end if;
  if char_length(v_body) > 5000 then raise exception 'INVALID_BODY'; end if;
  v_class := public.student_class(p_student);
  if v_class is null then raise exception 'NO_CLASS'; end if;
  if not exists (
    select 1 from public.teacher_assignments ta
    where ta.teacher_id = p_teacher and v_class = any(ta.classes)
  ) then raise exception 'FORBIDDEN'; end if;

  insert into public.teacher_messages(
    sender_id, recipient_id, audience, class_name, student_id, title, body, important
  )
  values (auth.uid(), p_teacher, 'individual', v_class, p_student, v_title, v_body, coalesce(p_important, false))
  returning id into v_id;

  insert into public.notifications(user_id, title, body, kind, link)
  values (p_teacher, 'Ата-ана хабарламасы: ' || v_title, left(v_body, 200), 'system', '/teacher/messages'),
         (p_student, 'Ата-ана мұғалімге хабарлама жіберді', left(v_title, 180), 'system', '/cabinet');

  return v_id;
end $$;

-- ---------------------------------------------------------------------
-- 8. АВАТАР
-- ---------------------------------------------------------------------
create or replace function public.profile_set_avatar(p_path text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'FORBIDDEN'; end if;
  if p_path is null or p_path = '' then
    update public.profiles set avatar_path = null where id = auth.uid();
    return;
  end if;
  if left(p_path, char_length(auth.uid()::text) + 1) <> auth.uid()::text || '/' then
    raise exception 'INVALID_PATH';
  end if;
  update public.profiles set avatar_path = p_path where id = auth.uid();
end $$;

-- ---------------------------------------------------------------------
-- 9. ОҚУ МАТЕРИАЛДАРЫ RPC
-- ---------------------------------------------------------------------
create or replace function public.study_material_list(p_class text default '') returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_class text := nullif(btrim(coalesce(p_class, '')), '');
  v_uid uuid := auth.uid();
  v_staff boolean := public.is_director() or public.teacher_admin_has('view');
begin
  if not public.is_active() then raise exception 'FORBIDDEN'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', m.id, 'subject_id', m.subject_id,
      'subject_title', coalesce(s.title, '—'),
      'class_name', m.class_name, 'title', m.title, 'description', m.description,
      'file_name', m.file_name, 'storage_path', m.storage_path,
      'mime_type', m.mime_type, 'size_bytes', m.size_bytes,
      'teacher_id', m.teacher_id,
      'teacher_name', coalesce(nullif(btrim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,'')), ''), '—'),
      'created_at', m.created_at
    ) order by m.created_at desc)
    from public.study_materials m
    join public.subjects s on s.id = m.subject_id
    join public.profiles p on p.id = m.teacher_id
    where (v_class is null or m.class_name = v_class)
      and (
        v_staff
        or m.teacher_id = v_uid
        or (public.is_teacher() and public.teacher_can_teach(m.subject_id, m.class_name) and (m.published or m.teacher_id = v_uid))
        or (public.student_class(v_uid) = m.class_name and m.published)
        or exists (
          select 1 from public.parent_student_links l
          join public.class_members cm on cm.student_id = l.student_id
          where l.parent_id = v_uid and l.status = 'approved'
            and cm.class_name = m.class_name and m.published
        )
      )
  ), '[]'::jsonb);
end $$;

create or replace function public.study_material_save(p_data jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := nullif(p_data->>'id', '')::uuid;
  v_subject uuid := nullif(p_data->>'subject_id', '')::uuid;
  v_class text := btrim(coalesce(p_data->>'class_name', ''));
  v_title text := btrim(coalesce(p_data->>'title', ''));
  v_desc text := coalesce(p_data->>'description', '');
  v_file text := btrim(coalesce(p_data->>'file_name', ''));
  v_path text := btrim(coalesce(p_data->>'storage_path', ''));
  v_size bigint := nullif(p_data->>'size_bytes', '')::bigint;
begin
  if not public.is_teacher() then raise exception 'FORBIDDEN'; end if;
  if v_subject is null or not public.teacher_can_teach(v_subject, v_class) then raise exception 'FORBIDDEN'; end if;
  if char_length(v_class) not between 1 and 20 then raise exception 'INVALID_CLASS'; end if;
  if char_length(v_title) not between 1 and 200 then raise exception 'INVALID_TITLE'; end if;
  if char_length(v_desc) > 1000 then raise exception 'INVALID_DESCRIPTION'; end if;
  if char_length(v_file) not between 1 and 260 then raise exception 'INVALID_FILE'; end if;
  if coalesce(v_size, 0) > 20971520 then raise exception 'FILE_TOO_LARGE'; end if;
  if left(v_path, char_length(auth.uid()::text) + 1) <> auth.uid()::text || '/' then
    raise exception 'INVALID_PATH';
  end if;

  if v_id is null then
    insert into public.study_materials(
      teacher_id, subject_id, academic_year_id, class_name,
      title, description, file_name, storage_path, mime_type, size_bytes
    )
    values (
      auth.uid(), v_subject, public.current_academic_year(), v_class,
      v_title, v_desc, v_file, v_path, nullif(p_data->>'mime_type', ''), v_size
    )
    returning id into v_id;
  else
    update public.study_materials set
      subject_id = v_subject, class_name = v_class, title = v_title,
      description = v_desc, file_name = v_file, storage_path = v_path,
      mime_type = nullif(p_data->>'mime_type', ''), size_bytes = v_size
    where id = v_id and teacher_id = auth.uid();
    if not found then raise exception 'FORBIDDEN'; end if;
  end if;
  return v_id;
end $$;

create or replace function public.study_material_delete(p_id uuid) returns text
language plpgsql security definer set search_path = public as $$
declare v_path text;
begin
  select storage_path into v_path from public.study_materials
   where id = p_id and teacher_id = auth.uid() for update;
  if not found then raise exception 'FORBIDDEN'; end if;
  delete from public.study_materials where id = p_id;
  return v_path;
end $$;

-- ---------------------------------------------------------------------
-- 10. МҰҒАЛІМ ТЕСТТЕРІ RPC
-- ---------------------------------------------------------------------
create or replace function public.class_test_save(p_data jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := nullif(p_data->>'id', '')::uuid;
  v_subject uuid := nullif(p_data->>'subject_id', '')::uuid;
  v_class text := btrim(coalesce(p_data->>'class_name', ''));
  v_title text := btrim(coalesce(p_data->>'title', ''));
  v_term text := coalesce(nullif(p_data->>'term', ''), 'year');
  v_limit int := coalesce((p_data->>'time_limit_minutes')::int, 0);
  v_pass int := coalesce((p_data->>'pass_percent')::int, 60);
  v_max int := coalesce((p_data->>'max_attempts')::int, 1);
  v_q jsonb;
  v_o jsonb;
  v_qid uuid;
  v_sort int := 0;
  v_ocount int;
begin
  if not public.is_teacher() then raise exception 'FORBIDDEN'; end if;
  if v_subject is null or not public.teacher_can_teach(v_subject, v_class) then raise exception 'FORBIDDEN'; end if;
  if char_length(v_class) not between 1 and 20 then raise exception 'INVALID_CLASS'; end if;
  if char_length(v_title) not between 1 and 200 then raise exception 'INVALID_TITLE'; end if;
  if v_term not in ('year','1','2','3','4') then v_term := 'year'; end if;
  if v_limit not between 0 and 300 then raise exception 'INVALID_LIMIT'; end if;
  if v_pass not between 1 and 100 then raise exception 'INVALID_PASS'; end if;
  if v_max not between 1 and 10 then raise exception 'INVALID_ATTEMPTS'; end if;
  if p_data->'questions' is null or jsonb_typeof(p_data->'questions') <> 'array'
     or jsonb_array_length(p_data->'questions') = 0 then
    raise exception 'NO_QUESTIONS';
  end if;

  if v_id is not null then
    if not exists (select 1 from public.class_tests where id = v_id and teacher_id = auth.uid()) then
      raise exception 'FORBIDDEN';
    end if;
    if exists (select 1 from public.class_test_attempts where test_id = v_id) then
      raise exception 'HAS_ATTEMPTS';
    end if;
    update public.class_tests set
      subject_id = v_subject, class_name = v_class, term = v_term,
      title = v_title, description = left(coalesce(p_data->>'description', ''), 2000),
      time_limit_minutes = v_limit, pass_percent = v_pass, max_attempts = v_max,
      academic_year_id = public.current_academic_year()
    where id = v_id;
    delete from public.class_test_questions where test_id = v_id;
  else
    insert into public.class_tests(
      teacher_id, subject_id, academic_year_id, class_name, term, title, description,
      time_limit_minutes, pass_percent, max_attempts
    )
    values (
      auth.uid(), v_subject, public.current_academic_year(), v_class, v_term, v_title,
      left(coalesce(p_data->>'description', ''), 2000), v_limit, v_pass, v_max
    )
    returning id into v_id;
  end if;

  for v_q in select * from jsonb_array_elements(p_data->'questions') loop
    if char_length(btrim(coalesce(v_q->>'text', ''))) not between 1 and 2000 then
      raise exception 'INVALID_QUESTION';
    end if;
    insert into public.class_test_questions(test_id, text, explanation, points, sort_order)
    values (
      v_id, btrim(v_q->>'text'), left(coalesce(v_q->>'explanation', ''), 1000),
      least(greatest(coalesce((v_q->>'points')::int, 1), 1), 100), v_sort
    )
    returning id into v_qid;
    v_sort := v_sort + 1;

    v_ocount := 0;
    for v_o in select * from jsonb_array_elements(coalesce(v_q->'options', '[]'::jsonb)) loop
      if char_length(btrim(coalesce(v_o->>'text', ''))) not between 1 and 500 then
        raise exception 'INVALID_OPTION';
      end if;
      insert into public.class_test_options(question_id, text, is_correct, sort_order)
      values (v_qid, btrim(v_o->>'text'), coalesce((v_o->>'is_correct')::boolean, false), v_ocount);
      v_ocount := v_ocount + 1;
    end loop;
    if v_ocount < 2 then raise exception 'NOT_ENOUGH_OPTIONS'; end if;
    if not exists (select 1 from public.class_test_options where question_id = v_qid and is_correct) then
      raise exception 'NO_CORRECT_OPTION';
    end if;
  end loop;

  return v_id;
end $$;

create or replace function public.class_test_list() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not (public.is_teacher() or public.is_director() or public.teacher_admin_has('view')) then
    raise exception 'FORBIDDEN';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', t.id, 'subject_id', t.subject_id, 'subject_title', coalesce(s.title, '—'),
      'class_name', t.class_name, 'term', t.term, 'title', t.title,
      'description', t.description, 'status', t.status,
      'time_limit_minutes', t.time_limit_minutes, 'pass_percent', t.pass_percent,
      'max_attempts', t.max_attempts,
      'questions', (select count(*) from public.class_test_questions q where q.test_id = t.id),
      'attempts', (select count(*) from public.class_test_attempts a where a.test_id = t.id),
      'created_at', t.created_at
    ) order by t.created_at desc)
    from public.class_tests t
    join public.subjects s on s.id = t.subject_id
    where t.teacher_id = auth.uid() or public.is_director() or public.teacher_admin_has('view')
  ), '[]'::jsonb);
end $$;

create or replace function public.class_test_detail(p_id uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_test public.class_tests;
begin
  select * into v_test from public.class_tests where id = p_id;
  if not found then raise exception 'NOT_FOUND'; end if;
  if not (v_test.teacher_id = auth.uid() or public.is_director() or public.teacher_admin_has('view')) then
    raise exception 'FORBIDDEN';
  end if;
  return jsonb_build_object(
    'id', v_test.id, 'subject_id', v_test.subject_id, 'class_name', v_test.class_name,
    'term', v_test.term, 'title', v_test.title, 'description', v_test.description,
    'time_limit_minutes', v_test.time_limit_minutes, 'pass_percent', v_test.pass_percent,
    'max_attempts', v_test.max_attempts, 'status', v_test.status,
    'questions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', q.id, 'text', q.text, 'explanation', q.explanation,
        'points', q.points,
        'options', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', o.id, 'text', o.text, 'is_correct', o.is_correct
          ) order by o.sort_order)
          from public.class_test_options o where o.question_id = q.id
        ), '[]'::jsonb)
      ) order by q.sort_order)
      from public.class_test_questions q where q.test_id = v_test.id
    ), '[]'::jsonb)
  );
end $$;

create or replace function public.class_test_set_status(p_id uuid, p_status text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_status not in ('draft','published','closed') then raise exception 'INVALID_STATUS'; end if;
  if p_status = 'published' and not exists (
    select 1 from public.class_test_questions where test_id = p_id
  ) then raise exception 'NO_QUESTIONS'; end if;
  update public.class_tests set status = p_status
   where id = p_id and teacher_id = auth.uid();
  if not found then raise exception 'FORBIDDEN'; end if;
end $$;

create or replace function public.class_test_delete(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.class_test_attempts where test_id = p_id) then
    raise exception 'HAS_ATTEMPTS';
  end if;
  delete from public.class_tests where id = p_id and teacher_id = auth.uid();
  if not found then raise exception 'FORBIDDEN'; end if;
end $$;

create or replace function public.class_test_available() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_class text := public.student_class(auth.uid());
begin
  if not public.is_active() then raise exception 'FORBIDDEN'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', t.id, 'title', t.title, 'description', t.description,
      'subject_title', coalesce(s.title, '—'),
      'class_name', t.class_name, 'term', t.term,
      'time_limit_minutes', t.time_limit_minutes, 'pass_percent', t.pass_percent,
      'max_attempts', t.max_attempts,
      'questions', (select count(*) from public.class_test_questions q where q.test_id = t.id),
      'attempts_used', (select count(*) from public.class_test_attempts a
                        where a.test_id = t.id and a.student_id = auth.uid() and a.status = 'submitted'),
      'best_percent', (select max(percent) from public.class_test_attempts a
                       where a.test_id = t.id and a.student_id = auth.uid() and a.status = 'submitted')
    ) order by t.created_at desc)
    from public.class_tests t
    join public.subjects s on s.id = t.subject_id
    where t.status = 'published' and v_class is not null and t.class_name = v_class
  ), '[]'::jsonb);
end $$;

create or replace function public.class_test_start(p_id uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_test public.class_tests;
  v_uid uuid := auth.uid();
  v_attempt public.class_test_attempts;
  v_used int;
begin
  if not public.is_active() then raise exception 'FORBIDDEN'; end if;
  if not exists (select 1 from public.profiles where id = v_uid and role = 'student') then
    raise exception 'FORBIDDEN';
  end if;
  select * into v_test from public.class_tests where id = p_id;
  if not found then raise exception 'NOT_FOUND'; end if;
  if v_test.status <> 'published' then raise exception 'NOT_OPEN'; end if;
  if public.student_class(v_uid) is distinct from v_test.class_name then raise exception 'FORBIDDEN'; end if;

  select count(*) into v_used from public.class_test_attempts
   where test_id = p_id and student_id = v_uid and status = 'submitted';
  if v_used >= v_test.max_attempts then raise exception 'NO_ATTEMPTS_LEFT'; end if;

  select * into v_attempt from public.class_test_attempts
   where test_id = p_id and student_id = v_uid and status = 'in_progress'
   order by started_at desc limit 1;
  if found and v_test.time_limit_minutes > 0
     and now() > v_attempt.started_at + (v_test.time_limit_minutes || ' minutes')::interval + interval '1 minute' then
    -- Уақыты өтіп кеткен әрекетті жабамыз, сонда оқушы қайта бастай алады.
    update public.class_test_attempts
       set status = 'submitted', finished_at = now(), percent = 0, passed = false
     where id = v_attempt.id;
    select count(*) into v_used from public.class_test_attempts
     where test_id = p_id and student_id = v_uid and status = 'submitted';
    if v_used >= v_test.max_attempts then raise exception 'NO_ATTEMPTS_LEFT'; end if;
    v_attempt := null;
  end if;
  if v_attempt.id is null then
    insert into public.class_test_attempts(test_id, student_id)
    values (p_id, v_uid)
    returning * into v_attempt;
  end if;

  return jsonb_build_object(
    'attempt_id', v_attempt.id,
    'started_at', v_attempt.started_at,
    'test', jsonb_build_object(
      'id', v_test.id, 'title', v_test.title, 'description', v_test.description,
      'time_limit_minutes', v_test.time_limit_minutes, 'pass_percent', v_test.pass_percent,
      'subject_title', (select title from public.subjects where id = v_test.subject_id),
      'questions', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', q.id, 'text', q.text, 'points', q.points,
          'options', coalesce((
            select jsonb_agg(jsonb_build_object('id', o.id, 'text', o.text) order by o.sort_order)
            from public.class_test_options o where o.question_id = q.id
          ), '[]'::jsonb)
        ) order by q.sort_order)
        from public.class_test_questions q where q.test_id = v_test.id
      ), '[]'::jsonb)
    )
  );
end $$;

create or replace function public.class_test_submit(p_attempt uuid, p_answers jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_attempt public.class_test_attempts;
  v_test public.class_tests;
  v_q public.class_test_questions;
  v_opt public.class_test_options;
  v_raw text;
  v_score numeric := 0;
  v_max numeric := 0;
  v_count int := 0;
  v_correct int := 0;
  v_pct numeric;
  v_passed boolean;
begin
  if not public.is_active() then raise exception 'FORBIDDEN'; end if;
  select * into v_attempt from public.class_test_attempts where id = p_attempt for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if v_attempt.student_id <> auth.uid() then raise exception 'FORBIDDEN'; end if;
  if v_attempt.status <> 'in_progress' then raise exception 'ALREADY_SUBMITTED'; end if;

  select * into v_test from public.class_tests where id = v_attempt.test_id;
  if not found or v_test.status = 'draft' then raise exception 'NOT_OPEN'; end if;
  if v_test.time_limit_minutes > 0
     and now() > v_attempt.started_at + (v_test.time_limit_minutes || ' minutes')::interval + interval '1 minute' then
    raise exception 'TIME_UP';
  end if;

  for v_q in select * from public.class_test_questions where test_id = v_test.id loop
    v_max := v_max + v_q.points;
    v_raw := p_answers->>v_q.id::text;
    v_opt := null;
    if v_raw ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' then
      select * into v_opt from public.class_test_options
       where id = v_raw::uuid and question_id = v_q.id;
    end if;
    insert into public.class_test_answers(attempt_id, question_id, option_id, is_correct)
    values (p_attempt, v_q.id, v_opt.id, coalesce(v_opt.is_correct, false))
    on conflict (attempt_id, question_id) do update
      set option_id = excluded.option_id, is_correct = excluded.is_correct;
    if coalesce(v_opt.is_correct, false) then
      v_score := v_score + v_q.points;
      v_correct := v_correct + 1;
    end if;
    v_count := v_count + 1;
  end loop;

  v_pct := round(100.0 * v_score / nullif(v_max, 0), 1);
  v_passed := coalesce(v_pct, 0) >= v_test.pass_percent;

  update public.class_test_attempts set
    finished_at = now(), score = v_score, max_score = v_max,
    percent = coalesce(v_pct, 0), passed = v_passed, status = 'submitted'
  where id = p_attempt;

  insert into public.notifications(user_id, title, body, kind, link)
  values (
    v_test.teacher_id,
    'Тест тапсырылды: ' || v_test.title,
    'Оқушы нәтижесі: ' || coalesce(v_pct, 0) || '%',
    'task',
    '/teacher/tests'
  );

  return jsonb_build_object(
    'attempt_id', p_attempt, 'score', v_score, 'max_score', v_max,
    'percent', coalesce(v_pct, 0), 'passed', v_passed,
    'pass_percent', v_test.pass_percent, 'correct_count', v_correct,
    'question_count', v_count
  );
end $$;

create or replace function public.class_test_my_attempts() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_active() then raise exception 'FORBIDDEN'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', a.id, 'test_id', a.test_id, 'title', t.title,
      'subject_title', coalesce(s.title, '—'), 'percent', a.percent,
      'score', a.score, 'max_score', a.max_score, 'passed', a.passed,
      'finished_at', a.finished_at, 'status', a.status
    ) order by a.created_at desc)
    from public.class_test_attempts a
    join public.class_tests t on t.id = a.test_id
    join public.subjects s on s.id = t.subject_id
    where a.student_id = auth.uid()
    limit 50
  ), '[]'::jsonb);
end $$;

create or replace function public.class_test_results(p_id uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_test public.class_tests;
begin
  select * into v_test from public.class_tests where id = p_id;
  if not found then raise exception 'NOT_FOUND'; end if;
  if not (v_test.teacher_id = auth.uid() or public.is_director() or public.teacher_admin_has('view')) then
    raise exception 'FORBIDDEN';
  end if;
  return jsonb_build_object(
    'test', jsonb_build_object(
      'id', v_test.id, 'title', v_test.title, 'class_name', v_test.class_name,
      'questions', (select count(*) from public.class_test_questions where test_id = p_id)
    ),
    'attempts', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', a.id, 'student_id', a.student_id,
        'student_name', coalesce(nullif(btrim(coalesce(pr.first_name,'') || ' ' || coalesce(pr.last_name,'')), ''), '—'),
        'started_at', a.started_at, 'finished_at', a.finished_at,
        'score', a.score, 'max_score', a.max_score, 'percent', a.percent,
        'passed', a.passed, 'status', a.status
      ) order by a.created_at desc)
      from public.class_test_attempts a
      join public.profiles pr on pr.id = a.student_id
      where a.test_id = p_id
    ), '[]'::jsonb)
  );
end $$;

-- ---------------------------------------------------------------------
-- 11. СЕРТИФИКАТ / МАРАПАТ БЕРУ (директор/әкімші)
-- ---------------------------------------------------------------------
create or replace function public.certificate_issue(
  p_student uuid, p_title text, p_description text default '', p_issued_at date default current_date
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if not (public.is_director() or public.is_admin()) then raise exception 'FORBIDDEN'; end if;
  if not exists (select 1 from public.profiles where id = p_student and role = 'student') then
    raise exception 'NOT_FOUND';
  end if;
  insert into public.certificates(student_id, title, description, issued_by, issued_at)
  values (p_student, btrim(p_title), coalesce(p_description, ''), auth.uid(), coalesce(p_issued_at, current_date))
  returning id into v_id;
  insert into public.notifications(user_id, title, body, kind, link)
  values (p_student, 'Жаңа сертификат', btrim(p_title), 'system', '/cabinet');
  return v_id;
end $$;

create or replace function public.achievement_award(p_student uuid, p_code text) returns void
language plpgsql security definer set search_path = public as $$
declare v_aid uuid;
begin
  if not (public.is_director() or public.is_admin() or public.teacher_has_student(p_student)) then
    raise exception 'FORBIDDEN';
  end if;
  select id into v_aid from public.achievements where code = p_code;
  if v_aid is null then raise exception 'NOT_FOUND'; end if;
  insert into public.student_achievements(student_id, achievement_id, awarded_by)
  values (p_student, v_aid, auth.uid())
  on conflict (student_id, achievement_id) do nothing;
end $$;

-- ---------------------------------------------------------------------
-- 12. STORAGE: avatars + study-materials (private)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', false, 5242880, array['image/jpeg','image/png','image/webp']),
  ('study-materials', 'study-materials', false, 20971520,
   array['application/pdf','application/msword',
         'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
         'application/vnd.ms-powerpoint',
         'application/vnd.openxmlformats-officedocument.presentationml.presentation',
         'image/jpeg','image/png','video/mp4','text/plain'])
on conflict (id) do nothing;

drop policy if exists "avatars_read" on storage.objects;
create policy "avatars_read" on storage.objects for select to authenticated
  using (bucket_id = 'avatars');

drop policy if exists "avatars_write" on storage.objects;
create policy "avatars_write" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_update" on storage.objects;
create policy "avatars_update" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_delete" on storage.objects;
create policy "avatars_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "study_materials_read" on storage.objects;
create policy "study_materials_read" on storage.objects for select to authenticated
  using (
    bucket_id = 'study-materials'
    and exists (select 1 from public.study_materials m where m.storage_path = storage.objects.name)
  );

drop policy if exists "study_materials_write" on storage.objects;
create policy "study_materials_write" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'study-materials'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.is_teacher()
  );

drop policy if exists "study_materials_delete" on storage.objects;
create policy "study_materials_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'study-materials' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------------
-- 13. REALTIME
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'class_tests','class_test_attempts','study_materials',
    'certificates','student_achievements'
  ] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 14. GRANTS
-- ---------------------------------------------------------------------
revoke execute on function public.student_id_is_self(text) from anon, public;
revoke execute on function public.is_parent_of_class(text) from anon, public;
revoke execute on function public.student_dashboard() from anon, public;
revoke execute on function public.parent_child_dashboard(uuid) from anon, public;
revoke execute on function public.parent_children() from anon, public;
revoke execute on function public.parent_message_send(uuid, uuid, text, text, boolean) from anon, public;
revoke execute on function public.profile_set_avatar(text) from anon, public;
revoke execute on function public.study_material_list(text) from anon, public;
revoke execute on function public.study_material_save(jsonb) from anon, public;
revoke execute on function public.study_material_delete(uuid) from anon, public;
revoke execute on function public.class_test_save(jsonb) from anon, public;
revoke execute on function public.class_test_list() from anon, public;
revoke execute on function public.class_test_detail(uuid) from anon, public;
revoke execute on function public.class_test_set_status(uuid, text) from anon, public;
revoke execute on function public.class_test_delete(uuid) from anon, public;
revoke execute on function public.class_test_available() from anon, public;
revoke execute on function public.class_test_start(uuid) from anon, public;
revoke execute on function public.class_test_submit(uuid, jsonb) from anon, public;
revoke execute on function public.class_test_my_attempts() from anon, public;
revoke execute on function public.class_test_results(uuid) from anon, public;
revoke execute on function public.certificate_issue(uuid, text, text, date) from anon, public;
revoke execute on function public.achievement_award(uuid, text) from anon, public;

grant execute on function public.student_id_is_self(text) to authenticated;
grant execute on function public.is_parent_of_class(text) to authenticated;
grant execute on function public.student_dashboard() to authenticated;
grant execute on function public.parent_child_dashboard(uuid) to authenticated;
grant execute on function public.parent_children() to authenticated;
grant execute on function public.parent_message_send(uuid, uuid, text, text, boolean) to authenticated;
grant execute on function public.profile_set_avatar(text) to authenticated;
grant execute on function public.study_material_list(text) to authenticated;
grant execute on function public.study_material_save(jsonb) to authenticated;
grant execute on function public.study_material_delete(uuid) to authenticated;
grant execute on function public.class_test_save(jsonb) to authenticated;
grant execute on function public.class_test_list() to authenticated;
grant execute on function public.class_test_detail(uuid) to authenticated;
grant execute on function public.class_test_set_status(uuid, text) to authenticated;
grant execute on function public.class_test_delete(uuid) to authenticated;
grant execute on function public.class_test_available() to authenticated;
grant execute on function public.class_test_start(uuid) to authenticated;
grant execute on function public.class_test_submit(uuid, jsonb) to authenticated;
grant execute on function public.class_test_my_attempts() to authenticated;
grant execute on function public.class_test_results(uuid) to authenticated;
grant execute on function public.certificate_issue(uuid, text, text, date) to authenticated;
grant execute on function public.achievement_award(uuid, text) to authenticated;
