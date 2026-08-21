-- Catálogo base: los artículos por cantidad y las unidades físicas se modelan
-- por separado para no perder trazabilidad de equipos individualizados.

create type public.inventory_tracking_mode as enum ('QUANTITY', 'INDIVIDUAL');
create type public.inventory_unit_status as enum (
  'AVAILABLE',
  'LOANED',
  'MAINTENANCE',
  'DISABLED'
);
create type public.inventory_unit_condition as enum (
  'NEW',
  'GOOD',
  'FAIR',
  'DAMAGED'
);

create table public.inventory_categories (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null unique check (char_length(btrim(name)) > 0),
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.inventory_locations (
  id uuid primary key default extensions.gen_random_uuid(),
  code text unique,
  name text not null unique check (char_length(btrim(name)) > 0),
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.inventory_items (
  id uuid primary key default extensions.gen_random_uuid(),
  category_id uuid not null references public.inventory_categories (id) on delete restrict,
  code text unique,
  name text not null check (char_length(btrim(name)) > 0),
  description text,
  tracking_mode public.inventory_tracking_mode not null,
  unit_of_measure text not null default 'unidad'
    check (char_length(btrim(unit_of_measure)) > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.inventory_units (
  id uuid primary key default extensions.gen_random_uuid(),
  inventory_item_id uuid not null references public.inventory_items (id) on delete restrict,
  location_id uuid references public.inventory_locations (id) on delete restrict,
  asset_tag text not null unique check (char_length(btrim(asset_tag)) > 0),
  serial_number text unique,
  status public.inventory_unit_status not null default 'AVAILABLE',
  condition public.inventory_unit_condition not null default 'GOOD',
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index inventory_items_category_id_idx
on public.inventory_items (category_id);

create index inventory_units_inventory_item_id_idx
on public.inventory_units (inventory_item_id);

create index inventory_units_location_id_idx
on public.inventory_units (location_id);

create index inventory_units_available_item_idx
on public.inventory_units (inventory_item_id)
where is_active and status = 'AVAILABLE';

create trigger inventory_categories_set_updated_at
before update on public.inventory_categories
for each row execute function private.set_updated_at();

create trigger inventory_locations_set_updated_at
before update on public.inventory_locations
for each row execute function private.set_updated_at();

create trigger inventory_items_set_updated_at
before update on public.inventory_items
for each row execute function private.set_updated_at();

create trigger inventory_units_set_updated_at
before update on public.inventory_units
for each row execute function private.set_updated_at();

create function private.validate_individual_inventory_unit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.inventory_items
    where id = new.inventory_item_id
      and tracking_mode = 'INDIVIDUAL'
  ) then
    raise exception 'Las unidades físicas solo pueden pertenecer a artículos INDIVIDUAL.';
  end if;

  return new;
end;
$$;

revoke all on function private.validate_individual_inventory_unit() from public;
grant execute on function private.validate_individual_inventory_unit() to service_role;

create trigger inventory_units_require_individual_item
before insert or update of inventory_item_id on public.inventory_units
for each row execute function private.validate_individual_inventory_unit();

revoke all on table public.inventory_categories from anon, authenticated;
revoke all on table public.inventory_locations from anon, authenticated;
revoke all on table public.inventory_items from anon, authenticated;
revoke all on table public.inventory_units from anon, authenticated;

grant select on table public.inventory_categories,
  public.inventory_locations,
  public.inventory_items,
  public.inventory_units to authenticated;
grant all privileges on table public.inventory_categories,
  public.inventory_locations,
  public.inventory_items,
  public.inventory_units to service_role;

alter table public.inventory_categories enable row level security;
alter table public.inventory_locations enable row level security;
alter table public.inventory_items enable row level security;
alter table public.inventory_units enable row level security;

create policy "active users read active inventory categories and staff read all"
on public.inventory_categories
for select
to authenticated
using (
  (is_active and (select private.is_active_user()))
  or (select private.has_any_role(array['ADMIN', 'MANAGER']::public.role_code[]))
);

create policy "active users read active inventory locations and staff read all"
on public.inventory_locations
for select
to authenticated
using (
  (is_active and (select private.is_active_user()))
  or (select private.has_any_role(array['ADMIN', 'MANAGER']::public.role_code[]))
);

create policy "active users read active inventory items and staff read all"
on public.inventory_items
for select
to authenticated
using (
  (is_active and (select private.is_active_user()))
  or (select private.has_any_role(array['ADMIN', 'MANAGER']::public.role_code[]))
);

create policy "active users read available units and staff read all units"
on public.inventory_units
for select
to authenticated
using (
  (
    is_active
    and status = 'AVAILABLE'
    and (select private.is_active_user())
  )
  or (select private.has_any_role(array['ADMIN', 'MANAGER']::public.role_code[]))
);

comment on table public.inventory_items is
  'Artículo de inventario: QUANTITY para existencias agregadas o INDIVIDUAL para equipos rastreables.';
comment on table public.inventory_units is
  'Unidad física de un artículo INDIVIDUAL; su disponibilidad y condición son independientes.';
