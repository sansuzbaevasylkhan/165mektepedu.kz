-- =====================================================================
-- 165 MEKTEP — TEACHER PANEL: тапсырмалар, журнал, қатысу, хабарлама, есеп
-- Additive migration: бар кестелерді қайта жазбайды, қауіпсіз кеңейтеді.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. ТАПСЫРМАЛАР (мұғалім → оқушы)
-- ---------------------------------------------------------------------
create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete restrict,
  academic_year_id uuid references public.academic_years(id) on delete set null,
  term text not null default 'year' check (term in ('year','1','2','3','4')),
  title text not null check (char_length(title) between 1 and 200),
  description text not null default '' check (char_length(description) <= 5000),
  class_names text[] not null default '{}'::text[],
  video_url text check (video_url is null or char_length(video_url) <= 500),
  due_at timestamptz,
  max_score int not null default 100 check (max_score between 1 and 1000),
  criteria text not null default '' check (char_length(criteria) <= 2000),
  status text not null default 'draft' check (status in ('draft','published','closed','archived')),
  audience text not null default 'class' check (audience in ('class','students')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists assignments_teacher_idx on public.assignments(teacher_id, created_at desc);
create index if not exists assignments_subject_idx on public.assignments(subject_id, status);
create index if not exists assignments_due_idx on public.assignments(status, due_at);

create table if not exists public.assignment_targets (
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (assignment_id, student_id)
);
create index if not exists assignment_targets_student_idx on public.assignment_targets(student_id);

create table if not exists public.assignment_files (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  kind text not null default 'material' check (kind in ('material','attachment','video')),
  file_name text not null check (char_length(file_name) between 1 and 260),
  storage_path text not null unique,
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes between 0 and 20971520),
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists assignment_files_assignment_idx on public.assignment_files(assignment_id);

create table if not exists public.assignment_submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  text_answer text not null default '' check (char_length(text_answer) <= 10000),
  status text not null default 'assigned'
    check (status in ('assigned','in_progress','submitted','late','checked','returned')),
  submitted_at timestamptz,
  checked_at timestamptz,
  checked_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (assignment_id, student_id)
);
create index if not exists assignment_submissions_student_idx
  on public.assignment_submissions(student_id, status);
create index if not exists assignment_submissions_status_idx
  on public.assignment_submissions(assignment_id, status);

create table if not exists public.assignment_submission_files (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.assignment_submissions(id) on delete cascade,
  file_name text not null check (char_length(file_name) between 1 and 260),
  storage_path text not null unique,
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes between 0 and 20971520),
  created_at timestamptz not null default now()
);
create index if not exists submission_files_submission_idx
  on public.assignment_submission_files(submission_id);

create table if not exists public.assignment_grades (
  submission_id uuid primary key references public.assignment_submissions(id) on delete cascade,
  score numeric(6,2) not null check (score >= 0),
  feedback text not null default '' check (char_length(feedback) <= 3000),
  graded_by uuid references public.profiles(id) on delete set null,
  graded_at timestamptz not null default now()
);

create table if not exists public.assignment_history (
  id bigserial primary key,
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  submission_id uuid references public.assignment_submissions(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null check (char_length(action) between 1 and 60),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists assignment_history_assignment_idx
  on public.assignment_history(assignment_id, created_at desc);

-- ---------------------------------------------------------------------
-- 2. ЭЛЕКТРОНДЫ ЖУРНАЛ: бағалар және сабаққа қатысу
-- ---------------------------------------------------------------------
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  academic_year_id uuid references public.academic_years(id) on delete set null,
  class_name text not null check (char_length(class_name) between 1 and 20),
  term text not null check (term in ('1','2','3','4')),
  kind text not null default 'daily' check (kind in ('daily','sor','soch','term')),
  score numeric(5,2) not null check (score >= 0),
  max_score numeric(5,2) not null default 100 check (max_score > 0),
  lesson_date date not null default current_date,
  comment text not null default '' check (char_length(comment) <= 500),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (score <= max_score)
);
create index if not exists journal_entries_lookup_idx
  on public.journal_entries(subject_id, class_name, term, student_id);
create index if not exists journal_entries_student_idx
  on public.journal_entries(student_id, lesson_date desc);

create table if not exists public.lesson_attendance (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  academic_year_id uuid references public.academic_years(id) on delete set null,
  class_name text not null check (char_length(class_name) between 1 and 20),
  lesson_date date not null default current_date,
  start_time time,
  status text not null default 'present'
    check (status in ('present','late','excused','absent')),
  note text not null default '' check (char_length(note) <= 300),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, subject_id, class_name, lesson_date)
);
create index if not exists lesson_attendance_lookup_idx
  on public.lesson_attendance(subject_id, class_name, lesson_date);
create index if not exists lesson_attendance_student_idx
  on public.lesson_attendance(student_id, lesson_date desc);

-- ---------------------------------------------------------------------
-- 3. МҰҒАЛІМ ХАБАРЛАМАЛАРЫ
-- ---------------------------------------------------------------------
create table if not exists public.teacher_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  audience text not null check (audience in ('individual','class','parents','director')),
  class_name text not null default '' check (char_length(class_name) <= 20),
  subject_id uuid references public.subjects(id) on delete set null,
  student_id uuid references public.profiles(id) on delete set null,
  title text not null check (char_length(title) between 1 and 200),
  body text not null default '' check (char_length(body) <= 5000),
  important boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists teacher_messages_recipient_idx
  on public.teacher_messages(recipient_id, created_at desc);
create index if not exists teacher_messages_sender_idx
  on public.teacher_messages(sender_id, created_at desc);

-- ---------------------------------------------------------------------
-- 4. ЕСЕПТЕРДІ КЕҢЕЙТУ
-- ---------------------------------------------------------------------
alter table public.teacher_reports
  add column if not exists metrics jsonb not null default '{}'::jsonb,
  add column if not exists submitted_to uuid references public.profiles(id) on delete set null,
  add column if not exists week_start date;

create index if not exists teacher_reports_status_idx
  on public.teacher_reports(status, created_at desc);

-- ---------------------------------------------------------------------
-- 5. КӨМЕКШІ ФУНКЦИЯЛАР (RLS)
-- ---------------------------------------------------------------------
create or replace function public.submission_can_view(p_submission uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.assignment_submissions s
    join public.assignments a on a.id = s.assignment_id
    where s.id = p_submission
      and (
        s.student_id = auth.uid()
        or public.is_parent_of(s.student_id)
        or a.teacher_id = auth.uid()
        or public.is_director()
        or public.teacher_admin_has('view')
      )
  );
$$;

create or replace function public.assignment_can_view(p_assignment uuid) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare
  a public.assignments;
  v_uid uuid := auth.uid();
