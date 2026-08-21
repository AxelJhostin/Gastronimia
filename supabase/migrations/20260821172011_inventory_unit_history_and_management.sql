create type public.inventory_unit_history_event as enum (
  'CREATED',
  'UPDATED',
  'STATUS_CHANGED',
  'CONDITION_CHANGED',
  'LOCATION_CHANGED',
  'DEACTIVATED',
  'REACTIVATED'
);

create table public.inventory_unit_history (
  id uuid primary key default extensions.gen_random_uuid(),
  inventory_unit_id uuid not null references public.inventory_units (id) on delete restrict,
  event_type public.inventory_unit_history_event not null,
  previous_status public.inventory_unit_status,
  current_status public.inventory_unit_status,
  previous_condition public.inventory_unit_condition,
  current_condition public.inventory_unit_condition,
  previous_location_id uuid references public.inventory_locations (id) on delete restrict,
  current_location_id uuid references public.inventory_locations (id) on delete restrict,
  previous_is_active boolean,
  current_is_active boolean not null,
  recorded_at timestamptz not null default now()
);

create index inventory_unit_history_unit_recorded_idx
on public.inventory_unit_history (inventory_unit_id, recorded_at desc);

create function private.log_inventory_unit_history()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  history_event public.inventory_unit_history_event;
begin
  if tg_op = 'INSERT' then
    history_event := 'CREATED';
  elsif old.is_active and not new.is_active then
    history_event := 'DEACTIVATED';
  elsif not old.is_active and new.is_active then
    history_event := 'REACTIVATED';
  elsif old.status is distinct from new.status then
    history_event := 'STATUS_CHANGED';
  elsif old.condition is distinct from new.condition then
    history_event := 'CONDITION_CHANGED';
  elsif old.location_id is distinct from new.location_id then
    history_event := 'LOCATION_CHANGED';
  else
    history_event := 'UPDATED';
  end if;

  insert into public.inventory_unit_history (
    inventory_unit_id,
    event_type,
    previous_status,
    current_status,
    previous_condition,
    current_condition,
    previous_location_id,
    current_location_id,
    previous_is_active,
    current_is_active
  )
  values (
    new.id,
    history_event,
    case when tg_op = 'INSERT' then null else old.status end,
    new.status,
    case when tg_op = 'INSERT' then null else old.condition end,
    new.condition,
    case when tg_op = 'INSERT' then null else old.location_id end,
    new.location_id,
    case when tg_op = 'INSERT' then null else old.is_active end,
    new.is_active
  );

  return new;
end;
$$;

revoke all on function private.log_inventory_unit_history() from public;
grant execute on function private.log_inventory_unit_history() to service_role;

create trigger inventory_units_history_after_change
after insert or update on public.inventory_units
for each row execute function private.log_inventory_unit_history();

revoke all on table public.inventory_unit_history from anon, authenticated;
grant select on table public.inventory_unit_history to authenticated;
grant all privileges on table public.inventory_unit_history to service_role;

alter table public.inventory_unit_history enable row level security;

create policy "inventory staff can read unit history"
on public.inventory_unit_history
for select
to authenticated
using ((select private.has_any_role(array['ADMIN', 'MANAGER']::public.role_code[])));

comment on table public.inventory_unit_history is
  'Hoja de vida automática de unidades físicas; conserva estados, condición, ubicación y activación.';
