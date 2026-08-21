create table public.equipment_preparations (
  id uuid primary key default extensions.gen_random_uuid(),
  equipment_request_id uuid not null unique references public.equipment_requests (id) on delete restrict,
  started_by_user_id uuid not null references public.users (id) on delete restrict,
  started_at timestamptz not null default now(),
  completed_by_user_id uuid references public.users (id) on delete restrict,
  completed_at timestamptz,
  check ((completed_by_user_id is null) = (completed_at is null))
);

create table public.equipment_preparation_details (
  id uuid primary key default extensions.gen_random_uuid(),
  equipment_preparation_id uuid not null references public.equipment_preparations (id) on delete restrict,
  equipment_reservation_detail_id uuid not null unique references public.equipment_reservation_details (id) on delete restrict,
  prepared_quantity numeric(14, 3) not null default 0 check (prepared_quantity >= 0),
  updated_at timestamptz not null default now()
);

create table public.equipment_preparation_units (
  id uuid primary key default extensions.gen_random_uuid(),
  equipment_preparation_detail_id uuid not null references public.equipment_preparation_details (id) on delete restrict,
  inventory_unit_id uuid not null references public.inventory_units (id) on delete restrict,
  is_active boolean not null default true,
  selected_at timestamptz not null default now(),
  unique (equipment_preparation_detail_id, inventory_unit_id)
);

create index equipment_preparation_units_active_unit_idx
on public.equipment_preparation_units (inventory_unit_id)
where is_active;

create trigger equipment_preparation_details_set_updated_at
before update on public.equipment_preparation_details
for each row execute function private.set_updated_at();

create function public.start_equipment_preparation(
  p_equipment_request_id uuid,
  p_started_by_user_id uuid
)
returns public.equipment_preparations
language plpgsql security invoker set search_path = '' as $$
declare
  request_record public.equipment_requests;
  preparation public.equipment_preparations;
begin
  if not private.is_active_request_reviewer(p_started_by_user_id) then
    raise exception 'Solo un administrador o encargado activo puede iniciar la preparación.';
  end if;
  select * into request_record from public.equipment_requests as request
  where request.id = p_equipment_request_id for update;
  if not found or request_record.status not in ('APPROVED', 'PARTIALLY_APPROVED') then
    raise exception 'Solo se puede preparar una solicitud aprobada.';
  end if;
  if not exists (
    select 1 from public.equipment_reservations as reservation
    where reservation.equipment_request_id = request_record.id and reservation.status = 'ACTIVE'
  ) then
    raise exception 'La solicitud aprobada debe tener una reserva activa.';
  end if;
  insert into public.equipment_preparations (equipment_request_id, started_by_user_id)
  values (request_record.id, p_started_by_user_id) returning * into preparation;
  update public.equipment_requests set status = 'PREPARING' where id = request_record.id;
  return preparation;
end;
$$;

