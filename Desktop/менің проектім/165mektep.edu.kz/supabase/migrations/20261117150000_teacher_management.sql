-- =====================================================================
-- 165 MEKTEP — Мұғалімдерді басқару (ADMIN) + тапсырмалар/хабарламалар
-- Additive migration: бар кестелер мен деректерді өзгертпейді.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. КЕСТЕЛЕР
-- ---------------------------------------------------------------------

-- Директор анықтайтын әкімші рұқсаттары (мұғалімдерге қатысты)
create table if not exists public.admin_teacher_permissions (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  can_view_teachers boolean not null default true,
  can_view_documents boolean not null default true,
  can_edit_teachers boolean not null default true,
  can_manage_accounts boolean not null default true,
  granted_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

-- Мұғалімнің қосымша профилі (auth/profiles кестелерін қайталамайды)
create table if not exists public.teacher_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  email text not null default '' check (char_length(email) <= 160),
  photo_url text,
  employment_status text not null default 'active'
    check (employment_status in ('active','probation','on_leave','terminated','archived')),
  hired_at date,
  birth_date date,
  qualification text not null default '' check (char_length(qualification) <= 300),
  address text not null default '' check (char_length(address) <= 300),
  notes text not null default '' check (char_length(notes) <= 2000),
  block_reason text not null default '' check (char_length(block_reason) <= 300),
  blocked_until timestamptz,
  archived_at timestamptz,
  archived_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Пән + сыныптар
create table if not exists public.teacher_assignments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  classes text[] not null default '{}'::text[],
  weekly_hours int not null default 0 check (weekly_hours between 0 and 40),
  created_at timestamptz not null default now(),
  unique (teacher_id, subject_id)
);
create index if not exists teacher_assignments_teacher_idx on public.teacher_assignments(teacher_id);
create index if not exists teacher_assignments_subject_idx on public.teacher_assignments(subject_id);

