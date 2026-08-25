drop function public.record_user_provisioning(uuid, uuid, text, public.role_code[]);

create or replace function public.record_user_provisioning(
  p_provisioned_user_id uuid,
  p_provisioned_by_user_id uuid,
  p_provisioned_email text,
  p_requested_roles public.role_code[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  valid_role_count integer;
begin
  if p_provisioned_user_id is null
    or p_provisioned_by_user_id is null
    or p_provisioned_email is null
    or char_length(btrim(p_provisioned_email)) = 0
    or p_requested_roles is null
    or cardinality(p_requested_roles) = 0 then
    raise exception 'Los datos de alta son incompletos.';
  end if;

  if not exists (
    select 1 from public.users as provisioned_user
    where provisioned_user.id = p_provisioned_user_id
  ) or not exists (
    select 1 from public.users as provisioning_admin
    where provisioning_admin.id = p_provisioned_by_user_id
  ) then
    raise exception 'El usuario de alta o el administrador no existe.';
  end if;

  select count(*) into valid_role_count
  from public.roles as available_role
  where available_role.code = any(p_requested_roles);
  if valid_role_count <> cardinality(p_requested_roles) then
    raise exception 'Los roles son inválidos o están repetidos.';
  end if;

  delete from public.user_roles as assigned_role
  where assigned_role.user_id = p_provisioned_user_id;

  insert into public.user_roles (user_id, role_id)
  select p_provisioned_user_id, available_role.id
  from public.roles as available_role
  where available_role.code = any(p_requested_roles);

  insert into public.user_provisioning_records (
    provisioned_user_id, provisioned_by_user_id, email, requested_roles
  ) values (
    p_provisioned_user_id,
    p_provisioned_by_user_id,
    lower(btrim(p_provisioned_email)),
    p_requested_roles
  ) on conflict (provisioned_user_id) do update set
    provisioned_by_user_id = excluded.provisioned_by_user_id,
    email = excluded.email,
    requested_roles = excluded.requested_roles,
    created_at = now();
end;
$$;

revoke all on function public.record_user_provisioning(uuid, uuid, text, public.role_code[]) from public;
grant execute on function public.record_user_provisioning(uuid, uuid, text, public.role_code[]) to service_role;
