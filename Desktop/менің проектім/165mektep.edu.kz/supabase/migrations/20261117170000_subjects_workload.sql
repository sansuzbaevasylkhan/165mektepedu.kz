-- =====================================================================
-- 165 MEKTEP — Пәндер, оқу жылдары, сынып құрамы және мұғалім жүктемесі
-- Additive migration: бар кестелерді қайта жазбайды, тек кеңейтеді.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. ПӘНДЕР: белсенді/мұрағат күйі
-- ---------------------------------------------------------------------
alter table public.subjects
  add column if not exists is_active boolean not null default true,
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references public.profiles(id) on delete set null,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists subjects_active_idx on public.subjects(is_active, sort_order);

drop trigger if exists subjects_updated on public.subjects;
create trigger subjects_updated before update on public.subjects
  for each row execute function public.set_updated_at();

-- Директор да пән басқара алады (бар admin саясатына қосымша)
drop policy if exists subjects_director_write on public.subjects;
create policy subjects_director_write on public.subjects for all to authenticated
  using (public.is_director()) with check (public.is_director());

-- ---------------------------------------------------------------------
-- 2. ОҚУ ЖЫЛДАРЫ
-- ---------------------------------------------------------------------
create table if not exists public.academic_years (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 4 and 40),
  starts_on date not null,
  ends_on date not null,
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  check (ends_on > starts_on)
);
create unique index if not exists academic_years_one_current
  on public.academic_years(is_current) where is_current;

insert into public.academic_years(name, starts_on, ends_on, is_current) values
  ('2025-2026', '2025-09-01', '2026-05-31', false),
  ('2026-2027', '2026-09-01', '2027-05-31', true)
on conflict (name) do nothing;

-- Егер басқа ағымдағы жыл белгіленген болса, оны өзгертпейміз.
update public.academic_years
  set is_current = true
  where name = '2026-2027'
    and not exists (select 1 from public.academic_years where is_current);

create or replace function public.current_academic_year() returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.academic_years
  where is_current
  order by starts_on desc
  limit 1;
$$;

-- ---------------------------------------------------------------------
-- 3. СЫНЫП-ПӘН ОҚУ ЖОСПАРЫ ЖӘНЕ СЫНЫП ҚҰРАМЫ
-- ---------------------------------------------------------------------
create table if not exists public.class_subjects (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references public.academic_years(id) on delete cascade,
  class_name text not null check (char_length(class_name) between 1 and 20),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  weekly_hours int not null default 0 check (weekly_hours between 0 and 40),
  created_at timestamptz not null default now(),
  unique (academic_year_id, class_name, subject_id)
);
create index if not exists class_subjects_class_idx
  on public.class_subjects(academic_year_id, class_name);
create index if not exists class_subjects_subject_idx
  on public.class_subjects(subject_id);

create table if not exists public.class_members (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references public.academic_years(id) on delete cascade,
  class_name text not null check (char_length(class_name) between 1 and 20),
  student_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (academic_year_id, student_id)
);
create index if not exists class_members_class_idx
  on public.class_members(academic_year_id, class_name);
create index if not exists class_members_student_idx
  on public.class_members(student_id);

-- ---------------------------------------------------------------------
-- 4. МҰҒАЛІМ ТАҒАЙЫНДАУЛАРЫН КЕҢЕЙТУ (оқу жылы + тоқсан)
-- ---------------------------------------------------------------------
alter table public.teacher_assignments
  add column if not exists academic_year_id uuid references public.academic_years(id) on delete set null,
  add column if not exists term text not null default 'year'
    check (term in ('year','1','2','3','4')),
  add column if not exists updated_at timestamptz not null default now();

create index if not exists teacher_assignments_year_idx
  on public.teacher_assignments(academic_year_id);
create index if not exists teacher_assignments_subject_year_idx
  on public.teacher_assignments(subject_id, academic_year_id);