-- Мұғалім құжаттары (файл — private storage bucket ішінде)
create table if not exists public.teacher_documents (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null default 'other'
    check (kind in ('diploma','certificate','medical','contract','identity','other')),
  title text not null default '' check (char_length(title) <= 160),
  file_name text not null check (char_length(file_name) between 1 and 260),
  storage_path text not null unique,
  mime_type text,
  size_bytes bigint,
  verified boolean not null default false,
  verified_at timestamptz,
  verified_by uuid references public.profiles(id) on delete set null,
  note text not null default '' check (char_length(note) <= 500),
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists teacher_documents_teacher_idx on public.teacher_documents(teacher_id, created_at desc);

-- Мұғалімге берілген тапсырмалар
create table if not exists public.teacher_tasks (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  description text not null default '' check (char_length(description) <= 2000),
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  status text not null default 'pending' check (status in ('pending','in_progress','done','cancelled')),
  due_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists teacher_tasks_teacher_idx on public.teacher_tasks(teacher_id, status, due_at);
create index if not exists teacher_tasks_status_idx on public.teacher_tasks(status, due_at);

-- Пайдаланушы хабарламалары (realtime + браузер хабарламасы)
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  body text not null default '' check (char_length(body) <= 500),
  kind text not null default 'system' check (kind in ('task','account','system')),
  link text not null default '',
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications(user_id, created_at desc);

-- Қатысу / кешігу
create table if not exists public.teacher_attendance (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  work_date date not null,
  check_in time,
  check_out time,
  status text not null default 'present' check (status in ('present','late','absent','leave')),
  late_minutes int not null default 0 check (late_minutes between 0 and 600),
  note text not null default '' check (char_length(note) <= 500),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (teacher_id, work_date)
);
create index if not exists teacher_attendance_teacher_idx on public.teacher_attendance(teacher_id, work_date desc);

-- Өткізілген сабақтар журналы
create table if not exists public.teacher_work_logs (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  work_date date not null default current_date,
  subject_id uuid references public.subjects(id) on delete set null,
  class_name text not null default '' check (char_length(class_name) <= 20),
  topic text not null default '' check (char_length(topic) <= 300),
  status text not null default 'conducted' check (status in ('conducted','missed','substituted')),
  note text not null default '' check (char_length(note) <= 500),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists teacher_work_logs_teacher_idx on public.teacher_work_logs(teacher_id, work_date desc);

-- Жұмыс есептері
create table if not exists public.teacher_reports (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  title text not null check (char_length(title) between 1 and 200),
  content text not null default '' check (char_length(content) <= 5000),
  status text not null default 'submitted' check (status in ('submitted','approved','revision')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  check (period_end >= period_start)
);
create index if not exists teacher_reports_teacher_idx on public.teacher_reports(teacher_id, created_at desc);

-- Audit log-қа толық өзгеріс мәліметін қосу (бар жолдарға әсер етпейді)
alter table public.admin_activity_logs
  add column if not exists details jsonb not null default '{}'::jsonb;

-- ---------------------------------------------------------------------
-- 2. КӨМЕКШІ ФУНКЦИЯЛАР
-- ---------------------------------------------------------------------

-- Директор әрқашан рұқсатты; әкімші үшін директор белгілеген рұқсат.
-- Жазба болмаса — әдепкі true (директор кейін шектей алады).
create or replace function public.teacher_admin_has(p_key text) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_director() or (
    public.is_admin() and coalesce((
      select case p_key
        when 'view' then can_view_teachers
        when 'documents' then can_view_documents
        when 'edit' then can_edit_teachers
        when 'accounts' then can_manage_accounts
        else false
      end
      from public.admin_teacher_permissions
      where user_id = auth.uid()
    ), true)
  );
$$;

create or replace function public.teacher_admin_my_permissions() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'role', (select role from public.profiles where id = auth.uid()),
    'director', public.is_director(),
    'view', public.teacher_admin_has('view'),
    'documents', public.teacher_admin_has('documents'),
    'edit', public.teacher_admin_has('edit'),
    'accounts', public.teacher_admin_has('accounts')
  );
$$;

-- Пән/сынып тағайындауларын толық қайта жазу (тек ішкі қолданыс)
create or replace function public._teacher_set_assignments(p_teacher uuid, p_items jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  delete from public.teacher_assignments where teacher_id = p_teacher;
  if p_items is null or jsonb_typeof(p_items) <> 'array' then return; end if;
  for v in select * from jsonb_array_elements(p_items) loop
    if coalesce(v->>'subject_id','') = '' then continue; end if;
    if not exists (select 1 from public.subjects where id = (v->>'subject_id')::uuid) then continue; end if;
    insert into public.teacher_assignments(teacher_id, subject_id, classes, weekly_hours)
    values (
      p_teacher,
      (v->>'subject_id')::uuid,
      coalesce((
        select array_agg(distinct btrim(x))
        from jsonb_array_elements_text(coalesce(v->'classes','[]'::jsonb)) as t(x)
        where char_length(btrim(x)) between 1 and 20
      ), '{}'::text[]),
      least(greatest(coalesce((v->>'weekly_hours')::int, 0), 0), 40)
    )
    on conflict (teacher_id, subject_id) do update
      set classes = excluded.classes, weekly_hours = excluded.weekly_hours;
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 3. RLS
-- ---------------------------------------------------------------------
alter table public.admin_teacher_permissions enable row level security;
alter table public.teacher_profiles enable row level security;
alter table public.teacher_assignments enable row level security;
alter table public.teacher_documents enable row level security;
alter table public.teacher_tasks enable row level security;
alter table public.notifications enable row level security;
alter table public.teacher_attendance enable row level security;
alter table public.teacher_work_logs enable row level security;
alter table public.teacher_reports enable row level security;

drop policy if exists admin_teacher_permissions_select on public.admin_teacher_permissions;
create policy admin_teacher_permissions_select on public.admin_teacher_permissions
  for select to authenticated
  using (public.is_director() or user_id = auth.uid());

drop policy if exists teacher_profiles_select on public.teacher_profiles;
create policy teacher_profiles_select on public.teacher_profiles
  for select to authenticated
  using (public.teacher_admin_has('view') or user_id = auth.uid());

drop policy if exists teacher_assignments_select on public.teacher_assignments;
create policy teacher_assignments_select on public.teacher_assignments
  for select to authenticated
  using (public.teacher_admin_has('view') or teacher_id = auth.uid());

drop policy if exists teacher_documents_select on public.teacher_documents;
create policy teacher_documents_select on public.teacher_documents
  for select to authenticated
  using (public.teacher_admin_has('documents') or teacher_id = auth.uid());

drop policy if exists teacher_tasks_select on public.teacher_tasks;
create policy teacher_tasks_select on public.teacher_tasks
  for select to authenticated
  using (public.teacher_admin_has('view') or teacher_id = auth.uid());

drop policy if exists notifications_select on public.notifications;
create policy notifications_select on public.notifications
  for select to authenticated using (user_id = auth.uid());

drop policy if exists notifications_update on public.notifications;
create policy notifications_update on public.notifications
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists teacher_attendance_select on public.teacher_attendance;
create policy teacher_attendance_select on public.teacher_attendance
  for select to authenticated
  using (public.teacher_admin_has('view') or teacher_id = auth.uid());

drop policy if exists teacher_work_logs_select on public.teacher_work_logs;
create policy teacher_work_logs_select on public.teacher_work_logs
  for select to authenticated
  using (public.teacher_admin_has('view') or teacher_id = auth.uid());

drop policy if exists teacher_reports_select on public.teacher_reports;
create policy teacher_reports_select on public.teacher_reports
  for select to authenticated
  using (public.teacher_admin_has('view') or teacher_id = auth.uid());

-- Жазу тек security-definer RPC арқылы.
revoke insert, update, delete on public.admin_teacher_permissions from authenticated, anon;
revoke insert, update, delete on public.teacher_profiles from authenticated, anon;
revoke insert, update, delete on public.teacher_assignments from authenticated, anon;
revoke insert, update, delete on public.teacher_documents from authenticated, anon;
revoke insert, update, delete on public.teacher_tasks from authenticated, anon;
revoke insert, delete on public.notifications from authenticated, anon;
revoke insert, update, delete on public.teacher_attendance from authenticated, anon;
revoke insert, update, delete on public.teacher_work_logs from authenticated, anon;
revoke insert, update, delete on public.teacher_reports from authenticated, anon;

grant select on public.admin_teacher_permissions to authenticated;
grant select on public.teacher_profiles to authenticated;
grant select on public.teacher_assignments to authenticated;
grant select on public.teacher_documents to authenticated;
grant select on public.teacher_tasks to authenticated;
grant select, update on public.notifications to authenticated;
grant select on public.teacher_attendance to authenticated;
grant select on public.teacher_work_logs to authenticated;
grant select on public.teacher_reports to authenticated;

revoke all on public.admin_teacher_permissions from anon;
revoke all on public.teacher_profiles from anon;
revoke all on public.teacher_assignments from anon;
revoke all on public.teacher_documents from anon;
revoke all on public.teacher_tasks from anon;
revoke all on public.notifications from anon;
revoke all on public.teacher_attendance from anon;
revoke all on public.teacher_work_logs from anon;
revoke all on public.teacher_reports from anon;

-- Профильдер: әкімші тек мұғалімдерді және өзін көреді, рөлді тікелей өзгерте алмайды.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (
    id = auth.uid()
    or public.is_director()
    or (public.is_admin() and role = 'teacher')
  );

drop policy if exists profiles_admin_update on public.profiles;
revoke insert, update, delete on public.profiles from authenticated, anon;
grant select on public.profiles to authenticated;

-- Директор audit log-ты көре алады
drop policy if exists logs_director_select on public.admin_activity_logs;
create policy logs_director_select on public.admin_activity_logs
  for select to authenticated using (public.is_director());

-- ---------------------------------------------------------------------
-- 4. STORAGE (private bucket)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('teacher-documents', 'teacher-documents', false, 10485760,
        array['application/pdf','image/jpeg','image/png'])
on conflict (id) do nothing;

drop policy if exists "teacher_docs_read" on storage.objects;
create policy "teacher_docs_read" on storage.objects for select to authenticated
  using (
    bucket_id = 'teacher-documents'
    and (public.teacher_admin_has('documents') or split_part(name,'/',1) = auth.uid()::text)
  );

drop policy if exists "teacher_docs_insert" on storage.objects;
create policy "teacher_docs_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'teacher-documents' and public.teacher_admin_has('edit'));

drop policy if exists "teacher_docs_delete" on storage.objects;
create policy "teacher_docs_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'teacher-documents' and public.teacher_admin_has('edit'));

-- ---------------------------------------------------------------------
-- 5. ТРИГГЕРЛЕР: updated_at, audit, notifications
-- ---------------------------------------------------------------------
drop trigger if exists teacher_profiles_updated on public.teacher_profiles;
create trigger teacher_profiles_updated before update on public.teacher_profiles
  for each row execute function public.set_updated_at();

drop trigger if exists teacher_tasks_updated on public.teacher_tasks;
create trigger teacher_tasks_updated before update on public.teacher_tasks
  for each row execute function public.set_updated_at();

create or replace function public.log_teacher_audit() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_details jsonb;
  v_id text;
begin
  v_details := jsonb_build_object(
    'before', case when tg_op = 'INSERT' then null else to_jsonb(old) end,
    'after', case when tg_op = 'DELETE' then null else to_jsonb(new) end
  );
  v_id := coalesce(
    v_details->'after'->>'user_id', v_details->'before'->>'user_id',
    v_details->'after'->>'id', v_details->'before'->>'id',
    v_details->'after'->>'teacher_id', v_details->'before'->>'teacher_id'
  );
  insert into public.admin_activity_logs(actor_id, action, entity, entity_id, details)
  values (auth.uid(), tg_op, tg_table_name, v_id, v_details);
  return coalesce(new, old);
end $$;

do $$
declare t text;
begin
  foreach t in array array[
    'admin_teacher_permissions','teacher_profiles','teacher_assignments','teacher_documents',
    'teacher_tasks','teacher_attendance','teacher_work_logs','teacher_reports'
  ] loop
    execute format('drop trigger if exists audit_%1$s on public.%1$s', t);
    execute format('create trigger audit_%1$s after insert or update or delete on public.%1$s for each row execute function public.log_teacher_audit()', t);
  end loop;
end $$;

-- Профиль өзгерісін журналға жазу (бұрынғы триггерді ауыстырады)
drop trigger if exists log_profiles_admin on public.profiles;
drop trigger if exists audit_profiles on public.profiles;
create trigger audit_profiles after update on public.profiles
  for each row
  when (old.role is distinct from new.role
        or old.is_blocked is distinct from new.is_blocked
        or old.first_name is distinct from new.first_name
        or old.last_name is distinct from new.last_name)
  execute function public.log_teacher_audit();

create or replace function public.teacher_task_notify() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.notifications(user_id, title, body, kind, link)
    values (new.teacher_id, 'Жаңа тапсырма', left(new.title, 180), 'task', '/teacher/tasks');
  elsif tg_op = 'UPDATE'
        and new.status = 'done' and old.status is distinct from 'done'
        and auth.uid() = new.teacher_id and new.created_by is not null then
    insert into public.notifications(user_id, title, body, kind, link)
    values (new.created_by, 'Тапсырма орындалды', left(new.title, 180), 'task', '/admin/tasks');
  end if;
  return new;
end $$;

drop trigger if exists teacher_task_notify_trg on public.teacher_tasks;
create trigger teacher_task_notify_trg after insert or update of status on public.teacher_tasks
  for each row execute function public.teacher_task_notify();

-- ---------------------------------------------------------------------
-- 6. RPC: басты панель / тізім / профиль
-- ---------------------------------------------------------------------
create or replace function public.teacher_dashboard() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v jsonb;
begin
  if not public.teacher_admin_has('view') then raise exception 'FORBIDDEN'; end if;
  select jsonb_build_object(
    'total', (select count(*) from public.profiles where role = 'teacher'),
    'active', (select count(*) from public.profiles p join public.teacher_profiles t on t.user_id = p.id
               where p.role = 'teacher' and not p.is_blocked
                 and t.employment_status in ('active','probation')),
    'blocked', (select count(*) from public.profiles where role = 'teacher' and is_blocked),
    'archived', (select count(*) from public.teacher_profiles where employment_status = 'archived'),
    'new_30d', (select count(*) from public.profiles
                where role = 'teacher' and created_at > now() - interval '30 days'),
    'documents', case when public.teacher_admin_has('documents')
                      then (select count(*) from public.teacher_documents) else 0 end,
    'unverified_documents', case when public.teacher_admin_has('documents')
      then (select count(*) from public.teacher_documents where not verified) else 0 end,
    'tasks_pending', (select count(*) from public.teacher_tasks where status in ('pending','in_progress')),
    'tasks_overdue', (select count(*) from public.teacher_tasks
                      where status in ('pending','in_progress') and due_at is not null and due_at < now()),
    'tasks_done_30d', (select count(*) from public.teacher_tasks
                       where status = 'done' and completed_at > now() - interval '30 days'),
    'subjects', coalesce((
      select jsonb_agg(jsonb_build_object('title', s.title, 'count', x.cnt) order by x.cnt desc, s.title)
      from (select subject_id, count(*) cnt from public.teacher_assignments group by subject_id) x
      join public.subjects s on s.id = x.subject_id
    ), '[]'::jsonb),
    'recent', coalesce((
      select jsonb_agg(r.obj order by r.created_at desc)
      from (
        select p.created_at, jsonb_build_object(
          'id', p.id, 'first_name', p.first_name, 'last_name', p.last_name, 'phone', p.phone,
          'email', coalesce(t.email,''), 'photo_url', t.photo_url,
          'employment_status', coalesce(t.employment_status,'active'),
          'is_blocked', p.is_blocked, 'hired_at', t.hired_at, 'created_at', p.created_at
        ) obj
        from public.profiles p
        left join public.teacher_profiles t on t.user_id = p.id
        where p.role = 'teacher'
        order by p.created_at desc
        limit 6
      ) r
    ), '[]'::jsonb),
    'permissions', public.teacher_admin_my_permissions()
  ) into v;
  return v;
end $$;

create or replace function public.teacher_list(
  p_search text default '', p_subject uuid default null,
  p_class text default '', p_status text default ''
) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v jsonb;
begin
  if not public.teacher_admin_has('view') then raise exception 'FORBIDDEN'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', p.id,
    'first_name', p.first_name,
    'last_name', p.last_name,
    'phone', p.phone,
    'email', coalesce(t.email,''),
    'photo_url', t.photo_url,
    'employment_status', coalesce(t.employment_status,'active'),
    'is_blocked', p.is_blocked,
    'hired_at', t.hired_at,
    'created_at', p.created_at,
    'last_seen_at', p.last_seen_at,
    'archived_at', t.archived_at,
    'block_reason', coalesce(t.block_reason,''),
    'blocked_until', t.blocked_until,
    'assignments', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', a.id, 'subject_id', a.subject_id, 'subject_title', s.title,
        'classes', a.classes, 'weekly_hours', a.weekly_hours
      ) order by s.title)
      from public.teacher_assignments a
      join public.subjects s on s.id = a.subject_id
      where a.teacher_id = p.id
    ), '[]'::jsonb),
    'classes', coalesce((
      select array_agg(distinct c) from public.teacher_assignments a, unnest(a.classes) c
      where a.teacher_id = p.id
    ), '{}'::text[]),
    'weekly_lessons', (select count(*) from public.timetable tt where tt.teacher_id = p.id),
    'pending_tasks', (select count(*) from public.teacher_tasks k
                      where k.teacher_id = p.id and k.status in ('pending','in_progress')),
    'documents_count', case when public.teacher_admin_has('documents')
      then (select count(*) from public.teacher_documents d where d.teacher_id = p.id) else 0 end,
    'subjects_text', coalesce((
      select string_agg(s.title, ', ' order by s.title)
      from public.teacher_assignments a join public.subjects s on s.id = a.subject_id
      where a.teacher_id = p.id
    ), '')
  ) order by p.last_name, p.first_name), '[]'::jsonb)
  into v
  from public.profiles p
  left join public.teacher_profiles t on t.user_id = p.id
  where p.role = 'teacher'
    and (coalesce(p_search,'') = '' or (
      p.last_name || ' ' || p.first_name || ' ' || p.phone || ' ' || coalesce(t.email,'')
    ) ilike '%' || p_search || '%')
    and (p_subject is null or exists (
      select 1 from public.teacher_assignments a where a.teacher_id = p.id and a.subject_id = p_subject
    ))
    and (coalesce(p_class,'') = '' or exists (
      select 1 from public.teacher_assignments a where a.teacher_id = p.id and p_class = any(a.classes)
    ))
    and (
      coalesce(p_status,'') = ''
      or (p_status = 'active' and not p.is_blocked
          and coalesce(t.employment_status,'active') in ('active','probation'))
      or (p_status = 'blocked' and p.is_blocked)
      or (p_status = 'archived' and coalesce(t.employment_status,'active') = 'archived')
      or (p_status not in ('active','blocked','archived')
          and coalesce(t.employment_status,'active') = p_status)
    );
  return v;
