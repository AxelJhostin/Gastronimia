-- Validar el estado DESPUÉS de adquirir el mismo bloqueo de fila que usa la entrega.
-- Una entrega no confirmada conserva visible la versión AVAILABLE para un SELECT
-- simple; FOR UPDATE espera y obtiene la versión final antes de decidir.
create or replace function public.start_equipment_maintenance(
  p_inventory_unit_id uuid, p_maintenance_type public.equipment_maintenance_type,
  p_reason text, p_description text, p_created_by_user_id uuid
) returns public.equipment_maintenances
language plpgsql security invoker set search_path = '' as $$
declare
  maintenance public.equipment_maintenances;
  unit_record public.inventory_units;
begin
  if not private.is_active_request_reviewer(p_created_by_user_id) then
    raise exception 'Solo el personal autorizado puede iniciar mantenimiento.';
  end if;
  if nullif(btrim(p_reason),'') is null then
    raise exception 'Debe registrar el motivo del mantenimiento.';
  end if;
  select * into unit_record from public.inventory_units
  where id=p_inventory_unit_id for update;
  if not found or not unit_record.is_active or unit_record.status='LOANED' then
    raise exception 'La unidad no existe, está prestada o está inactiva.';
  end if;
  update public.inventory_units set status='MAINTENANCE'
  where id=p_inventory_unit_id and status <> 'MAINTENANCE';
  insert into public.equipment_maintenances(
    inventory_unit_id,maintenance_type,reason,description,created_by_user_id
  ) values (
    p_inventory_unit_id,p_maintenance_type,nullif(btrim(p_reason),''),
    p_description,p_created_by_user_id
  ) returning * into maintenance;
  return maintenance;
end;
$$;
revoke all on function public.start_equipment_maintenance(
  uuid,public.equipment_maintenance_type,text,text,uuid
) from public,anon,authenticated;
grant execute on function public.start_equipment_maintenance(
  uuid,public.equipment_maintenance_type,text,text,uuid
) to service_role;