begin
  select * into a from public.assignments where id = p_assignment;
  if not found then return false; end if;
  if public.is_director() or public.teacher_admin_has('view') or a.teacher_id = v_uid then
    return true;
  end if;
  if a.status not in ('published','closed') then return false; end if;
  if exists (select 1 from public.assignment_targets t
             where t.assignment_id = a.id and t.student_id = v_uid) then
    return true;
  end if;
  if public.student_class(v_uid) = any(a.class_names) then return true; end if;
  if exists (
    select 1
    from public.parent_student_links l
    join public.class_members cm on cm.student_id = l.student_id
    where l.parent_id = v_uid and l.status = 'approved' and cm.class_name = any(a.class_names)
  ) then return true; end if;
  if exists (
    select 1
    from public.parent_student_links l
    join public.assignment_targets t on t.student_id = l.student_id
    where l.parent_id = v_uid and l.status = 'approved' and t.assignment_id = a.id
  ) then return true; end if;
  return false;
end $$;

create or replace function public.assignment_can_manage(p_assignment uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.assignments a
    where a.id = p_assignment
      and (a.teacher_id = auth.uid() or public.is_director() or public.teacher_admin_has('view'))
  );
$$;

-- ---------------------------------------------------------------------
-- 6. RLS: жаңа кестелер
-- ---------------------------------------------------------------------
alter table public.assignments enable row level security;
alter table public.assignment_targets enable row level security;
alter table public.assignment_files enable row level security;
alter table public.assignment_submissions enable row level security;
alter table public.assignment_submission_files enable row level security;
alter table public.assignment_grades enable row level security;
alter table public.assignment_history enable row level security;
alter table public.journal_entries enable row level security;
alter table public.lesson_attendance enable row level security;
alter table public.teacher_messages enable row level security;

drop policy if exists assignments_select on public.assignments;
create policy assignments_select on public.assignments
  for select to authenticated using (public.assignment_can_view(id));

drop policy if exists assignment_targets_select on public.assignment_targets;
create policy assignment_targets_select on public.assignment_targets
  for select to authenticated using (public.assignment_can_view(assignment_id));

drop policy if exists assignment_files_select on public.assignment_files;
create policy assignment_files_select on public.assignment_files
  for select to authenticated using (public.assignment_can_view(assignment_id));

drop policy if exists assignment_submissions_select on public.assignment_submissions;
create policy assignment_submissions_select on public.assignment_submissions
  for select to authenticated using (public.submission_can_view(id));

drop policy if exists submission_files_select on public.assignment_submission_files;
create policy submission_files_select on public.assignment_submission_files
  for select to authenticated using (public.submission_can_view(submission_id));

drop policy if exists assignment_grades_select on public.assignment_grades;
create policy assignment_grades_select on public.assignment_grades
  for select to authenticated using (public.submission_can_view(submission_id));

drop policy if exists assignment_history_select on public.assignment_history;
create policy assignment_history_select on public.assignment_history
  for select to authenticated using (public.assignment_can_manage(assignment_id));

drop policy if exists journal_entries_select on public.journal_entries;
create policy journal_entries_select on public.journal_entries
  for select to authenticated
  using (
    student_id = auth.uid()
    or public.is_parent_of(student_id)
    or teacher_id = auth.uid()
    or public.is_director()
    or public.teacher_admin_has('view')
  );

drop policy if exists lesson_attendance_select on public.lesson_attendance;
create policy lesson_attendance_select on public.lesson_attendance
  for select to authenticated
  using (
    student_id = auth.uid()
    or public.is_parent_of(student_id)
    or teacher_id = auth.uid()
    or public.is_director()
    or public.teacher_admin_has('view')
  );

drop policy if exists teacher_messages_select on public.teacher_messages;
create policy teacher_messages_select on public.teacher_messages
  for select to authenticated
  using (sender_id = auth.uid() or recipient_id = auth.uid() or public.is_director());

revoke insert, update, delete on public.assignments from authenticated, anon;
revoke insert, update, delete on public.assignment_targets from authenticated, anon;
revoke insert, update, delete on public.assignment_files from authenticated, anon;
revoke insert, update, delete on public.assignment_submissions from authenticated, anon;
revoke insert, update, delete on public.assignment_submission_files from authenticated, anon;
revoke insert, update, delete on public.assignment_grades from authenticated, anon;
revoke insert, update, delete on public.assignment_history from authenticated, anon;
revoke insert, update, delete on public.journal_entries from authenticated, anon;
revoke insert, update, delete on public.lesson_attendance from authenticated, anon;
revoke insert, update, delete on public.teacher_messages from authenticated, anon;
revoke all on public.assignments from anon;
revoke all on public.assignment_targets from anon;
revoke all on public.assignment_files from anon;
revoke all on public.assignment_submissions from anon;
revoke all on public.assignment_submission_files from anon;
revoke all on public.assignment_grades from anon;
revoke all on public.assignment_history from anon;
revoke all on public.journal_entries from anon;
revoke all on public.lesson_attendance from anon;
revoke all on public.teacher_messages from anon;

grant select on public.assignments to authenticated;
grant select on public.assignment_targets to authenticated;
grant select on public.assignment_files to authenticated;
grant select on public.assignment_submissions to authenticated;
grant select on public.assignment_submission_files to authenticated;
grant select on public.assignment_grades to authenticated;
grant select on public.assignment_history to authenticated;
grant select on public.journal_entries to authenticated;
grant select on public.lesson_attendance to authenticated;
grant select on public.teacher_messages to authenticated;

-- ---------------------------------------------------------------------
-- 7. STORAGE: тапсырма файлдары (private)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'assignment-files', 'assignment-files', false, 20971520,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg','image/png','image/webp','video/mp4','text/plain'
  ]
)
on conflict (id) do nothing;

create or replace function public.assignment_file_can_read(p_name text) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare
  parts text[] := string_to_array(p_name, '/');
  v_aid uuid;
begin
  if coalesce(array_length(parts, 1), 0) < 2 then return false; end if;
  begin
    v_aid := parts[1]::uuid;
  exception when others then
    return false;
  end;
  if not public.assignment_can_view(v_aid) then return false; end if;
  if parts[2] = 'material' then return true; end if;
  if parts[2] = 'submission' then
    if public.is_director() or public.teacher_admin_has('view') then return true; end if;
    if exists (select 1 from public.assignments a where a.id = v_aid and a.teacher_id = auth.uid()) then
      return true;
    end if;
    return coalesce(parts[3], '') = auth.uid()::text
        or (parts[3] ~ '^[0-9a-f-]{36}$' and public.is_parent_of(parts[3]::uuid));
  end if;
  return false;
end $$;

create or replace function public.assignment_file_folder_ok(p_name text) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare
  parts text[] := string_to_array(p_name, '/');
  v_aid uuid;
begin
  if coalesce(array_length(parts, 1), 0) < 3 then return false; end if;
  begin
    v_aid := parts[1]::uuid;
  exception when others then
    return false;
  end;
  if exists (select 1 from public.assignments a where a.id = v_aid and a.teacher_id = auth.uid()) then
    return true;
  end if;
  if parts[2] = 'submission' then
    return coalesce(parts[3], '') = auth.uid()::text
      and exists (
        select 1 from public.assignments a
        where a.id = v_aid and a.status in ('published','closed')
      )
      and public.assignment_can_view(v_aid);
  end if;
  return false;
end $$;

drop policy if exists "assignment_files_read" on storage.objects;
create policy "assignment_files_read" on storage.objects for select to authenticated
  using (bucket_id = 'assignment-files' and public.assignment_file_can_read(name));