end $$;

create or replace function public.teacher_detail(p_id uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v jsonb;
begin
  if not public.teacher_admin_has('view') then raise exception 'FORBIDDEN'; end if;
  if not exists (select 1 from public.profiles where id = p_id and role = 'teacher') then
    raise exception 'NOT_FOUND';
  end if;

  select jsonb_build_object(
    'id', pr.id,
    'first_name', pr.first_name,
    'last_name', pr.last_name,
    'phone', pr.phone,
    'email', coalesce(tp.email,''),
    'photo_url', tp.photo_url,
    'employment_status', coalesce(tp.employment_status,'active'),
    'hired_at', tp.hired_at,
    'birth_date', tp.birth_date,
    'qualification', coalesce(tp.qualification,''),
    'address', coalesce(tp.address,''),
    'notes', coalesce(tp.notes,''),
    'is_blocked', pr.is_blocked,
    'block_reason', coalesce(tp.block_reason,''),
    'blocked_until', tp.blocked_until,
    'archived_at', tp.archived_at,
    'created_at', pr.created_at,
    'last_seen_at', pr.last_seen_at,
    'assignments', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', a.id, 'subject_id', a.subject_id, 'subject_title', s.title,
        'classes', a.classes, 'weekly_hours', a.weekly_hours
      ) order by s.title)
      from public.teacher_assignments a
      join public.subjects s on s.id = a.subject_id
      where a.teacher_id = p_id
    ), '[]'::jsonb),
    'timetable', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', tt.id, 'subject_title', s.title, 'class_name', tt.class_name,
        'weekday', tt.weekday, 'start_time', tt.start_time, 'end_time', tt.end_time, 'room', tt.room
      ) order by tt.weekday, tt.start_time)
      from public.timetable tt
      join public.subjects s on s.id = tt.subject_id
      where tt.teacher_id = p_id
    ), '[]'::jsonb),
    'workload', jsonb_build_object(
      'lessons', (select count(*) from public.timetable tt where tt.teacher_id = p_id),
      'hours', coalesce((
        select round(sum(extract(epoch from (
          coalesce(tt.end_time, tt.start_time + interval '45 minutes') - tt.start_time
        )) / 3600.0)::numeric, 1)
        from public.timetable tt where tt.teacher_id = p_id
      ), 0)
    ),
    'tasks', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', k.id, 'teacher_id', k.teacher_id, 'title', k.title, 'description', k.description,
        'priority', k.priority, 'status', k.status, 'due_at', k.due_at,
        'created_at', k.created_at, 'completed_at', k.completed_at,
        'created_by_name', btrim(coalesce(cp.first_name,'') || ' ' || coalesce(cp.last_name,'')),
        'overdue', (k.status in ('pending','in_progress') and k.due_at is not null and k.due_at < now())
      ) order by (k.status = 'done'), k.due_at nulls last, k.created_at desc)
      from public.teacher_tasks k
      left join public.profiles cp on cp.id = k.created_by
      where k.teacher_id = p_id
    ), '[]'::jsonb),
    'documents', case when public.teacher_admin_has('documents') then coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', d.id, 'kind', d.kind, 'title', d.title, 'file_name', d.file_name,
        'storage_path', d.storage_path, 'mime_type', d.mime_type, 'size_bytes', d.size_bytes,
        'verified', d.verified, 'verified_at', d.verified_at, 'note', d.note, 'created_at', d.created_at
      ) order by d.created_at desc)
      from public.teacher_documents d where d.teacher_id = p_id
    ), '[]'::jsonb) else '[]'::jsonb end,
    'documents_hidden', not public.teacher_admin_has('documents'),
    'attendance', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', a.id, 'work_date', a.work_date, 'check_in', a.check_in, 'check_out', a.check_out,
        'status', a.status, 'late_minutes', a.late_minutes, 'note', a.note, 'created_at', a.created_at
      ) order by a.work_date desc)
      from (
        select * from public.teacher_attendance where teacher_id = p_id
        order by work_date desc limit 30
      ) a
    ), '[]'::jsonb),
    'attendance_stats', (
      select jsonb_build_object(
        'present', count(*) filter (where status = 'present'),
        'late', count(*) filter (where status = 'late'),
        'absent', count(*) filter (where status = 'absent'),
        'leave', count(*) filter (where status = 'leave')
      )
      from public.teacher_attendance where teacher_id = p_id
    ),
    'work_logs', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', w.id, 'work_date', w.work_date, 'subject_title', coalesce(s.title,''),
        'class_name', w.class_name, 'topic', w.topic, 'status', w.status,
        'note', w.note, 'created_at', w.created_at
      ) order by w.work_date desc, w.created_at desc)
      from (
        select * from public.teacher_work_logs where teacher_id = p_id
        order by work_date desc limit 30
      ) w
      left join public.subjects s on s.id = w.subject_id
    ), '[]'::jsonb),
    'reports', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', r.id, 'period_start', r.period_start, 'period_end', r.period_end,
        'title', r.title, 'content', r.content, 'status', r.status,
        'created_at', r.created_at, 'reviewed_at', r.reviewed_at
      ) order by r.created_at desc)
      from public.teacher_reports r where r.teacher_id = p_id
    ), '[]'::jsonb),
    'audit', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', x.id, 'action', x.action, 'entity', x.entity,
        'created_at', x.created_at, 'actor', x.actor
      ) order by x.created_at desc)
      from (
        select l.id, l.action, l.entity, l.created_at,
          btrim(coalesce(ap.first_name,'') || ' ' || coalesce(ap.last_name,'')) as actor
        from public.admin_activity_logs l
        left join public.profiles ap on ap.id = l.actor_id
        where l.entity in (
          'teacher_profiles','teacher_assignments','teacher_documents','teacher_tasks',
          'teacher_attendance','teacher_work_logs','teacher_reports'
        )
        and (
          l.entity_id = p_id::text
          or l.details->'after'->>'user_id' = p_id::text
          or l.details->'before'->>'user_id' = p_id::text
          or l.details->'after'->>'teacher_id' = p_id::text
          or l.details->'before'->>'teacher_id' = p_id::text
        )
        order by l.created_at desc limit 12
      ) x
    ), '[]'::jsonb),
    'permissions', public.teacher_admin_my_permissions()
  ) into v
  from public.profiles pr
  left join public.teacher_profiles tp on tp.user_id = pr.id
  where pr.id = p_id;

  return v;
