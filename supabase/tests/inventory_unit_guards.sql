-- Ejecutar con psql -v ON_ERROR_STOP=1. Todo se revierte, incluidos los datos QA.
begin;
do $$
declare
  category_id uuid;
  first_item uuid;
  other_item uuid;
  unit_id uuid;
  staff_id uuid;
  event_count bigint;
  rejected boolean;
  state text;
begin
  if has_function_privilege('anon', 'public.edit_inventory_unit(uuid,jsonb,uuid)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.edit_inventory_unit(uuid,jsonb,uuid)', 'EXECUTE')
     or not has_function_privilege('service_role', 'public.edit_inventory_unit(uuid,jsonb,uuid)', 'EXECUTE') then
    raise exception 'Permisos incorrectos para la edición de unidades.';
  end if;
  if has_table_privilege('authenticated', 'public.inventory_units', 'UPDATE')
     or has_table_privilege('authenticated', 'public.inventory_units', 'INSERT') then
    raise exception 'El cliente puede escribir unidades fuera del servidor.';
  end if;
  select u.id into staff_id from public.users u where private.is_active_request_reviewer(u.id) limit 1;
  if staff_id is null then raise exception 'Se requiere un usuario QA ADMIN o MANAGER.'; end if;
  insert into public.inventory_categories(name) values ('QA R03 rollback') returning id into category_id;
  insert into public.inventory_items(category_id,name,tracking_mode) values(category_id,'QA R03 unidad','INDIVIDUAL') returning id into first_item;
  insert into public.inventory_items(category_id,name,tracking_mode) values(category_id,'QA R03 otro','INDIVIDUAL') returning id into other_item;
  insert into public.inventory_units(inventory_item_id,asset_tag) values(first_item,'QA-R03-' || extensions.gen_random_uuid()) returning id into unit_id;
  select count(*) into event_count from public.inventory_unit_history where inventory_unit_id=unit_id;

  foreach state in array array['AVAILABLE','LOANED'] loop
    rejected := false;
    begin
      update public.inventory_units set status=state::public.inventory_unit_status, condition='DAMAGED' where id=unit_id;
    exception when check_violation then rejected := true;
    end;
    if not rejected then raise exception 'Una unidad dañada quedó disponible o prestada.'; end if;
  end loop;

  rejected := false;
  begin
    update public.inventory_units set inventory_item_id=other_item where id=unit_id;
  exception when check_violation then rejected := true;
  end;
  if not rejected then raise exception 'Se permitió cambiar el artículo de la unidad.'; end if;

  foreach state in array array['LOANED','MAINTENANCE'] loop
    rejected := false;
    begin
      perform public.edit_inventory_unit(unit_id, jsonb_build_object('status',state), staff_id);
    exception when check_violation then rejected := true;
    end;
    if not rejected then raise exception 'La operación de catálogo aceptó un estado operativo.'; end if;
  end loop;

  rejected := false;
  begin
    perform public.edit_inventory_unit(unit_id, '{"notes":"actor inválido"}', extensions.gen_random_uuid());
  exception when insufficient_privilege then rejected := true;
  end;
  if not rejected then raise exception 'La operación aceptó un actor sin permisos.'; end if;

  if (select count(*) from public.inventory_unit_history where inventory_unit_id=unit_id) <> event_count then
    raise exception 'Un cambio rechazado alteró el historial.';
  end if;
  perform public.edit_inventory_unit(unit_id, '{"status":"DISABLED","condition":"DAMAGED"}', staff_id);
  if not exists(select 1 from public.inventory_units where id=unit_id and status='DISABLED' and condition='DAMAGED') then
    raise exception 'No se guardó el cambio seguro.';
  end if;
  if (select count(*) from public.inventory_unit_history where inventory_unit_id=unit_id) <> event_count+1 then
    raise exception 'El cambio válido no dejó un único evento de historial.';
  end if;
  raise notice 'R-03: permisos, restricciones, actor e historial verificados.';
end;
$$;
rollback;
