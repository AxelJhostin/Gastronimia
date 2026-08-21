alter type public.equipment_request_status add value if not exists 'CLOSED';

create type public.equipment_loan_status as enum (
  'ACTIVE',
  'PARTIALLY_RETURNED',
  'CLOSED'
);

alter table public.equipment_loans
  add column status public.equipment_loan_status not null default 'ACTIVE',
  add column closed_at timestamptz,
  add constraint equipment_loans_closed_at_matches_status check (
    (status = 'CLOSED') = (closed_at is not null)
  );

create index equipment_loans_active_delivered_idx
on public.equipment_loans (delivered_at asc)
where status in ('ACTIVE', 'PARTIALLY_RETURNED');

create or replace function public.record_equipment_return(
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
  payload jsonb;
  unit_id text;
  detail_record record;
  amount numeric(14, 3);
  already_returned numeric(14, 3);
  stock numeric(14, 3);
  all_quantity_returned boolean;
  all_units_returned boolean;
begin
  if nullif(btrim(p_returned_by_name), '') is null
    or jsonb_typeof(p_quantity_details) <> 'array'
    or jsonb_typeof(p_loan_unit_ids) <> 'array'
    or (jsonb_array_length(p_quantity_details) = 0 and jsonb_array_length(p_loan_unit_ids) = 0) then
    raise exception 'La devolución debe incluir al menos una cantidad o una unidad.';
  end if;
  if not private.is_active_request_reviewer(p_received_by_user_id) then
    raise exception 'Solo el personal autorizado puede recibir devoluciones.';
  end if;

  select * into loan_record
  from public.equipment_loans as loan
  where loan.id = p_equipment_loan_id
  for update;
  if not found or loan_record.status = 'CLOSED' then
    raise exception 'El préstamo no existe o ya fue cerrado.';
  end if;

  insert into public.equipment_returns (equipment_loan_id, returned_by_name, received_by_user_id)
  values (loan_record.id, nullif(btrim(p_returned_by_name), ''), p_received_by_user_id)
  returning * into returned_record;

  for payload in select value from jsonb_array_elements(p_quantity_details)
  loop
    amount := (payload ->> 'returned_quantity')::numeric;
    select ld.id as loan_detail_id, rd.inventory_item_id, ld.loaned_quantity
    into detail_record
    from public.equipment_loan_details as ld
    join public.equipment_reservation_details as rd on rd.id = ld.equipment_reservation_detail_id
    where ld.id = (payload ->> 'equipment_loan_detail_id')::uuid
      and ld.equipment_loan_id = loan_record.id;
    if not found or amount <= 0 or (payload ->> 'location_id') is null then
      raise exception 'El detalle cuantitativo devuelto es inválido.';
    end if;
    select coalesce(sum(x.returned_quantity), 0) into already_returned
    from public.equipment_return_details as x
    join public.equipment_returns as r on r.id = x.equipment_return_id
    where r.equipment_loan_id = loan_record.id
      and x.equipment_loan_detail_id = detail_record.loan_detail_id;
    if already_returned + amount > detail_record.loaned_quantity then
      raise exception 'No se puede devolver más de lo prestado.';
    end if;

    insert into public.inventory_quantity_stock (inventory_item_id, location_id, quantity)
    values (detail_record.inventory_item_id, (payload ->> 'location_id')::uuid, 0)
    on conflict (inventory_item_id, location_id) do nothing;
    select quantity into stock
    from public.inventory_quantity_stock
    where inventory_item_id = detail_record.inventory_item_id
      and location_id = (payload ->> 'location_id')::uuid
    for update;
    update public.inventory_quantity_stock
    set quantity = stock + amount, updated_at = now()
    where inventory_item_id = detail_record.inventory_item_id
      and location_id = (payload ->> 'location_id')::uuid;
    insert into public.inventory_movements (
      inventory_item_id, location_id, movement_type, quantity, balance_after, notes, performed_by_user_id
    ) values (
      detail_record.inventory_item_id, (payload ->> 'location_id')::uuid, 'RETURN_IN', amount,
      stock + amount, 'Devolución de préstamo', p_received_by_user_id
    );
    insert into public.equipment_return_details (
      equipment_return_id, equipment_loan_detail_id, returned_quantity, location_id
    ) values (
      returned_record.id, detail_record.loan_detail_id, amount, (payload ->> 'location_id')::uuid
    );
  end loop;

  for unit_id in select value from jsonb_array_elements_text(p_loan_unit_ids)
  loop
    update public.inventory_units as unit
    set status = 'AVAILABLE'
    from public.equipment_loan_units as loan_unit
    join public.equipment_preparation_units as preparation_unit
      on preparation_unit.id = loan_unit.equipment_preparation_unit_id
    where loan_unit.id = unit_id::uuid
      and loan_unit.equipment_loan_id = loan_record.id
      and unit.id = preparation_unit.inventory_unit_id
      and unit.status = 'LOANED';
    if not found then
      raise exception 'La unidad no pertenece al préstamo o no está pendiente de devolución.';
    end if;
    update public.equipment_preparation_units as preparation_unit
    set is_active = false
    from public.equipment_loan_units as loan_unit
    where loan_unit.id = unit_id::uuid
      and loan_unit.equipment_loan_id = loan_record.id
      and preparation_unit.id = loan_unit.equipment_preparation_unit_id;
    insert into public.equipment_return_units (equipment_return_id, equipment_loan_unit_id)
    values (returned_record.id, unit_id::uuid);
  end loop;

  select not exists (
    select 1
    from public.equipment_loan_details as ld
    where ld.equipment_loan_id = loan_record.id
      and coalesce((
        select sum(rd.returned_quantity)
        from public.equipment_return_details as rd
        join public.equipment_returns as r on r.id = rd.equipment_return_id
        where r.equipment_loan_id = loan_record.id
          and rd.equipment_loan_detail_id = ld.id
      ), 0) < ld.loaned_quantity
  ) into all_quantity_returned;
  select not exists (
    select 1
    from public.equipment_loan_units as lu
    where lu.equipment_loan_id = loan_record.id
      and not exists (
        select 1 from public.equipment_return_units as ru
        where ru.equipment_loan_unit_id = lu.id
      )
  ) into all_units_returned;

  if all_quantity_returned and all_units_returned then
    update public.equipment_loans set status = 'CLOSED', closed_at = now() where id = loan_record.id;
    update public.equipment_requests set status = 'CLOSED' where id = loan_record.equipment_request_id;
  else
    update public.equipment_loans set status = 'PARTIALLY_RETURNED' where id = loan_record.id;
  end if;
  return returned_record;
end;
$$;

create function public.get_equipment_loan_pending(p_equipment_loan_id uuid)
returns jsonb
language sql security invoker set search_path = '' as $$
  select jsonb_build_object(
    'loan', to_jsonb(loan),
    'quantity_details', coalesce((
      select jsonb_agg(jsonb_build_object(
        'equipment_loan_detail_id', detail.id,
        'inventory_item_id', reservation_detail.inventory_item_id,
        'loaned_quantity', detail.loaned_quantity,
        'returned_quantity', coalesce(returned.total, 0),
        'pending_quantity', detail.loaned_quantity - coalesce(returned.total, 0)
      ) order by detail.created_at)
      from public.equipment_loan_details as detail
      join public.equipment_reservation_details as reservation_detail on reservation_detail.id = detail.equipment_reservation_detail_id
      left join lateral (
        select sum(return_detail.returned_quantity) as total
        from public.equipment_return_details as return_detail
        join public.equipment_returns as equipment_return on equipment_return.id = return_detail.equipment_return_id
        where equipment_return.equipment_loan_id = loan.id
          and return_detail.equipment_loan_detail_id = detail.id
      ) as returned on true
      where detail.equipment_loan_id = loan.id
    ), '[]'::jsonb),
    'unit_ids_pending', coalesce((
      select jsonb_agg(loan_unit.id order by loan_unit.created_at)
      from public.equipment_loan_units as loan_unit
      where loan_unit.equipment_loan_id = loan.id
        and not exists (
          select 1 from public.equipment_return_units as return_unit
          where return_unit.equipment_loan_unit_id = loan_unit.id
        )
    ), '[]'::jsonb)
  )
  from public.equipment_loans as loan
  where loan.id = p_equipment_loan_id;
$$;

revoke all on function public.record_equipment_return(uuid, text, uuid, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.record_equipment_return(uuid, text, uuid, jsonb, jsonb) to service_role;
revoke all on function public.get_equipment_loan_pending(uuid) from public, anon, authenticated;
grant execute on function public.get_equipment_loan_pending(uuid) to service_role;

create policy "request owners and staff can read returns"
on public.equipment_returns for select to authenticated using (
  exists (
    select 1 from public.equipment_loans as loan
    join public.equipment_requests as request on request.id = loan.equipment_request_id
    where loan.id = equipment_returns.equipment_loan_id
      and (request.teacher_id = (select private.current_teacher_id())
        or (select private.has_any_role(array['ADMIN', 'MANAGER']::public.role_code[])))
  )
);
create policy "request owners and staff can read return details"
on public.equipment_return_details for select to authenticated using (
  exists (
    select 1 from public.equipment_returns as equipment_return
    join public.equipment_loans as loan on loan.id = equipment_return.equipment_loan_id
    join public.equipment_requests as request on request.id = loan.equipment_request_id
    where equipment_return.id = equipment_return_details.equipment_return_id
      and (request.teacher_id = (select private.current_teacher_id())
        or (select private.has_any_role(array['ADMIN', 'MANAGER']::public.role_code[])))
  )
);
create policy "request owners and staff can read return units"
on public.equipment_return_units for select to authenticated using (
  exists (
    select 1 from public.equipment_returns as equipment_return
    join public.equipment_loans as loan on loan.id = equipment_return.equipment_loan_id
    join public.equipment_requests as request on request.id = loan.equipment_request_id
    where equipment_return.id = equipment_return_units.equipment_return_id
      and (request.teacher_id = (select private.current_teacher_id())
        or (select private.has_any_role(array['ADMIN', 'MANAGER']::public.role_code[])))
  )
);