end $$;

-- ---------------------------------------------------------------------
-- 7. RPC: аккаунт жасау / өңдеу / басқару
-- ---------------------------------------------------------------------
create or replace function public.teacher_finalize_account(p_user uuid, p_data jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare
  pr public.profiles;
  v_first text := btrim(coalesce(p_data->>'first_name',''));
  v_last text := btrim(coalesce(p_data->>'last_name',''));
  v_phone text := nullif(p_data->>'phone','');
  v_status text := coalesce(nullif(p_data->>'employment_status',''), 'active');
begin
  if not public.teacher_admin_has('accounts') then raise exception 'FORBIDDEN'; end if;
  select * into pr from public.profiles where id = p_user for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if pr.role <> 'student' then raise exception 'NOT_FOUND'; end if;
  if pr.created_at < now() - interval '15 minutes' then raise exception 'FORBIDDEN'; end if;
  if char_length(v_first) not between 1 and 60 or char_length(v_last) not between 1 and 60 then
    raise exception 'INVALID_NAME';
  end if;
  if v_phone is not null and v_phone <> pr.phone then raise exception 'INVALID_PHONE'; end if;
  if v_status not in ('active','probation','on_leave','terminated') then
    raise exception 'INVALID_STATUS';
  end if;

  update public.profiles set role = 'teacher', first_name = v_first, last_name = v_last
  where id = p_user;

  insert into public.teacher_profiles(
    user_id, email, photo_url, hired_at, birth_date, qualification, address, notes, employment_status
  )
  values (
    p_user,
    coalesce(p_data->>'email',''),
    nullif(p_data->>'photo_url',''),
    nullif(p_data->>'hired_at','')::date,
    nullif(p_data->>'birth_date','')::date,
    coalesce(p_data->>'qualification',''),
    coalesce(p_data->>'address',''),
    coalesce(p_data->>'notes',''),
    v_status
  )
  on conflict (user_id) do update set
    email = excluded.email,
    photo_url = excluded.photo_url,
    hired_at = excluded.hired_at,
    birth_date = excluded.birth_date,
    qualification = excluded.qualification,
    address = excluded.address,
    notes = excluded.notes,
    employment_status = excluded.employment_status,
    updated_at = now();

  perform public._teacher_set_assignments(p_user, p_data->'assignments');

  insert into public.notifications(user_id, title, body, kind, link)
  values (p_user, 'Аккаунт ашылды',
          'Мұғалім аккаунтыңыз дайын. Тапсырмаларыңызды тексеріңіз.', 'account', '/teacher/tasks');
end $$;

create or replace function public.teacher_save_profile(p_id uuid, p_data jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare v_status text := coalesce(nullif(p_data->>'employment_status',''), 'active');
begin
  if not public.teacher_admin_has('edit') then raise exception 'FORBIDDEN'; end if;
  if not exists (select 1 from public.profiles where id = p_id and role = 'teacher') then
    raise exception 'NOT_FOUND';
  end if;
  if p_data ? 'first_name' then
    if char_length(btrim(coalesce(p_data->>'first_name',''))) not between 1 and 60 then
      raise exception 'INVALID_NAME';
    end if;
    update public.profiles set first_name = btrim(p_data->>'first_name') where id = p_id;
  end if;
  if p_data ? 'last_name' then
    if char_length(btrim(coalesce(p_data->>'last_name',''))) not between 1 and 60 then
      raise exception 'INVALID_NAME';
    end if;
    update public.profiles set last_name = btrim(p_data->>'last_name') where id = p_id;
  end if;
  if v_status not in ('active','probation','on_leave','terminated','archived') then
    raise exception 'INVALID_STATUS';
  end if;

  insert into public.teacher_profiles(user_id) values (p_id) on conflict (user_id) do nothing;

  update public.teacher_profiles set
    email = coalesce(p_data->>'email', email),
    photo_url = case when p_data ? 'photo_url' then nullif(p_data->>'photo_url','') else photo_url end,
    hired_at = case when p_data ? 'hired_at' then nullif(p_data->>'hired_at','')::date else hired_at end,
    birth_date = case when p_data ? 'birth_date' then nullif(p_data->>'birth_date','')::date else birth_date end,
    qualification = coalesce(p_data->>'qualification', qualification),
    address = coalesce(p_data->>'address', address),
    notes = coalesce(p_data->>'notes', notes),
    employment_status = case when p_data ? 'employment_status' then v_status else employment_status end,
    updated_at = now()
  where user_id = p_id;

  if p_data ? 'assignments' then
    perform public._teacher_set_assignments(p_id, p_data->'assignments');
  end if;
end $$;

create or replace function public.teacher_set_account(
  p_id uuid,
  p_action text,
  p_reason text default '',
  p_until timestamptz default null,
  p_password text default ''
) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare v_count int;
begin
  if not public.teacher_admin_has('accounts') then raise exception 'FORBIDDEN'; end if;
  if not exists (select 1 from public.profiles where id = p_id and role = 'teacher') then
    raise exception 'NOT_FOUND';
  end if;

  if p_action = 'block' then
    update public.profiles set is_blocked = true where id = p_id;
    insert into public.teacher_profiles(user_id, block_reason, blocked_until, updated_at)
    values (p_id, coalesce(p_reason,''), p_until, now())
    on conflict (user_id) do update set
      block_reason = excluded.block_reason,
      blocked_until = excluded.blocked_until,
      updated_at = now();
  elsif p_action = 'unblock' then
    update public.profiles set is_blocked = false where id = p_id;
    insert into public.teacher_profiles(user_id, block_reason, blocked_until, updated_at)
    values (p_id, '', null, now())
    on conflict (user_id) do update set
      block_reason = '', blocked_until = null, updated_at = now();
    insert into public.notifications(user_id, title, body, kind, link)
    values (p_id, 'Аккаунт қосылды', 'Аккаунтыңыз қайта белсендірілді.', 'account', '/teacher/tasks');
  elsif p_action = 'archive' then
    update public.profiles set is_blocked = true where id = p_id;
    insert into public.teacher_profiles(user_id, employment_status, archived_at, archived_by, block_reason, updated_at)
    values (p_id, 'archived', now(), auth.uid(), coalesce(p_reason,'Мұрағатқа жіберілді'), now())
    on conflict (user_id) do update set
      employment_status = 'archived',
      archived_at = now(),
      archived_by = auth.uid(),
      block_reason = coalesce(nullif(excluded.block_reason,''),'Мұрағатқа жіберілді'),
      updated_at = now();
  elsif p_action = 'restore' then
    update public.profiles set is_blocked = false where id = p_id;
    insert into public.teacher_profiles(user_id, employment_status, archived_at, archived_by, block_reason, blocked_until, updated_at)
    values (p_id, 'active', null, null, '', null, now())
    on conflict (user_id) do update set
      employment_status = 'active',
      archived_at = null,
      archived_by = null,
      block_reason = '',
      blocked_until = null,
      updated_at = now();
    insert into public.notifications(user_id, title, body, kind, link)
    values (p_id, 'Аккаунт қалпына келтірілді', 'Аккаунтыңыз қайта белсендірілді.', 'account', '/teacher/tasks');
  elsif p_action = 'reset_password' then
    if char_length(coalesce(p_password,'')) not between 8 and 72 then
      raise exception 'WEAK_PASSWORD';
    end if;
    update auth.users
      set encrypted_password = crypt(p_password, gen_salt('bf')), updated_at = now()
      where id = p_id;
    get diagnostics v_count = row_count;
    if v_count = 0 then raise exception 'PASSWORD_RESET_FAILED'; end if;
    insert into public.notifications(user_id, title, body, kind, link)
    values (p_id, 'Құпиясөз жаңартылды',
            'Әкімші аккаунт құпиясөзін жаңартты. Жаңа құпиясөзбен кіріңіз.', 'account', '');
    insert into public.admin_activity_logs(actor_id, action, entity, entity_id, details)
    values (auth.uid(), 'PASSWORD_RESET', 'teacher_profiles', p_id::text,
            jsonb_build_object('source','admin'));
  else
    raise exception 'INVALID_ACTION';
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 8. RPC: тапсырмалар + хабарламалар
-- ---------------------------------------------------------------------
create or replace function public.teacher_task_create(
  p_teacher uuid,
  p_title text,
  p_description text default '',
  p_priority text default 'normal',
  p_due timestamptz default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if not public.teacher_admin_has('edit') then raise exception 'FORBIDDEN'; end if;
  if not exists (select 1 from public.profiles where id = p_teacher and role = 'teacher') then
    raise exception 'NOT_FOUND';
  end if;
  if char_length(btrim(coalesce(p_title,''))) not between 1 and 200 then raise exception 'INVALID_TITLE'; end if;
  if char_length(coalesce(p_description,'')) > 2000 then raise exception 'INVALID_DESCRIPTION'; end if;
  if p_priority not in ('low','normal','high','urgent') then raise exception 'INVALID_PRIORITY'; end if;

  insert into public.teacher_tasks(teacher_id, title, description, priority, due_at, created_by)
  values (p_teacher, btrim(p_title), coalesce(p_description,''), p_priority, p_due, auth.uid())
  returning id into v_id;
  return v_id;
end $$;

create or replace function public.teacher_task_list(p_status text default '', p_teacher uuid default null)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v jsonb;
begin
  if not public.teacher_admin_has('view') then raise exception 'FORBIDDEN'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', k.id,
    'teacher_id', k.teacher_id,
    'teacher_name', btrim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,'')),
    'title', k.title,
    'description', k.description,
    'priority', k.priority,
    'status', k.status,
    'due_at', k.due_at,
    'created_at', k.created_at,
    'updated_at', k.updated_at,
    'completed_at', k.completed_at,
    'created_by_name', btrim(coalesce(c.first_name,'') || ' ' || coalesce(c.last_name,'')),
    'overdue', (k.status in ('pending','in_progress') and k.due_at is not null and k.due_at < now())
  ) order by (k.status = 'done'), k.due_at nulls last, k.created_at desc), '[]'::jsonb)
  into v
  from public.teacher_tasks k
  join public.profiles p on p.id = k.teacher_id
  left join public.profiles c on c.id = k.created_by
  where (coalesce(p_status,'') = '' or k.status = p_status)
    and (p_teacher is null or k.teacher_id = p_teacher);
  return v;
