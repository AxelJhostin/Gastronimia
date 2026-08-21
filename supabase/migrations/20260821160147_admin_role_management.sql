-- Reemplaza los roles de un usuario de forma atómica. La función se publica
-- únicamente para service_role: FastAPI valida que quien la solicita sea ADMIN.
create function public.replace_user_roles(
  target_user_id uuid,
  requested_roles public.role_code[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  active_admin_count integer;
  target_is_admin boolean;
begin
  if requested_roles is null or cardinality(requested_roles) = 0 then
    raise exception 'Un usuario activo debe tener al menos un rol.';
  end if;

  perform 1
  from public.users
  where id = target_user_id
    and is_active
  for update;

  if not found then
    raise exception 'El usuario no existe o está inactivo.';
  end if;

  lock table public.user_roles in share row exclusive mode;

  select exists (
    select 1
    from public.user_roles as assigned_role
    join public.roles as role
      on role.id = assigned_role.role_id
    where assigned_role.user_id = target_user_id
      and role.code = 'ADMIN'
  )
  into target_is_admin;

  if target_is_admin and not ('ADMIN' = any(requested_roles)) then
    select count(*)
    into active_admin_count
    from public.user_roles as assigned_role
    join public.roles as role
      on role.id = assigned_role.role_id
    join public.users as application_user
      on application_user.id = assigned_role.user_id
    where role.code = 'ADMIN'
      and application_user.is_active;

    if active_admin_count <= 1 then
      raise exception 'Debe existir al menos un administrador activo.';
    end if;
  end if;

  delete from public.user_roles
  where user_id = target_user_id;

  insert into public.user_roles (user_id, role_id)
  select target_user_id, role.id
  from public.roles as role
  where role.code = any(requested_roles)
  on conflict do nothing;
end;
$$;

revoke all on function public.replace_user_roles(uuid, public.role_code[]) from public;
grant execute on function public.replace_user_roles(uuid, public.role_code[])
  to service_role;

comment on function public.replace_user_roles(uuid, public.role_code[]) is
  'Operación atómica de administración de roles; invocable solo por service_role.';
