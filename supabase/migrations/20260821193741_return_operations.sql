create table public.equipment_returns (
  id uuid primary key default extensions.gen_random_uuid(),
  equipment_loan_id uuid not null references public.equipment_loans (id) on delete restrict,
  returned_by_name text not null check (char_length(btrim(returned_by_name)) > 0),
  received_by_user_id uuid not null references public.users (id) on delete restrict,
  returned_at timestamptz not null default now()
);

create table public.equipment_return_details (
  id uuid primary key default extensions.gen_random_uuid(),
  equipment_return_id uuid not null references public.equipment_returns (id) on delete restrict,
  equipment_loan_detail_id uuid not null references public.equipment_loan_details (id) on delete restrict,
  returned_quantity numeric(14, 3) not null check (returned_quantity > 0),
  location_id uuid references public.inventory_locations (id) on delete restrict
);

create table public.equipment_return_units (
  id uuid primary key default extensions.gen_random_uuid(),
  equipment_return_id uuid not null references public.equipment_returns (id) on delete restrict,
  equipment_loan_unit_id uuid not null unique references public.equipment_loan_units (id) on delete restrict
);

create index equipment_returns_loan_id_idx on public.equipment_returns (equipment_loan_id, returned_at desc);

create function public.record_equipment_return(
  p_equipment_loan_id uuid,
  p_returned_by_name text,
  p_received_by_user_id uuid,
  p_quantity_details jsonb default '[]'::jsonb,
  p_loan_unit_ids jsonb default '[]'::jsonb
)
returns public.equipment_returns
language plpgsql security invoker set search_path = '' as $$
declare
  loan_record public.equipment_loans;
  returned_record public.equipment_returns;
  quantity_payload jsonb;
  unit_id text;
  loan_detail record;
  return_quantity numeric(14,3);
  already_returned numeric(14,3);
  stock_quantity numeric(14,3);
begin
  if nullif(btrim(p_returned_by_name), '') is null then raise exception 'Debe registrar quién devuelve.'; end if;
  if jsonb_typeof(p_quantity_details) <> 'array' or jsonb_typeof(p_loan_unit_ids) <> 'array' then raise exception 'Los detalles de devolución deben ser listas.'; end if;
  if not private.is_active_request_reviewer(p_received_by_user_id) then raise exception 'Solo el personal autorizado puede recibir devoluciones.'; end if;
  select * into loan_record from public.equipment_loans as loan where loan.id = p_equipment_loan_id for update;
  if not found then raise exception 'El préstamo no existe.'; end if;
  insert into public.equipment_returns (equipment_loan_id, returned_by_name, received_by_user_id)
  values (loan_record.id, nullif(btrim(p_returned_by_name), ''), p_received_by_user_id) returning * into returned_record;

  for quantity_payload in select value from jsonb_array_elements(p_quantity_details)
  loop
    return_quantity := (quantity_payload ->> 'returned_quantity')::numeric;
    select detail.id as loan_detail_id, detail.inventory_item_id, detail.loaned_quantity
    into loan_detail from public.equipment_loan_details as detail
    where detail.id = (quantity_payload ->> 'equipment_loan_detail_id')::uuid and detail.equipment_loan_id = loan_record.id;
    if not found or return_quantity <= 0 then raise exception 'El detalle devuelto debe pertenecer al préstamo.'; end if;
    select coalesce(sum(return_detail.returned_quantity), 0) into already_returned
    from public.equipment_return_details as return_detail join public.equipment_returns as prior_return on prior_return.id = return_detail.equipment_return_id
    where prior_return.equipment_loan_id = loan_record.id and return_detail.equipment_loan_detail_id = loan_detail.loan_detail_id;
    if already_returned + return_quantity > loan_detail.loaned_quantity then raise exception 'No se puede devolver más de lo prestado.'; end if;
    insert into public.inventory_quantity_stock (inventory_item_id, location_id, quantity)
    values (loan_detail.inventory_item_id, (quantity_payload ->> 'location_id')::uuid, 0)
    on conflict (inventory_item_id, location_id) do nothing;
    select quantity into stock_quantity from public.inventory_quantity_stock where inventory_item_id = loan_detail.inventory_item_id and location_id = (quantity_payload ->> 'location_id')::uuid for update;
    update public.inventory_quantity_stock set quantity = stock_quantity + return_quantity, updated_at = now()
    where inventory_item_id = loan_detail.inventory_item_id and location_id = (quantity_payload ->> 'location_id')::uuid;
    insert into public.inventory_movements (inventory_item_id, location_id, movement_type, quantity, balance_after, notes, performed_by_user_id)
    values (loan_detail.inventory_item_id, (quantity_payload ->> 'location_id')::uuid, 'RETURN_IN', return_quantity, stock_quantity + return_quantity, 'Devolución de préstamo', p_received_by_user_id);
    insert into public.equipment_return_details (equipment_return_id, equipment_loan_detail_id, returned_quantity, location_id)
    values (returned_record.id, loan_detail.loan_detail_id, return_quantity, (quantity_payload ->> 'location_id')::uuid);
  end loop;

  for unit_id in select value from jsonb_array_elements_text(p_loan_unit_ids)
  loop
    if not exists (select 1 from public.equipment_loan_units as loan_unit where loan_unit.id = unit_id::uuid and loan_unit.equipment_loan_id = loan_record.id) then raise exception 'La unidad devuelta no pertenece al préstamo.'; end if;
    update public.inventory_units as unit set status = 'AVAILABLE'
    from public.equipment_loan_units as loan_unit join public.equipment_preparation_units as preparation_unit on preparation_unit.id = loan_unit.equipment_preparation_unit_id
    where loan_unit.id = unit_id::uuid and unit.id = preparation_unit.inventory_unit_id and unit.status = 'LOANED';
    if not found then raise exception 'La unidad no está pendiente de devolución.'; end if;
    insert into public.equipment_return_units (equipment_return_id, equipment_loan_unit_id) values (returned_record.id, unit_id::uuid);
  end loop;
  return returned_record;
end;
$$;

revoke all on function public.record_equipment_return(uuid, text, uuid, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.record_equipment_return(uuid, text, uuid, jsonb, jsonb) to service_role;
revoke all on table public.equipment_returns, public.equipment_return_details, public.equipment_return_units from anon, authenticated;
grant select on table public.equipment_returns, public.equipment_return_details, public.equipment_return_units to authenticated;
grant all privileges on table public.equipment_returns, public.equipment_return_details, public.equipment_return_units to service_role;
alter table public.equipment_returns enable row level security;
alter table public.equipment_return_details enable row level security;
alter table public.equipment_return_units enable row level security;
