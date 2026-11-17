-- =====================================================================
-- 165 MEKTEP — Supabase схемасы
-- Supabase Dashboard -> SQL Editor ішінде толық іске қосыңыз (қайта іске қосуға болады).
-- Алдымен: Authentication -> Providers -> Email -> "Confirm email" ӨШІРУЛІ болсын
-- (сайт телефон нөмірінен жасалған ішкі email арқылы кіреді).
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. КЕСТЕЛЕР
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'student' check (role in ('admin','student','parent')),
  first_name text not null check (char_length(first_name) between 1 and 60),
  last_name text not null check (char_length(last_name) between 1 and 60),
  phone text not null unique check (phone ~ '^\+7[0-9]{10}$'),
  is_blocked boolean not null default false,
  last_seen_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  excerpt text not null default '',
  content text not null default '',
  image_url text,
  published boolean not null default false,
  published_at timestamptz,
  author_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  title text not null unique check (char_length(title) between 1 and 120),
  description text not null default '',
  image_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  description text not null default '',
  video_kind text not null default 'url' check (video_kind in ('url','upload')),
  video_url text,
  video_path text,
  thumbnail_url text,
  published boolean not null default true,
  duration_seconds int not null check (duration_seconds > 0),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  check ((video_kind = 'url' and video_url is not null) or (video_kind = 'upload' and video_path is not null))
);
create index if not exists lessons_subject_idx on public.lessons(subject_id, sort_order);

create table if not exists public.tests (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null unique references public.lessons(id) on delete cascade,
  title text not null default 'Тест',
  pass_percent int not null default 70 check (pass_percent between 1 and 100),
  created_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.tests(id) on delete cascade,
  text text not null check (char_length(text) > 0),
  explanation text not null default '',
  points int not null default 1 check (points between 1 and 100),
  sort_order int not null default 0
);
create index if not exists questions_test_idx on public.questions(test_id, sort_order);

create table if not exists public.answer_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  text text not null check (char_length(text) > 0),
  is_correct boolean not null default false,
  sort_order int not null default 0
);
create index if not exists options_question_idx on public.answer_options(question_id, sort_order);

create table if not exists public.lesson_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  watched_seconds numeric not null default 0,
  last_position numeric not null default 0,
  last_report_at timestamptz,
  video_percent int not null default 0,
  video_completed boolean not null default false,
  test_passed boolean not null default false,
  best_score_percent int not null default 0,
  completed boolean not null default false,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create table if not exists public.test_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  test_id uuid not null references public.tests(id) on delete cascade,
  score int not null,
  max_score int not null,
  percent int not null,
  passed boolean not null,
  answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists attempts_user_idx on public.test_attempts(user_id, created_at desc);

create table if not exists public.parent_student_links (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  unique (parent_id, student_id),
  check (parent_id <> student_id)
);

create table if not exists public.site_settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.social_links (
  platform text primary key check (platform in ('instagram','tiktok','youtube','facebook','telegram')),
  url text not null default '',
  is_active boolean not null default true,
  sort_order int not null default 0
);

-- Мұғалімдер, жетістіктер, фотогалерея (ADMIN басқарады)
create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('teacher','achievement','student_achievement','gallery')),
  title text not null default '',
  subtitle text not null default '',
  image_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Бұрыннан бар дерекқорлар үшін kind шектеуін жаңарту (қайта іске қосуға қауіпсіз)
alter table public.content_items drop constraint if exists content_items_kind_check;
alter table public.content_items add constraint content_items_kind_check
  check (kind in ('teacher','achievement','student_achievement','gallery'));

-- Рөлдер: director (кестені басқарады) және teacher (тек көреді) қосылады
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('admin','director','teacher','student','parent'));

create table if not exists public.admin_activity_logs (
  id bigserial primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id text,
  created_at timestamptz not null default now()
);
create index if not exists logs_created_idx on public.admin_activity_logs(created_at desc);

-- Сабақ кестесі. Жазу құқығы ТЕК director рөлінде (RLS төменде).
create table if not exists public.timetable (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  class_name text not null check (char_length(class_name) between 1 and 20),
  weekday smallint not null check (weekday between 1 and 7),
  start_time time not null,
  end_time time,
  room text not null default '' check (char_length(room) <= 40),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint timetable_teacher_slot unique (teacher_id, weekday, start_time),
  constraint timetable_class_slot unique (class_name, weekday, start_time),
  constraint timetable_time_order check (end_time is null or end_time > start_time)
);
create index if not exists timetable_day_idx on public.timetable(weekday, start_time);
create index if not exists timetable_teacher_idx on public.timetable(teacher_id, weekday);
alter table public.timetable replica identity full;

-- Кестенің өзгерістер тарихы (триггер жазады, тек director оқиды)
create table if not exists public.timetable_history (
  id bigserial primary key,
  timetable_id uuid,
  action text not null check (action in ('INSERT','UPDATE','DELETE')),
  actor_id uuid references public.profiles(id) on delete set null,
  actor_name text not null default '',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists timetable_history_created_idx on public.timetable_history(created_at desc);

-- Ескі нұсқадан қалған кестелерді жаңа схемаға сәйкестендіру (қайта іске қосуға қауіпсіз).
-- create table if not exists ескі кестені өзгертпейді, сондықтан айырмашылықтарды осында түзетеміз.
alter table public.news add column if not exists excerpt text not null default '';
alter table public.news add column if not exists published_at timestamptz;
alter table public.news add column if not exists updated_at timestamptz not null default now();
update public.news set published_at = created_at where published and published_at is null;

-- Ескі нұсқадағы кестелерде id бағанының әдепкі мәні болмаған (bigint) — sequence қосамыз.
do $$
declare t text;
begin
  foreach t in array array['news','social_links','test_attempts','lesson_progress'] loop
    if exists (select 1 from information_schema.columns
               where table_schema = 'public' and table_name = t and column_name = 'id'
                 and data_type in ('bigint','integer') and column_default is null and is_identity = 'NO') then
      execute format('create sequence if not exists public.%I_id_seq owned by public.%I.id', t, t);
      execute format('alter table public.%I alter column id set default nextval(''public.%I_id_seq'')', t, t);
      execute format('select setval(''public.%I_id_seq'', coalesce((select max(id) from public.%I), 0) + 1, false)', t, t);
    end if;
  end loop;
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'test_attempts' and column_name = 'total_questions') then
    execute 'alter table public.test_attempts alter column total_questions set default 0';
  end if;
