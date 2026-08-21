create or replace function public.record_outbound_inspection(
  p_equipment_request_id uuid, p_inspected_by_user_id uuid, p_notes text, p_items jsonb
)
returns public.equipment_inspections
language plpgsql security invoker set search_path = '' as $$
declare request_record public.equipment_requests; inspection public.equipment_inspections; payload jsonb;
begin
  if not private.is_active_request_reviewer(p_inspected_by_user_id) then raise exception 'Solo el personal autorizado puede inspeccionar.'; end if;
  if jsonb_typeof(p_items) <> 'array' then raise exception 'Los elementos inspeccionados deben ser una lista.'; end if;
  select * into request_record from public.equipment_requests where id = p_equipment_request_id for update;
  if not found or request_record.status <> 'PREPARED' then raise exception 'Solo una solicitud preparada puede inspeccionarse antes de entregar.'; end if;
  insert into public.equipment_inspections (equipment_request_id, stage, inspected_by_user_id, notes)
  values (request_record.id, 'OUTBOUND', p_inspected_by_user_id, p_notes) returning * into inspection;
  for payload in select value from jsonb_array_elements(p_items) loop
    if not exists (
      select 1 from public.equipment_preparation_units pu join public.equipment_preparation_details pd on pd.id=pu.equipment_preparation_detail_id join public.equipment_preparations p on p.id=pd.equipment_preparation_id
      where p.equipment_request_id=request_record.id and pu.inventory_unit_id=(payload->>'inventory_unit_id')::uuid and pu.is_active
    ) then raise exception 'La unidad no pertenece a la preparación activa.'; end if;
    insert into public.equipment_inspection_details (equipment_inspection_id, inventory_unit_id, observed_condition, is_complete)
    values (inspection.id, (payload->>'inventory_unit_id')::uuid, (payload->>'observed_condition')::public.inventory_unit_condition, coalesce((payload->>'is_complete')::boolean, true));
  end loop;
  if exists (
    select 1 from public.equipment_preparation_units pu join public.equipment_preparation_details pd on pd.id=pu.equipment_preparation_detail_id join public.equipment_preparations p on p.id=pd.equipment_preparation_id
    where p.equipment_request_id=request_record.id and pu.is_active and not exists (select 1 from public.equipment_inspection_details d where d.equipment_inspection_id=inspection.id and d.inventory_unit_id=pu.inventory_unit_id)
  ) then raise exception 'La inspección previa debe cubrir todas las unidades preparadas.'; end if;
  return inspection;
end;
$$;

revoke all on function public.record_outbound_inspection(uuid,uuid,text,jsonb) from public, anon, authenticated;
grant execute on function public.record_outbound_inspection(uuid,uuid,text,jsonb) to service_role;