end $$;

create or replace function public.teacher_my_tasks() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v jsonb;
begin
  if not public.is_teacher() then raise exception 'FORBIDDEN'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', k.id, 'teacher_id', k.teacher_id,
    'title', k.title, 'description', k.description, 'priority', k.priority, 'status', k.status,
    'due_at', k.due_at, 'created_at', k.created_at, 'completed_at', k.completed_at,
    'created_by_name', btrim(coalesce(c.first_name,'') || ' ' || coalesce(c.last_name,'')),
    'overdue', (k.status in ('pending','in_progress') and k.due_at is not null and k.due_at < now())
  ) order by (k.status = 'done'), k.due_at nulls last, k.created_at desc), '[]'::jsonb)
  into v
  from public.teacher_tasks k
  left join public.profiles c on c.id = k.created_by
  where k.teacher_id = auth.uid();
  return v;
end $$;

create or replace function public.teacher_task_set_status(p_task uuid, p_status text) returns void
language plpgsql security definer set search_path = public as $$
declare k public.teacher_tasks;
begin
  select * into k from public.teacher_tasks where id = p_task for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if p_status not in ('pending','in_progress','done','cancelled') then raise exception 'INVALID_STATUS'; end if;

  if public.is_teacher() then
    if k.teacher_id <> auth.uid() then raise exception 'FORBIDDEN'; end if;
    if p_status not in ('in_progress','done') then raise exception 'FORBIDDEN'; end if;
  elsif not public.teacher_admin_has('edit') then
    raise exception 'FORBIDDEN';
  end if;

  update public.teacher_tasks
    set status = p_status,
        completed_at = case when p_status = 'done' then now() else null end,
        updated_at = now()
    where id = p_task;