drop policy if exists "assignment_files_insert" on storage.objects;
create policy "assignment_files_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'assignment-files' and public.assignment_file_folder_ok(name));

drop policy if exists "assignment_files_delete" on storage.objects;
create policy "assignment_files_delete" on storage.objects for delete to authenticated
  using (
    bucket_id = 'assignment-files'
    and (
      exists (
        select 1 from public.assignments a
        where a.id::text = split_part(name, '/', 1) and a.teacher_id = auth.uid()
      )
      or (
        split_part(name, '/', 2) = 'submission'
        and split_part(name, '/', 3) = auth.uid()::text
      )
    )
  );

-- ---------------------------------------------------------------------
-- 8. ТРИГГЕРЛЕР: updated_at + audit
-- ---------------------------------------------------------------------
drop trigger if exists assignments_updated on public.assignments;
create trigger assignments_updated before update on public.assignments
  for each row execute function public.set_updated_at();

drop trigger if exists submissions_updated on public.assignment_submissions;
create trigger submissions_updated before update on public.assignment_submissions
  for each row execute function public.set_updated_at();

drop trigger if exists journal_updated on public.journal_entries;
create trigger journal_updated before update on public.journal_entries
  for each row execute function public.set_updated_at();

drop trigger if exists lesson_attendance_updated on public.lesson_attendance;
create trigger lesson_attendance_updated before update on public.lesson_attendance
  for each row execute function public.set_updated_at();

