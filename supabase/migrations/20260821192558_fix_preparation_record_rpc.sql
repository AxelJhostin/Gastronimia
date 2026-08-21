create or replace function public.record_equipment_preparation(
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
  reservation_detail_record record;
  preparation_detail_id uuid;
  requested_preparation numeric(14, 3);
  cumulative_preparation numeric(14, 3);
  unit_count integer;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'La preparación debe incluir al menos un artículo.'; end if;
  if not private.is_active_request_reviewer(p_prepared_by_user_id) then raise exception 'Solo un administrador o encargado activo puede preparar recursos.'; end if;
  select * into request_record from public.equipment_requests as request where request.id = p_equipment_request_id for update;
  if not found or request_record.status <> 'PREPARING' then raise exception 'La solicitud debe estar en preparación.'; end if;
  select * into preparation from public.equipment_preparations as current_preparation
  where current_preparation.equipment_request_id = request_record.id and current_preparation.completed_at is null for update;
  if not found then raise exception 'No existe una preparación activa para la solicitud.'; end if;

  for item_payload in select value from jsonb_array_elements(p_items)
  loop
    requested_preparation := (item_payload ->> 'prepared_quantity')::numeric;
    select rd.id as reservation_detail_id, rd.reserved_quantity, rd.inventory_item_id, inventory_item.tracking_mode
    into reservation_detail_record
    from public.equipment_reservation_details as rd
    join public.equipment_reservations as reservation on reservation.id = rd.equipment_reservation_id
    join public.inventory_items as inventory_item on inventory_item.id = rd.inventory_item_id
    where rd.id = (item_payload ->> 'equipment_reservation_detail_id')::uuid
      and reservation.equipment_request_id = request_record.id and reservation.status = 'ACTIVE';
    if not found then raise exception 'El detalle preparado debe pertenecer a una reserva activa de la solicitud.'; end if;
    if requested_preparation <= 0 then raise exception 'La cantidad preparada debe ser mayor que cero.'; end if;
    if reservation_detail_record.tracking_mode = 'INDIVIDUAL' and requested_preparation <> trunc(requested_preparation) then raise exception 'La cantidad preparada de un artículo individual debe ser entera.'; end if;

    insert into public.equipment_preparation_details (equipment_preparation_id, equipment_reservation_detail_id)
    values (preparation.id, reservation_detail_record.reservation_detail_id)
    on conflict (equipment_reservation_detail_id) do update set updated_at = now()
    returning id, prepared_quantity into preparation_detail_id, cumulative_preparation;
    if cumulative_preparation + requested_preparation > reservation_detail_record.reserved_quantity then raise exception 'No se puede preparar más de la cantidad reservada.'; end if;

    if reservation_detail_record.tracking_mode = 'INDIVIDUAL' then
      if jsonb_typeof(coalesce(item_payload -> 'inventory_unit_ids', 'null'::jsonb)) <> 'array' then raise exception 'La preparación de unidades individuales requiere identificadores de unidad.'; end if;
      select count(*) into unit_count from jsonb_array_elements_text(item_payload -> 'inventory_unit_ids');
      if unit_count <> requested_preparation then raise exception 'La cantidad de unidades seleccionadas debe coincidir con la cantidad preparada.'; end if;
      for unit_payload in select value from jsonb_array_elements_text(item_payload -> 'inventory_unit_ids') order by value
      loop
        perform pg_advisory_xact_lock(hashtextextended(unit_payload, 0));
        if not exists (select 1 from public.inventory_units as unit where unit.id = unit_payload::uuid and unit.inventory_item_id = reservation_detail_record.inventory_item_id and unit.is_active and unit.status = 'AVAILABLE') then raise exception 'La unidad seleccionada no está disponible para el artículo reservado.'; end if;
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
    elsif item_payload ? 'inventory_unit_ids' then raise exception 'Los artículos por cantidad no aceptan unidades físicas seleccionadas.';
    end if;
    update public.equipment_preparation_details set prepared_quantity = cumulative_preparation + requested_preparation where id = preparation_detail_id;
  end loop;
  return preparation;
end;
$$;