end $$;

-- ---------------------------------------------------------------------
-- 9. RPC: құжаттар / жұмыс журналы / есептер
-- ---------------------------------------------------------------------
create or replace function public.teacher_add_document(
  p_teacher uuid, p_kind text, p_title text, p_file_name text,
  p_storage_path text, p_mime text default null, p_size bigint default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if not public.teacher_admin_has('edit') then raise exception 'FORBIDDEN'; end if;
  if not exists (select 1 from public.profiles where id = p_teacher and role = 'teacher') then
    raise exception 'NOT_FOUND';
  end if;
  if p_kind not in ('diploma','certificate','medical','contract','identity','other') then
    raise exception 'INVALID_KIND';
  end if;
  if left(p_storage_path, char_length(p_teacher::text) + 1) <> p_teacher::text || '/' then
    raise exception 'INVALID_PATH';
  end if;
  if coalesce(p_size, 0) > 10485760 then raise exception 'FILE_TOO_LARGE'; end if;

  insert into public.teacher_documents(
    teacher_id, kind, title, file_name, storage_path, mime_type, size_bytes, uploaded_by
  )
  values (
    p_teacher, p_kind, left(coalesce(p_title,''),160), p_file_name, p_storage_path,
    p_mime, p_size, auth.uid()
  )
  returning id into v_id;
  return v_id;
end $$;

create or replace function public.teacher_review_document(
  p_doc uuid, p_verified boolean, p_note text default ''
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.teacher_admin_has('documents') then raise exception 'FORBIDDEN'; end if;
  update public.teacher_documents set
    verified = p_verified,
    verified_at = case when p_verified then now() else null end,
    verified_by = case when p_verified then auth.uid() else null end,
    note = left(coalesce(p_note,''),500)
  where id = p_doc;
  if not found then raise exception 'NOT_FOUND'; end if;
end $$;

create or replace function public.teacher_delete_document(p_doc uuid) returns text
language plpgsql security definer set search_path = public as $$
declare v_path text;
begin
  if not public.teacher_admin_has('edit') then raise exception 'FORBIDDEN'; end if;
  delete from public.teacher_documents where id = p_doc returning storage_path into v_path;
  if v_path is null then raise exception 'NOT_FOUND'; end if;
  return v_path;
end $$;

create or replace function public.teacher_attendance_add(
  p_teacher uuid, p_date date, p_check_in time default null, p_check_out time default null,
  p_status text default 'present', p_late int default 0, p_note text default ''
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.teacher_admin_has('edit') then raise exception 'FORBIDDEN'; end if;
  if not exists (select 1 from public.profiles where id = p_teacher and role = 'teacher') then
    raise exception 'NOT_FOUND';
  end if;
  if p_status not in ('present','late','absent','leave') then raise exception 'INVALID_STATUS'; end if;
  insert into public.teacher_attendance(
    teacher_id, work_date, check_in, check_out, status, late_minutes, note, created_by
  )
  values (p_teacher, p_date, p_check_in, p_check_out, p_status,
          least(greatest(coalesce(p_late,0),0),600), left(coalesce(p_note,''),500), auth.uid())
  on conflict (teacher_id, work_date) do update set
    check_in = excluded.check_in,
    check_out = excluded.check_out,
    status = excluded.status,
    late_minutes = excluded.late_minutes,
    note = excluded.note,
    created_by = excluded.created_by;
end $$;

create or replace function public.teacher_work_log_add(
  p_teacher uuid, p_date date, p_subject uuid, p_class text,
  p_topic text, p_status text default 'conducted', p_note text default ''
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.teacher_admin_has('edit') then raise exception 'FORBIDDEN'; end if;
  if not exists (select 1 from public.profiles where id = p_teacher and role = 'teacher') then
    raise exception 'NOT_FOUND';
  end if;
  if p_status not in ('conducted','missed','substituted') then raise exception 'INVALID_STATUS'; end if;
  if p_subject is not null and not exists (select 1 from public.subjects where id = p_subject) then
    raise exception 'NOT_FOUND';
  end if;
  insert into public.teacher_work_logs(
    teacher_id, work_date, subject_id, class_name, topic, status, note, created_by
  )
  values (p_teacher, p_date, p_subject, left(coalesce(p_class,''),20),
          left(coalesce(p_topic,''),300), p_status, left(coalesce(p_note,''),500), auth.uid());
end $$;

create or replace function public.teacher_report_add(
  p_teacher uuid, p_start date, p_end date, p_title text, p_content text default ''
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if not public.teacher_admin_has('edit') then raise exception 'FORBIDDEN'; end if;
  if not exists (select 1 from public.profiles where id = p_teacher and role = 'teacher') then
    raise exception 'NOT_FOUND';
  end if;
  if p_end < p_start then raise exception 'INVALID_PERIOD'; end if;
  if char_length(btrim(coalesce(p_title,''))) not between 1 and 200 then raise exception 'INVALID_TITLE'; end if;
  insert into public.teacher_reports(teacher_id, period_start, period_end, title, content, created_by)
  values (p_teacher, p_start, p_end, btrim(p_title), left(coalesce(p_content,''),5000), auth.uid())
  returning id into v_id;
  return v_id;
end $$;

create or replace function public.teacher_report_review(p_report uuid, p_status text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.teacher_admin_has('documents') then raise exception 'FORBIDDEN'; end if;
  if p_status not in ('submitted','approved','revision') then raise exception 'INVALID_STATUS'; end if;
  update public.teacher_reports set
    status = p_status,
    reviewed_by = case when p_status = 'submitted' then null else auth.uid() end,
    reviewed_at = case when p_status = 'submitted' then null else now() end
  where id = p_report;
  if not found then raise exception 'NOT_FOUND'; end if;
end $$;

-- ---------------------------------------------------------------------
-- 10. RPC: директор рұқсаттары + audit
-- ---------------------------------------------------------------------
create or replace function public.director_admin_list() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v jsonb;
begin
  if not public.is_director() then raise exception 'FORBIDDEN'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', p.id,
    'first_name', p.first_name,
    'last_name', p.last_name,
    'phone', p.phone,
    'is_blocked', p.is_blocked,
    'created_at', p.created_at,
    'last_seen_at', p.last_seen_at,
    'view', coalesce(ap.can_view_teachers, true),
    'documents', coalesce(ap.can_view_documents, true),
    'edit', coalesce(ap.can_edit_teachers, true),
    'accounts', coalesce(ap.can_manage_accounts, true),
    'updated_at', ap.updated_at
  ) order by p.created_at desc), '[]'::jsonb)
  into v
  from public.profiles p
  left join public.admin_teacher_permissions ap on ap.user_id = p.id
  where p.role = 'admin';
  return v;
end $$;

create or replace function public.director_set_admin_permission(
  p_admin uuid, p_key text, p_allowed boolean
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_director() then raise exception 'FORBIDDEN'; end if;
  if not exists (select 1 from public.profiles where id = p_admin and role = 'admin') then
    raise exception 'NOT_FOUND';
  end if;
  if p_key not in ('view','documents','edit','accounts') then raise exception 'INVALID_KEY'; end if;

  insert into public.admin_teacher_permissions(user_id, granted_by)
  values (p_admin, auth.uid())
  on conflict (user_id) do update set granted_by = auth.uid(), updated_at = now();

  update public.admin_teacher_permissions set
    can_view_teachers = case when p_key = 'view' then p_allowed else can_view_teachers end,
    can_view_documents = case when p_key = 'documents' then p_allowed else can_view_documents end,
    can_edit_teachers = case when p_key = 'edit' then p_allowed else can_edit_teachers end,
    can_manage_accounts = case when p_key = 'accounts' then p_allowed else can_manage_accounts end,
    updated_at = now()
  where user_id = p_admin;
end $$;

create or replace function public.teacher_audit_list(p_limit int default 100) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v jsonb;
begin
  if not public.teacher_admin_has('view') then raise exception 'FORBIDDEN'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', x.id,
    'action', x.action,
    'entity', x.entity,
    'entity_id', x.entity_id,
    'created_at', x.created_at,
    'actor', x.actor,
    'details', x.details
  ) order by x.created_at desc), '[]'::jsonb)
  into v
  from (
    select l.id, l.action, l.entity, l.entity_id, l.created_at, l.details,
      btrim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,'')) as actor
    from public.admin_activity_logs l
    left join public.profiles p on p.id = l.actor_id
    where l.entity in (
      'teacher_profiles','teacher_assignments','teacher_documents','teacher_tasks',
      'teacher_attendance','teacher_work_logs','teacher_reports','admin_teacher_permissions'
    ) or (
      l.entity = 'profiles'
      and (l.details->'after'->>'role' = 'teacher' or l.details->'before'->>'role' = 'teacher')
    )
    order by l.created_at desc
    limit greatest(1, least(coalesce(p_limit,100), 500))
  ) x;
  return v;
