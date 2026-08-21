create type public.equipment_request_status as enum (
  'DRAFT',
  'PENDING'
);

create table public.equipment_requests (
  id uuid primary key default extensions.gen_random_uuid(),
  teacher_id uuid not null references public.teachers (id) on delete restrict,
  course_section_id uuid not null references public.course_sections (id) on delete restrict,
  laboratory_id uuid not null references public.laboratories (id) on delete restrict,
  start_at timestamptz not null,
  end_at timestamptz not null,
  purpose text,
  status public.equipment_request_status not null default 'DRAFT',
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_at > start_at),
  check ((status = 'PENDING') = (submitted_at is not null))
);

create table public.equipment_request_items (
  id uuid primary key default extensions.gen_random_uuid(),
  equipment_request_id uuid not null references public.equipment_requests (id) on delete cascade,
  inventory_item_id uuid not null references public.inventory_items (id) on delete restrict,
  requested_quantity numeric(14, 3) not null check (requested_quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (equipment_request_id, inventory_item_id)
);

create index equipment_requests_teacher_status_start_idx
on public.equipment_requests (teacher_id, status, start_at desc);

create index equipment_requests_course_section_id_idx
on public.equipment_requests (course_section_id);

create index equipment_requests_laboratory_id_idx
on public.equipment_requests (laboratory_id);

create index equipment_request_items_inventory_item_id_idx
on public.equipment_request_items (inventory_item_id);

create trigger equipment_requests_set_updated_at
before update on public.equipment_requests
for each row execute function private.set_updated_at();

create trigger equipment_request_items_set_updated_at
before update on public.equipment_request_items
for each row execute function private.set_updated_at();

create function private.validate_equipment_request_context()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.teachers as teacher
    join public.users as application_user on application_user.id = teacher.user_id
    where teacher.id = new.teacher_id
      and teacher.is_active
      and application_user.is_active
  ) then
    raise exception 'El docente debe existir y estar activo.';
  end if;

  if not exists (
    select 1
    from public.course_sections as course_section
    join public.academic_periods as academic_period
      on academic_period.id = course_section.academic_period_id
    where course_section.id = new.course_section_id
      and course_section.teacher_id = new.teacher_id
      and course_section.is_active
      and academic_period.is_active
  ) then
    raise exception 'El curso debe estar activo y pertenecer al docente en un periodo activo.';
  end if;

  if not exists (
    select 1
    from public.laboratories as laboratory
    where laboratory.id = new.laboratory_id
      and laboratory.is_active
  ) then
    raise exception 'El laboratorio debe existir y estar activo.';
  end if;

  return new;
end;
$$;

create function private.validate_equipment_request_item()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  item_tracking_mode public.inventory_tracking_mode;
begin
  select item.tracking_mode
  into item_tracking_mode
  from public.inventory_items as item
  where item.id = new.inventory_item_id
    and item.is_active;

  if not found then
    raise exception 'El artículo solicitado debe existir y estar activo.';
  end if;

  if item_tracking_mode = 'INDIVIDUAL'
    and new.requested_quantity <> trunc(new.requested_quantity) then
    raise exception 'La cantidad de un artículo individual debe ser un número entero.';
  end if;

  return new;
end;
$$;

create trigger equipment_requests_validate_context
before insert or update of teacher_id, course_section_id, laboratory_id
on public.equipment_requests
for each row execute function private.validate_equipment_request_context();

create trigger equipment_request_items_validate_item
before insert or update of inventory_item_id, requested_quantity
on public.equipment_request_items
for each row execute function private.validate_equipment_request_item();

create function public.create_equipment_request_draft(
  p_teacher_user_id uuid,
  p_course_section_id uuid,
  p_laboratory_id uuid,
  p_start_at timestamptz,
  p_end_at timestamptz,
  p_purpose text default null,
  p_items jsonb default '[]'::jsonb
)
returns public.equipment_requests
language plpgsql
security invoker
set search_path = ''
as $$
declare
  request_teacher_id uuid;
  created_request public.equipment_requests;
  request_item jsonb;
