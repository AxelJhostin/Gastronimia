create or replace function public.approve_equipment_request(
  p_equipment_request_id uuid,
  p_reviewer_user_id uuid,
  p_items jsonb
)
returns public.equipment_requests
language plpgsql security invoker set search_path = '' as $$
declare
  reviewed_request public.equipment_requests;
  review_item jsonb;
  requested_quantity numeric(14, 3);
  approved_quantity numeric(14, 3);
  available_quantity numeric(14, 3);
  available_units integer;
  item_tracking_mode public.inventory_tracking_mode;
  inventory_item_id uuid;
  expected_item_count integer;
  processed_item_count integer := 0;
  any_partial boolean := false;
  total_approved numeric(14, 3) := 0;
  final_status public.equipment_request_status;
begin
  if jsonb_typeof(p_items) <> 'array' then raise exception 'Los artículos aprobados deben ser una lista.'; end if;
  if not private.is_active_request_reviewer(p_reviewer_user_id) then raise exception 'El revisor debe ser un administrador o encargado activo.'; end if;
  select * into reviewed_request from public.equipment_requests as request where request.id = p_equipment_request_id for update;
  if not found or reviewed_request.status <> 'PENDING' then raise exception 'Solo se pueden aprobar solicitudes pendientes.'; end if;
  select count(*) into expected_item_count from public.equipment_request_items as item where item.equipment_request_id = reviewed_request.id;
  if expected_item_count = 0 or jsonb_array_length(p_items) <> expected_item_count then raise exception 'La aprobación debe indicar una cantidad para cada artículo solicitado.'; end if;

  for review_item in select value from jsonb_array_elements(p_items)
  loop
    approved_quantity := (review_item ->> 'approved_quantity')::numeric;
    select item.requested_quantity, inventory_item.tracking_mode, item.inventory_item_id
    into requested_quantity, item_tracking_mode, inventory_item_id
    from public.equipment_request_items as item join public.inventory_items as inventory_item on inventory_item.id = item.inventory_item_id
    where item.id = (review_item ->> 'equipment_request_item_id')::uuid and item.equipment_request_id = reviewed_request.id;
    if not found then raise exception 'Cada artículo aprobado debe pertenecer a la solicitud.'; end if;
    if approved_quantity < 0 or approved_quantity > requested_quantity then raise exception 'La cantidad aprobada debe estar entre cero y la cantidad solicitada.'; end if;
    if item_tracking_mode = 'INDIVIDUAL' and approved_quantity <> trunc(approved_quantity) then raise exception 'La cantidad aprobada de un artículo individual debe ser entera.'; end if;
    select availability.quantity_available, availability.units_available into available_quantity, available_units
    from public.calculate_inventory_availability(inventory_item_id, reviewed_request.start_at, reviewed_request.end_at) as availability;
    if item_tracking_mode = 'QUANTITY' and approved_quantity > available_quantity then raise exception 'La cantidad aprobada supera la disponibilidad actual.'; end if;
    if item_tracking_mode = 'INDIVIDUAL' and approved_quantity > available_units then raise exception 'Las unidades aprobadas superan la disponibilidad actual.'; end if;
    insert into public.equipment_request_item_reviews (equipment_request_item_id, approved_quantity)
    values ((review_item ->> 'equipment_request_item_id')::uuid, approved_quantity);
    processed_item_count := processed_item_count + 1;
    total_approved := total_approved + approved_quantity;
    any_partial := any_partial or approved_quantity < requested_quantity;
  end loop;

  if processed_item_count <> expected_item_count or total_approved <= 0 then raise exception 'La aprobación debe incluir al menos una cantidad positiva y cada artículo una sola vez.'; end if;
  final_status := case
    when any_partial then 'PARTIALLY_APPROVED'::public.equipment_request_status
    else 'APPROVED'::public.equipment_request_status
  end;
  update public.equipment_requests set status = final_status where id = reviewed_request.id returning * into reviewed_request;
  insert into public.equipment_request_reviews (equipment_request_id, reviewed_by_user_id, previous_status, decision)
  values (reviewed_request.id, p_reviewer_user_id, 'PENDING', final_status);
  return reviewed_request;
end;
$$;