end $$;

-- Ескі social_links (platform_name/icon_name) пішіні — бос болса жаңа пішінмен қайта құрылады.
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'social_links' and column_name = 'platform_name') then
    if (select count(*) from public.social_links) = 0 then
      drop table public.social_links;
      create table public.social_links (
        platform text primary key check (platform in ('instagram','tiktok','youtube','facebook','telegram')),
        url text not null default '',
        is_active boolean not null default true,
        sort_order int not null default 0
      );
    else
      alter table public.social_links add column if not exists platform text;
      alter table public.social_links add column if not exists is_active boolean not null default true;
      alter table public.social_links add column if not exists sort_order int not null default 0;
      alter table public.social_links alter column platform_name drop not null;
      update public.social_links set platform = lower(platform_name) where platform is null;
      create unique index if not exists social_links_platform_uidx on public.social_links(platform);
    end if;
  end if;
end $$;

create unique index if not exists profiles_phone_uidx on public.profiles(phone);

-- Бастапқы мәліметтер (бос мәндер — ADMIN кейін толтырады, жалған ақпарат жоқ)
insert into public.site_settings(key, value) values
  ('address',''),('phone',''),('email',''),('working_hours',''),
  ('google_play_url',''),('app_store_url',''),('hero_image_url',''),
  ('school_name','165 MEKTEP'),('logo_url',''),('favicon_url',''),
  ('seo_title','165 MEKTEP — Білім — болашаққа бастар жол'),('seo_description',''),
  ('primary_color',''),('secondary_color',''),
  ('footer_about',''),('copyright',''),('app_name',''),('app_logo_url',''),
  ('google_play_active','true'),('app_store_active','true'),
  ('home_content',''),('home_sections',''),('about_content','')
on conflict (key) do nothing;

insert into public.social_links(platform, url, sort_order) values
  ('instagram','',1),('tiktok','',2),('youtube','',3),('facebook','',4),('telegram','',5)
on conflict (platform) do nothing;

insert into public.subjects(title, sort_order) values
  ('Қазақстан тарихы',1),('Математикалық сауаттылық',2),('Оқу сауаттылығы',3),
  ('Математика',4),('Физика',5),('Химия',6),('Биология',7),('География',8),
  ('Дүниежүзі тарихы',9),('Ағылшын тілі',10),('Қазақ тілі',11),('Қазақ әдебиеті',12)
on conflict (title) do nothing;

-- Бұрыннан бар дерекқорға жаңа өрістерді қосу (қайта іске қосуға қауіпсіз)
alter table public.subjects add column if not exists image_url text;
alter table public.lessons add column if not exists thumbnail_url text;
alter table public.lessons add column if not exists published boolean not null default true;
alter table public.questions add column if not exists explanation text not null default '';
alter table public.social_links drop constraint if exists social_links_platform_check;
alter table public.social_links add constraint social_links_platform_check
  check (platform in ('instagram','tiktok','youtube','facebook','telegram'));
insert into public.social_links(platform, url, sort_order) values ('telegram','',5)
on conflict (platform) do nothing;

-- ---------------------------------------------------------------------
-- 2. КӨМЕКШІ ФУНКЦИЯЛАР
-- ---------------------------------------------------------------------
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles
                 where id = auth.uid() and role = 'admin' and not is_blocked);
$$;

create or replace function public.is_active() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and not is_blocked);
$$;

create or replace function public.is_director() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles
                 where id = auth.uid() and role = 'director' and not is_blocked);
$$;

create or replace function public.is_teacher() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles
                 where id = auth.uid() and role = 'teacher' and not is_blocked);
$$;

-- Кестені көру: ADMIN, DIRECTOR, TEACHER. STUDENT/PARENT кіре алмайды.
create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles
                 where id = auth.uid() and role in ('admin','director','teacher') and not is_blocked);
$$;

create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

drop trigger if exists news_updated on public.news;
create trigger news_updated before update on public.news
  for each row execute function public.set_updated_at();

create or replace function public.news_before_write() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.published and new.published_at is null then new.published_at := now(); end if;
  if not new.published then new.published_at := null; end if;
  if tg_op = 'INSERT' and new.author_id is null then new.author_id := auth.uid(); end if;
  return new;
end $$;

drop trigger if exists news_before_write_trg on public.news;
create trigger news_before_write_trg before insert or update on public.news
  for each row execute function public.news_before_write();

drop trigger if exists timetable_updated on public.timetable;
create trigger timetable_updated before update on public.timetable
  for each row execute function public.set_updated_at();

-- created_by әрқашан серверде auth.uid()-тан алынады (клиент мәніне сенбейміз)
create or replace function public.set_timetable_creator() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.created_by := auth.uid();
  return new;
end $$;

drop trigger if exists timetable_creator on public.timetable;
create trigger timetable_creator before insert on public.timetable
  for each row execute function public.set_timetable_creator();

-- Кесте өзгерісін тарихқа жазу (әрекетті жасаған адамды auth.uid()-тан алады)
create or replace function public.log_timetable_change() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_row public.timetable;
  v_teacher text;
  v_subject text;
  v_actor text;
begin
  v_row := coalesce(new, old);
  select btrim(first_name || ' ' || last_name) into v_teacher
    from public.profiles where id = v_row.teacher_id;
  select title into v_subject from public.subjects where id = v_row.subject_id;
  select btrim(first_name || ' ' || last_name) into v_actor
    from public.profiles where id = auth.uid();
  insert into public.timetable_history(timetable_id, action, actor_id, actor_name, data)
  values (
    v_row.id, tg_op, auth.uid(), coalesce(nullif(v_actor, ''), '—'),
    jsonb_build_object(
      'teacher_name', coalesce(v_teacher, '—'),
      'subject_title', coalesce(v_subject, '—'),
      'class_name', v_row.class_name,
      'weekday', v_row.weekday,
      'start_time', v_row.start_time,
      'end_time', v_row.end_time,
      'room', v_row.room
    )
  );
  return coalesce(new, old);
end $$;

drop trigger if exists timetable_audit on public.timetable;
create trigger timetable_audit after insert or update or delete on public.timetable
  for each row execute function public.log_timetable_change();

