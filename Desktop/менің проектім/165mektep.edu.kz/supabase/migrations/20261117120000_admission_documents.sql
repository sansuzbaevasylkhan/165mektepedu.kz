-- =====================================================================
-- 165 MEKTEP — ADMISSION DOCUMENTS CENTER
-- Additive migration: existing tables/functions are not modified.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. PERMISSIONS
-- ---------------------------------------------------------------------
create table if not exists public.admission_permission_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  admission_view boolean not null default true,
  admission_documents_view boolean not null default false,
  admission_details_view boolean not null default false,
  admission_status_update boolean not null default false,
  admission_comment boolean not null default false,
  granted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists admission_permission_user_idx on public.admission_permission_settings(user_id);

-- effective permission for current user
create or replace function public.admission_has(p_key text) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare v_role text; v_row public.admission_permission_settings;
begin
  select role into v_role from public.profiles where id = auth.uid() and not is_blocked;
  if v_role is null then return false; end if;
  if v_role in ('admin','director') then return true; end if;
  if v_role <> 'teacher' then return false; end if;
  if p_key not in ('admission_view','admission_documents_view','admission_details_view',
                   'admission_status_update','admission_comment') then return false; end if;
  select * into v_row from public.admission_permission_settings where user_id = auth.uid();
  if not found then return p_key = 'admission_view'; end if;
  return case p_key
    when 'admission_view' then v_row.admission_view
    when 'admission_documents_view' then v_row.admission_documents_view
    when 'admission_details_view' then v_row.admission_details_view
    when 'admission_status_update' then v_row.admission_status_update
    when 'admission_comment' then v_row.admission_comment
    else false end;
end $$;

create or replace function public.admission_my_permissions() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_role text;
begin
  select role into v_role from public.profiles where id = auth.uid() and not is_blocked;
  if v_role is null then raise exception 'FORBIDDEN'; end if;
  return jsonb_build_object(
    'role', v_role,
    'admission_view', public.admission_has('admission_view'),
    'admission_documents_view', public.admission_has('admission_documents_view'),
    'admission_details_view', public.admission_has('admission_details_view'),
    'admission_status_update', public.admission_has('admission_status_update'),
    'admission_comment', public.admission_has('admission_comment')
  );
end $$;

create or replace function public.admission_set_permission(p_user uuid, p_key text, p_allowed boolean)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  if p_key not in ('admission_view','admission_documents_view','admission_details_view',
                   'admission_status_update','admission_comment') then
    raise exception 'BAD_PERMISSION';
  end if;
  if not exists (select 1 from public.profiles where id = p_user and role = 'teacher') then
    raise exception 'NOT_TEACHER';
  end if;
  insert into public.admission_permission_settings(user_id, granted_by)
  values (p_user, auth.uid())
  on conflict (user_id) do nothing;

  update public.admission_permission_settings set
    admission_view = case when p_key = 'admission_view' then p_allowed else admission_view end,
    admission_documents_view = case when p_key = 'admission_documents_view' then p_allowed else admission_documents_view end,
    admission_details_view = case when p_key = 'admission_details_view' then p_allowed else admission_details_view end,
    admission_status_update = case when p_key = 'admission_status_update' then p_allowed else admission_status_update end,
    admission_comment = case when p_key = 'admission_comment' then p_allowed else admission_comment end,
    granted_by = auth.uid(),
    updated_at = now()
  where user_id = p_user;
end $$;

create or replace function public.admission_teachers() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', p.id, 'first_name', p.first_name, 'last_name', p.last_name, 'phone', p.phone,
      'is_blocked', p.is_blocked,
      'admission_view', coalesce(s.admission_view, true),
      'admission_documents_view', coalesce(s.admission_documents_view, false),
      'admission_details_view', coalesce(s.admission_details_view, false),
      'admission_status_update', coalesce(s.admission_status_update, false),
      'admission_comment', coalesce(s.admission_comment, false)
    ) order by p.last_name, p.first_name)
    from public.profiles p
    left join public.admission_permission_settings s on s.user_id = p.id
    where p.role = 'teacher'
  ), '[]'::jsonb);
end $$;

-- ---------------------------------------------------------------------
-- 2. DOCUMENT TYPES
-- ---------------------------------------------------------------------
create table if not exists public.admission_document_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z][a-z0-9_]{1,60}$'),
  name_kk text not null check (char_length(name_kk) between 1 and 160),
  name_ru text not null default '',
  name_en text not null default '',
  description_kk text not null default '',
  description_ru text not null default '',
  description_en text not null default '',
  category text not null default 'general'
    check (category in ('application','identity','medical','address','additional','general')),
  required boolean not null default true,
  formats text[] not null default '{PDF,JPG,PNG}',
  max_mb int not null default 10 check (max_mb between 1 and 50),
  grades int[] null,
  multiple boolean not null default false,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admission_document_grades_chk check (grades is null or grades <@ array[1,2,3,4,5,6,7,8,9,10,11])
);

create index if not exists admission_document_types_active_idx
  on public.admission_document_types(active, sort_order);

insert into public.admission_document_types
  (code, name_kk, name_ru, name_en, description_kk, description_ru, description_en,
   category, required, formats, max_mb, multiple, sort_order)
