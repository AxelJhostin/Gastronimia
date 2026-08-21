-- Núcleo de seguridad para Supabase Auth y la autorización de la aplicación.
-- Las asignaciones de roles se realizan desde servicios de confianza (FastAPI),
-- nunca desde metadatos editables por el usuario.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public;

-- Evita que futuras tablas o funciones de public queden accesibles por defecto
-- a través de la Data API. Cada migración debe conceder solo lo que necesite.
alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke usage, select on sequences from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke execute on functions from public;

create type public.role_code as enum (
  'ADMIN',
  'MANAGER',
  'TEACHER'
);

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null check (char_length(btrim(full_name)) > 0),
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index users_email_unique_ci on public.users (lower(email));

create table public.roles (
  id smallint primary key,
  code public.role_code not null unique,
  name text not null unique check (char_length(btrim(name)) > 0)
);

create table public.user_roles (
  user_id uuid not null references public.users (id) on delete cascade,
  role_id smallint not null references public.roles (id) on delete restrict,
  primary key (user_id, role_id)
);

insert into public.roles (id, code, name)
values
  (1, 'ADMIN', 'Administrador'),
  (2, 'MANAGER', 'Encargado'),
  (3, 'TEACHER', 'Docente');

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_set_updated_at
before update on public.users
for each row
execute function private.set_updated_at();

create function private.handle_auth_user_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_full_name text;
begin
  if tg_op = 'INSERT' then
    if new.email is null then
      raise exception 'Solo se admiten cuentas de Supabase Auth con correo electrónico.';
    end if;

    profile_full_name := coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(split_part(new.email, '@', 1), ''),
      new.id::text
    );

    insert into public.users (id, email, full_name)
    values (new.id, new.email, profile_full_name);
  elsif new.email is distinct from old.email then
    update public.users
    set email = new.email
    where id = new.id;
  end if;

  return new;
end;
$$;

create trigger auth_user_created
after insert on auth.users
for each row
execute function private.handle_auth_user_change();

create trigger auth_user_email_changed
after update of email on auth.users
for each row
execute function private.handle_auth_user_change();

create function private.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.users
    where id = (select auth.uid())
      and is_active
  );
$$;

create function private.has_role(required_role public.role_code)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.users as application_user
    join public.user_roles as assigned_role
      on assigned_role.user_id = application_user.id
    join public.roles as role
      on role.id = assigned_role.role_id
    where application_user.id = (select auth.uid())
      and application_user.is_active
      and role.code = required_role
  );
$$;

create function private.has_any_role(required_roles public.role_code[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.users as application_user
    join public.user_roles as assigned_role
      on assigned_role.user_id = application_user.id
    join public.roles as role
      on role.id = assigned_role.role_id
    where application_user.id = (select auth.uid())
      and application_user.is_active
      and role.code = any(required_roles)
  );
$$;

revoke all on function private.set_updated_at() from public;
revoke all on function private.handle_auth_user_change() from public;
revoke all on function private.is_active_user() from public;
revoke all on function private.has_role(public.role_code) from public;
revoke all on function private.has_any_role(public.role_code[]) from public;

grant usage on schema private to authenticated, service_role, supabase_auth_admin;
grant execute on function private.set_updated_at() to service_role;
grant execute on function private.handle_auth_user_change() to supabase_auth_admin;
grant execute on function private.is_active_user() to authenticated;
grant execute on function private.has_role(public.role_code) to authenticated;
grant execute on function private.has_any_role(public.role_code[]) to authenticated;

revoke all on table public.users from anon, authenticated;
revoke all on table public.roles from anon, authenticated;
revoke all on table public.user_roles from anon, authenticated;

grant select on table public.users, public.roles, public.user_roles to authenticated;
grant all privileges on table public.users, public.roles, public.user_roles to service_role;

alter table public.users enable row level security;
alter table public.roles enable row level security;
alter table public.user_roles enable row level security;

create policy "users can read their own profile or staff can read active profiles"
on public.users
for select
to authenticated
using (
  (
    (select auth.uid()) = id
    and is_active
  )
  or (select private.has_any_role(array['ADMIN', 'MANAGER']::public.role_code[]))
);

create policy "active users can read role definitions"
on public.roles
for select
to authenticated
using ((select private.is_active_user()));

create policy "users can read their own roles and admins can read all roles"
on public.user_roles
for select
to authenticated
using (
  (
    user_id = (select auth.uid())
    and (select private.is_active_user())
  )
  or (select private.has_role('ADMIN'::public.role_code))
);

comment on table public.users is
  'Perfil de aplicación sincronizado desde auth.users. El rol nunca se deriva de user_metadata.';
comment on table public.roles is
  'Catálogo cerrado de roles de aplicación.';
comment on table public.user_roles is
  'Asignación de roles. Solo debe modificarse desde operaciones administrativas de confianza.';