-- Жаңа пайдаланушы -> профиль. Рөл ТЕК student/parent бола алады (admin қолмен беріледі).
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_role text;
  v_phone text := m->>'phone';
  v_first text := btrim(coalesce(m->>'first_name',''));
  v_last text := btrim(coalesce(m->>'last_name',''));
begin
  v_role := case when m->>'role' = 'parent' then 'parent' else 'student' end;
  if v_phone is null or v_phone !~ '^\+7[0-9]{10}$' then raise exception 'INVALID_PHONE'; end if;
  if char_length(v_first) not between 1 and 60 or char_length(v_last) not between 1 and 60 then
    raise exception 'INVALID_NAME';
  end if;
  insert into public.profiles(id, role, first_name, last_name, phone)
  values (new.id, v_role, v_first, v_last, v_phone);
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ADMIN әрекеттерінің журналы (сервер жағында, триггер арқылы)
create or replace function public.log_admin_change() returns trigger
language plpgsql security definer set search_path = public as $$
declare j jsonb; rid text;
begin
  if auth.uid() is null or not public.is_admin() then return coalesce(new, old); end if;
  j := to_jsonb(coalesce(new, old));
  rid := coalesce(j->>'id', j->>'key', j->>'platform');
  insert into public.admin_activity_logs(actor_id, action, entity, entity_id)
  values (auth.uid(), tg_op, tg_table_name, rid);
  return coalesce(new, old);
end $$;

do $$
declare t text;
begin
  foreach t in array array['news','subjects','lessons','tests','questions','site_settings','social_links','content_items','parent_student_links']
  loop
    execute format('drop trigger if exists log_%1$s on public.%1$s', t);
    execute format('create trigger log_%1$s after insert or update or delete on public.%1$s for each row execute function public.log_admin_change()', t);
  end loop;
end $$;

drop trigger if exists log_profiles_admin on public.profiles;
create trigger log_profiles_admin after update on public.profiles
  for each row
  when (old.role is distinct from new.role or old.is_blocked is distinct from new.is_blocked)
  execute function public.log_admin_change();

-- ---------------------------------------------------------------------
-- 3. ПРОГРЕСС ЛОГИКАСЫ (толығымен сервер жағында)
-- ---------------------------------------------------------------------
-- Әр сабақтың күйі. Сабақ ашық, егер өз пәніндегі алдыңғы сабақ толық аяқталса.
create or replace function public._lesson_status(p_uid uuid)
returns table (
  lesson_id uuid, subject_id uuid, subject_title text, title text, description text,
  sort_order int, duration_seconds int, has_test boolean,
  video_percent int, video_completed boolean, test_passed boolean, best_score int,
  completed boolean, unlocked boolean
)
language sql stable security definer set search_path = public as $$
  with base as (
    select l.id, l.subject_id, s.title as s_title, s.sort_order as s_order, l.title as l_title,
           l.description as l_desc, l.sort_order as l_order, l.duration_seconds as dur, l.created_at,
           exists (select 1 from public.tests t where t.lesson_id = l.id) as has_t,
           coalesce(p.video_percent, 0) as vp,
           coalesce(p.video_completed, false) as vc,
           coalesce(p.test_passed, false) as tp,
           coalesce(p.best_score_percent, 0) as bs,
           coalesce(p.completed, false) as cmp
    from public.lessons l
    join public.subjects s on s.id = l.subject_id
    left join public.lesson_progress p on p.lesson_id = l.id and p.user_id = p_uid
    where l.published or public.is_admin()
  )
  select id, subject_id, s_title, l_title, l_desc, l_order, dur, has_t, vp, vc, tp, bs, cmp,
         coalesce(lag(cmp) over (partition by subject_id order by l_order, created_at), true)
  from base
  order by s_order, subject_id, l_order, created_at;
$$;