end $$;

-- ---------------------------------------------------------------------
-- 11. EXECUTE құқықтары
-- ---------------------------------------------------------------------
revoke all on function public.teacher_admin_has(text) from public, anon;
grant execute on function public.teacher_admin_has(text) to authenticated;
revoke all on function public.teacher_admin_my_permissions() from public, anon;
grant execute on function public.teacher_admin_my_permissions() to authenticated;
revoke all on function public._teacher_set_assignments(uuid, jsonb) from public, anon, authenticated;

revoke all on function public.teacher_dashboard() from public, anon;
grant execute on function public.teacher_dashboard() to authenticated;
revoke all on function public.teacher_list(text, uuid, text, text) from public, anon;
grant execute on function public.teacher_list(text, uuid, text, text) to authenticated;
revoke all on function public.teacher_detail(uuid) from public, anon;
grant execute on function public.teacher_detail(uuid) to authenticated;
revoke all on function public.teacher_finalize_account(uuid, jsonb) from public, anon;
grant execute on function public.teacher_finalize_account(uuid, jsonb) to authenticated;
revoke all on function public.teacher_save_profile(uuid, jsonb) from public, anon;
grant execute on function public.teacher_save_profile(uuid, jsonb) to authenticated;
revoke all on function public.teacher_set_account(uuid, text, text, timestamptz, text) from public, anon;
grant execute on function public.teacher_set_account(uuid, text, text, timestamptz, text) to authenticated;