drop trigger if exists teacher_assignments_updated on public.teacher_assignments;
create trigger teacher_assignments_updated before update on public.teacher_assignments
  for each row execute function public.set_updated_at();

-- Ескі шақырулар (teacher_save_profile / teacher_finalize_account) үшін
-- сигнатура сақталады, жаңа өрістер қосымша оқылады.
create or replace function public._teacher_set_assignments(p_teacher uuid, p_items jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare
  v jsonb;
  v_year uuid;
  v_term text;
begin
  delete from public.teacher_assignments where teacher_id = p_teacher;
  if p_items is null or jsonb_typeof(p_items) <> 'array' then return; end if;
  for v in select * from jsonb_array_elements(p_items) loop
    if coalesce(v->>'subject_id','') = '' then continue; end if;
    if not exists (select 1 from public.subjects where id = (v->>'subject_id')::uuid) then continue; end if;
    v_year := nullif(v->>'academic_year_id','')::uuid;
    if v_year is null then v_year := public.current_academic_year(); end if;
    v_term := coalesce(nullif(v->>'term',''), 'year');
    if v_term not in ('year','1','2','3','4') then v_term := 'year'; end if;
    insert into public.teacher_assignments(teacher_id, subject_id, classes, weekly_hours, academic_year_id, term)
    values (
      p_teacher,
      (v->>'subject_id')::uuid,
      coalesce((
        select array_agg(distinct btrim(x))
        from jsonb_array_elements_text(coalesce(v->'classes','[]'::jsonb)) as t(x)
        where char_length(btrim(x)) between 1 and 20
      ), '{}'::text[]),
      least(greatest(coalesce((v->>'weekly_hours')::int, 0), 0), 40),
      v_year,
      v_term
    )
    on conflict (teacher_id, subject_id) do update
      set classes = excluded.classes,
          weekly_hours = excluded.weekly_hours,
          academic_year_id = excluded.academic_year_id,
          term = excluded.term,
          updated_at = now();
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 5. КӨМЕКШІ ФУНКЦИЯЛАР (RLS үшін)
-- ---------------------------------------------------------------------
create or replace function public.teacher_can_teach(p_subject uuid, p_class text default '') returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.teacher_assignments a
    where a.teacher_id = auth.uid()
      and a.subject_id = p_subject
      and (coalesce(p_class,'') = '' or p_class = any(a.classes))
  );
$$;

create or replace function public.teacher_has_class(p_class text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.teacher_assignments a
    where a.teacher_id = auth.uid() and p_class = any(a.classes)
  );
$$;

create or replace function public.student_class(p_student uuid default null) returns text
language sql stable security definer set search_path = public as $$
  select cm.class_name
  from public.class_members cm
  where cm.student_id = coalesce(p_student, auth.uid())
  order by (cm.academic_year_id = public.current_academic_year()) desc nulls last,
           cm.created_at desc
  limit 1;
$$;

create or replace function public.is_parent_of(p_student uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.parent_student_links l
    where l.parent_id = auth.uid() and l.student_id = p_student and l.status = 'approved'
  );
$$;

create or replace function public.teacher_has_student(p_student uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.class_members cm
    join public.teacher_assignments a
      on a.teacher_id = auth.uid() and cm.class_name = any(a.classes)
    where cm.student_id = p_student
  );
$$;

-- ---------------------------------------------------------------------
-- 6. RLS: жаңа кестелер
-- ---------------------------------------------------------------------
alter table public.academic_years enable row level security;
alter table public.class_subjects enable row level security;
alter table public.class_members enable row level security;

drop policy if exists academic_years_select on public.academic_years;
create policy academic_years_select on public.academic_years
  for select to authenticated using (public.is_active());

drop policy if exists class_subjects_select on public.class_subjects;
create policy class_subjects_select on public.class_subjects
  for select to authenticated using (public.is_active());