create or replace function public.can_view_lesson(p_lesson uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_active() and (
    public.is_admin()
    or coalesce((select s.unlocked from public._lesson_status(auth.uid()) s where s.lesson_id = p_lesson), false)
  );
$$;

create or replace function public.touch_presence() returns void
language sql security definer set search_path = public as $$
  update public.profiles set last_seen_at = now() where id = auth.uid();
$$;

create or replace function public.ubt_catalog() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_admin boolean;
begin
  if not public.is_active() then raise exception 'FORBIDDEN'; end if;
  v_admin := public.is_admin();
  return jsonb_build_object(
    'subjects', coalesce((select jsonb_agg(to_jsonb(s) order by s.sort_order, s.title) from public.subjects s), '[]'::jsonb),
    'lessons', coalesce((select jsonb_agg(to_jsonb(x) || jsonb_build_object('unlocked', x.unlocked or v_admin))
                         from public._lesson_status(auth.uid()) x), '[]'::jsonb)
  );
end $$;

create or replace function public.get_lesson(p_lesson uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare l public.lessons; pr public.lesson_progress; v_next uuid; v_has_test boolean;
begin
  if not public.is_active() then raise exception 'FORBIDDEN'; end if;
  select * into l from public.lessons where id = p_lesson;
  if not found then raise exception 'NOT_FOUND'; end if;
  if not l.published and not public.is_admin() then raise exception 'NOT_FOUND'; end if;
  if not public.can_view_lesson(p_lesson) then raise exception 'LESSON_LOCKED'; end if;
  select * into pr from public.lesson_progress where user_id = auth.uid() and lesson_id = p_lesson;
  select n.id into v_next from public.lessons n
    where n.subject_id = l.subject_id and (n.sort_order, n.created_at) > (l.sort_order, l.created_at)
    order by n.sort_order, n.created_at limit 1;
  select exists (select 1 from public.tests where lesson_id = p_lesson) into v_has_test;
  return jsonb_build_object(
    'id', l.id, 'subject_id', l.subject_id,
    'subject_title', (select title from public.subjects where id = l.subject_id),
    'title', l.title, 'description', l.description,
    'video_kind', l.video_kind, 'video_url', l.video_url, 'video_path', l.video_path,
    'duration_seconds', l.duration_seconds, 'next_lesson_id', v_next, 'has_test', v_has_test,
    'start_position', coalesce(pr.last_position, 0),
    'video_percent', coalesce(pr.video_percent, 0),
    'video_completed', coalesce(pr.video_completed, false),
    'test_passed', coalesce(pr.test_passed, false),
    'best_score', coalesce(pr.best_score_percent, 0),
    'completed', coalesce(pr.completed, false)
  );
end $$;

-- Видео прогресі: сервер НАҚТЫ УАҚЫТ бойынша есептейді. Клиент "100%" деп жібере алмайды:
-- әр есепте қосылатын уақыт = (өткен нақты секунд * 1.3) мөлшерінен аспайды.
create or replace function public.report_video_progress(p_lesson uuid, p_position numeric)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  l public.lessons; pr public.lesson_progress;
  v_elapsed numeric; v_gain numeric; v_watched numeric; v_pct int;
  v_done boolean; v_has_test boolean; v_pos numeric;
begin
  if not public.is_active() then raise exception 'FORBIDDEN'; end if;
  if not public.can_view_lesson(p_lesson) then raise exception 'LESSON_LOCKED'; end if;
  select * into l from public.lessons where id = p_lesson;
  if not found then raise exception 'NOT_FOUND'; end if;

  insert into public.lesson_progress(user_id, lesson_id, last_report_at)
  values (v_uid, p_lesson, now()) on conflict (user_id, lesson_id) do nothing;
  select * into pr from public.lesson_progress where user_id = v_uid and lesson_id = p_lesson for update;

  v_pos := least(greatest(coalesce(p_position, 0), 0), l.duration_seconds);
  v_elapsed := least(extract(epoch from (now() - coalesce(pr.last_report_at, now()))), 30);
  v_gain := least(greatest(v_pos - pr.last_position, 0), v_elapsed * 1.3);
  v_watched := least(pr.watched_seconds + v_gain, l.duration_seconds);
  v_done := pr.video_completed or v_watched >= l.duration_seconds * 0.97;
  v_pct := case when v_done then 100 else least(99, floor(v_watched / l.duration_seconds * 100)::int) end;
  select exists (select 1 from public.tests where lesson_id = p_lesson) into v_has_test;

  update public.lesson_progress set
    watched_seconds = v_watched,
    last_position = v_pos,
    last_report_at = now(),
    video_percent = greatest(video_percent, v_pct),
    video_completed = v_done,
    completed = completed or (v_done and not v_has_test),
    completed_at = case when not completed and v_done and not v_has_test then now() else completed_at end,
    updated_at = now()
  where user_id = v_uid and lesson_id = p_lesson;

  return jsonb_build_object('video_percent', greatest(pr.video_percent, v_pct), 'video_completed', v_done,
                            'completed', pr.completed or (v_done and not v_has_test));
end $$;

-- Тест сұрақтары: дұрыс жауаптар (is_correct) КЛИЕНТКЕ ЖІБЕРІЛМЕЙДІ
create or replace function public.get_test(p_lesson uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare t public.tests; pr public.lesson_progress;
begin
  if not public.is_active() then raise exception 'FORBIDDEN'; end if;
  if not public.can_view_lesson(p_lesson) then raise exception 'LESSON_LOCKED'; end if;
  select * into t from public.tests where lesson_id = p_lesson;
  if not found then return null; end if;
  select * into pr from public.lesson_progress where user_id = auth.uid() and lesson_id = p_lesson;
  if not public.is_admin() and not coalesce(pr.video_completed, false) then raise exception 'VIDEO_NOT_COMPLETED'; end if;
  return jsonb_build_object(
    'id', t.id, 'title', t.title, 'pass_percent', t.pass_percent,
    'questions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', q.id, 'text', q.text, 'points', q.points,
        'options', coalesce((select jsonb_agg(jsonb_build_object('id', o.id, 'text', o.text) order by o.sort_order, o.id)
                             from public.answer_options o where o.question_id = q.id), '[]'::jsonb)
      ) order by q.sort_order, q.id)
      from public.questions q where q.test_id = t.id), '[]'::jsonb)
  );
end $$;

-- Тест нәтижесін сервер тексереді
create or replace function public.submit_test(p_lesson uuid, p_answers jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  t public.tests; pr public.lesson_progress;
  v_total int; v_earned int; v_correct int; v_count int; v_pct int; v_passed boolean;
begin
  if not public.is_active() then raise exception 'FORBIDDEN'; end if;
  if not public.can_view_lesson(p_lesson) then raise exception 'LESSON_LOCKED'; end if;
  if p_answers is null or jsonb_typeof(p_answers) <> 'object' then raise exception 'BAD_ANSWERS'; end if;
  select * into t from public.tests where lesson_id = p_lesson;
  if not found then raise exception 'NOT_FOUND'; end if;
  select * into pr from public.lesson_progress where user_id = v_uid and lesson_id = p_lesson for update;
  if not found or not pr.video_completed then
    if not public.is_admin() then raise exception 'VIDEO_NOT_COMPLETED'; end if;
  end if;
  if exists (select 1 from public.test_attempts
             where user_id = v_uid and lesson_id = p_lesson and created_at > now() - interval '3 seconds') then
    raise exception 'TOO_FAST';
  end if;

  select coalesce(sum(q.points), 0), count(*) into v_total, v_count from public.questions q where q.test_id = t.id;
  if v_total = 0 then raise exception 'EMPTY_TEST'; end if;

  select coalesce(sum(q.points), 0), count(*) into v_earned, v_correct
  from public.questions q
  where q.test_id = t.id
    and exists (
      select 1 from public.answer_options o
      where o.question_id = q.id and o.is_correct
        and o.id::text = p_answers ->> q.id::text
    );

  v_pct := round(v_earned * 100.0 / v_total);
  v_passed := v_pct >= t.pass_percent;

  insert into public.test_attempts(user_id, lesson_id, test_id, score, max_score, percent, passed, answers)
  values (v_uid, p_lesson, t.id, v_earned, v_total, v_pct, v_passed, p_answers);

  insert into public.lesson_progress(user_id, lesson_id) values (v_uid, p_lesson)
  on conflict (user_id, lesson_id) do nothing;

  update public.lesson_progress set
    test_passed = test_passed or v_passed,
    best_score_percent = greatest(best_score_percent, v_pct),
    completed = completed or (v_passed and video_completed),
    completed_at = case when not completed and v_passed and video_completed then now() else completed_at end,
    updated_at = now()
  where user_id = v_uid and lesson_id = p_lesson;

  return jsonb_build_object('score', v_earned, 'max_score', v_total, 'percent', v_pct, 'passed', v_passed,
                            'pass_percent', t.pass_percent, 'correct_count', v_correct, 'question_count', v_count);
end $$;

-- Оқушының жалпы көрінісі (өз деректері / бекітілген ата-ана / admin)
create or replace function public.student_overview(p_student uuid default null) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_target uuid := coalesce(p_student, auth.uid());
begin
  if not public.is_active() then raise exception 'FORBIDDEN'; end if;
  if v_target <> auth.uid() and not public.is_admin() and not exists (
    select 1 from public.parent_student_links
    where parent_id = auth.uid() and student_id = v_target and status = 'approved'
  ) then raise exception 'FORBIDDEN'; end if;

  return jsonb_build_object(
    'profile', (select jsonb_build_object('id', id, 'first_name', first_name, 'last_name', last_name, 'phone', phone, 'role', role)
                from public.profiles where id = v_target),
    'lessons', coalesce((select jsonb_agg(to_jsonb(x)) from public._lesson_status(v_target) x), '[]'::jsonb),
    'attempts', coalesce((
      select jsonb_agg(jsonb_build_object('id', a.id, 'lesson_id', a.lesson_id, 'lesson_title', l.title,
                                          'percent', a.percent, 'passed', a.passed, 'created_at', a.created_at)
                       order by a.created_at desc)
      from (select * from public.test_attempts where user_id = v_target order by created_at desc limit 50) a
      join public.lessons l on l.id = a.lesson_id), '[]'::jsonb)
  );
end $$;

-- ---------------------------------------------------------------------
-- 4. АТА-АНА <-> ОҚУШЫ БАЙЛАНЫСЫ
-- ---------------------------------------------------------------------
create or replace function public.request_student_link(p_phone text) returns void
language plpgsql security definer set search_path = public as $$
declare v_student uuid;
begin
  if not public.is_active() then raise exception 'FORBIDDEN'; end if;
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'parent') then
    raise exception 'FORBIDDEN';
  end if;
  if p_phone is null or p_phone !~ '^\+7[0-9]{10}$' then raise exception 'INVALID_PHONE'; end if;
  select id into v_student from public.profiles where phone = p_phone and role = 'student' and not is_blocked;
  if v_student is null then raise exception 'STUDENT_NOT_FOUND'; end if;
  insert into public.parent_student_links(parent_id, student_id, status)
  values (auth.uid(), v_student, 'pending')
  on conflict (parent_id, student_id) do update
    set status = case when public.parent_student_links.status = 'rejected' then 'pending' else public.parent_student_links.status end;
