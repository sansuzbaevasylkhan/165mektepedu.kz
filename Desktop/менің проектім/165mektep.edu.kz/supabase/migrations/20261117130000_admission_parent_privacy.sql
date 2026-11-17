-- Parents must not receive internal staff notes or internal-only timeline comments.
-- Additive: replaces two read RPCs, keeps existing signatures and behaviour for staff.

create or replace function public._admission_parent_safe(p jsonb) returns jsonb
language sql immutable set search_path = public as $$
  select jsonb_set(
    jsonb_set(p, '{staff_comment}', '""'::jsonb),
    '{events}', coalesce((
      select jsonb_agg(
        case
          when e->'details' ? 'comment' then jsonb_set(e, '{details}', (e->'details') - 'comment')
          else e
        end
        order by ord
      )
      from jsonb_array_elements(coalesce(p->'events', '[]'::jsonb)) with ordinality as t(e, ord)
      where e->>'action' <> 'COMMENT_ADDED'
    ), '[]'::jsonb)
  );
$$;

revoke all on function public._admission_parent_safe(jsonb) from public, anon, authenticated;

create or replace function public.admission_application_detail(p_id uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  a public.admission_applications; v jsonb;
  v_staff boolean; v_owner boolean; v_privileged boolean; v_details boolean; v_docs boolean;
begin
  if not public.is_active() then raise exception 'FORBIDDEN'; end if;
  select * into a from public.admission_applications where id = p_id;
  if not found then raise exception 'NOT_FOUND'; end if;
  v_owner := a.parent_id = auth.uid();
  v_privileged := public.is_admin() or public.is_director() or public.admission_has('admission_details_view');
  v_staff := v_privileged or public.admission_has('admission_view')
             or public.admission_has('admission_documents_view')
             or public.admission_has('admission_status_update') or public.admission_has('admission_comment');
  if not v_owner and not v_staff then raise exception 'FORBIDDEN'; end if;
  v_details := v_owner or v_privileged;
  v_docs := v_owner or public.is_admin() or public.is_director() or public.admission_has('admission_documents_view');
  v := public._admission_app_json(p_id, v_docs, v_details, v_details);
  if v_owner and not v_privileged then
    v := public._admission_parent_safe(v);
  end if;
  return v || jsonb_build_object('permissions', public.admission_my_permissions(), 'parent_view', v_owner);
end $$;

create or replace function public.admission_my_applications() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_active() then raise exception 'FORBIDDEN'; end if;
  return jsonb_build_object(
    'permissions', public.admission_my_permissions(),
    'applications', coalesce((
      select jsonb_agg(
        case
          when public.is_admin() or public.is_director() or public.admission_has('admission_details_view')
            then public._admission_app_json(a.id, true, true, true)
          else public._admission_parent_safe(public._admission_app_json(a.id, true, true, true))
        end
        order by a.created_at desc
      )
      from public.admission_applications a
      where a.parent_id = auth.uid() or public.is_admin() or public.is_director()
    ), '[]'::jsonb)
  );
end $$;