do $$
declare t text;
begin
  foreach t in array array[
    'assignments','assignment_submissions','assignment_grades',
    'journal_entries','lesson_attendance','teacher_messages'
  ] loop
    execute format('drop trigger if exists audit_%1$s on public.%1$s', t);
    execute format('create trigger audit_%1$s after insert or update or delete on public.%1$s for each row execute function public.log_teacher_audit()', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 9. RPC: ТАПСЫРМАЛАР
-- ---------------------------------------------------------------------
create or replace function public.assignment_save(p_data jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := nullif(p_data->>'id','')::uuid;
  v_subject uuid := nullif(p_data->>'subject_id','')::uuid;
  v_title text := btrim(coalesce(p_data->>'title',''));
  v_desc text := coalesce(p_data->>'description','');
  v_criteria text := coalesce(p_data->>'criteria','');
  v_status text := coalesce(nullif(p_data->>'status',''),'draft');
  v_audience text := coalesce(nullif(p_data->>'audience',''),'class');
  v_max int := least(greatest(coalesce((p_data->>'max_score')::int, 100), 1), 1000);
  v_due timestamptz := nullif(p_data->>'due_at','')::timestamptz;
  v_video text := nullif(btrim(coalesce(p_data->>'video_url','')), '');
  v_year uuid := coalesce(nullif(p_data->>'academic_year_id','')::uuid, public.current_academic_year());
  v_term text := coalesce(nullif(p_data->>'term',''),'year');
  v_classes text[] := '{}'::text[];
  v_students uuid[] := '{}'::uuid[];
  v_owner uuid;
begin
  if not public.is_teacher() then raise exception 'FORBIDDEN'; end if;
  if v_subject is null or not exists (select 1 from public.subjects where id = v_subject) then
    raise exception 'NOT_FOUND';
  end if;
  if not public.teacher_can_teach(v_subject, '') then raise exception 'FORBIDDEN'; end if;
  if char_length(v_title) not between 1 and 200 then raise exception 'INVALID_TITLE'; end if;
  if char_length(v_desc) > 5000 or char_length(v_criteria) > 2000 then raise exception 'INVALID_DESCRIPTION'; end if;
  if v_status not in ('draft','published') then raise exception 'INVALID_STATUS'; end if;
  if v_audience not in ('class','students') then raise exception 'INVALID_AUDIENCE'; end if;
  if v_term not in ('year','1','2','3','4') then raise exception 'INVALID_TERM'; end if;

  select coalesce(array_agg(distinct btrim(c)), '{}'::text[]) into v_classes
  from jsonb_array_elements_text(coalesce(p_data->'class_names','[]'::jsonb)) c
  where char_length(btrim(c)) between 1 and 20;

  if v_audience = 'class' then
    if coalesce(array_length(v_classes,1),0) = 0 then raise exception 'INVALID_CLASS'; end if;
    if exists (
      select 1 from unnest(v_classes) c where not public.teacher_can_teach(v_subject, c)
    ) then raise exception 'FORBIDDEN'; end if;
  else
    select coalesce(array_agg(distinct x), '{}'::uuid[]) into v_students
    from jsonb_array_elements_text(coalesce(p_data->'student_ids','[]'::jsonb)) s(x)
    where x ~ '^[0-9a-f-]{36}$' and public.teacher_has_student(x::uuid);
    if coalesce(array_length(v_students,1),0) = 0 then raise exception 'INVALID_TARGETS'; end if;
  end if;

  if v_id is null then
    insert into public.assignments(
      teacher_id, subject_id, academic_year_id, term, title, description,
      class_names, video_url, due_at, max_score, criteria, status, audience, published_at
    )
    values (
      auth.uid(), v_subject, v_year, v_term, v_title, v_desc,
      v_classes, v_video, v_due, v_max, v_criteria, v_status, v_audience,
      case when v_status = 'published' then now() else null end
    )
    returning id into v_id;
  else
    select teacher_id into v_owner from public.assignments where id = v_id for update;
    if not found then raise exception 'NOT_FOUND'; end if;
    if v_owner <> auth.uid() then raise exception 'FORBIDDEN'; end if;
    update public.assignments
      set subject_id = v_subject, academic_year_id = v_year, term = v_term,
          title = v_title, description = v_desc, class_names = v_classes,
          video_url = v_video, due_at = v_due, max_score = v_max,
          criteria = v_criteria, status = v_status, audience = v_audience,
          published_at = case
            when v_status = 'published' and published_at is null then now()
            else published_at end,
          updated_at = now()
      where id = v_id;
  end if;

  delete from public.assignment_targets
    where assignment_id = v_id and not (student_id = any(v_students));
  if v_audience = 'students' then
    insert into public.assignment_targets(assignment_id, student_id)
    select v_id, x from unnest(v_students) x
    on conflict do nothing;
  end if;

  insert into public.assignment_history(assignment_id, actor_id, action, details)
  values (v_id, auth.uid(), case when v_status = 'published' then 'PUBLISHED' else 'SAVED' end,
          jsonb_build_object('title', v_title, 'status', v_status));

  return v_id;
end $$;

create or replace function public.assignment_publish(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare a public.assignments;
begin
  select * into a from public.assignments where id = p_id for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if a.teacher_id <> auth.uid() then raise exception 'FORBIDDEN'; end if;
  if a.status not in ('draft','published') then raise exception 'INVALID_STATUS'; end if;
  update public.assignments
    set status = 'published', published_at = coalesce(published_at, now()), updated_at = now()
    where id = p_id;
  insert into public.assignment_history(assignment_id, actor_id, action)
  values (p_id, auth.uid(), 'PUBLISHED');
end $$;

create or replace function public.assignment_close(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare a public.assignments;
begin
  select * into a from public.assignments where id = p_id for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if a.teacher_id <> auth.uid() then raise exception 'FORBIDDEN'; end if;
  update public.assignments set status = 'closed', updated_at = now() where id = p_id;
  insert into public.assignment_history(assignment_id, actor_id, action)
  values (p_id, auth.uid(), 'CLOSED');
end $$;

create or replace function public.assignment_delete(p_id uuid) returns text[]
language plpgsql security definer set search_path = public as $$
declare
  a public.assignments;
  v_paths text[];
begin
  select * into a from public.assignments where id = p_id for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if a.teacher_id <> auth.uid() then raise exception 'FORBIDDEN'; end if;
  if a.status <> 'draft' then raise exception 'FORBIDDEN'; end if;
  select coalesce(array_agg(storage_path), '{}'::text[]) into v_paths
  from public.assignment_files where assignment_id = p_id;
  delete from public.assignments where id = p_id;
  return v_paths;
end $$;

create or replace function public.assignment_file_add(
  p_assignment uuid, p_kind text, p_file_name text, p_storage_path text,
  p_mime text default null, p_size bigint default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid; a public.assignments;
begin
  select * into a from public.assignments where id = p_assignment for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if a.teacher_id <> auth.uid() then raise exception 'FORBIDDEN'; end if;
  if p_kind not in ('material','attachment','video') then raise exception 'INVALID_KIND'; end if;
  if left(p_storage_path, char_length(p_assignment::text) + 1) <> p_assignment::text || '/' then
    raise exception 'INVALID_PATH';
  end if;
  if coalesce(p_size, 0) > 20971520 then raise exception 'FILE_TOO_LARGE'; end if;
  insert into public.assignment_files(
    assignment_id, kind, file_name, storage_path, mime_type, size_bytes, uploaded_by
  )
  values (p_assignment, p_kind, p_file_name, p_storage_path, p_mime, p_size, auth.uid())
  returning id into v_id;
  return v_id;
end $$;

create or replace function public.assignment_file_remove(p_file uuid) returns text
language plpgsql security definer set search_path = public as $$
declare f public.assignment_files; a public.assignments;
begin
  select * into f from public.assignment_files where id = p_file for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  select * into a from public.assignments where id = f.assignment_id;
  if a.teacher_id <> auth.uid() then raise exception 'FORBIDDEN'; end if;
  delete from public.assignment_files where id = p_file;
  return f.storage_path;
end $$;

create or replace function public.assignment_teacher_list(
  p_subject uuid default null, p_class text default '', p_status text default ''
) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v jsonb;
begin
  if not public.is_teacher() then raise exception 'FORBIDDEN'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', a.id,
    'subject_id', a.subject_id,
    'subject_title', s.title,
    'title', a.title,
    'description', a.description,
    'class_names', a.class_names,
    'audience', a.audience,
    'status', a.status,
    'video_url', a.video_url,
    'due_at', a.due_at,
    'max_score', a.max_score,
    'criteria', a.criteria,
    'created_at', a.created_at,
    'published_at', a.published_at,
    'files', (select count(*) from public.assignment_files f where f.assignment_id = a.id),
    'targets', (select count(*) from public.assignment_targets t where t.assignment_id = a.id),
    'submissions', (select count(*) from public.assignment_submissions x where x.assignment_id = a.id),
    'submitted', (select count(*) from public.assignment_submissions x
                  where x.assignment_id = a.id and x.status in ('submitted','late')),
    'checked', (select count(*) from public.assignment_submissions x
                where x.assignment_id = a.id and x.status = 'checked'),
    'avg_score', (select round(avg(g.score), 1)
                  from public.assignment_grades g
                  join public.assignment_submissions x on x.id = g.submission_id
                  where x.assignment_id = a.id)
  ) order by a.created_at desc), '[]'::jsonb)
  into v
  from public.assignments a
  join public.subjects s on s.id = a.subject_id
  where a.teacher_id = auth.uid()
    and (p_subject is null or a.subject_id = p_subject)
    and (coalesce(p_class,'') = '' or p_class = any(a.class_names))
    and (coalesce(p_status,'') = '' or a.status = p_status);
  return v;
end $$;

create or replace function public.assignment_detail(p_id uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  a public.assignments;
  v_full boolean;
begin
  select * into a from public.assignments where id = p_id;
  if not found then raise exception 'NOT_FOUND'; end if;
  if not public.assignment_can_view(p_id) then raise exception 'FORBIDDEN'; end if;
  v_full := a.teacher_id = auth.uid() or public.is_director() or public.teacher_admin_has('view');

  return jsonb_build_object(
    'id', a.id,
    'subject_id', a.subject_id,
    'subject_title', (select title from public.subjects where id = a.subject_id),
    'title', a.title,
    'description', a.description,
    'class_names', a.class_names,
    'audience', a.audience,
    'status', a.status,
    'video_url', a.video_url,
    'due_at', a.due_at,
    'max_score', a.max_score,
    'criteria', a.criteria,
    'term', a.term,
    'academic_year_id', a.academic_year_id,
    'created_at', a.created_at,
    'published_at', a.published_at,
    'files', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', f.id, 'kind', f.kind, 'file_name', f.file_name,
        'storage_path', f.storage_path, 'mime_type', f.mime_type, 'size_bytes', f.size_bytes
      ) order by f.created_at)
      from public.assignment_files f where f.assignment_id = a.id
    ), '[]'::jsonb),
    'targets', case when v_full then coalesce((
      select jsonb_agg(jsonb_build_object(
        'student_id', pr.id,
        'name', btrim(pr.last_name || ' ' || pr.first_name)
      ) order by pr.last_name, pr.first_name)
      from public.assignment_targets t
      join public.profiles pr on pr.id = t.student_id
      where t.assignment_id = a.id
    ), '[]'::jsonb) else '[]'::jsonb end,
    'my_submission', coalesce((
      select jsonb_build_object(
        'id', sub.id, 'status', sub.status, 'text_answer', sub.text_answer,
        'submitted_at', sub.submitted_at, 'checked_at', sub.checked_at,
        'score', g.score, 'feedback', g.feedback,
        'files', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', sf.id, 'file_name', sf.file_name, 'storage_path', sf.storage_path,
            'mime_type', sf.mime_type, 'size_bytes', sf.size_bytes
          ))
          from public.assignment_submission_files sf where sf.submission_id = sub.id
        ), '[]'::jsonb)
      )
      from public.assignment_submissions sub
      left join public.assignment_grades g on g.submission_id = sub.id
      where sub.assignment_id = a.id and sub.student_id = auth.uid()
    ), 'null'::jsonb),
    'submissions', case when v_full then coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', sub.id,
        'student_id', sub.student_id,
        'student_name', btrim(pr.last_name || ' ' || pr.first_name),
        'status', sub.status,
        'text_answer', sub.text_answer,
        'submitted_at', sub.submitted_at,
        'checked_at', sub.checked_at,
        'score', g.score,
        'feedback', g.feedback,
        'files', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', sf.id, 'file_name', sf.file_name, 'storage_path', sf.storage_path,
            'mime_type', sf.mime_type, 'size_bytes', sf.size_bytes
          ))
          from public.assignment_submission_files sf where sf.submission_id = sub.id
        ), '[]'::jsonb)
      ) order by sub.submitted_at desc nulls last, pr.last_name)
      from public.assignment_submissions sub
      join public.profiles pr on pr.id = sub.student_id
      left join public.assignment_grades g on g.submission_id = sub.id
      where sub.assignment_id = a.id
    ), '[]'::jsonb) else '[]'::jsonb end
  );