drop policy if exists class_members_select on public.class_members;
create policy class_members_select on public.class_members
  for select to authenticated
  using (
    public.is_director()
    or public.teacher_admin_has('view')
    or student_id = auth.uid()
    or public.is_parent_of(student_id)
    or (public.is_teacher() and public.teacher_has_class(class_name))
  );

revoke insert, update, delete on public.academic_years from authenticated, anon;
revoke insert, update, delete on public.class_subjects from authenticated, anon;
revoke insert, update, delete on public.class_members from authenticated, anon;
revoke all on public.academic_years from anon;
revoke all on public.class_subjects from anon;
revoke all on public.class_members from anon;
grant select on public.academic_years to authenticated;
grant select on public.class_subjects to authenticated;
grant select on public.class_members to authenticated;

-- Мұғалім өз әрекеттерін audit журналынан көре алады
drop policy if exists logs_teacher_own_select on public.admin_activity_logs;
create policy logs_teacher_own_select on public.admin_activity_logs
  for select to authenticated using (actor_id = auth.uid());

-- ---------------------------------------------------------------------
-- 7. AUDIT TRIGGER-LER
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['subjects','academic_years','class_subjects','class_members'] loop
    execute format('drop trigger if exists audit_%1$s on public.%1$s', t);
    execute format('create trigger audit_%1$s after insert or update or delete on public.%1$s for each row execute function public.log_teacher_audit()', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 8. RPC: ПӘНДЕРДІ БАСҚАРУ
-- ---------------------------------------------------------------------
create or replace function public.subjects_admin_list(
  p_search text default '', p_include_archived boolean default true
) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v jsonb;
begin
  if not public.teacher_admin_has('view') then raise exception 'FORBIDDEN'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', s.id,
    'title', s.title,
    'description', s.description,
    'sort_order', s.sort_order,
    'is_active', s.is_active,
    'archived_at', s.archived_at,
    'teachers', (select count(distinct a.teacher_id) from public.teacher_assignments a where a.subject_id = s.id),
    'classes', (select count(distinct c) from public.teacher_assignments a, unnest(a.classes) c where a.subject_id = s.id),
    'weekly_hours', (select coalesce(sum(a.weekly_hours),0) from public.teacher_assignments a where a.subject_id = s.id),
    'lessons', (select count(*) from public.lessons l where l.subject_id = s.id),
    'tests', (select count(*) from public.tests t where t.subject_id = s.id),
    'timetable', (select count(*) from public.timetable tt where tt.subject_id = s.id)
  ) order by s.is_active desc, s.sort_order, s.title), '[]'::jsonb)
  into v
  from public.subjects s
  where (coalesce(p_search,'') = '' or s.title ilike '%' || p_search || '%')
    and (p_include_archived or s.is_active);
  return v;
end $$;

