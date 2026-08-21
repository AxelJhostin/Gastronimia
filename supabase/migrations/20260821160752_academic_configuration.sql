create table public.teachers (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null unique references public.users (id) on delete restrict,
  employee_code text unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.academic_periods (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null unique check (char_length(btrim(name)) > 0),
  start_date date not null,
  end_date date not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create table public.subjects (
  id uuid primary key default extensions.gen_random_uuid(),
  code text unique,
  name text not null unique check (char_length(btrim(name)) > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.course_sections (
  id uuid primary key default extensions.gen_random_uuid(),
  subject_id uuid not null references public.subjects (id) on delete restrict,
  teacher_id uuid not null references public.teachers (id) on delete restrict,
  academic_period_id uuid not null references public.academic_periods (id) on delete restrict,
  section text not null check (char_length(btrim(section)) > 0),
  semester text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (subject_id, teacher_id, academic_period_id, section)
);

create table public.laboratories (
  id uuid primary key default extensions.gen_random_uuid(),
  code text unique,
  name text not null unique check (char_length(btrim(name)) > 0),
  location_description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index course_sections_subject_teacher_period_idx
on public.course_sections (subject_id, teacher_id, academic_period_id);

create trigger teachers_set_updated_at
before update on public.teachers
for each row execute function private.set_updated_at();

create trigger subjects_set_updated_at
before update on public.subjects
for each row execute function private.set_updated_at();

create trigger course_sections_set_updated_at
before update on public.course_sections
for each row execute function private.set_updated_at();

create function private.current_teacher_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select teacher.id
  from public.teachers as teacher
  join public.users as application_user
    on application_user.id = teacher.user_id
  where teacher.user_id = (select auth.uid())
    and teacher.is_active
    and application_user.is_active;
$$;

revoke all on function private.current_teacher_id() from public;
grant execute on function private.current_teacher_id() to authenticated;

revoke all on table public.teachers from anon, authenticated;
revoke all on table public.academic_periods from anon, authenticated;
revoke all on table public.subjects from anon, authenticated;
revoke all on table public.course_sections from anon, authenticated;
revoke all on table public.laboratories from anon, authenticated;

grant select on table public.teachers,
  public.academic_periods,
  public.subjects,
  public.course_sections,
  public.laboratories to authenticated;
grant all privileges on table public.teachers,
  public.academic_periods,
  public.subjects,
  public.course_sections,
  public.laboratories to service_role;

alter table public.teachers enable row level security;
alter table public.academic_periods enable row level security;
alter table public.subjects enable row level security;
alter table public.course_sections enable row level security;
alter table public.laboratories enable row level security;

create policy "teachers can read their own record and staff can read all teachers"
on public.teachers
for select
to authenticated
using (
  user_id = (select auth.uid())
  or (select private.has_any_role(array['ADMIN', 'MANAGER']::public.role_code[]))
);

create policy "active users can read active academic periods and staff can read all"
on public.academic_periods
for select
to authenticated
using (
  (is_active and (select private.is_active_user()))
  or (select private.has_any_role(array['ADMIN', 'MANAGER']::public.role_code[]))
);

create policy "active users can read active subjects and staff can read all"
on public.subjects
for select
to authenticated
using (
  (is_active and (select private.is_active_user()))
  or (select private.has_any_role(array['ADMIN', 'MANAGER']::public.role_code[]))
);

create policy "teachers can read their course sections and staff can read all"
on public.course_sections
for select
to authenticated
using (
  teacher_id = (select private.current_teacher_id())
  or (select private.has_any_role(array['ADMIN', 'MANAGER']::public.role_code[]))
);

create policy "active users can read active laboratories and staff can read all"
on public.laboratories
for select
to authenticated
using (
  (is_active and (select private.is_active_user()))
  or (select private.has_any_role(array['ADMIN', 'MANAGER']::public.role_code[]))
);

comment on table public.teachers is
  'Perfil académico de una persona con rol TEACHER; está separado del usuario Auth.';
comment on table public.course_sections is
  'Asignatura y paralelo impartidos por un docente en un periodo académico.';