values
  ('electronic_application',
   'Электронды өтініш', 'Электронное заявление', 'Electronic application',
   'Портал арқылы толтырылатын elektronды өтініш. Жүктеу қажет емес.',
   'Электронное заявление, заполняемое через портал. Загрузка не требуется.',
   'Electronic application submitted through the portal. No upload required.',
   'application', true, '{PDF}', 5, false, 10),
  ('birth_certificate',
   'Туу туралы куәлік', 'Свидетельство о рождении', 'Birth certificate',
   'Баланың туу туралы куәлігі. Екі беті қажет — екі файл жүктеуге болады.',
   'Свидетельство о рождении ребёнка. Нужны обе стороны — можно загрузить два файла.',
   'Child birth certificate. Both sides are required — two files are allowed.',
   'identity', true, '{PDF,JPG,PNG}', 10, true, 20),
  ('parent_id',
   'Ата-ананың жеке куәлігі', 'Удостоверение личности родителя', 'Parent ID card',
   'Өтініш беруші ата-ананың жеке куәлігі. Екі жағы қажет.',
   'Удостоверение личности родителя-заявителя. Нужны обе стороны.',
   'ID card of the applying parent. Both sides are required.',
   'identity', true, '{PDF,JPG,PNG}', 10, true, 30),
  ('photo_3x4',
   'Баланың 3×4 фотосуреті', 'Фото ребёнка 3×4', 'Child photo 3×4',
   'Ақ фондағы 3×4 фотосурет, JPG немесе PNG.',
   'Фотография 3×4 на белом фоне, JPG или PNG.',
   '3×4 photo on a white background, JPG or PNG.',
   'identity', true, '{JPG,JPEG,PNG}', 2, false, 40),
  ('medical_docs',
   'Медициналық құжаттар', 'Медицинские документы', 'Medical documents',
   'Медициналық карта, екпе туралы мәліметтер және басқа медициналық құжаттар.',
   'Медицинская карта, сведения о прививках и другие медицинские документы.',
   'Medical card, vaccination records and other medical documents.',
   'medical', true, '{PDF,JPG,PNG}', 10, true, 50),
  ('address_info',
   'Тұрғылықты мекенжай мәліметтері', 'Сведения об адресе проживания', 'Residential address details',
   'Тіркеу немесе тұрғылықты мекенжайды растайтын құжат.',
   'Документ, подтверждающий регистрацию или адрес проживания.',
   'Document confirming registration or residential address.',
   'address', true, '{PDF,JPG,PNG}', 5, false, 60),
  ('additional_docs',
   'Қосымша құжаттар', 'Дополнительные документы', 'Additional documents',
   'Қажет болған жағдайда қосымша құжаттарды жүктеуге болады.',
   'При необходимости можно загрузить дополнительные документы.',
   'Additional documents can be uploaded if needed.',
   'additional', false, '{PDF,JPG,PNG}', 10, true, 70)
on conflict (code) do nothing;