end $$;

create or replace function public.my_links() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'link_id', k.id, 'status', k.status, 'created_at', k.created_at,
    'user_id', o.id, 'first_name', o.first_name, 'last_name', o.last_name, 'phone', o.phone
  ) order by k.created_at desc), '[]'::jsonb)
  from public.parent_student_links k
  join public.profiles o on o.id = case when k.parent_id = auth.uid() then k.student_id else k.parent_id end
  where (k.parent_id = auth.uid() or k.student_id = auth.uid()) and public.is_active();
$$;

-- Оқушы (немесе admin) ата-ана сұранысын бекітеді / қабылдамайды
create or replace function public.respond_link(p_link uuid, p_approve boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_active() then raise exception 'FORBIDDEN'; end if;
  update public.parent_student_links
     set status = case when p_approve then 'approved' else 'rejected' end
   where id = p_link and (student_id = auth.uid() or public.is_admin());
  if not found then raise exception 'FORBIDDEN'; end if;
end $$;

create or replace function public.remove_link(p_link uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_active() then raise exception 'FORBIDDEN'; end if;
  delete from public.parent_student_links
   where id = p_link and (student_id = auth.uid() or parent_id = auth.uid() or public.is_admin());
end $$;

-- ---------------------------------------------------------------------
-- 5. ADMIN ФУНКЦИЯЛАРЫ
-- ---------------------------------------------------------------------
create or replace function public.admin_stats() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  return jsonb_build_object(
    'students', (select count(*) from public.profiles where role = 'student'),
    'parents', (select count(*) from public.profiles where role = 'parent'),
    'news', (select count(*) from public.news),
    'lessons', (select count(*) from public.lessons),
    'tests', (select count(*) from public.tests),
    'active_24h', (select count(*) from public.profiles where last_seen_at > now() - interval '24 hours'),
    'logs', coalesce((
      select jsonb_agg(jsonb_build_object('id', g.id, 'action', g.action, 'entity', g.entity, 'created_at', g.created_at,
                                          'actor', coalesce(p.first_name || ' ' || p.last_name, '—')) order by g.id desc)
      from (select * from public.admin_activity_logs order by id desc limit 12) g
      left join public.profiles p on p.id = g.actor_id), '[]'::jsonb)
  );
end $$;

-- Сұрақты және жауап нұсқаларын бір транзакцияда сақтау (сервер валидациясымен)
create or replace function public.admin_save_question(p_test uuid, p_question jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := nullif(p_question->>'id','')::uuid;
  v_opt jsonb; v_oid uuid; v_keep uuid[] := '{}'; v_i int := 0; v_correct int := 0; v_n int := 0;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  if btrim(coalesce(p_question->>'text','')) = '' then raise exception 'EMPTY_QUESTION'; end if;
  for v_opt in select * from jsonb_array_elements(coalesce(p_question->'options','[]'::jsonb)) loop
    if btrim(coalesce(v_opt->>'text','')) <> '' then
      v_n := v_n + 1;
      if coalesce((v_opt->>'is_correct')::boolean, false) then v_correct := v_correct + 1; end if;
    end if;
  end loop;
  if v_n < 2 then raise exception 'NEED_TWO_OPTIONS'; end if;
  if v_correct <> 1 then raise exception 'NEED_ONE_CORRECT'; end if;

  if v_id is null then
    insert into public.questions(test_id, text, explanation, points, sort_order)
    values (p_test, btrim(p_question->>'text'), coalesce(p_question->>'explanation',''),
            greatest(1, coalesce((p_question->>'points')::int, 1)),
            coalesce((p_question->>'sort_order')::int, 0))
    returning id into v_id;
  else
    update public.questions set text = btrim(p_question->>'text'),
           explanation = coalesce(p_question->>'explanation',''),
           points = greatest(1, coalesce((p_question->>'points')::int, 1)),
           sort_order = coalesce((p_question->>'sort_order')::int, 0)
     where id = v_id and test_id = p_test;
    if not found then raise exception 'NOT_FOUND'; end if;
  end if;

  for v_opt in select * from jsonb_array_elements(p_question->'options') loop
    if btrim(coalesce(v_opt->>'text','')) <> '' then
      v_i := v_i + 1;
      v_oid := nullif(v_opt->>'id','')::uuid;
      if v_oid is not null and exists (select 1 from public.answer_options where id = v_oid and question_id = v_id) then
        update public.answer_options set text = btrim(v_opt->>'text'),
               is_correct = coalesce((v_opt->>'is_correct')::boolean, false), sort_order = v_i
         where id = v_oid;
      else
        insert into public.answer_options(question_id, text, is_correct, sort_order)
        values (v_id, btrim(v_opt->>'text'), coalesce((v_opt->>'is_correct')::boolean, false), v_i)
        returning id into v_oid;
      end if;
      v_keep := v_keep || v_oid;
    end if;
  end loop;
  delete from public.answer_options where question_id = v_id and not (id = any (v_keep));
  return v_id;
end $$;

-- Оқушы прогресінің қысқаша жиынтығы (тек admin функциялары ішінде қолданылады)
create or replace function public._student_progress(p_uid uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  with t as (
    select count(*) as total from public.lessons where published
  ), p as (
    select count(*) filter (where lp.completed) as done,
           count(*) filter (where lp.video_completed) as vids,
           count(*) filter (where lp.test_passed) as tests,
           coalesce(round(avg(lp.best_score_percent) filter (where lp.test_passed)), 0) as avg_score
    from public.lesson_progress lp where lp.user_id = p_uid
  )
  select jsonb_build_object(
    'lessons_total', t.total,
    'lessons_done', p.done,
    'video_done', p.vids,
    'tests_passed', p.tests,
    'avg_score', p.avg_score,
    'percent', case when t.total > 0 then round(100.0 * p.done / t.total)::int else 0 end
  ) from t, p;
$$;

-- ADMIN: оқушылар / ата-аналар тізімі (нақты прогресімен)
create or replace function public.admin_people(p_role text, p_search text default '') returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_role text := case when p_role in ('student','parent','admin') then p_role else 'student' end;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', pr.id, 'first_name', pr.first_name, 'last_name', pr.last_name,
      'phone', pr.phone, 'role', pr.role, 'is_blocked', pr.is_blocked,
      'created_at', pr.created_at, 'last_seen_at', pr.last_seen_at,
      'progress', public._student_progress(pr.id),
      'students', case when pr.role = 'parent' then coalesce((
        select jsonb_agg(jsonb_build_object(
          'link_id', k.id, 'student_id', s.id, 'status', k.status,
          'first_name', s.first_name, 'last_name', s.last_name, 'phone', s.phone,
          'progress', public._student_progress(s.id)
        ) order by s.first_name, s.last_name)
        from public.parent_student_links k
        join public.profiles s on s.id = k.student_id
        where k.parent_id = pr.id), '[]'::jsonb) else '[]'::jsonb end
    ) order by pr.created_at desc)
    from public.profiles pr
    where pr.role = v_role
      and (btrim(coalesce(p_search,'')) = ''
           or pr.first_name ilike '%' || btrim(p_search) || '%'
           or pr.last_name ilike '%' || btrim(p_search) || '%'
           or pr.phone ilike '%' || btrim(p_search) || '%')
  ), '[]'::jsonb);
