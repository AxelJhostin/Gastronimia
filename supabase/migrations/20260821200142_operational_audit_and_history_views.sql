alter type public.inventory_movement_type add value if not exists 'LOSS';
alter type public.inventory_movement_type add value if not exists 'DISPOSAL';
alter type public.inventory_movement_type add value if not exists 'REACTIVATION';

create type public.operational_audit_action as enum (
  'INVENTORY_MOVEMENT', 'UNIT_CHANGE', 'MAINTENANCE_STARTED',
  'MAINTENANCE_CLOSED', 'RETURN_RECORDED', 'INSPECTION_RECORDED'
);

create table public.operational_audit_log (
  id uuid primary key default extensions.gen_random_uuid(),
  action public.operational_audit_action not null,
  entity_table text not null,
  entity_id uuid not null,
  performed_by_user_id uuid references public.users (id) on delete restrict,
  previous_data jsonb,
  current_data jsonb not null,
  recorded_at timestamptz not null default now()
);
create index operational_audit_entity_recorded_idx
on public.operational_audit_log (entity_table, entity_id, recorded_at desc);
create index operational_audit_actor_recorded_idx
on public.operational_audit_log (performed_by_user_id, recorded_at desc)
where performed_by_user_id is not null;

create function private.audit_inventory_movement()
returns trigger language plpgsql set search_path = '' as $$
begin
  insert into public.operational_audit_log(action,entity_table,entity_id,performed_by_user_id,current_data)
  values('INVENTORY_MOVEMENT','inventory_movements',new.id,new.performed_by_user_id,to_jsonb(new));
  return new;
end;
$$;
create trigger inventory_movements_audit_after_insert
after insert on public.inventory_movements for each row execute function private.audit_inventory_movement();

create function private.audit_inventory_unit_change()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and (old.status is distinct from new.status or old.condition is distinct from new.condition or old.is_active is distinct from new.is_active or old.location_id is distinct from new.location_id) then
    insert into public.operational_audit_log(action,entity_table,entity_id,current_data,previous_data)
    values('UNIT_CHANGE','inventory_units',new.id,to_jsonb(new),to_jsonb(old));
  end if;
  return new;
end;
$$;
create trigger inventory_units_audit_after_change
after update on public.inventory_units for each row execute function private.audit_inventory_unit_change();

create function private.audit_equipment_maintenance()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    insert into public.operational_audit_log(action,entity_table,entity_id,performed_by_user_id,current_data)
    values('MAINTENANCE_STARTED','equipment_maintenances',new.id,new.created_by_user_id,to_jsonb(new));
  elsif old.status = 'OPEN' and new.status <> 'OPEN' then
    insert into public.operational_audit_log(action,entity_table,entity_id,performed_by_user_id,previous_data,current_data)
    values('MAINTENANCE_CLOSED','equipment_maintenances',new.id,new.completed_by_user_id,to_jsonb(old),to_jsonb(new));
  end if;
  return new;
end;
$$;
create trigger equipment_maintenances_audit_after_change
after insert or update on public.equipment_maintenances for each row execute function private.audit_equipment_maintenance();

create function private.audit_return()
returns trigger language plpgsql set search_path = '' as $$
begin
  insert into public.operational_audit_log(action,entity_table,entity_id,performed_by_user_id,current_data)
  values('RETURN_RECORDED','equipment_returns',new.id,new.received_by_user_id,to_jsonb(new));
  return new;
end;
$$;
create trigger equipment_returns_audit_after_insert
after insert on public.equipment_returns for each row execute function private.audit_return();

create function private.audit_inspection()
returns trigger language plpgsql set search_path = '' as $$
begin
  insert into public.operational_audit_log(action,entity_table,entity_id,performed_by_user_id,current_data)
  values('INSPECTION_RECORDED','equipment_inspections',new.id,new.inspected_by_user_id,to_jsonb(new));
  return new;
end;
$$;
create trigger equipment_inspections_audit_after_insert
after insert on public.equipment_inspections for each row execute function private.audit_inspection();

create view public.inventory_kardex
with (security_invoker = true) as
select movement.id, movement.inventory_item_id, item.code as inventory_item_code,
  item.name as inventory_item_name, movement.location_id, location.name as location_name,
  movement.movement_type, movement.quantity, movement.balance_after, movement.notes,
  movement.performed_by_user_id, movement.created_at
from public.inventory_movements as movement
join public.inventory_items as item on item.id = movement.inventory_item_id
join public.inventory_locations as location on location.id = movement.location_id;

create view public.inventory_unit_lifecycle
with (security_invoker = true) as
select history.id, history.inventory_unit_id, unit.asset_tag, unit.inventory_item_id,
  history.event_type, history.previous_status, history.current_status,
  history.previous_condition, history.current_condition, history.recorded_at
from public.inventory_unit_history as history
join public.inventory_units as unit on unit.id = history.inventory_unit_id;

revoke all on table public.operational_audit_log from anon, authenticated;
grant select on table public.operational_audit_log to authenticated;
grant all on table public.operational_audit_log to service_role;
alter table public.operational_audit_log enable row level security;
create policy "inventory staff can read operational audit"
on public.operational_audit_log for select to authenticated
using ((select private.has_any_role(array['ADMIN','MANAGER']::public.role_code[])));

revoke all on table public.inventory_kardex, public.inventory_unit_lifecycle from anon, authenticated;
grant select on table public.inventory_kardex, public.inventory_unit_lifecycle to authenticated, service_role;
revoke all on function private.audit_inventory_movement(),private.audit_inventory_unit_change(),private.audit_equipment_maintenance(),private.audit_return(),private.audit_inspection() from public;
grant execute on function private.audit_inventory_movement(),private.audit_inventory_unit_change(),private.audit_equipment_maintenance(),private.audit_return(),private.audit_inspection() to service_role;
