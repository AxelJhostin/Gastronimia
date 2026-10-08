-- Ejecutar con psql -v ON_ERROR_STOP=1; no conserva datos ni triggers de prueba.
begin;
create function pg_temp.reject_unit_audit() returns trigger language plpgsql as $$
begin
  if new.action='UNIT_CHANGE' and new.current_data->>'notes'='QA simular fallo de auditoría' then
    raise exception 'QA auditoría no disponible' using errcode='P0001';
  end if;
  return new;
end;
$$;
create trigger qa_reject_unit_audit before insert on public.operational_audit_log
for each row execute function pg_temp.reject_unit_audit();
do $$
declare
  category_id uuid; item_id uuid; unit_id uuid; staff_id uuid;
  changed public.inventory_units;
  event public.operational_audit_log;
  rejected boolean := false;
  old_context text;
begin
  select u.id into staff_id from public.users u where private.is_active_request_reviewer(u.id) limit 1;
  if staff_id is null then raise exception 'Se requiere un ADMIN o MANAGER QA.'; end if;
  insert into public.inventory_categories(name) values('QA auditoría rollback') returning id into category_id;
  insert into public.inventory_items(category_id,name,tracking_mode) values(category_id,'QA auditoría rollback','INDIVIDUAL') returning id into item_id;
  insert into public.inventory_units(inventory_item_id,asset_tag) values(item_id,'QA-R04-' || extensions.gen_random_uuid()) returning id into unit_id;
  old_context := current_setting('app.inventory_audit_actor',true);
  changed := public.edit_inventory_unit(unit_id,'{"notes":"QA cambio descriptivo"}',staff_id);
  select * into strict event from public.operational_audit_log where entity_id=unit_id;
  if event.performed_by_user_id is distinct from staff_id
     or event.previous_data->>'notes' is not null
     or event.current_data->>'notes' is distinct from 'QA cambio descriptivo' then
    raise exception 'Actor o valores del cambio incorrectos.';
  end if;
  if nullif(current_setting('app.inventory_audit_actor',true),'') is distinct from nullif(old_context,'') then
    raise exception 'El contexto del actor se filtró fuera de la operación.';
  end if;
  perform public.edit_inventory_unit(unit_id,'{"notes":"QA cambio descriptivo"}',staff_id);
  if (select count(*) from public.operational_audit_log where entity_id=unit_id) <> 1 then
    raise exception 'Se duplicó un evento sin cambio real.';
  end if;
  begin
    perform public.edit_inventory_unit(unit_id,'{"notes":"QA simular fallo de auditoría"}',staff_id);
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'QA auditoría no disponible' then raise; end if;
    rejected := true;
  end;
  if not rejected or (select notes from public.inventory_units where id=unit_id) <> 'QA cambio descriptivo'
     or (select count(*) from public.operational_audit_log where entity_id=unit_id) <> 1 then
    raise exception 'El fallo de auditoría no revirtió el cambio.';
  end if;
  if nullif(current_setting('app.inventory_audit_actor',true),'') is distinct from nullif(old_context,'') then
    raise exception 'El fallo dejó un responsable en el contexto.';
  end if;
  -- Una escritura técnica posterior no hereda al último usuario humano.
  perform set_config('app.inventory_audit_actor','',true);
  update public.inventory_units set notes='QA escritura técnica sin actor' where id=unit_id;
  if not exists(select 1 from public.operational_audit_log where entity_id=unit_id
      and current_data->>'notes'='QA escritura técnica sin actor' and performed_by_user_id is null) then
    raise exception 'La escritura técnica heredó un actor incorrecto.';
  end if;
  raise notice 'R-04: identidad, valores, no duplicación, aislamiento y reversión verificados.';
end;
$$;
rollback;