end $$;

-- ADMIN: әрекеттер тарихы (фильтр + шектеу)
create or replace function public.admin_logs(p_limit int default 100, p_entity text default '') returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_limit int := least(greatest(coalesce(p_limit, 100), 1), 500);
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  return jsonb_build_object(
    'entities', coalesce((select jsonb_agg(distinct g.entity) from public.admin_activity_logs g), '[]'::jsonb),
    'logs', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', g.id, 'action', g.action, 'entity', g.entity, 'entity_id', g.entity_id,
        'created_at', g.created_at, 'actor_id', g.actor_id,
        'actor', coalesce(nullif(btrim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,'')), ''), '—')
      ) order by g.id desc)
      from (select * from public.admin_activity_logs
             where btrim(coalesce(p_entity,'')) = '' or entity = p_entity
             order by id desc limit v_limit) g
      left join public.profiles p on p.id = g.actor_id), '[]'::jsonb)
  );
end $$;

-- ADMIN: басты бет панелі — 8 карточка, графиктер, соңғы жазбалар (барлығы нақты деректер)
create or replace function public.admin_dashboard(p_days int default 14) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_days int := least(greatest(coalesce(p_days, 14), 7), 90);
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  return jsonb_build_object(
    'days', v_days,
    'stats', jsonb_build_object(
      'students', (select count(*) from public.profiles where role = 'student'),
      'parents', (select count(*) from public.profiles where role = 'parent'),
      'admins', (select count(*) from public.profiles where role = 'admin'),
      'blocked', (select count(*) from public.profiles where is_blocked),
      'active_24h', (select count(*) from public.profiles where last_seen_at > now() - interval '24 hours'),
      'new_7d', (select count(*) from public.profiles where created_at > now() - interval '7 days'),
      'news', (select count(*) from public.news),
      'news_published', (select count(*) from public.news where published),
      'subjects', (select count(*) from public.subjects),
      'lessons', (select count(*) from public.lessons),
      'lessons_published', (select count(*) from public.lessons where published),
      'tests', (select count(*) from public.tests),
      'questions', (select count(*) from public.questions),
      'attempts', (select count(*) from public.test_attempts),
      'completed_lessons', (select count(*) from public.lesson_progress where completed),
      'avg_progress', coalesce((
        select round(avg((public._student_progress(p.id)->>'percent')::int))
        from public.profiles p where p.role = 'student' and not p.is_blocked), 0),
      'avg_score', coalesce((select round(avg(percent)) from public.test_attempts), 0)
    ),
    'registrations', coalesce((
      select jsonb_agg(jsonb_build_object(
        'day', d::date,
        'students', (select count(*) from public.profiles p where p.role = 'student' and p.created_at::date = d::date),
        'parents', (select count(*) from public.profiles p where p.role = 'parent' and p.created_at::date = d::date)
      ) order by d)
      from generate_series(current_date - (v_days - 1), current_date, interval '1 day') d), '[]'::jsonb),
    'activity', coalesce((
      select jsonb_agg(jsonb_build_object(
        'day', d::date,
        'attempts', (select count(*) from public.test_attempts a where a.created_at::date = d::date),
        'completed', (select count(*) from public.lesson_progress lp where lp.completed_at::date = d::date)
      ) order by d)
      from generate_series(current_date - (v_days - 1), current_date, interval '1 day') d), '[]'::jsonb),
    'subjects', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id, 'title', s.title,
        'lessons', count(distinct l.id),
        'completions', count(lp.*) filter (where lp.completed),
        'avg_video', coalesce(round(avg(lp.video_percent)), 0),
        'avg_score', coalesce(round(avg(lp.best_score_percent) filter (where lp.test_passed)), 0)
      ) order by s.sort_order, s.title)
      from public.subjects s
      left join public.lessons l on l.subject_id = s.id and l.published
      left join public.lesson_progress lp on lp.lesson_id = l.id), '[]'::jsonb),
    'scores', (
      select jsonb_agg(jsonb_build_object('range', r.label, 'count', (
        select count(*) from public.test_attempts a
        where a.created_at > now() - (v_days || ' days')::interval
          and a.percent between r.lo and r.hi)) order by r.ord)
      from (values ('0–49', 0, 49, 1), ('50–69', 50, 69, 2), ('70–89', 70, 89, 3), ('90–100', 90, 100, 4))
        as r(label, lo, hi, ord)),
    'top_students', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', x.id, 'first_name', x.first_name, 'last_name', x.last_name, 'phone', x.phone,
        'percent', (x.sp->>'percent')::int, 'lessons_done', (x.sp->>'lessons_done')::int,
        'avg_score', (x.sp->>'avg_score')::int
      ) order by (x.sp->>'percent')::int desc, x.last_name)
      from (select pr.*, public._student_progress(pr.id) as sp
            from public.profiles pr
            where pr.role = 'student' and not pr.is_blocked) x), '[]'::jsonb),
    'recent_students', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', x.id, 'first_name', x.first_name, 'last_name', x.last_name, 'phone', x.phone,
        'is_blocked', x.is_blocked, 'created_at', x.created_at,
        'percent', (x.sp->>'percent')::int, 'lessons_done', (x.sp->>'lessons_done')::int
      ) order by x.created_at desc)
      from (select pr.*, public._student_progress(pr.id) as sp
            from public.profiles pr where pr.role = 'student'
            order by pr.created_at desc limit 6) x), '[]'::jsonb),
    'recent_news', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', n.id, 'title', n.title, 'published', n.published,
        'image_url', n.image_url, 'created_at', n.created_at) order by n.created_at desc)
      from (select * from public.news order by created_at desc limit 5) n), '[]'::jsonb),
    'recent_logs', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', g.id, 'action', g.action, 'entity', g.entity, 'created_at', g.created_at,
        'actor', coalesce(nullif(btrim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,'')), ''), '—')
      ) order by g.id desc)
      from (select * from public.admin_activity_logs order by id desc limit 8) g
      left join public.profiles p on p.id = g.actor_id), '[]'::jsonb),
    'system', jsonb_build_object(
      'database', true,
      'storage', (select count(*) from storage.buckets where id in ('news-images','site-media','lesson-videos')) = 3,
      'auth', (select count(*) > 0 from auth.users),
      'server_time', now()
    )
  );