end $$;

create or replace function public.assignment_submit(p_id uuid, p_text text default '') returns uuid
language plpgsql security definer set search_path = public as $$
declare
  a public.assignments;
  sub public.assignment_submissions;
  v_id uuid;
  v_status text;
begin
  select * into a from public.assignments where id = p_id;
  if not found then raise exception 'NOT_FOUND'; end if;
  if not public.assignment_can_view(p_id) then raise exception 'FORBIDDEN'; end if;
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'student' and not is_blocked
  ) then raise exception 'FORBIDDEN'; end if;
  if a.status <> 'published' then raise exception 'NOT_OPEN'; end if;
  if char_length(coalesce(p_text,'')) > 10000 then raise exception 'INVALID_TEXT'; end if;

  select * into sub from public.assignment_submissions
    where assignment_id = p_id and student_id = auth.uid() for update;
  if found and sub.status = 'checked' then raise exception 'ALREADY_CHECKED'; end if;

  v_status := case when a.due_at is not null and now() > a.due_at then 'late' else 'submitted' end;

  insert into public.assignment_submissions(
    assignment_id, student_id, text_answer, status, submitted_at
  )
  values (p_id, auth.uid(), coalesce(p_text,''), v_status, now())
  on conflict (assignment_id, student_id) do update
    set text_answer = excluded.text_answer,
        status = excluded.status,
        submitted_at = now(),
        updated_at = now()
  returning id into v_id;

  insert into public.assignment_history(assignment_id, submission_id, actor_id, action, details)
  values (p_id, v_id, auth.uid(), 'SUBMITTED', jsonb_build_object('status', v_status));

  insert into public.notifications(user_id, title, body, kind, link)
  values (a.teacher_id, 'Жаңа жауап', left(a.title, 180), 'task', '/teacher/assignments');

  return v_id;
end $$;

create or replace function public.submission_file_add(
  p_submission uuid, p_file_name text, p_storage_path text,
  p_mime text default null, p_size bigint default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  sub public.assignment_submissions;
  a public.assignments;
  v_id uuid;
begin
  select * into sub from public.assignment_submissions where id = p_submission for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if sub.student_id <> auth.uid() then raise exception 'FORBIDDEN'; end if;
  if sub.status = 'checked' then raise exception 'ALREADY_CHECKED'; end if;
  select * into a from public.assignments where id = sub.assignment_id;
  if left(p_storage_path, char_length(a.id::text) + 1) <> a.id::text || '/' then
    raise exception 'INVALID_PATH';
  end if;
  if coalesce(p_size, 0) > 20971520 then raise exception 'FILE_TOO_LARGE'; end if;
  insert into public.assignment_submission_files(
    submission_id, file_name, storage_path, mime_type, size_bytes
  )
  values (p_submission, p_file_name, p_storage_path, p_mime, p_size)
  returning id into v_id;
  return v_id;
end $$;

create or replace function public.submission_review(
  p_submission uuid, p_score numeric, p_feedback text default '', p_action text default 'check'
) returns void
language plpgsql security definer set search_path = public as $$
declare
  sub public.assignment_submissions;
  a public.assignments;
  v_status text;
begin
  select * into sub from public.assignment_submissions where id = p_submission for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  select * into a from public.assignments where id = sub.assignment_id;
  if a.teacher_id <> auth.uid() then raise exception 'FORBIDDEN'; end if;
  if p_action not in ('check','return') then raise exception 'INVALID_ACTION'; end if;
  if sub.status in ('assigned','in_progress') then raise exception 'NOT_SUBMITTED'; end if;
  if p_action = 'check' then
    if p_score is null or p_score < 0 or p_score > a.max_score then raise exception 'INVALID_SCORE'; end if;
    v_status := 'checked';
    insert into public.assignment_grades(submission_id, score, feedback, graded_by, graded_at)
    values (p_submission, p_score, left(coalesce(p_feedback,''),3000), auth.uid(), now())
    on conflict (submission_id) do update
      set score = excluded.score, feedback = excluded.feedback,
          graded_by = excluded.graded_by, graded_at = now();
  else
    v_status := 'returned';
  end if;

  update public.assignment_submissions
    set status = v_status, checked_at = now(), checked_by = auth.uid(), updated_at = now()
    where id = p_submission;

  insert into public.assignment_history(assignment_id, submission_id, actor_id, action, details)
  values (a.id, p_submission, auth.uid(),
          case when p_action = 'check' then 'CHECKED' else 'RETURNED' end,
          jsonb_build_object('score', p_score, 'feedback', p_feedback));

  insert into public.notifications(user_id, title, body, kind, link)
  values (sub.student_id,
          case when p_action = 'check' then 'Жұмыс тексерілді' else 'Қайта орындауға жіберілді' end,
          left(a.title, 180), 'task', '/cabinet/assignments');
end $$;

create or replace function public.assignment_student_list() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v jsonb;
begin
  if not public.is_active() then raise exception 'FORBIDDEN'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', a.id,
    'subject_title', s.title,
    'teacher_name', btrim(tp.first_name || ' ' || tp.last_name),
    'title', a.title,
    'description', a.description,
    'class_names', a.class_names,
    'due_at', a.due_at,
    'max_score', a.max_score,
    'criteria', a.criteria,
    'video_url', a.video_url,
    'status', a.status,
    'files', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', f.id, 'kind', f.kind, 'file_name', f.file_name,
        'storage_path', f.storage_path, 'mime_type', f.mime_type, 'size_bytes', f.size_bytes
      ))
      from public.assignment_files f where f.assignment_id = a.id
    ), '[]'::jsonb),
    'my_submission', (
      select jsonb_build_object(
        'id', sub.id, 'status', sub.status, 'text_answer', sub.text_answer,
        'submitted_at', sub.submitted_at, 'score', g.score, 'feedback', g.feedback
      )
      from public.assignment_submissions sub
      left join public.assignment_grades g on g.submission_id = sub.id
      where sub.assignment_id = a.id and sub.student_id = auth.uid()
    )
  ) order by (a.due_at is null), a.due_at, a.created_at desc), '[]'::jsonb)
  into v
  from public.assignments a
  join public.subjects s on s.id = a.subject_id
  join public.profiles tp on tp.id = a.teacher_id
  where public.assignment_can_view(a.id) and a.status in ('published','closed');
  return v;
end $$;

create or replace function public.assignment_history_list(p_assignment uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.assignment_can_manage(p_assignment) then raise exception 'FORBIDDEN'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', h.id, 'action', h.action, 'details', h.details,
      'actor', btrim(coalesce(pr.first_name,'') || ' ' || coalesce(pr.last_name,'')),
      'created_at', h.created_at
    ) order by h.created_at desc)
    from public.assignment_history h
    left join public.profiles pr on pr.id = h.actor_id
    where h.assignment_id = p_assignment
  ), '[]'::jsonb);
