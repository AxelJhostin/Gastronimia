create table public.equipment_delivery_qr_tokens (
  id uuid primary key default extensions.gen_random_uuid(),
  equipment_request_id uuid not null unique references public.equipment_requests (id) on delete restrict,
  token_hash bytea not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.equipment_loans (
  id uuid primary key default extensions.gen_random_uuid(),
  equipment_request_id uuid not null unique references public.equipment_requests (id) on delete restrict,
  responsible_teacher_id uuid not null references public.teachers (id) on delete restrict,
  collected_by_name text not null check (char_length(btrim(collected_by_name)) > 0),
  delivered_by_user_id uuid not null references public.users (id) on delete restrict,
  delivered_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.equipment_loan_details (
  id uuid primary key default extensions.gen_random_uuid(),
  equipment_loan_id uuid not null references public.equipment_loans (id) on delete restrict,
  equipment_reservation_detail_id uuid not null references public.equipment_reservation_details (id) on delete restrict,
  location_id uuid references public.inventory_locations (id) on delete restrict,
  loaned_quantity numeric(14, 3) not null check (loaned_quantity > 0),
  created_at timestamptz not null default now()
);

create table public.equipment_loan_units (
  id uuid primary key default extensions.gen_random_uuid(),
  equipment_loan_id uuid not null references public.equipment_loans (id) on delete restrict,
  equipment_preparation_unit_id uuid not null unique references public.equipment_preparation_units (id) on delete restrict,
  created_at timestamptz not null default now()
);

create index equipment_loan_details_reservation_detail_idx on public.equipment_loan_details (equipment_reservation_detail_id);
create index equipment_loan_units_loan_id_idx on public.equipment_loan_units (equipment_loan_id);

create function public.generate_equipment_delivery_qr(
  p_equipment_request_id uuid,
  p_generated_by_user_id uuid
)
returns table (token text, expires_at timestamptz)
language plpgsql security invoker set search_path = '' as $$
declare
  request_record public.equipment_requests;
  raw_token text;
  expiry timestamptz := now() + interval '30 minutes';
begin
  if not private.is_active_request_reviewer(p_generated_by_user_id) then raise exception 'Solo el personal autorizado puede generar el QR.'; end if;
  select * into request_record from public.equipment_requests as request where request.id = p_equipment_request_id for update;
  if not found or request_record.status <> 'PREPARED' then raise exception 'Solo una solicitud preparada puede generar un QR de entrega.'; end if;
  delete from public.equipment_delivery_qr_tokens where equipment_request_id = request_record.id and used_at is null;
  raw_token := encode(extensions.gen_random_bytes(32), 'hex');
  insert into public.equipment_delivery_qr_tokens (equipment_request_id, token_hash, expires_at)
  values (request_record.id, extensions.digest(raw_token, 'sha256'), expiry);
  return query select raw_token, expiry;
end;
$$;

create function public.deliver_equipment_request(
  p_qr_token text,
  p_collected_by_name text,
  p_delivered_by_user_id uuid,
  p_quantity_locations jsonb default '[]'::jsonb
)
returns public.equipment_loans
language plpgsql security invoker set search_path = '' as $$
declare
  qr_record public.equipment_delivery_qr_tokens;
  request_record public.equipment_requests;
  loan public.equipment_loans;
  location_payload jsonb;
  reservation_detail record;
  stock_quantity numeric(14, 3);
  location_quantity numeric(14, 3);
  prepared_unit record;
begin
  if nullif(btrim(p_collected_by_name), '') is null then raise exception 'Debe registrar quién retira los recursos.'; end if;
  if jsonb_typeof(p_quantity_locations) <> 'array' then raise exception 'Las ubicaciones de artículos por cantidad deben ser una lista.'; end if;
  if not private.is_active_request_reviewer(p_delivered_by_user_id) then raise exception 'Solo el personal autorizado puede entregar recursos.'; end if;

  select * into qr_record from public.equipment_delivery_qr_tokens as qr
  where qr.token_hash = extensions.digest(p_qr_token, 'sha256') for update;
  if not found or qr_record.used_at is not null or qr_record.expires_at <= now() then raise exception 'El QR no es válido o expiró.'; end if;
  select * into request_record from public.equipment_requests as request where request.id = qr_record.equipment_request_id for update;
  if request_record.status <> 'PREPARED' then raise exception 'Solo una solicitud preparada puede entregarse.'; end if;

  insert into public.equipment_loans (equipment_request_id, responsible_teacher_id, collected_by_name, delivered_by_user_id)
  values (request_record.id, request_record.teacher_id, nullif(btrim(p_collected_by_name), ''), p_delivered_by_user_id)
  returning * into loan;

  for location_payload in select value from jsonb_array_elements(p_quantity_locations)
  loop
    location_quantity := (location_payload ->> 'loaned_quantity')::numeric;
    select rd.id as reservation_detail_id, rd.inventory_item_id, pd.prepared_quantity
    into reservation_detail
    from public.equipment_reservation_details as rd
    join public.equipment_reservations as reservation on reservation.id = rd.equipment_reservation_id
    join public.equipment_preparation_details as pd on pd.equipment_reservation_detail_id = rd.id
    join public.inventory_items as item on item.id = rd.inventory_item_id
    where rd.id = (location_payload ->> 'equipment_reservation_detail_id')::uuid
      and reservation.equipment_request_id = request_record.id and reservation.status = 'ACTIVE'
      and item.tracking_mode = 'QUANTITY';
    if not found or location_quantity <= 0 then raise exception 'Cada salida por ubicación debe corresponder a un artículo QUANTITY preparado.'; end if;
    insert into public.inventory_quantity_stock (inventory_item_id, location_id, quantity)
    values (reservation_detail.inventory_item_id, (location_payload ->> 'location_id')::uuid, 0)
    on conflict (inventory_item_id, location_id) do nothing;
    select quantity into stock_quantity from public.inventory_quantity_stock
    where inventory_item_id = reservation_detail.inventory_item_id and location_id = (location_payload ->> 'location_id')::uuid for update;
    if stock_quantity < location_quantity then raise exception 'La ubicación no tiene stock suficiente para la entrega.'; end if;
    update public.inventory_quantity_stock set quantity = stock_quantity - location_quantity, updated_at = now()
    where inventory_item_id = reservation_detail.inventory_item_id and location_id = (location_payload ->> 'location_id')::uuid;
    insert into public.inventory_movements (inventory_item_id, location_id, movement_type, quantity, balance_after, notes, performed_by_user_id)
    values (reservation_detail.inventory_item_id, (location_payload ->> 'location_id')::uuid, 'LOAN_OUT', location_quantity, stock_quantity - location_quantity, 'Salida por préstamo', p_delivered_by_user_id);
    insert into public.equipment_loan_details (equipment_loan_id, equipment_reservation_detail_id, location_id, loaned_quantity)
    values (loan.id, reservation_detail.reservation_detail_id, (location_payload ->> 'location_id')::uuid, location_quantity);
  end loop;

  if exists (
    select 1 from public.equipment_reservation_details as rd
    join public.inventory_items as item on item.id = rd.inventory_item_id
    join public.equipment_preparation_details as pd on pd.equipment_reservation_detail_id = rd.id
    where rd.equipment_reservation_id = (select id from public.equipment_reservations where equipment_request_id = request_record.id and status = 'ACTIVE')
      and item.tracking_mode = 'QUANTITY'
      and coalesce((select sum(detail.loaned_quantity) from public.equipment_loan_details as detail where detail.equipment_loan_id = loan.id and detail.equipment_reservation_detail_id = rd.id), 0) <> pd.prepared_quantity
  ) then raise exception 'La salida por ubicación debe cubrir exactamente toda la cantidad preparada.'; end if;

  for prepared_unit in
    select pu.id as preparation_unit_id, pu.inventory_unit_id
    from public.equipment_preparation_units as pu
    join public.equipment_preparation_details as pd on pd.id = pu.equipment_preparation_detail_id
    join public.equipment_preparations as preparation on preparation.id = pd.equipment_preparation_id
    where preparation.equipment_request_id = request_record.id and pu.is_active
  loop
    update public.inventory_units set status = 'LOANED' where id = prepared_unit.inventory_unit_id and status = 'AVAILABLE';
    if not found then raise exception 'La unidad preparada ya no está disponible para entregar.'; end if;
    insert into public.equipment_loan_units (equipment_loan_id, equipment_preparation_unit_id)
    values (loan.id, prepared_unit.preparation_unit_id);
  end loop;

  update public.equipment_reservations set status = 'CONSUMED', consumed_at = now()
  where equipment_request_id = request_record.id and status = 'ACTIVE';
  update public.equipment_delivery_qr_tokens set used_at = now() where id = qr_record.id;
  update public.equipment_requests set status = 'DELIVERED' where id = request_record.id;
  return loan;
end;
$$;

revoke all on function public.generate_equipment_delivery_qr(uuid, uuid) from public, anon, authenticated;
grant execute on function public.generate_equipment_delivery_qr(uuid, uuid) to service_role;
revoke all on function public.deliver_equipment_request(text, text, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.deliver_equipment_request(text, text, uuid, jsonb) to service_role;

revoke all on table public.equipment_delivery_qr_tokens, public.equipment_loans, public.equipment_loan_details, public.equipment_loan_units from anon, authenticated;
grant select on table public.equipment_loans, public.equipment_loan_details, public.equipment_loan_units to authenticated;
grant all privileges on table public.equipment_delivery_qr_tokens, public.equipment_loans, public.equipment_loan_details, public.equipment_loan_units to service_role;
alter table public.equipment_delivery_qr_tokens enable row level security;
alter table public.equipment_loans enable row level security;
alter table public.equipment_loan_details enable row level security;
alter table public.equipment_loan_units enable row level security;

create policy "request owners and staff can read loans" on public.equipment_loans for select to authenticated using (
  exists (select 1 from public.equipment_requests as request where request.id = equipment_loans.equipment_request_id
    and (request.teacher_id = (select private.current_teacher_id()) or (select private.has_any_role(array['ADMIN', 'MANAGER']::public.role_code[]))))
);
create policy "request owners and staff can read loan details" on public.equipment_loan_details for select to authenticated using (
  exists (select 1 from public.equipment_loans as loan join public.equipment_requests as request on request.id = loan.equipment_request_id where loan.id = equipment_loan_details.equipment_loan_id
    and (request.teacher_id = (select private.current_teacher_id()) or (select private.has_any_role(array['ADMIN', 'MANAGER']::public.role_code[]))))
);
create policy "request owners and staff can read loan units" on public.equipment_loan_units for select to authenticated using (
  exists (select 1 from public.equipment_loans as loan join public.equipment_requests as request on request.id = loan.equipment_request_id where loan.id = equipment_loan_units.equipment_loan_id
    and (request.teacher_id = (select private.current_teacher_id()) or (select private.has_any_role(array['ADMIN', 'MANAGER']::public.role_code[]))))
);