create or replace function public.subject_save(
  p_id uuid, p_title text, p_description text default '', p_sort_order int default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := p_id;
  v_title text := btrim(coalesce(p_title,''));
  v_desc text := coalesce(p_description,'');
  v_order int;
begin
  if not public.teacher_admin_has('edit') then raise exception 'FORBIDDEN'; end if;
  if char_length(v_title) not between 1 and 120 then raise exception 'INVALID_TITLE'; end if;
  if char_length(v_desc) > 2000 then raise exception 'INVALID_DESCRIPTION'; end if;

  if v_id is null then
    v_order := coalesce(p_sort_order, (select coalesce(max(sort_order),0) + 1 from public.subjects));
    insert into public.subjects(title, description, sort_order)
    values (v_title, v_desc, v_order)
    returning id into v_id;
  else
    update public.subjects
      set title = v_title,
          description = v_desc,
          sort_order = coalesce(p_sort_order, sort_order),
          updated_at = now()
      where id = v_id;
    if not found then raise exception 'NOT_FOUND'; end if;
  end if;
  return v_id;
end $$;

create or replace function public.subject_set_active(p_id uuid, p_active boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.teacher_admin_has('edit') then raise exception 'FORBIDDEN'; end if;
  update public.subjects
    set is_active = p_active,
        archived_at = case when p_active then null else archived_at end,
        archived_by = case when p_active then null else archived_by end,
        updated_at = now()
    where id = p_id;
  if not found then raise exception 'NOT_FOUND'; end if;
end $$;

-- Пайдаланылып жатқан пән физикалық өшірілмейді — мұрағатқа жіберіледі.
create or replace function public.subject_delete(p_id uuid) returns text
language plpgsql security definer set search_path = public as $$
declare v_used boolean;
begin
  if not public.teacher_admin_has('edit') then raise exception 'FORBIDDEN'; end if;
  if not exists (select 1 from public.subjects where id = p_id) then raise exception 'NOT_FOUND'; end if;

  v_used := exists (select 1 from public.lessons where subject_id = p_id)
         or exists (select 1 from public.tests where subject_id = p_id)
         or exists (select 1 from public.timetable where subject_id = p_id)
         or exists (select 1 from public.teacher_assignments where subject_id = p_id)
         or exists (select 1 from public.class_subjects where subject_id = p_id);

  if v_used then
    update public.subjects
      set is_active = false, archived_at = now(), archived_by = auth.uid(), updated_at = now()
      where id = p_id;
    return 'archived';
  end if;

  delete from public.subjects where id = p_id;
  return 'deleted';
end $$;

-- ---------------------------------------------------------------------
-- 9. RPC: ОҚУ ЖЫЛДАРЫ
-- ---------------------------------------------------------------------
create or replace function public.academic_year_list() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_active() then raise exception 'FORBIDDEN'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', y.id, 'name', y.name, 'starts_on', y.starts_on,
      'ends_on', y.ends_on, 'is_current', y.is_current
    ) order by y.starts_on desc)
    from public.academic_years y
  ), '[]'::jsonb);
end $$;

create or replace function public.academic_year_save(
  p_id uuid, p_name text, p_starts date, p_ends date, p_current boolean default false
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid := p_id;
begin
  if not public.teacher_admin_has('edit') then raise exception 'FORBIDDEN'; end if;
  if char_length(btrim(coalesce(p_name,''))) not between 4 and 40 then raise exception 'INVALID_TITLE'; end if;
  if p_ends <= p_starts then raise exception 'INVALID_PERIOD'; end if;

  if p_current then update public.academic_years set is_current = false where is_current; end if;

  if v_id is null then
    insert into public.academic_years(name, starts_on, ends_on, is_current)
    values (btrim(p_name), p_starts, p_ends, p_current)
    returning id into v_id;
  else
    update public.academic_years
      set name = btrim(p_name), starts_on = p_starts, ends_on = p_ends, is_current = p_current
      where id = v_id;
    if not found then raise exception 'NOT_FOUND'; end if;
  end if;
  return v_id;
end $$;

create or replace function public.academic_year_set_current(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.teacher_admin_has('edit') then raise exception 'FORBIDDEN'; end if;
  update public.academic_years set is_current = false where is_current;
  update public.academic_years set is_current = true where id = p_id;
  if not found then raise exception 'NOT_FOUND'; end if;
end $$;

-- ---------------------------------------------------------------------
-- 10. RPC: МҰҒАЛІМ ЖҮКТЕМЕСІ
-- ---------------------------------------------------------------------
create or replace function public.teacher_workload_list() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v jsonb;
begin
  if not public.teacher_admin_has('view') then raise exception 'FORBIDDEN'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', p.id,
    'first_name', p.first_name,
    'last_name', p.last_name,
    'photo_url', tp.photo_url,
    'is_blocked', p.is_blocked,
    'employment_status', coalesce(tp.employment_status,'active'),
    'assignments', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', a.id,
        'subject_id', a.subject_id,
        'subject_title', s.title,
        'subject_active', s.is_active,
        'classes', a.classes,
        'weekly_hours', a.weekly_hours,
        'academic_year_id', a.academic_year_id,
        'academic_year', coalesce(y.name,''),
        'term', a.term,
        'students', (select count(*) from public.class_members cm
                     where cm.class_name = any(a.classes)
                       and (a.academic_year_id is null or cm.academic_year_id = a.academic_year_id))
      ) order by s.title)
      from public.teacher_assignments a
      join public.subjects s on s.id = a.subject_id
      left join public.academic_years y on y.id = a.academic_year_id
      where a.teacher_id = p.id
    ), '[]'::jsonb),
    'classes', coalesce((
      select array_agg(distinct c) from public.teacher_assignments a, unnest(a.classes) c
      where a.teacher_id = p.id
    ), '{}'::text[]),
    'total_hours', coalesce((
      select sum(a.weekly_hours) from public.teacher_assignments a where a.teacher_id = p.id
    ), 0),
    'subjects_count', (select count(*) from public.teacher_assignments a where a.teacher_id = p.id)
  ) order by p.last_name, p.first_name), '[]'::jsonb)
  into v
  from public.profiles p
  left join public.teacher_profiles tp on tp.user_id = p.id
  where p.role = 'teacher';
  return v;
