alter table public.user_invitations rename to user_provisioning_records;
alter table public.user_provisioning_records
  rename column invited_user_id to provisioned_user_id;
alter table public.user_provisioning_records
  rename column invited_by_user_id to provisioned_by_user_id;

drop function public.record_user_invitation(uuid, uuid, text, public.role_code[]);

create function public.record_user_provisioning(
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
  if provisioned_user_id is null or provisioned_by_user_id is null
    or provisioned_email is null or char_length(btrim(provisioned_email)) = 0
    or requested_roles is null or cardinality(requested_roles) = 0 then
    raise exception 'Los datos de alta son incompletos.';
  end if;

  if not exists (select 1 from public.users where id = provisioned_user_id)
    or not exists (select 1 from public.users where id = provisioned_by_user_id) then
    raise exception 'El usuario de alta o el administrador no existe.';
  end if;

  select count(*) into valid_role_count
  from public.roles where code = any(requested_roles);
  if valid_role_count <> cardinality(requested_roles) then
    raise exception 'Los roles son inválidos o están repetidos.';
  end if;

  delete from public.user_roles where user_id = provisioned_user_id;
  insert into public.user_roles (user_id, role_id)
  select provisioned_user_id, id from public.roles
  where code = any(requested_roles);

  insert into public.user_provisioning_records (
    provisioned_user_id, provisioned_by_user_id, email, requested_roles
  ) values (
    provisioned_user_id, provisioned_by_user_id,
    lower(btrim(provisioned_email)), requested_roles
  ) on conflict (provisioned_user_id) do update set
    provisioned_by_user_id = excluded.provisioned_by_user_id,
    email = excluded.email,
    requested_roles = excluded.requested_roles,
    created_at = now();
end;
$$;

revoke all on function public.record_user_provisioning(uuid, uuid, text, public.role_code[]) from public;
grant execute on function public.record_user_provisioning(uuid, uuid, text, public.role_code[]) to service_role;

comment on table public.user_provisioning_records is
  'Auditoría de altas directas. La contraseña temporal nunca se almacena aquí.';