-- ---------------------------------------------------------------------
-- 3. APPLICATIONS + REQUIREMENT SNAPSHOTS
-- ---------------------------------------------------------------------
create table if not exists public.admission_applications (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.profiles(id) on delete cascade,
  student_first_name text not null check (char_length(student_first_name) between 1 and 60),
  student_last_name text not null check (char_length(student_last_name) between 1 and 60),
  birth_date date,
  iin text,
  grade int not null check (grade between 1 and 11),
  status text not null default 'new'
    check (status in ('new','under_review','documents_incomplete','documents_complete','accepted','rejected')),
  parent_note text not null default '',
  staff_comment text not null default '',
  decided_by uuid references public.profiles(id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admission_iin_chk check (iin is null or iin ~ '^[0-9]{12}$')
);

create index if not exists admission_applications_parent_idx on public.admission_applications(parent_id);
create index if not exists admission_applications_status_idx on public.admission_applications(status, created_at desc);

create table if not exists public.admission_document_requirements (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.admission_applications(id) on delete cascade,
  document_type_id uuid references public.admission_document_types(id) on delete set null,
  code text not null,
  name_kk text not null,
  name_ru text not null default '',
  name_en text not null default '',
  description_kk text not null default '',
  description_ru text not null default '',
  description_en text not null default '',
  required boolean not null default true,
  formats text[] not null default '{PDF,JPG,PNG}',
  max_mb int not null default 10,
  multiple boolean not null default false,
  sort_order int not null default 0,
  snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admission_requirements_app_idx on public.admission_document_requirements(application_id, sort_order);

-- ---------------------------------------------------------------------
-- 4. DOCUMENTS, VERSIONS, REVIEWS, EVENTS
-- ---------------------------------------------------------------------
create table if not exists public.admission_documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.admission_applications(id) on delete cascade,
  requirement_id uuid not null references public.admission_document_requirements(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id) on delete cascade,
  file_name text not null,
  storage_path text not null unique,
  mime_type text,
  size_bytes bigint,
  version int not null default 1 check (version >= 1),
  status text not null default 'UPLOADED'
    check (status in ('UPLOADED','UNDER_REVIEW','VERIFIED','NEEDS_CORRECTION','REJECTED')),
  review_comment text not null default '',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  is_current boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists admission_documents_app_idx on public.admission_documents(application_id, status);
create index if not exists admission_documents_req_idx on public.admission_documents(requirement_id, is_current);

create table if not exists public.admission_document_versions (
  id bigint generated by default as identity primary key,
  document_id uuid not null references public.admission_documents(id) on delete cascade,
  version int not null,
  file_name text not null,
  storage_path text not null,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists admission_document_versions_doc_idx on public.admission_document_versions(document_id, version desc);

create table if not exists public.admission_document_reviews (
  id bigint generated by default as identity primary key,
  document_id uuid not null references public.admission_documents(id) on delete cascade,
  application_id uuid not null references public.admission_applications(id) on delete cascade,
  reviewer_id uuid references public.profiles(id) on delete set null,
  action text not null check (action in ('SUBMITTED','UNDER_REVIEW','VERIFIED','NEEDS_CORRECTION','REJECTED')),
  comment text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists admission_reviews_doc_idx on public.admission_document_reviews(document_id, created_at desc);

create table if not exists public.admission_events (
  id bigint generated by default as identity primary key,
  application_id uuid not null references public.admission_applications(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admission_events_app_idx on public.admission_events(application_id, created_at desc);

-- updated_at triggers
drop trigger if exists admission_app_updated on public.admission_applications;
create trigger admission_app_updated before update on public.admission_applications
  for each row execute function public.set_updated_at();

drop trigger if exists admission_doc_updated on public.admission_documents;
create trigger admission_doc_updated before update on public.admission_documents
  for each row execute function public.set_updated_at();

drop trigger if exists admission_type_updated on public.admission_document_types;
create trigger admission_type_updated before update on public.admission_document_types
  for each row execute function public.set_updated_at();

drop trigger if exists admission_perm_updated on public.admission_permission_settings;
create trigger admission_perm_updated before update on public.admission_permission_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 5. HELPERS
-- ---------------------------------------------------------------------
create or replace function public._admission_event(p_app uuid, p_action text, p_details jsonb default '{}'::jsonb)
returns void language sql security definer set search_path = public as $$
  insert into public.admission_events(application_id, actor_id, action, details)
  values (p_app, auth.uid(), p_action, coalesce(p_details, '{}'::jsonb));
$$;

create or replace function public._admission_requirement_status(p_req uuid)
returns text language sql stable security definer set search_path = public as $$
  select case
    when r.code = 'electronic_application' then 'VERIFIED'
    else coalesce((
      select case
        when count(*) = 0 then 'NOT_UPLOADED'
        when bool_or(d.status = 'NEEDS_CORRECTION') then 'NEEDS_CORRECTION'
        when bool_or(d.status = 'REJECTED') then 'REJECTED'
        when bool_or(d.status = 'UNDER_REVIEW') then 'UNDER_REVIEW'
        when bool_or(d.status = 'VERIFIED') then 'VERIFIED'
        else 'UPLOADED' end
      from public.admission_documents d
      where d.requirement_id = r.id and d.is_current
    ), 'NOT_UPLOADED')
  end
  from public.admission_document_requirements r where r.id = p_req;
$$;

create or replace function public._admission_app_json(
  p_app uuid, p_docs boolean default false, p_details boolean default false, p_events boolean default false
) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', a.id,
    'student_first_name', a.student_first_name,
    'student_last_name', a.student_last_name,
    'grade', a.grade,
    'status', a.status,
    'created_at', a.created_at,
    'updated_at', a.updated_at,
    'parent_note', case when p_details then a.parent_note else '' end,
    'staff_comment', case when p_details then a.staff_comment else '' end,
    'birth_date', case when p_details then a.birth_date else null end,
    'iin', case when p_details then a.iin else null end,
    'decided_at', case when p_details then a.decided_at else null end,
    'parent', case when p_details then (
      select jsonb_build_object('id', p.id, 'first_name', p.first_name, 'last_name', p.last_name, 'phone', p.phone)
      from public.profiles p where p.id = a.parent_id
    ) else null end,
    'required_total', (
      select count(*) from public.admission_document_requirements r
      where r.application_id = a.id and r.required
    ),
    'required_done', (
      select count(*) from public.admission_document_requirements r
      where r.application_id = a.id and r.required
        and public._admission_requirement_status(r.id) = 'VERIFIED'
    ),
    'documents_uploaded', (
      select count(distinct d.requirement_id) from public.admission_documents d
      where d.application_id = a.id and d.is_current
    ),
    'requirements', case when p_docs or p_details then coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', r.id,
        'code', r.code,
        'name_kk', r.name_kk, 'name_ru', r.name_ru, 'name_en', r.name_en,
        'description_kk', r.description_kk, 'description_ru', r.description_ru, 'description_en', r.description_en,
        'required', r.required,
        'formats', r.formats,
        'max_mb', r.max_mb,
        'multiple', r.multiple,
        'sort_order', r.sort_order,
        'status', public._admission_requirement_status(r.id),
        'documents', case when p_docs then coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', d.id, 'file_name', d.file_name, 'storage_path', d.storage_path,
            'mime_type', d.mime_type, 'size_bytes', d.size_bytes, 'version', d.version,
            'status', d.status, 'review_comment', d.review_comment,
            'reviewed_at', d.reviewed_at, 'created_at', d.created_at
          ) order by d.created_at)
          from public.admission_documents d
          where d.requirement_id = r.id and d.is_current
        ), '[]'::jsonb) else '[]'::jsonb end
      ) order by r.sort_order, r.created_at)
      from public.admission_document_requirements r
      where r.application_id = a.id
    ), '[]'::jsonb) else '[]'::jsonb end,
    'events', case when p_events then coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', e.id, 'action', e.action, 'details', e.details, 'created_at', e.created_at,
        'actor', coalesce(nullif(trim(coalesce(pr.first_name,'') || ' ' || coalesce(pr.last_name,'')), ''), '—')
      ) order by e.created_at desc)
      from public.admission_events e
      left join public.profiles pr on pr.id = e.actor_id
      where e.application_id = a.id
    ), '[]'::jsonb) else '[]'::jsonb end
  )
  from public.admission_applications a where a.id = p_app;