end $$;

-- ---------------------------------------------------------------------
-- 10. RPC: ЖУРНАЛ ЖӘНЕ ҚАТЫСУ
-- ---------------------------------------------------------------------
create or replace function public.journal_get(
  p_subject uuid, p_class text, p_term text default '1', p_date date default current_date
) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_term text := case when p_term in ('1','2','3','4') then p_term else '1' end;
begin
  if not public.teacher_can_teach(p_subject, p_class) then raise exception 'FORBIDDEN'; end if;
  return jsonb_build_object(
    'subject_id', p_subject,
    'class_name', p_class,
    'term', v_term,
    'date', p_date,
    'students', coalesce((
      select jsonb_agg(jsonb_build_object(
        'student_id', pr.id,
        'first_name', pr.first_name,
        'last_name', pr.last_name,
        'grades', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', j.id, 'kind', j.kind, 'score', j.score,
            'max_score', j.max_score, 'date', j.lesson_date, 'comment', j.comment,
            'teacher_id', j.teacher_id
          ) order by j.lesson_date, j.created_at)
          from public.journal_entries j
          where j.student_id = pr.id and j.subject_id = p_subject
            and j.class_name = p_class and j.term = v_term
        ), '[]'::jsonb),
        'average', (
          select round(avg(j.score), 2) from public.journal_entries j
          where j.student_id = pr.id and j.subject_id = p_subject
            and j.class_name = p_class and j.term = v_term
        ),
        'attendance', (
          select jsonb_build_object('status', la.status, 'note', la.note)
          from public.lesson_attendance la
          where la.student_id = pr.id and la.subject_id = p_subject
            and la.class_name = p_class and la.lesson_date = p_date
          limit 1
        )
      ) order by pr.last_name, pr.first_name)
      from public.class_members cm
      join public.profiles pr on pr.id = cm.student_id
      where cm.class_name = p_class
        and cm.academic_year_id = public.current_academic_year()
    ), '[]'::jsonb)
  );
end $$;

create or replace function public.journal_grade_save(
  p_student uuid, p_subject uuid, p_class text, p_term text,
  p_kind text, p_score numeric, p_max numeric default 100,
  p_date date default current_date, p_comment text default ''
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_term text := case when p_term in ('1','2','3','4') then p_term else '1' end;
begin
  if not public.teacher_can_teach(p_subject, p_class) then raise exception 'FORBIDDEN'; end if;
  if p_kind not in ('daily','sor','soch','term') then raise exception 'INVALID_KIND'; end if;
  if p_max is null or p_max <= 0 or p_max > 1000 then raise exception 'INVALID_SCORE'; end if;
  if p_score is null or p_score < 0 or p_score > p_max then raise exception 'INVALID_SCORE'; end if;
  if not exists (
    select 1 from public.class_members
    where student_id = p_student and class_name = p_class
      and academic_year_id = public.current_academic_year()
  ) then raise exception 'NOT_FOUND'; end if;

  insert into public.journal_entries(
    teacher_id, student_id, subject_id, academic_year_id, class_name,
    term, kind, score, max_score, lesson_date, comment, created_by
  )
  values (
    auth.uid(), p_student, p_subject, public.current_academic_year(), p_class,
    v_term, p_kind, p_score, p_max, p_date, left(coalesce(p_comment,''),500), auth.uid()
  )
  returning id into v_id;
  return v_id;
end $$;

create or replace function public.journal_grade_delete(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare j public.journal_entries;
begin
  select * into j from public.journal_entries where id = p_id for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if j.teacher_id <> auth.uid() then raise exception 'FORBIDDEN'; end if;
  delete from public.journal_entries where id = p_id;
end $$;

create or replace function public.lesson_attendance_save(
  p_subject uuid, p_class text, p_date date, p_start time, p_entries jsonb
) returns void
language plpgsql security definer set search_path = public as $$
declare e jsonb; v_student uuid; v_status text;
begin
  if not public.teacher_can_teach(p_subject, p_class) then raise exception 'FORBIDDEN'; end if;
  if p_entries is null or jsonb_typeof(p_entries) <> 'array' then raise exception 'INVALID_DATA'; end if;

  for e in select * from jsonb_array_elements(p_entries) loop
    v_student := nullif(e->>'student_id','')::uuid;
    v_status := coalesce(e->>'status','present');
    if v_student is null then continue; end if;
    if v_status not in ('present','late','excused','absent') then raise exception 'INVALID_STATUS'; end if;
    if not exists (
      select 1 from public.class_members
      where student_id = v_student and class_name = p_class
        and academic_year_id = public.current_academic_year()
    ) then continue; end if;

    insert into public.lesson_attendance(
      teacher_id, student_id, subject_id, academic_year_id, class_name,
      lesson_date, start_time, status, note, created_by
    )
    values (
      auth.uid(), v_student, p_subject, public.current_academic_year(), p_class,
      p_date, p_start, v_status, left(coalesce(e->>'note',''),300), auth.uid()
    )
    on conflict (student_id, subject_id, class_name, lesson_date) do update
      set status = excluded.status, note = excluded.note,
          start_time = excluded.start_time, teacher_id = excluded.teacher_id,
          updated_at = now();
  end loop;
end $$;

create or replace function public.student_progress(p_student uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_ok boolean;
begin
  v_ok := p_student = auth.uid()
       or public.is_parent_of(p_student)
       or public.teacher_has_student(p_student)
       or public.is_director()
       or public.teacher_admin_has('view');
  if not v_ok then raise exception 'FORBIDDEN'; end if;

  return jsonb_build_object(
    'student', (select jsonb_build_object(
      'id', p.id, 'first_name', p.first_name, 'last_name', p.last_name,
      'class_name', public.student_class(p.id)
    ) from public.profiles p where p.id = p_student),
    'subjects', coalesce((
      select jsonb_agg(jsonb_build_object(
        'subject_id', x.subject_id,
        'title', x.title,
        'average', x.avg_score,
        'grades', x.cnt,
        'attendance_present', x.present,
        'attendance_total', x.total
      ) order by x.title)
      from (
        select s.id subject_id, s.title,
               round(avg(j.score), 2) avg_score, count(j.id) cnt,
               count(la.id) filter (where la.status = 'present') present,
               count(la.id) total
        from public.journal_entries j
        join public.subjects s on s.id = j.subject_id
        left join public.lesson_attendance la
          on la.student_id = j.student_id and la.subject_id = j.subject_id
        where j.student_id = p_student
        group by s.id, s.title
      ) x
    ), '[]'::jsonb),
    'assignments', jsonb_build_object(
      'total', (select count(*) from public.assignments a
                where a.status in ('published','closed')
                  and (
                    exists (select 1 from public.class_members cm
                            where cm.student_id = p_student and cm.class_name = any(a.class_names))
                    or exists (select 1 from public.assignment_targets t
                               where t.assignment_id = a.id and t.student_id = p_student)
                  )),
      'checked', (select count(*) from public.assignment_submissions s
                  where s.student_id = p_student and s.status = 'checked'),
      'avg_score', (select round(avg(g.score), 2) from public.assignment_grades g
                    join public.assignment_submissions s on s.id = g.submission_id
                    where s.student_id = p_student)
    ),
    'recent_grades', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', j.id, 'subject', s.title, 'kind', j.kind,
        'score', j.score, 'max_score', j.max_score,
        'date', j.lesson_date, 'comment', j.comment
      ) order by j.lesson_date desc, j.created_at desc)
      from (
        select * from public.journal_entries
        where student_id = p_student
        order by lesson_date desc limit 20
      ) j
      join public.subjects s on s.id = j.subject_id
    ), '[]'::jsonb)
  );