create function public.record_equipment_preparation(
  p_equipment_request_id uuid,
  p_prepared_by_user_id uuid,
  p_items jsonb
)
returns public.equipment_preparations
language plpgsql security invoker set search_path = '' as $$
declare
  request_record public.equipment_requests;
  preparation public.equipment_preparations;
  item_payload jsonb;
  unit_payload text;
  reservation_detail record;
  preparation_detail_id uuid;
  requested_preparation numeric(14, 3);
  cumulative_preparation numeric(14, 3);
  unit_count integer;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'La preparación debe incluir al menos un artículo.';
  end if;
  if not private.is_active_request_reviewer(p_prepared_by_user_id) then
    raise exception 'Solo un administrador o encargado activo puede preparar recursos.';
  end if;
  select * into request_record from public.equipment_requests as request
  where request.id = p_equipment_request_id for update;
  if not found or request_record.status <> 'PREPARING' then
    raise exception 'La solicitud debe estar en preparación.';
  end if;
  select * into preparation from public.equipment_preparations as current_preparation
  where current_preparation.equipment_request_id = request_record.id and current_preparation.completed_at is null
  for update;
  if not found then raise exception 'No existe una preparación activa para la solicitud.'; end if;

  for item_payload in select value from jsonb_array_elements(p_items)
  loop
    requested_preparation := (item_payload ->> 'prepared_quantity')::numeric;
    select
      reservation_detail.id as reservation_detail_id,
      reservation_detail.reserved_quantity,
      reservation_detail.inventory_item_id,
      inventory_item.tracking_mode
    into reservation_detail
    from public.equipment_reservation_details as reservation_detail
    join public.equipment_reservations as reservation on reservation.id = reservation_detail.equipment_reservation_id
    join public.inventory_items as inventory_item on inventory_item.id = reservation_detail.inventory_item_id
    where reservation_detail.id = (item_payload ->> 'equipment_reservation_detail_id')::uuid
      and reservation.equipment_request_id = request_record.id
      and reservation.status = 'ACTIVE';
    if not found then raise exception 'El detalle preparado debe pertenecer a una reserva activa de la solicitud.'; end if;
    if requested_preparation <= 0 then raise exception 'La cantidad preparada debe ser mayor que cero.'; end if;
    if reservation_detail.tracking_mode = 'INDIVIDUAL' and requested_preparation <> trunc(requested_preparation) then
      raise exception 'La cantidad preparada de un artículo individual debe ser entera.';
    end if;

    insert into public.equipment_preparation_details (equipment_preparation_id, equipment_reservation_detail_id)
    values (preparation.id, reservation_detail.reservation_detail_id)
    on conflict (equipment_reservation_detail_id) do update set updated_at = now()
    returning id, prepared_quantity into preparation_detail_id, cumulative_preparation;
    if cumulative_preparation + requested_preparation > reservation_detail.reserved_quantity then
      raise exception 'No se puede preparar más de la cantidad reservada.';
    end if;

    if reservation_detail.tracking_mode = 'INDIVIDUAL' then
      if jsonb_typeof(coalesce(item_payload -> 'inventory_unit_ids', 'null'::jsonb)) <> 'array' then
        raise exception 'La preparación de unidades individuales requiere identificadores de unidad.';
      end if;
      select count(*) into unit_count from jsonb_array_elements_text(item_payload -> 'inventory_unit_ids');
      if unit_count <> requested_preparation then
        raise exception 'La cantidad de unidades seleccionadas debe coincidir con la cantidad preparada.';
      end if;
      for unit_payload in
        select value from jsonb_array_elements_text(item_payload -> 'inventory_unit_ids') order by value
      loop
        perform pg_advisory_xact_lock(hashtextextended(unit_payload, 0));
        if not exists (
          select 1 from public.inventory_units as unit
          where unit.id = unit_payload::uuid
            and unit.inventory_item_id = reservation_detail.inventory_item_id
            and unit.is_active and unit.status = 'AVAILABLE'
        ) then raise exception 'La unidad seleccionada no está disponible para el artículo reservado.'; end if;
        if exists (
          select 1 from public.equipment_preparation_units as selected_unit
          join public.equipment_preparation_details as selected_detail on selected_detail.id = selected_unit.equipment_preparation_detail_id
          join public.equipment_preparations as selected_preparation on selected_preparation.id = selected_detail.equipment_preparation_id
          join public.equipment_requests as selected_request on selected_request.id = selected_preparation.equipment_request_id
          where selected_unit.inventory_unit_id = unit_payload::uuid and selected_unit.is_active
            and selected_request.start_at < request_record.end_at and selected_request.end_at > request_record.start_at
        ) then raise exception 'La unidad ya fue seleccionada para una preparación que se superpone.'; end if;
        insert into public.equipment_preparation_units (equipment_preparation_detail_id, inventory_unit_id)
        values (preparation_detail_id, unit_payload::uuid);
      end loop;
    elsif item_payload ? 'inventory_unit_ids' then
      raise exception 'Los artículos por cantidad no aceptan unidades físicas seleccionadas.';
    end if;

    update public.equipment_preparation_details
    set prepared_quantity = cumulative_preparation + requested_preparation
    where id = preparation_detail_id;
  end loop;
  return preparation;
end;
$$;

create function public.complete_equipment_preparation(
  p_equipment_request_id uuid,
  p_completed_by_user_id uuid
)
returns public.equipment_preparations
language plpgsql security invoker set search_path = '' as $$
declare
  request_record public.equipment_requests;
  preparation public.equipment_preparations;