end $$;

-- Кестені оқу (ADMIN/DIRECTOR/TEACHER). Аты-жөні қорғалған профильден қосылады.
create or replace function public.timetable_list() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'FORBIDDEN'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', t.id, 'teacher_id', t.teacher_id,
      'teacher_name', coalesce(nullif(btrim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,'')), ''), '—'),
      'subject_id', t.subject_id, 'subject_title', coalesce(s.title, '—'),
      'class_name', t.class_name, 'weekday', t.weekday,
      'start_time', t.start_time, 'end_time', t.end_time, 'room', t.room,
      'created_at', t.created_at, 'updated_at', t.updated_at
    ) order by t.weekday, t.start_time, t.class_name)
    from public.timetable t
    left join public.profiles p on p.id = t.teacher_id
    left join public.subjects s on s.id = t.subject_id
    where public.is_admin() or public.is_director() or t.teacher_id = auth.uid()
  ), '[]'::jsonb);
end $$;

-- Директор формасына арналған тізімдер: тек директорға
create or replace function public.timetable_catalog() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_director() then raise exception 'FORBIDDEN'; end if;
  return jsonb_build_object(
    'teachers', coalesce((
      select jsonb_agg(jsonb_build_object('id', p.id, 'first_name', p.first_name, 'last_name', p.last_name)
                       order by p.last_name, p.first_name)
      from public.profiles p where p.role = 'teacher' and not p.is_blocked), '[]'::jsonb),
    'subjects', coalesce((
      select jsonb_agg(jsonb_build_object('id', s.id, 'title', s.title)
                       order by s.sort_order, s.title)
      from public.subjects s), '[]'::jsonb)
  );
end $$;

-- Директорға ғана: кесте өзгерістерінің тарихы
create or replace function public.timetable_history(p_limit int default 100) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_limit int := least(greatest(coalesce(p_limit, 100), 1), 500);
begin
  if not public.is_director() then raise exception 'FORBIDDEN'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', h.id, 'timetable_id', h.timetable_id, 'action', h.action,
      'actor_name', h.actor_name, 'data', h.data, 'created_at', h.created_at
    ) order by h.id desc)
    from (select * from public.timetable_history order by id desc limit v_limit) h
  ), '[]'::jsonb);
end $$;

-- ---------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.news enable row level security;
alter table public.subjects enable row level security;
alter table public.lessons enable row level security;
alter table public.tests enable row level security;
alter table public.questions enable row level security;
alter table public.answer_options enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.test_attempts enable row level security;
alter table public.parent_student_links enable row level security;
alter table public.site_settings enable row level security;
alter table public.social_links enable row level security;
alter table public.content_items enable row level security;
alter table public.admin_activity_logs enable row level security;

