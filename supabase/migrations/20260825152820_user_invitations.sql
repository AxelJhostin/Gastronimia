-- Auditoría de invitaciones emitidas por administración. El token, la
-- expiración y el uso único del enlace los administra Supabase Auth.
create table public.user_invitations (
  id uuid primary key default extensions.gen_random_uuid(),
  invited_user_id uuid not null unique references public.users (id) on delete cascade,
  invited_by_user_id uuid not null references public.users (id) on delete restrict,
  email text not null,
  requested_roles public.role_code[] not null check (cardinality(requested_roles) > 0),
  created_at timestamptz not null default now()
);

create index user_invitations_invited_by_user_id_idx
on public.user_invitations (invited_by_user_id);

alter table public.user_invitations enable row level security;
revoke all on table public.user_invitations from anon, authenticated;
grant all on table public.user_invitations to service_role;

-- FastAPI invoca esta RPC exclusivamente con service_role después de que
-- Supabase Auth haya creado la invitación. Así, roles y auditoría se guardan
-- juntos y nunca dependen de metadatos editables del destinatario.
create function public.record_user_invitation(
  invited_user_id uuid,
  invited_by_user_id uuid,
  invited_email text,
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
  if invited_user_id is null or invited_by_user_id is null then
    raise exception 'La invitación requiere usuario invitado y administrador responsable.';
  end if;

  if invited_email is null or char_length(btrim(invited_email)) = 0 then
    raise exception 'La invitación requiere correo.';
  end if;

  if requested_roles is null or cardinality(requested_roles) = 0 then
    raise exception 'Un usuario invitado debe tener al menos un rol.';
  end if;

  if not exists (select 1 from public.users where id = invited_user_id) then
    raise exception 'El usuario invitado no existe.';
  end if;

  if not exists (select 1 from public.users where id = invited_by_user_id) then
    raise exception 'El administrador responsable no existe.';
  end if;

  select count(*) into valid_role_count
  from public.roles
  where code = any(requested_roles);

  if valid_role_count <> cardinality(requested_roles) then
    raise exception 'La invitación contiene roles inválidos o repetidos.';
  end if;

  delete from public.user_roles where user_id = invited_user_id;

  insert into public.user_roles (user_id, role_id)
  select invited_user_id, role.id
  from public.roles as role
  where role.code = any(requested_roles);

  insert into public.user_invitations (
    invited_user_id,
    invited_by_user_id,
    email,
    requested_roles
  )
  values (
    invited_user_id,
    invited_by_user_id,
    lower(btrim(invited_email)),
    requested_roles
  )
  on conflict (invited_user_id) do update
  set
    invited_by_user_id = excluded.invited_by_user_id,
    email = excluded.email,
    requested_roles = excluded.requested_roles,
    created_at = now();
end;
$$;

revoke all on function public.record_user_invitation(
  uuid,
  uuid,
  text,
  public.role_code[]
) from public;
grant execute on function public.record_user_invitation(
  uuid,
  uuid,
  text,
  public.role_code[]
) to service_role;

comment on table public.user_invitations is
  'Auditoría de altas por invitación. Supabase Auth conserva el enlace temporal de un solo uso.';
comment on function public.record_user_invitation(uuid, uuid, text, public.role_code[]) is
  'Guarda la auditoría y asigna roles de una invitación; invocable solo por service_role.';