revoke all on function public.teacher_task_create(uuid, text, text, text, timestamptz) from public, anon;
grant execute on function public.teacher_task_create(uuid, text, text, text, timestamptz) to authenticated;
revoke all on function public.teacher_task_list(text, uuid) from public, anon;
grant execute on function public.teacher_task_list(text, uuid) to authenticated;
revoke all on function public.teacher_my_tasks() from public, anon;
grant execute on function public.teacher_my_tasks() to authenticated;
revoke all on function public.teacher_task_set_status(uuid, text) from public, anon;
grant execute on function public.teacher_task_set_status(uuid, text) to authenticated;

revoke all on function public.teacher_add_document(uuid, text, text, text, text, text, bigint) from public, anon;
grant execute on function public.teacher_add_document(uuid, text, text, text, text, text, bigint) to authenticated;
revoke all on function public.teacher_review_document(uuid, boolean, text) from public, anon;
grant execute on function public.teacher_review_document(uuid, boolean, text) to authenticated;
revoke all on function public.teacher_delete_document(uuid) from public, anon;
grant execute on function public.teacher_delete_document(uuid) to authenticated;
revoke all on function public.teacher_attendance_add(uuid, date, time, time, text, int, text) from public, anon;
grant execute on function public.teacher_attendance_add(uuid, date, time, time, text, int, text) to authenticated;
revoke all on function public.teacher_work_log_add(uuid, date, uuid, text, text, text, text) from public, anon;
grant execute on function public.teacher_work_log_add(uuid, date, uuid, text, text, text, text) to authenticated;
revoke all on function public.teacher_report_add(uuid, date, date, text, text) from public, anon;
grant execute on function public.teacher_report_add(uuid, date, date, text, text) to authenticated;
revoke all on function public.teacher_report_review(uuid, text) from public, anon;
grant execute on function public.teacher_report_review(uuid, text) to authenticated;

revoke all on function public.director_admin_list() from public, anon;
grant execute on function public.director_admin_list() to authenticated;
revoke all on function public.director_set_admin_permission(uuid, text, boolean) from public, anon;
grant execute on function public.director_set_admin_permission(uuid, text, boolean) to authenticated;
revoke all on function public.teacher_audit_list(int) from public, anon;
grant execute on function public.teacher_audit_list(int) to authenticated;

revoke all on function public.log_teacher_audit() from public, anon, authenticated;
revoke all on function public.teacher_task_notify() from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 12. REALTIME
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'notifications','teacher_tasks','teacher_profiles','teacher_assignments',
    'teacher_documents','admin_teacher_permissions','teacher_attendance','teacher_work_logs','teacher_reports'
  ] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