do $$
declare r record;
begin
  for r in select schemaname, tablename, policyname from pg_policies where schemaname = 'public' loop
    execute format('drop policy %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

-- profiles: өзін көреді, admin бәрін көреді/өзгертеді. INSERT/DELETE жоқ (триггер жасайды).
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
create policy profiles_admin_update on public.profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- news: жарияланғанды бәрі көреді, басқаруды тек admin
create policy news_select on public.news for select to anon, authenticated
  using (published or public.is_admin());
create policy news_admin_write on public.news for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- subjects: тек кірген пайдаланушы; admin басқарады
create policy subjects_select on public.subjects for select to authenticated using (public.is_active());
create policy subjects_admin_write on public.subjects for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- lessons / tests / questions / answer_options: тікелей тек admin. Оқушылар RPC арқылы ғана.
create policy lessons_admin on public.lessons for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy tests_admin on public.tests for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy questions_admin on public.questions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy options_admin on public.answer_options for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- прогресс және нәтижелер: тек оқу (өзі немесе admin). Жазу тек RPC арқылы.
create policy progress_select on public.lesson_progress for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy attempts_select on public.test_attempts for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- байланыстар: қатысушылар көреді; жазу тек RPC / admin
create policy links_select on public.parent_student_links for select to authenticated
  using (parent_id = auth.uid() or student_id = auth.uid() or public.is_admin());
create policy links_admin_write on public.parent_student_links for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- сайт баптаулары, әлеуметтік желілер, мазмұн: бәрі оқиды, admin жазады
create policy settings_select on public.site_settings for select to anon, authenticated using (true);
create policy settings_admin on public.site_settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy social_select on public.social_links for select to anon, authenticated using (true);
create policy social_admin on public.social_links for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy content_select on public.content_items for select to anon, authenticated using (true);
create policy content_admin on public.content_items for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Сабақ кестесі: көру — admin/director толық, teacher тек өз жазбаларын; жазу — ТЕК director
alter table public.timetable enable row level security;
alter table public.timetable_history enable row level security;
create policy timetable_select on public.timetable for select to authenticated
  using (public.is_admin() or public.is_director() or (public.is_teacher() and teacher_id = auth.uid()));
create policy timetable_insert on public.timetable for insert to authenticated
  with check (public.is_director());
create policy timetable_update on public.timetable for update to authenticated
  using (public.is_director()) with check (public.is_director());
create policy timetable_delete on public.timetable for delete to authenticated
  using (public.is_director());
create policy timetable_history_select on public.timetable_history for select to authenticated
  using (public.is_director());

-- Тікелей Supabase сұраулары үшін құқықтар; нақты шектеуді RLS жасайды
grant select, insert, update, delete on public.timetable to authenticated;
grant select on public.timetable_history to authenticated;
revoke all on public.timetable from anon;
revoke all on public.timetable_history from anon;

create policy logs_admin_select on public.admin_activity_logs for select to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------
-- 7. ФУНКЦИЯ РҰҚСАТТАРЫ
-- ---------------------------------------------------------------------
revoke execute on function public._lesson_status(uuid) from public, anon, authenticated;
revoke execute on function public._student_progress(uuid) from public, anon, authenticated;
revoke execute on function public.log_admin_change() from public, anon, authenticated;
revoke execute on function public.log_timetable_change() from public, anon, authenticated;
revoke execute on function public.set_timetable_creator() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.news_before_write() from public, anon, authenticated;

grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_active() to authenticated;
grant execute on function public.is_director() to authenticated;
grant execute on function public.is_teacher() to authenticated;
grant execute on function public.is_staff() to authenticated;
grant execute on function public.can_view_lesson(uuid) to authenticated;

do $$
declare f text;
begin
  foreach f in array array[
    'touch_presence()','ubt_catalog()','get_lesson(uuid)','report_video_progress(uuid,numeric)',
    'get_test(uuid)','submit_test(uuid,jsonb)','student_overview(uuid)','request_student_link(text)',
    'my_links()','respond_link(uuid,boolean)','remove_link(uuid)','admin_stats()','admin_save_question(uuid,jsonb)',
    'admin_people(text,text)','admin_logs(int,text)','admin_dashboard(int)',
    'timetable_list()','timetable_catalog()','timetable_history(int)'
  ] loop
    execute format('revoke execute on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;

-- Realtime: директор өзгерткен кесте барлық рұқсаты бар пайдаланушыға бірден жетеді
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables
                     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'timetable') then
    execute 'alter publication supabase_realtime add table public.timetable';
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 8. STORAGE
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public) values
  ('news-images', 'news-images', true),
  ('site-media', 'site-media', true),
  ('lesson-videos', 'lesson-videos', false)
on conflict (id) do nothing;

drop policy if exists "mektep_public_read" on storage.objects;
drop policy if exists "mektep_admin_insert" on storage.objects;
drop policy if exists "mektep_admin_update" on storage.objects;
drop policy if exists "mektep_admin_delete" on storage.objects;
drop policy if exists "mektep_video_read" on storage.objects;

create policy "mektep_public_read" on storage.objects for select
  using (bucket_id in ('news-images', 'site-media'));

create policy "mektep_admin_insert" on storage.objects for insert to authenticated
  with check (bucket_id in ('news-images', 'site-media', 'lesson-videos') and public.is_admin());
create policy "mektep_admin_update" on storage.objects for update to authenticated
  using (bucket_id in ('news-images', 'site-media', 'lesson-videos') and public.is_admin());
create policy "mektep_admin_delete" on storage.objects for delete to authenticated
  using (bucket_id in ('news-images', 'site-media', 'lesson-videos') and public.is_admin());

-- Жүктелген видеоны тек сабағы ашық пайдаланушы (немесе admin) оқи алады
create policy "mektep_video_read" on storage.objects for select to authenticated
  using (
    bucket_id = 'lesson-videos' and (
      public.is_admin() or exists (
        select 1 from public.lessons l
        where l.video_path = storage.objects.name and public.can_view_lesson(l.id)
      )
    )
  );

-- ---------------------------------------------------------------------
-- 9. REALTIME
-- ---------------------------------------------------------------------
do $$
begin
  begin alter publication supabase_realtime add table public.news; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.admin_activity_logs; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.site_settings; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.social_links; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.content_items; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.profiles; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.parent_student_links; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.subjects; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.lessons; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.tests; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.questions; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.answer_options; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.lesson_progress; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.test_attempts; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.timetable_history; exception when duplicate_object then null; end;
end $$;

-- ---------------------------------------------------------------------
-- 10. БІРІНШІ ADMIN
-- Сайтта әдеттегідей тіркеліп алыңыз, сосын осы жолды өз нөміріңізбен іске қосыңыз:
--   update public.profiles set role = 'admin' where phone = '+77771234567';
-- ---------------------------------------------------------------------

-- PostgREST кэшін жаңарту: жаңа кесте/функциялар API-де бірден көрінеді
notify pgrst, 'reload schema';