begin
  if not private.is_active_request_reviewer(p_completed_by_user_id) then
    raise exception 'Solo un administrador o encargado activo puede finalizar la preparación.';
  end if;
  select * into request_record from public.equipment_requests as request
  where request.id = p_equipment_request_id for update;
  if not found or request_record.status <> 'PREPARING' then raise exception 'La solicitud debe estar en preparación.'; end if;
  select * into preparation from public.equipment_preparations as current_preparation
  where current_preparation.equipment_request_id = request_record.id and current_preparation.completed_at is null for update;
  if not found then raise exception 'No existe una preparación activa para la solicitud.'; end if;
  if exists (
    select 1 from public.equipment_reservation_details as reservation_detail
    left join public.equipment_preparation_details as preparation_detail
      on preparation_detail.equipment_reservation_detail_id = reservation_detail.id
    where reservation_detail.equipment_reservation_id = (
      select reservation.id from public.equipment_reservations as reservation
      where reservation.equipment_request_id = request_record.id and reservation.status = 'ACTIVE'
    )
      and coalesce(preparation_detail.prepared_quantity, 0) <> reservation_detail.reserved_quantity
  ) then raise exception 'No se puede finalizar una preparación incompleta.'; end if;
  if exists (
    select 1 from public.equipment_preparation_details as preparation_detail
    join public.equipment_reservation_details as reservation_detail on reservation_detail.id = preparation_detail.equipment_reservation_detail_id
    join public.inventory_items as item on item.id = reservation_detail.inventory_item_id
    where preparation_detail.equipment_preparation_id = preparation.id and item.tracking_mode = 'INDIVIDUAL'
      and (select count(*) from public.equipment_preparation_units as unit where unit.equipment_preparation_detail_id = preparation_detail.id and unit.is_active) <> preparation_detail.prepared_quantity
  ) then raise exception 'Cada unidad individual preparada debe estar seleccionada.'; end if;
  update public.equipment_preparations
  set completed_by_user_id = p_completed_by_user_id, completed_at = now()
  where id = preparation.id returning * into preparation;
  update public.equipment_requests set status = 'PREPARED' where id = request_record.id;
  return preparation;
end;
$$;

revoke all on function public.start_equipment_preparation(uuid, uuid) from public, anon, authenticated;
grant execute on function public.start_equipment_preparation(uuid, uuid) to service_role;
revoke all on function public.record_equipment_preparation(uuid, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.record_equipment_preparation(uuid, uuid, jsonb) to service_role;
revoke all on function public.complete_equipment_preparation(uuid, uuid) from public, anon, authenticated;
grant execute on function public.complete_equipment_preparation(uuid, uuid) to service_role;

revoke all on table public.equipment_preparations, public.equipment_preparation_details, public.equipment_preparation_units from anon, authenticated;
grant select on table public.equipment_preparations, public.equipment_preparation_details, public.equipment_preparation_units to authenticated;
grant all privileges on table public.equipment_preparations, public.equipment_preparation_details, public.equipment_preparation_units to service_role;
alter table public.equipment_preparations enable row level security;
alter table public.equipment_preparation_details enable row level security;
alter table public.equipment_preparation_units enable row level security;

create policy "request owners and staff can read preparations" on public.equipment_preparations
for select to authenticated using (
  exists (select 1 from public.equipment_requests as request where request.id = equipment_preparations.equipment_request_id
    and (request.teacher_id = (select private.current_teacher_id()) or (select private.has_any_role(array['ADMIN', 'MANAGER']::public.role_code[]))))
);
create policy "request owners and staff can read preparation details" on public.equipment_preparation_details
for select to authenticated using (
  exists (select 1 from public.equipment_preparations as preparation join public.equipment_requests as request on request.id = preparation.equipment_request_id
    where preparation.id = equipment_preparation_details.equipment_preparation_id
      and (request.teacher_id = (select private.current_teacher_id()) or (select private.has_any_role(array['ADMIN', 'MANAGER']::public.role_code[]))))
);
create policy "request owners and staff can read preparation units" on public.equipment_preparation_units
for select to authenticated using (
  exists (select 1 from public.equipment_preparation_details as detail join public.equipment_preparations as preparation on preparation.id = detail.equipment_preparation_id join public.equipment_requests as request on request.id = preparation.equipment_request_id
    where detail.id = equipment_preparation_units.equipment_preparation_detail_id
      and (request.teacher_id = (select private.current_teacher_id()) or (select private.has_any_role(array['ADMIN', 'MANAGER']::public.role_code[]))))
);
