create or replace function public.record_user_provisioning(
  provisioned_user_id uuid,
  provisioned_by_user_id uuid,
  provisioned_email text,
  requested_roles public.role_code[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  valid_role_count integer;
begin
  if record_user_provisioning.provisioned_user_id is null
    or record_user_provisioning.provisioned_by_user_id is null
    or record_user_provisioning.provisioned_email is null
    or char_length(btrim(record_user_provisioning.provisioned_email)) = 0
    or record_user_provisioning.requested_roles is null
    or cardinality(record_user_provisioning.requested_roles) = 0 then
    raise exception 'Los datos de alta son incompletos.';
  end if;

  if not exists (
    select 1 from public.users as provisioned_user
    where provisioned_user.id = record_user_provisioning.provisioned_user_id
  ) or not exists (
    select 1 from public.users as provisioning_admin
    where provisioning_admin.id = record_user_provisioning.provisioned_by_user_id
  ) then
    raise exception 'El usuario de alta o el administrador no existe.';
  end if;

  select count(*) into valid_role_count
  from public.roles as available_role
  where available_role.code = any(record_user_provisioning.requested_roles);
  if valid_role_count <> cardinality(record_user_provisioning.requested_roles) then
    raise exception 'Los roles son inválidos o están repetidos.';
  end if;

  delete from public.user_roles as assigned_role
  where assigned_role.user_id = record_user_provisioning.provisioned_user_id;

  insert into public.user_roles (user_id, role_id)
  select record_user_provisioning.provisioned_user_id, available_role.id
  from public.roles as available_role
  where available_role.code = any(record_user_provisioning.requested_roles);

  insert into public.user_provisioning_records (
    provisioned_user_id, provisioned_by_user_id, email, requested_roles
  ) values (
    record_user_provisioning.provisioned_user_id,
    record_user_provisioning.provisioned_by_user_id,
    lower(btrim(record_user_provisioning.provisioned_email)),
    record_user_provisioning.requested_roles
  ) on conflict (provisioned_user_id) do update set
    provisioned_by_user_id = excluded.provisioned_by_user_id,
    email = excluded.email,
    requested_roles = excluded.requested_roles,
    created_at = now();
end;
$$;
