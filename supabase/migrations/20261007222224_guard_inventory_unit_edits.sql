-- Protege la edición de catálogo sin sustituir préstamos, inspecciones ni mantenimiento.

alter table public.inventory_units drop constraint if exists inventory_units_damaged_not_available;
alter table public.inventory_units
  add constraint inventory_units_damaged_not_available
  check (condition <> 'DAMAGED' or status not in ('AVAILABLE', 'LOANED'));

create or replace function private.preserve_inventory_unit_item()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.inventory_item_id is distinct from old.inventory_item_id then
    raise exception 'El artículo de una unidad no puede cambiar: conserva su historial.' using errcode = '23514';
  end if;
  return new;
end;
$$;
drop trigger if exists inventory_units_preserve_item on public.inventory_units;
create trigger inventory_units_preserve_item
before update of inventory_item_id on public.inventory_units
for each row execute function private.preserve_inventory_unit_item();

create or replace function public.edit_inventory_unit(p_unit_id uuid, p_changes jsonb, p_user_id uuid)
returns public.inventory_units language plpgsql security invoker set search_path = '' as $$
declare
  current_unit public.inventory_units;
  edited_unit public.inventory_units;
begin
  if not private.is_active_request_reviewer(p_user_id) then
    raise exception 'Solo el personal autorizado puede editar unidades.' using errcode = '42501';
  end if;
  -- Mismo bloqueo que la selección de unidades en la preparación.
  perform pg_advisory_xact_lock(hashtextextended(p_unit_id::text, 0));
  select * into current_unit from public.inventory_units where id = p_unit_id for update;
  if not found then
    raise exception 'No se encontró la unidad.' using errcode = 'PT404';
  end if;
  if current_unit.status not in ('AVAILABLE', 'DISABLED')
     or exists (select 1 from public.equipment_preparation_units where inventory_unit_id = p_unit_id and is_active)
     or exists (
       select 1 from public.equipment_loan_units lu
       join public.equipment_preparation_units pu on pu.id = lu.equipment_preparation_unit_id
       where pu.inventory_unit_id = p_unit_id and not exists (
         select 1 from public.equipment_return_units ru where ru.equipment_loan_unit_id = lu.id
       )
     )
     or exists (select 1 from public.equipment_maintenances where inventory_unit_id = p_unit_id and status = 'OPEN')
     or exists (
       select 1 from public.equipment_return_units ru
       join public.equipment_loan_units lu on lu.id = ru.equipment_loan_unit_id
       join public.equipment_preparation_units pu on pu.id = lu.equipment_preparation_unit_id
       where pu.inventory_unit_id = p_unit_id and not exists (
         select 1 from public.equipment_inspections i
         join public.equipment_inspection_details d on d.equipment_inspection_id = i.id
         where i.equipment_return_id = ru.equipment_return_id and d.inventory_unit_id = p_unit_id
       )
     ) then
    raise exception 'Complete la preparación, devolución, inspección o mantenimiento antes de editar la unidad.' using errcode = '23514';
  end if;
  edited_unit := jsonb_populate_record(current_unit, p_changes);
  if edited_unit.status not in ('AVAILABLE', 'DISABLED') then
    raise exception 'El estado debe cambiar mediante su flujo operativo.' using errcode = '23514';
  end if;
  update public.inventory_units set
    inventory_item_id = edited_unit.inventory_item_id,
    location_id = edited_unit.location_id,
    asset_tag = edited_unit.asset_tag,
    serial_number = edited_unit.serial_number,
    status = edited_unit.status,
    condition = edited_unit.condition,
    notes = edited_unit.notes,
    is_active = edited_unit.is_active
  where id = p_unit_id returning * into edited_unit;
  return edited_unit;
end;
$$;
revoke all on function public.edit_inventory_unit(uuid,jsonb,uuid) from public, anon, authenticated;
grant execute on function public.edit_inventory_unit(uuid,jsonb,uuid) to service_role;
revoke all on function private.preserve_inventory_unit_item() from public, anon, authenticated;
