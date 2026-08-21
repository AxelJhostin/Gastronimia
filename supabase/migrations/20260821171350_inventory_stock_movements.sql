-- El saldo se mantiene por artículo y ubicación. Toda variación pasa por la
-- RPC para registrar kardex y evitar cantidades negativas en una transacción.

create type public.inventory_movement_type as enum (
  'INITIAL_STOCK',
  'ADJUSTMENT_IN',
  'ADJUSTMENT_OUT'
);

create table public.inventory_quantity_stock (
  inventory_item_id uuid not null references public.inventory_items (id) on delete restrict,
  location_id uuid not null references public.inventory_locations (id) on delete restrict,
  quantity numeric(14, 3) not null default 0 check (quantity >= 0),
  updated_at timestamptz not null default now(),
  primary key (inventory_item_id, location_id)
);

create table public.inventory_movements (
  id uuid primary key default extensions.gen_random_uuid(),
  inventory_item_id uuid not null references public.inventory_items (id) on delete restrict,
  location_id uuid not null references public.inventory_locations (id) on delete restrict,
  movement_type public.inventory_movement_type not null,
  quantity numeric(14, 3) not null check (quantity > 0),
  balance_after numeric(14, 3) not null check (balance_after >= 0),
  notes text,
  performed_by_user_id uuid not null references public.users (id) on delete restrict,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index inventory_movements_item_location_occurred_idx
on public.inventory_movements (inventory_item_id, location_id, occurred_at desc);

create index inventory_movements_performed_by_user_id_idx
on public.inventory_movements (performed_by_user_id);

create function public.record_quantity_stock_movement(
  p_inventory_item_id uuid,
  p_location_id uuid,
  p_movement_type public.inventory_movement_type,
  p_quantity numeric,
  p_notes text,
  p_performed_by_user_id uuid,
  p_occurred_at timestamptz default now()
)
returns public.inventory_movements
language plpgsql
security definer
set search_path = ''
as $$
declare
  movement public.inventory_movements;
  current_quantity numeric(14, 3);
  quantity_delta numeric(14, 3);
begin
  if p_quantity <= 0 then
    raise exception 'La cantidad del movimiento debe ser mayor que cero.';
  end if;

  if not exists (
    select 1
    from public.inventory_items
    where id = p_inventory_item_id
      and tracking_mode = 'QUANTITY'
      and is_active
  ) then
    raise exception 'El artículo debe existir, estar activo y ser de tipo QUANTITY.';
  end if;

  if not exists (
    select 1
    from public.inventory_locations
    where id = p_location_id
      and is_active
  ) then
    raise exception 'La ubicación debe existir y estar activa.';
  end if;

  if not exists (
    select 1
    from public.users
    where id = p_performed_by_user_id
      and is_active
  ) then
    raise exception 'El usuario responsable debe existir y estar activo.';
  end if;

  quantity_delta := case p_movement_type
    when 'INITIAL_STOCK' then p_quantity
    when 'ADJUSTMENT_IN' then p_quantity
    when 'ADJUSTMENT_OUT' then -p_quantity
  end;

  insert into public.inventory_quantity_stock (
    inventory_item_id,
    location_id,
    quantity
  )
  values (p_inventory_item_id, p_location_id, 0)
  on conflict (inventory_item_id, location_id) do nothing;

  select quantity
  into current_quantity
  from public.inventory_quantity_stock
  where inventory_item_id = p_inventory_item_id
    and location_id = p_location_id
  for update;

  if current_quantity + quantity_delta < 0 then
    raise exception 'El movimiento dejaría el stock en negativo.';
  end if;

  update public.inventory_quantity_stock
  set
    quantity = current_quantity + quantity_delta,
    updated_at = now()
  where inventory_item_id = p_inventory_item_id
    and location_id = p_location_id;

  insert into public.inventory_movements (
    inventory_item_id,
    location_id,
    movement_type,
    quantity,
    balance_after,
    notes,
    performed_by_user_id,
    occurred_at
  )
  values (
    p_inventory_item_id,
    p_location_id,
    p_movement_type,
    p_quantity,
    current_quantity + quantity_delta,
    nullif(btrim(p_notes), ''),
    p_performed_by_user_id,
    p_occurred_at
  )
  returning * into movement;

  return movement;
end;
$$;

revoke all on function public.record_quantity_stock_movement(
  uuid,
  uuid,
  public.inventory_movement_type,
  numeric,
  text,
  uuid,
  timestamptz
) from public, anon, authenticated;
grant execute on function public.record_quantity_stock_movement(
  uuid,
  uuid,
  public.inventory_movement_type,
  numeric,
  text,
  uuid,
  timestamptz
) to service_role;

revoke all on table public.inventory_quantity_stock from anon, authenticated;
revoke all on table public.inventory_movements from anon, authenticated;

grant select on table public.inventory_quantity_stock, public.inventory_movements to authenticated;
grant all privileges on table public.inventory_quantity_stock, public.inventory_movements to service_role;

alter table public.inventory_quantity_stock enable row level security;
alter table public.inventory_movements enable row level security;

create policy "inventory staff can read current quantity stock"
on public.inventory_quantity_stock
for select
to authenticated
using ((select private.has_any_role(array['ADMIN', 'MANAGER']::public.role_code[])));

create policy "inventory staff can read inventory movements"
on public.inventory_movements
for select
to authenticated
using ((select private.has_any_role(array['ADMIN', 'MANAGER']::public.role_code[])));

create view public.inventory_current_stock
with (security_invoker = true)
as
select
  stock.inventory_item_id,
  item.code as inventory_item_code,
  item.name as inventory_item_name,
  item.unit_of_measure,
  stock.location_id,
  location.code as location_code,
  location.name as location_name,
  stock.quantity,
  stock.updated_at
from public.inventory_quantity_stock as stock
join public.inventory_items as item on item.id = stock.inventory_item_id
join public.inventory_locations as location on location.id = stock.location_id;

revoke all on table public.inventory_current_stock from anon, authenticated;
grant select on table public.inventory_current_stock to authenticated, service_role;

comment on table public.inventory_movements is
  'Kardex inmutable de movimientos de artículos QUANTITY; balance_after permite auditoría rápida.';
comment on table public.inventory_quantity_stock is
  'Saldo transaccional por artículo y ubicación, actualizado exclusivamente por record_quantity_stock_movement.';