end $$;

-- ---------------------------------------------------------------------
-- 11. RPC: ХАБАРЛАМАЛАР
-- ---------------------------------------------------------------------
create or replace function public.teacher_message_send(
  p_audience text, p_recipient uuid, p_class text, p_subject uuid,
  p_title text, p_body text, p_important boolean default false,
  p_student uuid default null
) returns int
language plpgsql security definer set search_path = public as $$
declare
  v_title text := btrim(coalesce(p_title,''));
  v_body text := coalesce(p_body,'');
  v_class text := btrim(coalesce(p_class,''));
  v_count int := 0;
  r record;
begin
  if not public.is_teacher() then raise exception 'FORBIDDEN'; end if;
  if char_length(v_title) not between 1 and 200 then raise exception 'INVALID_TITLE'; end if;
  if char_length(v_body) > 5000 then raise exception 'INVALID_BODY'; end if;
  if p_audience not in ('individual','class','parents','director') then raise exception 'INVALID_AUDIENCE'; end if;

  if p_audience = 'director' then
    for r in select id from public.profiles where role = 'director' and not is_blocked loop
      insert into public.teacher_messages(sender_id, recipient_id, audience, class_name, subject_id, student_id, title, body, important)
      values (auth.uid(), r.id, 'director', v_class, p_subject, p_student, v_title, v_body, coalesce(p_important,false));
      insert into public.notifications(user_id, title, body, kind, link)
      values (r.id, 'Мұғалім хабарламасы: ' || v_title, left(v_body, 200), 'system', '/direktor-admin/teachers');
      v_count := v_count + 1;
    end loop;
    return v_count;
  end if;

  if p_audience = 'individual' then
    if p_recipient is null then raise exception 'INVALID_RECIPIENT'; end if;
    if not exists (
      select 1 from public.profiles p where p.id = p_recipient and p.role in ('student','parent','director','admin') and not p.is_blocked
    ) then raise exception 'INVALID_RECIPIENT'; end if;
    if exists (select 1 from public.profiles where id = p_recipient and role = 'student') then
      if not public.teacher_has_student(p_recipient) then raise exception 'FORBIDDEN'; end if;
    elsif exists (select 1 from public.profiles where id = p_recipient and role = 'parent') then
      if not exists (
        select 1 from public.parent_student_links l
        where l.parent_id = p_recipient and l.status = 'approved'
          and public.teacher_has_student(l.student_id)
      ) then raise exception 'FORBIDDEN'; end if;
    end if;
    insert into public.teacher_messages(sender_id, recipient_id, audience, class_name, subject_id, student_id, title, body, important)
    values (auth.uid(), p_recipient, 'individual', v_class, p_subject, p_student, v_title, v_body, coalesce(p_important,false));
    insert into public.notifications(user_id, title, body, kind, link)
    values (p_recipient, 'Мұғалім хабарламасы: ' || v_title, left(v_body, 200), 'system', '/cabinet');
    return 1;
  end if;

  if v_class = '' or not public.teacher_has_class(v_class) then raise exception 'FORBIDDEN'; end if;

  if p_audience = 'class' then
    for r in
      select p.id
      from public.class_members cm
      join public.profiles p on p.id = cm.student_id
      where cm.class_name = v_class
        and cm.academic_year_id = public.current_academic_year()
        and not p.is_blocked
    loop
      insert into public.teacher_messages(sender_id, recipient_id, audience, class_name, subject_id, student_id, title, body, important)
      values (auth.uid(), r.id, 'class', v_class, p_subject, p_student, v_title, v_body, coalesce(p_important,false));
      insert into public.notifications(user_id, title, body, kind, link)
      values (r.id, 'Сынып хабарламасы: ' || v_title, left(v_body, 200), 'system', '/cabinet');
      v_count := v_count + 1;
    end loop;
  else
    for r in
      select distinct l.parent_id
      from public.class_members cm
      join public.parent_student_links l on l.student_id = cm.student_id and l.status = 'approved'
      join public.profiles pp on pp.id = l.parent_id and not pp.is_blocked
      where cm.class_name = v_class
        and cm.academic_year_id = public.current_academic_year()
    loop
      insert into public.teacher_messages(sender_id, recipient_id, audience, class_name, subject_id, student_id, title, body, important)
      values (auth.uid(), r.parent_id, 'parents', v_class, p_subject, p_student, v_title, v_body, coalesce(p_important,false));
      insert into public.notifications(user_id, title, body, kind, link)
      values (r.parent_id, 'Ата-аналарға хабарлама: ' || v_title, left(v_body, 200), 'system', '/cabinet');
      v_count := v_count + 1;
    end loop;
  end if;
  return v_count;
end $$;

create or replace function public.my_messages(p_limit int default 50) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_active() then raise exception 'FORBIDDEN'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', m.id,
      'sender_id', m.sender_id,
      'recipient_id', m.recipient_id,
      'audience', m.audience,
      'class_name', m.class_name,
      'title', m.title,
      'body', m.body,
      'important', m.important,
      'read_at', m.read_at,
      'created_at', m.created_at,
      'is_mine', m.sender_id = auth.uid(),
      'sender_name', btrim(coalesce(sp.first_name,'') || ' ' || coalesce(sp.last_name,'')),
      'recipient_name', btrim(coalesce(rp.first_name,'') || ' ' || coalesce(rp.last_name,''))
    ) order by m.created_at desc)
    from (
      select * from public.teacher_messages
      where sender_id = auth.uid() or recipient_id = auth.uid()
      order by created_at desc
      limit least(greatest(coalesce(p_limit,50),1),200)
    ) m
    left join public.profiles sp on sp.id = m.sender_id
    left join public.profiles rp on rp.id = m.recipient_id
  ), '[]'::jsonb);
end $$;

