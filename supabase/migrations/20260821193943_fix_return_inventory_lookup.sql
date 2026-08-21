create or replace function public.record_equipment_return(
  p_equipment_loan_id uuid, p_returned_by_name text, p_received_by_user_id uuid,
  p_quantity_details jsonb default '[]'::jsonb, p_loan_unit_ids jsonb default '[]'::jsonb
) returns public.equipment_returns
language plpgsql security invoker set search_path = '' as $$
declare loan_record public.equipment_loans; returned_record public.equipment_returns; payload jsonb; unit_id text; detail_record record; amount numeric; already_returned numeric; stock numeric;
begin
  if nullif(btrim(p_returned_by_name), '') is null or jsonb_typeof(p_quantity_details) <> 'array' or jsonb_typeof(p_loan_unit_ids) <> 'array' then raise exception 'Los datos de devolución son inválidos.'; end if;
  if not private.is_active_request_reviewer(p_received_by_user_id) then raise exception 'Solo el personal autorizado puede recibir devoluciones.'; end if;
  select * into loan_record from public.equipment_loans as loan where loan.id = p_equipment_loan_id for update; if not found then raise exception 'El préstamo no existe.'; end if;
  insert into public.equipment_returns (equipment_loan_id, returned_by_name, received_by_user_id) values (loan_record.id, nullif(btrim(p_returned_by_name), ''), p_received_by_user_id) returning * into returned_record;
  for payload in select value from jsonb_array_elements(p_quantity_details) loop
    amount := (payload ->> 'returned_quantity')::numeric;
    select ld.id as loan_detail_id, rd.inventory_item_id, ld.loaned_quantity into detail_record from public.equipment_loan_details ld join public.equipment_reservation_details rd on rd.id = ld.equipment_reservation_detail_id where ld.id = (payload ->> 'equipment_loan_detail_id')::uuid and ld.equipment_loan_id = loan_record.id;
    if not found or amount <= 0 then raise exception 'El detalle devuelto no pertenece al préstamo.'; end if;
    select coalesce(sum(x.returned_quantity),0) into already_returned from public.equipment_return_details x join public.equipment_returns r on r.id=x.equipment_return_id where r.equipment_loan_id=loan_record.id and x.equipment_loan_detail_id=detail_record.loan_detail_id;
    if already_returned + amount > detail_record.loaned_quantity then raise exception 'No se puede devolver más de lo prestado.'; end if;
    insert into public.inventory_quantity_stock (inventory_item_id,location_id,quantity) values (detail_record.inventory_item_id,(payload->>'location_id')::uuid,0) on conflict do nothing;
    select quantity into stock from public.inventory_quantity_stock where inventory_item_id=detail_record.inventory_item_id and location_id=(payload->>'location_id')::uuid for update;
    update public.inventory_quantity_stock set quantity=stock+amount,updated_at=now() where inventory_item_id=detail_record.inventory_item_id and location_id=(payload->>'location_id')::uuid;
    insert into public.inventory_movements (inventory_item_id,location_id,movement_type,quantity,balance_after,notes,performed_by_user_id) values (detail_record.inventory_item_id,(payload->>'location_id')::uuid,'RETURN_IN',amount,stock+amount,'Devolución de préstamo',p_received_by_user_id);
    insert into public.equipment_return_details (equipment_return_id,equipment_loan_detail_id,returned_quantity,location_id) values (returned_record.id,detail_record.loan_detail_id,amount,(payload->>'location_id')::uuid);
  end loop;
  for unit_id in select value from jsonb_array_elements_text(p_loan_unit_ids) loop
    update public.inventory_units u set status='AVAILABLE' from public.equipment_loan_units lu join public.equipment_preparation_units pu on pu.id=lu.equipment_preparation_unit_id where lu.id=unit_id::uuid and lu.equipment_loan_id=loan_record.id and u.id=pu.inventory_unit_id and u.status='LOANED';
    if not found then raise exception 'La unidad no está pendiente de devolución.'; end if;
    insert into public.equipment_return_units (equipment_return_id,equipment_loan_unit_id) values (returned_record.id,unit_id::uuid);
  end loop;
  return returned_record;
end; $$;