$$;

-- ---------------------------------------------------------------------
-- 6. PARENT FUNCTIONS
-- ---------------------------------------------------------------------
create or replace function public.admission_requirements_preview(p_grade int) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_active() then raise exception 'FORBIDDEN'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', t.id, 'code', t.code,
      'name_kk', t.name_kk, 'name_ru', t.name_ru, 'name_en', t.name_en,
      'description_kk', t.description_kk, 'description_ru', t.description_ru, 'description_en', t.description_en,
      'required', t.required, 'formats', t.formats, 'max_mb', t.max_mb, 'multiple', t.multiple,
      'sort_order', t.sort_order
    ) order by t.sort_order)
    from public.admission_document_types t
    where t.active and (t.grades is null or p_grade = any(t.grades))
  ), '[]'::jsonb);
end $$;

create or replace function public.admission_create_application(
  p_first_name text, p_last_name text, p_grade int,
  p_birth_date date default null, p_iin text default null, p_note text default ''
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_role text;
begin
  select role into v_role from public.profiles where id = auth.uid() and not is_blocked;
  if v_role not in ('parent','admin','director') then raise exception 'FORBIDDEN'; end if;
  if coalesce(btrim(p_first_name),'') = '' or char_length(p_first_name) > 60 then raise exception 'BAD_NAME'; end if;
  if coalesce(btrim(p_last_name),'') = '' or char_length(p_last_name) > 60 then raise exception 'BAD_NAME'; end if;
  if p_grade is null or p_grade not between 1 and 11 then raise exception 'BAD_GRADE'; end if;
  if p_iin is not null and p_iin !~ '^[0-9]{12}$' then raise exception 'BAD_IIN'; end if;
  if p_birth_date is not null and p_birth_date > current_date then raise exception 'BAD_BIRTH_DATE'; end if;

  insert into public.admission_applications(parent_id, student_first_name, student_last_name, grade, birth_date, iin, parent_note)
  values (auth.uid(), btrim(p_first_name), btrim(p_last_name), p_grade, p_birth_date, nullif(p_iin,''), coalesce(p_note,''))
  returning id into v_id;

  -- Immutable snapshot of the requirements that existed at submission time.
  insert into public.admission_document_requirements(
    application_id, document_type_id, code, name_kk, name_ru, name_en,
    description_kk, description_ru, description_en,
    required, formats, max_mb, multiple, sort_order, snapshot
  )
  select v_id, t.id, t.code, t.name_kk, t.name_ru, t.name_en,
         t.description_kk, t.description_ru, t.description_en,
         t.required, t.formats, t.max_mb, t.multiple, t.sort_order, to_jsonb(t)
  from public.admission_document_types t
  where t.active and (t.grades is null or p_grade = any(t.grades))
  order by t.sort_order;

  perform public._admission_event(v_id, 'APPLICATION_CREATED', jsonb_build_object('grade', p_grade));
  return v_id;
end $$;

create or replace function public.admission_my_applications() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_active() then raise exception 'FORBIDDEN'; end if;
  return jsonb_build_object(
    'permissions', public.admission_my_permissions(),
    'applications', coalesce((
      select jsonb_agg(public._admission_app_json(a.id, true, true, true) order by a.created_at desc)
      from public.admission_applications a
      where a.parent_id = auth.uid() or public.is_admin() or public.is_director()
    ), '[]'::jsonb)
  );
end $$;

create or replace function public.admission_upload_document(
  p_application uuid, p_requirement uuid, p_file_name text, p_storage_path text
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  a public.admission_applications; r public.admission_document_requirements;
  v_ext text; v_size bigint; v_mime text; v_id uuid; v_exists boolean;
begin
  if not public.is_active() then raise exception 'FORBIDDEN'; end if;
  select * into a from public.admission_applications where id = p_application;
  if not found then raise exception 'NOT_FOUND'; end if;
  if a.parent_id <> auth.uid() and not (public.is_admin() or public.is_director()) then raise exception 'FORBIDDEN'; end if;
  select * into r from public.admission_document_requirements where id = p_requirement and application_id = p_application;
  if not found then raise exception 'BAD_REQUIREMENT'; end if;
  if p_storage_path not like p_application::text || '/%' then raise exception 'BAD_PATH'; end if;
  if not exists (select 1 from storage.objects where bucket_id = 'admission-documents' and name = p_storage_path) then
    raise exception 'FILE_NOT_FOUND';
  end if;
  select (metadata->>'size')::bigint, metadata->>'mimetype'
    into v_size, v_mime from storage.objects
   where bucket_id = 'admission-documents' and name = p_storage_path;
  v_ext := upper(regexp_replace(coalesce(p_file_name,''), '^.*\.', ''));
  if not (v_ext = any(r.formats)) then raise exception 'BAD_FORMAT'; end if;
  if coalesce(v_size,0) > r.max_mb * 1024 * 1024 then raise exception 'FILE_TOO_LARGE'; end if;
  select exists (select 1 from public.admission_documents where requirement_id = p_requirement and is_current)
    into v_exists;
  if v_exists and not r.multiple then raise exception 'USE_REPLACE'; end if;

  insert into public.admission_documents(
    application_id, requirement_id, uploaded_by, file_name, storage_path, mime_type, size_bytes
  ) values (p_application, p_requirement, auth.uid(), p_file_name, p_storage_path, v_mime, v_size)
  returning id into v_id;

  insert into public.admission_document_reviews(document_id, application_id, reviewer_id, action, comment)
  values (v_id, p_application, auth.uid(), 'SUBMITTED', '');
  perform public._admission_event(p_application, 'DOCUMENT_UPLOADED',
    jsonb_build_object('document', v_id, 'requirement', r.code, 'file', p_file_name));
  return v_id;
end $$;

create or replace function public.admission_replace_document(
  p_document uuid, p_file_name text, p_storage_path text
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  d public.admission_documents; r public.admission_document_requirements;
  v_ext text; v_size bigint; v_mime text;
begin
  if not public.is_active() then raise exception 'FORBIDDEN'; end if;
  select * into d from public.admission_documents where id = p_document and is_current;
  if not found then raise exception 'NOT_FOUND'; end if;
  if d.uploaded_by <> auth.uid() and not (public.is_admin() or public.is_director()) then raise exception 'FORBIDDEN'; end if;
  select * into r from public.admission_document_requirements where id = d.requirement_id;
  if p_storage_path not like d.application_id::text || '/%' then raise exception 'BAD_PATH'; end if;
  if not exists (select 1 from storage.objects where bucket_id = 'admission-documents' and name = p_storage_path) then
    raise exception 'FILE_NOT_FOUND';
  end if;
  select (metadata->>'size')::bigint, metadata->>'mimetype'
    into v_size, v_mime from storage.objects
   where bucket_id = 'admission-documents' and name = p_storage_path;
  v_ext := upper(regexp_replace(coalesce(p_file_name,''), '^.*\.', ''));
  if not (v_ext = any(r.formats)) then raise exception 'BAD_FORMAT'; end if;
  if coalesce(v_size,0) > r.max_mb * 1024 * 1024 then raise exception 'FILE_TOO_LARGE'; end if;

  insert into public.admission_document_versions(document_id, version, file_name, storage_path, mime_type, size_bytes, uploaded_by)
  values (d.id, d.version, d.file_name, d.storage_path, d.mime_type, d.size_bytes, d.uploaded_by);

  update public.admission_documents set
    file_name = p_file_name, storage_path = p_storage_path, mime_type = v_mime, size_bytes = v_size,
    version = d.version + 1, status = 'UPLOADED', review_comment = '',
    reviewed_by = null, reviewed_at = null
  where id = d.id;

  insert into public.admission_document_reviews(document_id, application_id, reviewer_id, action, comment)
  values (d.id, d.application_id, auth.uid(), 'SUBMITTED', '');
  perform public._admission_event(d.application_id, 'DOCUMENT_REPLACED',
    jsonb_build_object('document', d.id, 'version', d.version + 1));
  return d.id;
end $$;

create or replace function public.admission_delete_document(p_document uuid) returns void
language plpgsql security definer set search_path = public as $$
declare d public.admission_documents;
begin
  if not public.is_active() then raise exception 'FORBIDDEN'; end if;
  select * into d from public.admission_documents where id = p_document;
  if not found then raise exception 'NOT_FOUND'; end if;
  if d.uploaded_by <> auth.uid() and not (public.is_admin() or public.is_director()) then raise exception 'FORBIDDEN'; end if;
  delete from public.admission_documents where id = p_document;
  perform public._admission_event(d.application_id, 'DOCUMENT_DELETED', jsonb_build_object('document', p_document));
end $$;

-- ---------------------------------------------------------------------
-- 7. STAFF FUNCTIONS
-- ---------------------------------------------------------------------
create or replace function public.admission_applications_list(p_status text default '', p_search text default '')
returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_active() then raise exception 'FORBIDDEN'; end if;
  if not (public.is_admin() or public.is_director() or public.admission_has('admission_view')
          or public.admission_has('admission_documents_view') or public.admission_has('admission_details_view')
          or public.admission_has('admission_status_update') or public.admission_has('admission_comment')) then
    raise exception 'FORBIDDEN';
  end if;
  return jsonb_build_object(
    'permissions', public.admission_my_permissions(),
    'applications', coalesce((
      select jsonb_agg(public._admission_app_json(a.id, false, public.admission_has('admission_details_view'), false)
                       order by a.created_at desc)
      from public.admission_applications a
      where (coalesce(p_status,'') = '' or a.status = p_status)
        and (coalesce(p_search,'') = '' or
             (a.student_first_name || ' ' || a.student_last_name) ilike '%' || p_search || '%' or
             a.student_last_name ilike '%' || p_search || '%' or
             a.student_first_name ilike '%' || p_search || '%' or
             a.grade::text = p_search)
    ), '[]'::jsonb)
  );
end $$;

create or replace function public.admission_application_detail(p_id uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare a public.admission_applications; v_staff boolean; v_owner boolean; v_details boolean; v_docs boolean;
begin
  if not public.is_active() then raise exception 'FORBIDDEN'; end if;
  select * into a from public.admission_applications where id = p_id;
  if not found then raise exception 'NOT_FOUND'; end if;
  v_owner := a.parent_id = auth.uid();
  v_staff := public.is_admin() or public.is_director() or public.admission_has('admission_view')
             or public.admission_has('admission_details_view') or public.admission_has('admission_documents_view')
             or public.admission_has('admission_status_update') or public.admission_has('admission_comment');
  if not v_owner and not v_staff then raise exception 'FORBIDDEN'; end if;
  v_details := v_owner or public.is_admin() or public.is_director() or public.admission_has('admission_details_view');
  v_docs := v_owner or public.is_admin() or public.is_director() or public.admission_has('admission_documents_view');
  return public._admission_app_json(p_id, v_docs, v_details, v_details)
    || jsonb_build_object('permissions', public.admission_my_permissions(), 'parent_view', v_owner);
end $$;

create or replace function public.admission_update_status(p_id uuid, p_status text, p_comment text default '')
returns void
language plpgsql security definer set search_path = public as $$
declare a public.admission_applications; v_missing int;
begin
  if not (public.is_admin() or public.is_director() or public.admission_has('admission_status_update')) then
    raise exception 'FORBIDDEN';
  end if;
  if p_status not in ('new','under_review','documents_incomplete','documents_complete','accepted','rejected') then
    raise exception 'BAD_STATUS';
  end if;
  select * into a from public.admission_applications where id = p_id;
  if not found then raise exception 'NOT_FOUND'; end if;

  if p_status = 'accepted' then
    select count(*) into v_missing
    from public.admission_document_requirements r
    where r.application_id = p_id and r.required
      and public._admission_requirement_status(r.id) <> 'VERIFIED';
    if v_missing > 0 then raise exception 'DOCUMENTS_INCOMPLETE'; end if;
  end if;

  update public.admission_applications set
    status = p_status,
    staff_comment = case when coalesce(btrim(p_comment),'') <> '' then p_comment else staff_comment end,
    decided_by = case when p_status in ('accepted','rejected') then auth.uid() else decided_by end,
    decided_at = case when p_status in ('accepted','rejected') then now() else decided_at end
  where id = p_id;

  perform public._admission_event(p_id, 'STATUS_CHANGED',
    jsonb_build_object('from', a.status, 'to', p_status, 'comment', coalesce(p_comment,'')));
end $$;

create or replace function public.admission_add_comment(p_id uuid, p_comment text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not (public.is_admin() or public.is_director() or public.admission_has('admission_comment')) then
    raise exception 'FORBIDDEN';
  end if;
  if coalesce(btrim(p_comment),'') = '' then raise exception 'EMPTY_COMMENT'; end if;
  if not exists (select 1 from public.admission_applications where id = p_id) then raise exception 'NOT_FOUND'; end if;
  update public.admission_applications set staff_comment = p_comment where id = p_id;
  perform public._admission_event(p_id, 'COMMENT_ADDED', jsonb_build_object('comment', p_comment));
end $$;

create or replace function public.admission_review_document(p_document uuid, p_status text, p_comment text default '')
returns void
language plpgsql security definer set search_path = public as $$
declare d public.admission_documents;
begin
  if not (public.is_admin() or public.is_director() or public.admission_has('admission_documents_view')) then
    raise exception 'FORBIDDEN';
  end if;
  if p_status not in ('UNDER_REVIEW','VERIFIED','NEEDS_CORRECTION','REJECTED') then raise exception 'BAD_STATUS'; end if;
  select * into d from public.admission_documents where id = p_document and is_current;
  if not found then raise exception 'NOT_FOUND'; end if;
  update public.admission_documents set
    status = p_status, review_comment = coalesce(p_comment,''),
    reviewed_by = auth.uid(), reviewed_at = now()
  where id = p_document;
  insert into public.admission_document_reviews(document_id, application_id, reviewer_id, action, comment)
  values (p_document, d.application_id, auth.uid(), p_status, coalesce(p_comment,''));
  perform public._admission_event(d.application_id, 'DOCUMENT_REVIEWED',
    jsonb_build_object('document', p_document, 'status', p_status, 'comment', coalesce(p_comment,'')));
end $$;

create or replace function public.admission_dashboard() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_total int; v_new int; v_review int; v_incomplete int; v_complete int; v_accepted int; v_pending_docs int;
begin
  if not (public.is_admin() or public.is_director()) then raise exception 'FORBIDDEN'; end if;
  select count(*),
         count(*) filter (where status = 'new'),
         count(*) filter (where status = 'under_review'),
         count(*) filter (where status not in ('accepted','rejected') and exists (
           select 1 from public.admission_document_requirements r
           where r.application_id = a.id and r.required
             and public._admission_requirement_status(r.id) <> 'VERIFIED')),
         count(*) filter (where exists (
           select 1 from public.admission_document_requirements r
           where r.application_id = a.id and r.required
             and public._admission_requirement_status(r.id) = 'VERIFIED')),
         count(*) filter (where status = 'accepted')
    into v_total, v_new, v_review, v_incomplete, v_complete, v_accepted
  from public.admission_applications a;
  select count(*) into v_pending_docs from public.admission_documents where is_current and status in ('UPLOADED','UNDER_REVIEW');
  return jsonb_build_object(
    'total', v_total, 'new', v_new, 'under_review', v_review,
    'incomplete', v_incomplete, 'complete', v_complete, 'accepted', v_accepted,
    'pending_documents', v_pending_docs,
    'recent', coalesce((
      select jsonb_agg(public._admission_app_json(a.id, false, true, false) order by a.created_at desc)
      from (select * from public.admission_applications order by created_at desc limit 8) a
    ), '[]'::jsonb)
  );
end $$;

-- ---------------------------------------------------------------------
-- 8. DOCUMENT TYPE MANAGEMENT (director + admin)
-- ---------------------------------------------------------------------
create or replace function public.admission_document_types_list() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not (public.is_admin() or public.is_director()) then raise exception 'FORBIDDEN'; end if;
  return coalesce((
    select jsonb_agg(to_jsonb(t) order by t.sort_order, t.created_at)
    from public.admission_document_types t
  ), '[]'::jsonb);
end $$;

create or replace function public.admission_save_document_type(
  p_id uuid,
  p_code text,
  p_name_kk text, p_name_ru text, p_name_en text,
  p_description_kk text, p_description_ru text, p_description_en text,
  p_category text, p_required boolean, p_formats text[], p_max_mb int,
  p_grades int[], p_multiple boolean, p_active boolean, p_sort_order int
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_code text;
begin
  if not (public.is_admin() or public.is_director()) then raise exception 'FORBIDDEN'; end if;
  if coalesce(btrim(p_name_kk),'') = '' then raise exception 'BAD_NAME'; end if;
  if p_category not in ('application','identity','medical','address','additional','general') then raise exception 'BAD_CATEGORY'; end if;
  if p_formats is null or array_length(p_formats,1) is null then raise exception 'BAD_FORMATS'; end if;
  if p_max_mb is null or p_max_mb not between 1 and 50 then raise exception 'BAD_SIZE'; end if;
  if p_grades is not null and not (p_grades <@ array[1,2,3,4,5,6,7,8,9,10,11]) then raise exception 'BAD_GRADES'; end if;
  v_code := lower(coalesce(nullif(btrim(p_code),''), 'doc_' || substr(md5(random()::text),1,10)));
  if v_code !~ '^[a-z][a-z0-9_]{1,60}$' then raise exception 'BAD_CODE'; end if;

  if p_id is null then
    insert into public.admission_document_types(
      code, name_kk, name_ru, name_en, description_kk, description_ru, description_en,
      category, required, formats, max_mb, grades, multiple, active, sort_order
    ) values (
      v_code, p_name_kk, coalesce(p_name_ru,''), coalesce(p_name_en,''),
      coalesce(p_description_kk,''), coalesce(p_description_ru,''), coalesce(p_description_en,''),
      p_category, p_required, p_formats, p_max_mb, p_grades, p_multiple, p_active, p_sort_order
    ) returning id into v_id;
  else
    update public.admission_document_types set
      code = v_code, name_kk = p_name_kk, name_ru = coalesce(p_name_ru,''), name_en = coalesce(p_name_en,''),
      description_kk = coalesce(p_description_kk,''), description_ru = coalesce(p_description_ru,''),
      description_en = coalesce(p_description_en,''),
      category = p_category, required = p_required, formats = p_formats, max_mb = p_max_mb,
      grades = p_grades, multiple = p_multiple, active = p_active, sort_order = p_sort_order
    where id = p_id returning id into v_id;
    if v_id is null then raise exception 'NOT_FOUND'; end if;
  end if;
  return v_id;
end $$;

create or replace function public.admission_toggle_document_type(p_id uuid, p_active boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not (public.is_admin() or public.is_director()) then raise exception 'FORBIDDEN'; end if;
  update public.admission_document_types set active = p_active where id = p_id;
  if not found then raise exception 'NOT_FOUND'; end if;
end $$;

create or replace function public.admission_reorder_document_types(p_ids uuid[]) returns void
language plpgsql security definer set search_path = public as $$
declare i int;
begin
  if not (public.is_admin() or public.is_director()) then raise exception 'FORBIDDEN'; end if;
  if p_ids is null then return; end if;
  for i in 1 .. array_length(p_ids,1) loop
    update public.admission_document_types set sort_order = i * 10 where id = p_ids[i];
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 9. RLS
-- ---------------------------------------------------------------------
alter table public.admission_permission_settings enable row level security;
alter table public.admission_document_types enable row level security;
alter table public.admission_applications enable row level security;
alter table public.admission_document_requirements enable row level security;
alter table public.admission_documents enable row level security;
alter table public.admission_document_versions enable row level security;
alter table public.admission_document_reviews enable row level security;
alter table public.admission_events enable row level security;

drop policy if exists admission_perm_select on public.admission_permission_settings;
create policy admission_perm_select on public.admission_permission_settings for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists admission_types_select on public.admission_document_types;
create policy admission_types_select on public.admission_document_types for select to authenticated
  using (public.is_admin() or public.is_director() or public.is_staff());

drop policy if exists admission_apps_select on public.admission_applications;
create policy admission_apps_select on public.admission_applications for select to authenticated
  using (
    parent_id = auth.uid() or public.is_admin() or public.is_director()
    or public.admission_has('admission_view') or public.admission_has('admission_documents_view')
    or public.admission_has('admission_details_view') or public.admission_has('admission_status_update')
    or public.admission_has('admission_comment')
  );

drop policy if exists admission_req_select on public.admission_document_requirements;
create policy admission_req_select on public.admission_document_requirements for select to authenticated
  using (
    exists (select 1 from public.admission_applications a where a.id = application_id and a.parent_id = auth.uid())
    or public.is_admin() or public.is_director()
    or public.admission_has('admission_view') or public.admission_has('admission_documents_view')
    or public.admission_has('admission_details_view')
  );

drop policy if exists admission_docs_select on public.admission_documents;
create policy admission_docs_select on public.admission_documents for select to authenticated
  using (
    exists (select 1 from public.admission_applications a where a.id = application_id and a.parent_id = auth.uid())
    or public.is_admin() or public.is_director() or public.admission_has('admission_documents_view')
  );

drop policy if exists admission_versions_select on public.admission_document_versions;
create policy admission_versions_select on public.admission_document_versions for select to authenticated
  using (
    exists (select 1 from public.admission_documents d
            join public.admission_applications a on a.id = d.application_id
            where d.id = document_id and a.parent_id = auth.uid())
    or public.is_admin() or public.is_director() or public.admission_has('admission_documents_view')
  );

drop policy if exists admission_reviews_select on public.admission_document_reviews;
create policy admission_reviews_select on public.admission_document_reviews for select to authenticated
  using (
    exists (select 1 from public.admission_applications a where a.id = application_id and a.parent_id = auth.uid())
    or public.is_admin() or public.is_director() or public.admission_has('admission_documents_view')
  );

drop policy if exists admission_events_select on public.admission_events;
create policy admission_events_select on public.admission_events for select to authenticated
  using (
    exists (select 1 from public.admission_applications a where a.id = application_id and a.parent_id = auth.uid())
    or public.is_admin() or public.is_director() or public.admission_has('admission_details_view')
  );

grant select on public.admission_permission_settings to authenticated;
grant select on public.admission_document_types to authenticated;
grant select on public.admission_applications to authenticated;
grant select on public.admission_document_requirements to authenticated;
grant select on public.admission_documents to authenticated;
grant select on public.admission_document_versions to authenticated;
grant select on public.admission_document_reviews to authenticated;
grant select on public.admission_events to authenticated;

-- ---------------------------------------------------------------------
-- 10. STORAGE (private bucket)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('admission-documents', 'admission-documents', false, 10485760,
        array['application/pdf','image/jpeg','image/png'])
on conflict (id) do update set public = false;

drop policy if exists "admission_docs_read" on storage.objects;
drop policy if exists "admission_docs_insert" on storage.objects;
drop policy if exists "admission_docs_update" on storage.objects;
drop policy if exists "admission_docs_delete" on storage.objects;

create policy "admission_docs_read" on storage.objects for select to authenticated
  using (
    bucket_id = 'admission-documents' and (
      public.is_admin() or public.is_director() or public.admission_has('admission_documents_view')
      or exists (
        select 1 from public.admission_applications a
        where a.id::text = (storage.foldername(name))[1] and a.parent_id = auth.uid()
      )
    )
  );

create policy "admission_docs_insert" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'admission-documents' and exists (
      select 1 from public.admission_applications a
      where a.id::text = (storage.foldername(name))[1]
        and (a.parent_id = auth.uid() or public.is_admin() or public.is_director())
    )
  );

create policy "admission_docs_update" on storage.objects for update to authenticated
  using (
    bucket_id = 'admission-documents' and exists (
      select 1 from public.admission_applications a
      where a.id::text = (storage.foldername(name))[1]
        and (a.parent_id = auth.uid() or public.is_admin() or public.is_director())
    )
  );

create policy "admission_docs_delete" on storage.objects for delete to authenticated
  using (
    bucket_id = 'admission-documents' and (
      public.is_admin() or public.is_director() or exists (
        select 1 from public.admission_applications a
        where a.id::text = (storage.foldername(name))[1] and a.parent_id = auth.uid()
      )
    )
  );

-- ---------------------------------------------------------------------
-- 11. REALTIME
-- ---------------------------------------------------------------------
do $$
begin
  begin alter publication supabase_realtime add table public.admission_applications; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.admission_documents; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.admission_document_reviews; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.admission_document_types; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.admission_permission_settings; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.admission_document_requirements; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.admission_events; exception when duplicate_object then null; end;
end $$;

-- Internal helpers are used only inside security-definer RPCs.
revoke all on function public._admission_event(uuid, text, jsonb) from public, anon, authenticated;
revoke all on function public._admission_requirement_status(uuid) from public, anon, authenticated;
revoke all on function public._admission_app_json(uuid, boolean, boolean, boolean) from public, anon, authenticated;

notify pgrst, 'reload schema';