end $$;

create or replace function public.teacher_assignment_save(
  p_teacher uuid, p_subject uuid, p_classes text[],
  p_hours int default 0, p_year uuid default null, p_term text default 'year'
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_classes text[];
  v_term text := coalesce(nullif(p_term,''),'year');
  v_year uuid := coalesce(p_year, public.current_academic_year());
  v_hours int := least(greatest(coalesce(p_hours,0),0),40);
  v_other int;
begin
  if not public.teacher_admin_has('edit') then raise exception 'FORBIDDEN'; end if;
  if not exists (select 1 from public.profiles where id = p_teacher and role = 'teacher') then
    raise exception 'NOT_FOUND';
  end if;
  if not exists (select 1 from public.subjects where id = p_subject) then raise exception 'NOT_FOUND'; end if;
  if v_term not in ('year','1','2','3','4') then raise exception 'INVALID_TERM'; end if;

  select coalesce(array_agg(distinct btrim(c)), '{}'::text[]) into v_classes
  from unnest(coalesce(p_classes, '{}'::text[])) c
  where char_length(btrim(c)) between 1 and 20;

  select coalesce(sum(weekly_hours),0) into v_other
  from public.teacher_assignments
  where teacher_id = p_teacher and subject_id <> p_subject;
  if v_other + v_hours > 40 then raise exception 'WORKLOAD_LIMIT'; end if;

  insert into public.teacher_assignments(
    teacher_id, subject_id, classes, weekly_hours, academic_year_id, term
  )
  values (p_teacher, p_subject, v_classes, v_hours, v_year, v_term)
  on conflict (teacher_id, subject_id) do update
    set classes = excluded.classes,
        weekly_hours = excluded.weekly_hours,
        academic_year_id = excluded.academic_year_id,
        term = excluded.term,
        updated_at = now()
  returning id into v_id;
  return v_id;
end $$;

create or replace function public.teacher_assignment_remove(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.teacher_admin_has('edit') then raise exception 'FORBIDDEN'; end if;
  delete from public.teacher_assignments where id = p_id;
  if not found then raise exception 'NOT_FOUND'; end if;
end $$;

create or replace function public.teacher_assignment_remove_class(p_id uuid, p_class text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.teacher_admin_has('edit') then raise exception 'FORBIDDEN'; end if;
  update public.teacher_assignments
    set classes = array_remove(classes, btrim(p_class)), updated_at = now()
    where id = p_id;
  if not found then raise exception 'NOT_FOUND'; end if;
end $$;

-- ---------------------------------------------------------------------
-- 11. RPC: СЫНЫП ҚҰРАМЫ
-- ---------------------------------------------------------------------
create or replace function public.class_roster_get(p_class text, p_year uuid default null) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_year uuid := coalesce(p_year, public.current_academic_year());
  v_admin boolean := public.teacher_admin_has('view');
begin
  if not (v_admin or public.teacher_has_class(p_class)) then raise exception 'FORBIDDEN'; end if;
  return jsonb_build_object(
    'class_name', p_class,
    'academic_year_id', v_year,
    'members', coalesce((
      select jsonb_agg(jsonb_build_object(
        'student_id', pr.id, 'first_name', pr.first_name, 'last_name', pr.last_name,
        'phone', pr.phone, 'class_name', cm.class_name, 'is_blocked', pr.is_blocked
      ) order by pr.last_name, pr.first_name)
      from public.class_members cm
      join public.profiles pr on pr.id = cm.student_id
      where cm.class_name = p_class and cm.academic_year_id = v_year
    ), '[]'::jsonb),
    'available', case when v_admin then coalesce((
      select jsonb_agg(jsonb_build_object(
        'student_id', pr.id, 'first_name', pr.first_name, 'last_name', pr.last_name,
        'phone', pr.phone
      ) order by pr.last_name, pr.first_name)
      from public.profiles pr
      where pr.role = 'student' and not pr.is_blocked
    ), '[]'::jsonb) else '[]'::jsonb end
  );
end $$;

create or replace function public.class_roster_set(
  p_class text, p_student_ids uuid[], p_year uuid default null
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_class text := btrim(p_class);
  v_year uuid := coalesce(p_year, public.current_academic_year());
  v_ids uuid[] := coalesce(p_student_ids, '{}'::uuid[]);
begin
  if not public.teacher_admin_has('edit') then raise exception 'FORBIDDEN'; end if;
  if char_length(v_class) not between 1 and 20 then raise exception 'INVALID_CLASS'; end if;
  if v_year is null then raise exception 'NO_ACADEMIC_YEAR'; end if;

  delete from public.class_members
    where academic_year_id = v_year
      and class_name = v_class
      and not (student_id = any(v_ids));

  insert into public.class_members(academic_year_id, class_name, student_id)
  select v_year, v_class, x
  from unnest(v_ids) x
  join public.profiles p on p.id = x and p.role = 'student'
  on conflict (academic_year_id, student_id) do update
    set class_name = excluded.class_name;
end $$;

create or replace function public.class_catalog() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v jsonb;
begin
  if not public.teacher_admin_has('view') then raise exception 'FORBIDDEN'; end if;
  with names as (
    select class_name from public.teacher_assignments a, unnest(a.classes) class_name
    union select class_name from public.class_members
    union select class_name from public.timetable
    union select class_name from public.class_subjects
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'class_name', n.class_name,
    'students', (select count(*) from public.class_members cm where cm.class_name = n.class_name),
    'subjects', (select count(distinct subject_id) from public.class_subjects cs where cs.class_name = n.class_name),
    'teachers', (select count(distinct teacher_id) from public.teacher_assignments a where n.class_name = any(a.classes)),
    'lessons', (select count(*) from public.timetable tt where tt.class_name = n.class_name)
  ) order by n.class_name), '[]'::jsonb)
  into v
  from names n
  where char_length(n.class_name) between 1 and 20;
  return v;
end $$;

-- ---------------------------------------------------------------------
-- 12. RPC: МҰҒАЛІМНІҢ ӨЗ ПӘНДЕРІ
-- ---------------------------------------------------------------------
create or replace function public.teacher_my_subjects() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v jsonb;
begin
  if not public.is_teacher() then raise exception 'FORBIDDEN'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', a.id,
    'subject_id', a.subject_id,
    'subject_title', s.title,
    'subject_active', s.is_active,
    'classes', a.classes,
    'weekly_hours', a.weekly_hours,
    'academic_year_id', a.academic_year_id,
    'academic_year', coalesce(y.name,''),
    'term', a.term,
    'class_students', coalesce((
      select jsonb_agg(jsonb_build_object(
        'class_name', c.class_name,
        'students', (select count(*) from public.class_members cm
                     where cm.class_name = c.class_name
                       and cm.academic_year_id = coalesce(a.academic_year_id, public.current_academic_year()))
      ) order by c.class_name)
      from unnest(a.classes) c(class_name)
    ), '[]'::jsonb),
    'lessons_week', (select count(*) from public.timetable tt
                     where tt.teacher_id = a.teacher_id and tt.subject_id = a.subject_id)
  ) order by s.title), '[]'::jsonb)
  into v
  from public.teacher_assignments a
  join public.subjects s on s.id = a.subject_id
  left join public.academic_years y on y.id = a.academic_year_id
  where a.teacher_id = auth.uid();
  return v;