create or replace function public.message_mark_read(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.teacher_messages
    set read_at = now()
    where id = p_id and recipient_id = auth.uid() and read_at is null;
end $$;

create or replace function public.message_unread_count() returns int
language sql stable security definer set search_path = public as $$
  select count(*)::int from public.teacher_messages
  where recipient_id = auth.uid() and read_at is null;
$$;

-- ---------------------------------------------------------------------
-- 12. RPC: ЕСЕПТЕР
-- ---------------------------------------------------------------------
create or replace function public.teacher_report_generate(
  p_start date, p_end date
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_director uuid;
  v_lessons int;
  v_assignments int;
  v_checked int;
  v_students int;
  v_avg numeric;
  v_att jsonb;
  v_metrics jsonb;
begin
  if not public.is_teacher() then raise exception 'FORBIDDEN'; end if;
  if p_end < p_start then raise exception 'INVALID_PERIOD'; end if;

  v_lessons := (select count(*) from public.teacher_work_logs
                where teacher_id = auth.uid() and work_date between p_start and p_end
                  and status = 'conducted');
  v_assignments := (select count(*) from public.assignments
                    where teacher_id = auth.uid() and created_at::date between p_start and p_end);
  v_checked := (select count(*) from public.assignment_grades g
                join public.assignment_submissions s on s.id = g.submission_id
                join public.assignments a on a.id = s.assignment_id
                where a.teacher_id = auth.uid() and g.graded_at::date between p_start and p_end);
  v_students := (select count(distinct cm.student_id)
                 from public.class_members cm
                 join public.teacher_assignments a on a.teacher_id = auth.uid()
                 where cm.class_name = any(a.classes));
  v_avg := (select round(avg(g.score), 2) from public.assignment_grades g
            join public.assignment_submissions s on s.id = g.submission_id
            join public.assignments a on a.id = s.assignment_id
            where a.teacher_id = auth.uid() and g.graded_at::date between p_start and p_end);
  v_att := (select jsonb_build_object(
              'present', count(*) filter (where status = 'present'),
              'late', count(*) filter (where status = 'late'),
              'excused', count(*) filter (where status = 'excused'),
              'absent', count(*) filter (where status = 'absent')
            ) from public.lesson_attendance
            where teacher_id = auth.uid() and lesson_date between p_start and p_end);

  v_metrics := jsonb_build_object(
    'lessons', v_lessons,
    'assignments', v_assignments,
    'checked', v_checked,
    'students', v_students,
    'avg_score', coalesce(v_avg, 0),
    'attendance', coalesce(v_att, '{}'::jsonb)
  );

  select id into v_director from public.profiles
    where role = 'director' and not is_blocked
    order by created_at limit 1;

  insert into public.teacher_reports(
    teacher_id, period_start, period_end, title, content, status,
    metrics, submitted_to, week_start, created_by
  )
  values (
    auth.uid(), p_start, p_end,
    'Апталық жұмыс есебі (' || p_start || ' — ' || p_end || ')',
    coalesce(jsonb_pretty(v_metrics), ''),
    'submitted', v_metrics, v_director, p_start, auth.uid()
  )
  returning id into v_id;

  if v_director is not null then
    insert into public.notifications(user_id, title, body, kind, link)
    values (v_director, 'Жаңа мұғалім есебі',
            'Апталық есеп тексеруді күтуде.', 'system', '/direktor-admin/academics');
  end if;
  return v_id;
end $$;

create or replace function public.director_reports_list(p_status text default '') returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not (public.is_director() or public.teacher_admin_has('view')) then raise exception 'FORBIDDEN'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', r.id,
      'teacher_id', r.teacher_id,
      'teacher_name', btrim(p.first_name || ' ' || p.last_name),
      'period_start', r.period_start,
      'period_end', r.period_end,
      'title', r.title,
      'status', r.status,
      'metrics', r.metrics,
      'created_at', r.created_at,
      'reviewed_at', r.reviewed_at
    ) order by r.created_at desc)
    from public.teacher_reports r
    join public.profiles p on p.id = r.teacher_id
    where coalesce(p_status,'') = '' or r.status = p_status
  ), '[]'::jsonb);
end $$;

-- ---------------------------------------------------------------------
-- 13. RPC: МҰҒАЛІМ ПАНЕЛІНІҢ БАСТЫ БЕТІ
-- ---------------------------------------------------------------------
create or replace function public.teacher_panel_dashboard() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v jsonb;
begin
  if not public.is_teacher() then raise exception 'FORBIDDEN'; end if;
  select jsonb_build_object(
    'lessons_today', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', tt.id, 'subject', s.title, 'class_name', tt.class_name,
        'start_time', tt.start_time, 'end_time', tt.end_time, 'room', tt.room
      ) order by tt.start_time)
      from public.timetable tt
      join public.subjects s on s.id = tt.subject_id
      where tt.teacher_id = auth.uid()
        and tt.weekday = extract(isodow from current_date)
    ), '[]'::jsonb),
    'classes', coalesce((
      select array_agg(distinct c) from public.teacher_assignments a, unnest(a.classes) c
      where a.teacher_id = auth.uid()
    ), '{}'::text[]),
    'subjects', (select count(*) from public.teacher_assignments where teacher_id = auth.uid()),
    'students', (select count(distinct cm.student_id)
                 from public.class_members cm
                 join public.teacher_assignments a on a.teacher_id = auth.uid()
                 where cm.class_name = any(a.classes)),
    'pending_submissions', (select count(*)
      from public.assignment_submissions sub
      join public.assignments a on a.id = sub.assignment_id
      where a.teacher_id = auth.uid() and sub.status in ('submitted','late')),
    'today_attendance', jsonb_build_object(
      'present', (select count(*) from public.lesson_attendance
                  where teacher_id = auth.uid() and lesson_date = current_date and status = 'present'),
      'late', (select count(*) from public.lesson_attendance
               where teacher_id = auth.uid() and lesson_date = current_date and status = 'late'),
      'excused', (select count(*) from public.lesson_attendance
                  where teacher_id = auth.uid() and lesson_date = current_date and status = 'excused'),
      'absent', (select count(*) from public.lesson_attendance
                 where teacher_id = auth.uid() and lesson_date = current_date and status = 'absent')
    ),
    'upcoming', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', a.id, 'title', a.title, 'subject', s.title,
        'due_at', a.due_at, 'status', a.status
      ) order by a.due_at)
      from (
        select * from public.assignments
        where teacher_id = auth.uid() and status = 'published'
        order by due_at nulls last
        limit 5
      ) a
      join public.subjects s on s.id = a.subject_id
    ), '[]'::jsonb),
    'messages', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', m.id, 'title', m.title, 'body', m.body,
        'is_mine', m.sender_id = auth.uid(), 'important', m.important,
        'read_at', m.read_at, 'created_at', m.created_at
      ) order by m.created_at desc)
      from (
        select * from public.teacher_messages
        where sender_id = auth.uid() or recipient_id = auth.uid()
        order by created_at desc limit 4
      ) m
    ), '[]'::jsonb),
    'unread_messages', (select count(*) from public.teacher_messages
                        where recipient_id = auth.uid() and read_at is null),
    'director_messages', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', m.id, 'title', m.title, 'body', m.body,
        'read_at', m.read_at, 'created_at', m.created_at
      ) order by m.created_at desc)
      from (
        select m.* from public.teacher_messages m
        join public.profiles p on p.id = m.sender_id
        where m.recipient_id = auth.uid() and p.role = 'director'
        order by m.created_at desc limit 3
      ) m
    ), '[]'::jsonb)
  ) into v;
  return v;
end $$;

-- ---------------------------------------------------------------------
-- 14. REALTIME
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'assignments','assignment_submissions','journal_entries',
    'lesson_attendance','teacher_messages','class_members'
  ] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;
