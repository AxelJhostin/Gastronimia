create type public.equipment_reservation_status as enum (
  'ACTIVE',
  'RELEASED',
  'CONSUMED'
);

create table public.equipment_reservations (
  id uuid primary key default extensions.gen_random_uuid(),
  equipment_request_id uuid not null unique references public.equipment_requests (id) on delete restrict,
  status public.equipment_reservation_status not null default 'ACTIVE',
  reserved_at timestamptz not null default now(),
  released_at timestamptz,
  consumed_at timestamptz,
  check (num_nonnulls(released_at, consumed_at) <= 1)
);

create table public.equipment_reservation_details (
  id uuid primary key default extensions.gen_random_uuid(),
  equipment_reservation_id uuid not null references public.equipment_reservations (id) on delete restrict,
  equipment_request_item_review_id uuid not null unique references public.equipment_request_item_reviews (id) on delete restrict,
  inventory_item_id uuid not null references public.inventory_items (id) on delete restrict,
  reserved_quantity numeric(14, 3) not null check (reserved_quantity > 0),
  created_at timestamptz not null default now(),
  unique (equipment_reservation_id, inventory_item_id)
);

create index equipment_reservation_details_item_id_idx
on public.equipment_reservation_details (inventory_item_id);

create index equipment_reservations_active_request_idx
on public.equipment_reservations (equipment_request_id)
where status = 'ACTIVE';

create or replace function public.calculate_inventory_availability(
  p_inventory_item_id uuid,
  p_start_at timestamptz,
  p_end_at timestamptz
)
returns table (
  tracking_mode public.inventory_tracking_mode,
  quantity_available numeric(14, 3),
  units_available integer
)
language plpgsql security invoker set search_path = '' as $$
declare
  item_tracking_mode public.inventory_tracking_mode;
  base_quantity numeric(14, 3);
  base_units integer;
  reserved_quantity numeric(14, 3);
begin
  if p_start_at is null or p_end_at is null or p_end_at <= p_start_at then
    raise exception 'El intervalo de disponibilidad debe tener una fecha de fin posterior a la de inicio.';
  end if;
  select item.tracking_mode into item_tracking_mode
  from public.inventory_items as item
  where item.id = p_inventory_item_id and item.is_active;
  if not found then raise exception 'El artículo debe existir y estar activo.'; end if;

  select coalesce(sum(detail.reserved_quantity), 0) into reserved_quantity
  from public.equipment_reservation_details as detail
  join public.equipment_reservations as reservation on reservation.id = detail.equipment_reservation_id
  join public.equipment_requests as request on request.id = reservation.equipment_request_id
  where detail.inventory_item_id = p_inventory_item_id
    and reservation.status = 'ACTIVE'
    and request.start_at < p_end_at
    and request.end_at > p_start_at;

  if item_tracking_mode = 'QUANTITY' then
    select coalesce(sum(stock.quantity), 0) into base_quantity
    from public.inventory_quantity_stock as stock where stock.inventory_item_id = p_inventory_item_id;
    return query select item_tracking_mode, greatest(base_quantity - reserved_quantity, 0)::numeric(14, 3), 0;
  else
    select count(*)::integer into base_units
    from public.inventory_units as unit
    where unit.inventory_item_id = p_inventory_item_id and unit.is_active and unit.status = 'AVAILABLE';
    return query select item_tracking_mode, 0::numeric(14, 3), greatest(base_units - reserved_quantity::integer, 0);
  end if;
end;
$$;

create function private.create_request_reservation()
returns trigger
language plpgsql security invoker set search_path = '' as $$
declare
  reservation_id uuid;
  reviewed_item record;
  available_quantity numeric(14, 3);
  available_units integer;
  already_reserved numeric(14, 3);
begin
  if old.status <> 'PENDING' or new.status not in ('APPROVED', 'PARTIALLY_APPROVED') then
    return new;
  end if;

  insert into public.equipment_reservations (equipment_request_id)
  values (new.id) returning id into reservation_id;

  for reviewed_item in
    select
      item_review.id as item_review_id,
      request_item.inventory_item_id,
      item_review.approved_quantity,
      inventory_item.tracking_mode
    from public.equipment_request_item_reviews as item_review
    join public.equipment_request_items as request_item on request_item.id = item_review.equipment_request_item_id
    join public.inventory_items as inventory_item on inventory_item.id = request_item.inventory_item_id
    where request_item.equipment_request_id = new.id
      and item_review.approved_quantity > 0
    order by request_item.inventory_item_id
  loop
    perform pg_advisory_xact_lock(hashtextextended(reviewed_item.inventory_item_id::text, 0));

    select availability.quantity_available, availability.units_available
    into available_quantity, available_units
    from public.calculate_inventory_availability(
      reviewed_item.inventory_item_id,
      new.start_at,
      new.end_at
    ) as availability;

    if reviewed_item.tracking_mode = 'QUANTITY'
      and reviewed_item.approved_quantity > available_quantity then
      raise exception 'La aprobación supera la disponibilidad al crear la reserva.';
    end if;
    if reviewed_item.tracking_mode = 'INDIVIDUAL'
      and reviewed_item.approved_quantity > available_units then
      raise exception 'La aprobación supera las unidades disponibles al crear la reserva.';
    end if;

    insert into public.equipment_reservation_details (
      equipment_reservation_id,
      equipment_request_item_review_id,
      inventory_item_id,
      reserved_quantity
    ) values (
      reservation_id,
      reviewed_item.item_review_id,
      reviewed_item.inventory_item_id,
      reviewed_item.approved_quantity
    );
  end loop;

  if not exists (
    select 1 from public.equipment_reservation_details
    where equipment_reservation_id = reservation_id
  ) then
    raise exception 'Una solicitud aprobada debe reservar al menos un artículo.';
  end if;
  return new;
end;
$$;

create trigger equipment_requests_create_reservation
after update of status on public.equipment_requests
for each row execute function private.create_request_reservation();

revoke all on function private.create_request_reservation() from public;
grant execute on function private.create_request_reservation() to service_role;
revoke all on function public.calculate_inventory_availability(uuid, timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.calculate_inventory_availability(uuid, timestamptz, timestamptz) to service_role;

revoke all on table public.equipment_reservations, public.equipment_reservation_details from anon, authenticated;
grant select on table public.equipment_reservations, public.equipment_reservation_details to authenticated;
grant all privileges on table public.equipment_reservations, public.equipment_reservation_details to service_role;
alter table public.equipment_reservations enable row level security;
alter table public.equipment_reservation_details enable row level security;

create policy "request owners and staff can read reservations"
on public.equipment_reservations for select to authenticated using (
  exists (select 1 from public.equipment_requests as request
    where request.id = equipment_reservations.equipment_request_id
      and (request.teacher_id = (select private.current_teacher_id())
        or (select private.has_any_role(array['ADMIN', 'MANAGER']::public.role_code[]))))
);
create policy "request owners and staff can read reservation details"
on public.equipment_reservation_details for select to authenticated using (
  exists (select 1 from public.equipment_reservations as reservation
    join public.equipment_requests as request on request.id = reservation.equipment_request_id
    where reservation.id = equipment_reservation_details.equipment_reservation_id
      and (request.teacher_id = (select private.current_teacher_id())
        or (select private.has_any_role(array['ADMIN', 'MANAGER']::public.role_code[]))))
);

comment on table public.equipment_reservations is 'Compromiso transaccional de recursos para solicitudes aprobadas.';
comment on table public.equipment_reservation_details is 'Cantidad comprometida por artículo e ítem revisado.';