end $$;

create or replace function public.teacher_class_students(p_subject uuid, p_class text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.teacher_can_teach(p_subject, p_class) then raise exception 'FORBIDDEN'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'student_id', pr.id,
      'first_name', pr.first_name,
      'last_name', pr.last_name,
      'phone', pr.phone,
      'class_name', cm.class_name
    ) order by pr.last_name, pr.first_name)
    from public.class_members cm
    join public.profiles pr on pr.id = cm.student_id
    where cm.class_name = p_class
      and cm.academic_year_id = public.current_academic_year()
  ), '[]'::jsonb);
end $$;

-- ---------------------------------------------------------------------
-- 13. RPC: АНАЛИТИКА (ADMIN / DIRECTOR)
-- ---------------------------------------------------------------------
create or replace function public.academic_analytics() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v jsonb;
begin
  if not public.teacher_admin_has('view') then raise exception 'FORBIDDEN'; end if;
  select jsonb_build_object(
    'subjects_total', (select count(*) from public.subjects),
    'subjects_active', (select count(*) from public.subjects where is_active),
    'subjects_archived', (select count(*) from public.subjects where archived_at is not null),
    'subjects_unassigned', coalesce((
      select jsonb_agg(jsonb_build_object('id', s.id, 'title', s.title) order by s.title)
      from public.subjects s
      where s.is_active and not exists (
        select 1 from public.teacher_assignments a where a.subject_id = s.id
      )
    ), '[]'::jsonb),
    'classes_without_teacher', coalesce((
      select jsonb_agg(jsonb_build_object('class_name', n.class_name) order by n.class_name)
      from (
        select class_name from public.class_members
        union select class_name from public.timetable
      ) n
      where not exists (
        select 1 from public.teacher_assignments a where n.class_name = any(a.classes)
      )
    ), '[]'::jsonb),
    'teachers_total', (select count(*) from public.profiles where role = 'teacher' and not is_blocked),
    'avg_weekly_hours', coalesce((
      select round(avg(x.h), 1) from (
        select coalesce(sum(a.weekly_hours),0) h
        from public.profiles p
        left join public.teacher_assignments a on a.teacher_id = p.id
        where p.role = 'teacher' and not p.is_blocked
        group by p.id
      ) x
    ), 0),
    'lessons_30d', (select count(*) from public.teacher_work_logs
                    where work_date > current_date - interval '30 days' and status = 'conducted'),
    'subject_stats', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id,
        'title', s.title,
        'is_active', s.is_active,
        'teachers', (select count(distinct a.teacher_id) from public.teacher_assignments a where a.subject_id = s.id),
        'classes', (select count(distinct c) from public.teacher_assignments a, unnest(a.classes) c where a.subject_id = s.id),
        'weekly_hours', (select coalesce(sum(a.weekly_hours),0) from public.teacher_assignments a where a.subject_id = s.id),
        'lessons', (select count(*) from public.timetable tt where tt.subject_id = s.id),
        'conducted_30d', (select count(*) from public.teacher_work_logs w
                          where w.subject_id = s.id and w.work_date > current_date - interval '30 days'
                            and w.status = 'conducted')
      ) order by s.sort_order, s.title)
      from public.subjects s
    ), '[]'::jsonb)
  ) into v;
  return v;
end $$;