begin
  if p_start_at is null or p_end_at is null or p_end_at <= p_start_at then
    raise exception 'El intervalo de la solicitud debe tener una fecha de fin posterior a la de inicio.';
  end if;

  if jsonb_typeof(p_items) <> 'array' then
    raise exception 'Los artículos de la solicitud deben ser una lista.';
  end if;

  select teacher.id
  into request_teacher_id
  from public.teachers as teacher
  join public.users as application_user on application_user.id = teacher.user_id
  where teacher.user_id = p_teacher_user_id
    and teacher.is_active
    and application_user.is_active;

  if not found then
    raise exception 'El usuario debe tener un perfil docente activo para crear solicitudes.';
  end if;

  insert into public.equipment_requests (
    teacher_id,
    course_section_id,
    laboratory_id,
    start_at,
    end_at,
    purpose
  )
  values (
    request_teacher_id,
    p_course_section_id,
    p_laboratory_id,
    p_start_at,
    p_end_at,
    nullif(btrim(p_purpose), '')
  )
  returning * into created_request;

  for request_item in select value from jsonb_array_elements(p_items)
  loop
    insert into public.equipment_request_items (
      equipment_request_id,
      inventory_item_id,
      requested_quantity
    )
    values (
      created_request.id,
      (request_item ->> 'inventory_item_id')::uuid,
      (request_item ->> 'requested_quantity')::numeric
    );
  end loop;

  return created_request;
end;
$$;

create function public.submit_equipment_request(
  p_equipment_request_id uuid,
  p_teacher_user_id uuid
)
returns public.equipment_requests
language plpgsql
security invoker
set search_path = ''
as $$
declare
  submitted_request public.equipment_requests;
begin
  if not exists (
    select 1
    from public.equipment_request_items as request_item
    where request_item.equipment_request_id = p_equipment_request_id
  ) then
    raise exception 'La solicitud debe incluir al menos un artículo antes de enviarse.';
  end if;

  update public.equipment_requests as request
  set
    status = 'PENDING',
    submitted_at = now()
  from public.teachers as teacher
  where request.id = p_equipment_request_id
    and request.teacher_id = teacher.id
    and teacher.user_id = p_teacher_user_id
    and teacher.is_active
    and request.status = 'DRAFT'
  returning request.* into submitted_request;

  if not found then
    raise exception 'Solo el docente propietario puede enviar un borrador activo.';
  end if;

  return submitted_request;
end;
$$;

revoke all on function public.create_equipment_request_draft(uuid, uuid, uuid, timestamptz, timestamptz, text, jsonb) from public, anon, authenticated;
grant execute on function public.create_equipment_request_draft(uuid, uuid, uuid, timestamptz, timestamptz, text, jsonb) to service_role;

revoke all on function public.submit_equipment_request(uuid, uuid) from public, anon, authenticated;
grant execute on function public.submit_equipment_request(uuid, uuid) to service_role;

revoke all on table public.equipment_requests, public.equipment_request_items from anon, authenticated;
grant select on table public.equipment_requests, public.equipment_request_items to authenticated;
grant all privileges on table public.equipment_requests, public.equipment_request_items to service_role;

alter table public.equipment_requests enable row level security;
alter table public.equipment_request_items enable row level security;

create policy "teachers can read their requests and staff can read all requests"
on public.equipment_requests
for select
to authenticated
using (
  teacher_id = (select private.current_teacher_id())
  or (select private.has_any_role(array['ADMIN', 'MANAGER']::public.role_code[]))
);

create policy "teachers can read items from their requests and staff can read all request items"
on public.equipment_request_items
for select
to authenticated
using (
  exists (
    select 1
    from public.equipment_requests as request
    where request.id = equipment_request_items.equipment_request_id
      and (
        request.teacher_id = (select private.current_teacher_id())
        or (select private.has_any_role(array['ADMIN', 'MANAGER']::public.role_code[]))
      )
  )
);

comment on table public.equipment_requests is
  'Solicitud de recursos asociada a docente, curso, laboratorio e intervalo. En esta fase solo admite DRAFT y PENDING.';
comment on table public.equipment_request_items is
  'Detalle de artículos y cantidades solicitadas. La asignación concreta se realiza al aprobar y preparar.';
