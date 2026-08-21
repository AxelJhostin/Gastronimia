-- Consulta de disponibilidad preliminar. Las reservas y préstamos se descontarán
-- en fases posteriores; por ahora se consideran existencias y estados físicos.

create function public.calculate_inventory_availability(
  p_inventory_item_id uuid,
  p_start_at timestamptz,
  p_end_at timestamptz
)
returns table (
  tracking_mode public.inventory_tracking_mode,
  quantity_available numeric(14, 3),
  units_available integer
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  item_tracking_mode public.inventory_tracking_mode;
begin
  if p_start_at is null or p_end_at is null or p_end_at <= p_start_at then
    raise exception 'El intervalo de disponibilidad debe tener una fecha de fin posterior a la de inicio.';
  end if;

  select item.tracking_mode
  into item_tracking_mode
  from public.inventory_items as item
  where item.id = p_inventory_item_id
    and item.is_active;

  if not found then
    raise exception 'El artículo debe existir y estar activo.';
  end if;

  if item_tracking_mode = 'QUANTITY' then
    return query
    select
      item_tracking_mode,
      coalesce(sum(stock.quantity), 0)::numeric(14, 3),
      0
    from public.inventory_quantity_stock as stock
    where stock.inventory_item_id = p_inventory_item_id;
  else
    return query
    select
      item_tracking_mode,
      0::numeric(14, 3),
      count(*)::integer
    from public.inventory_units as unit
    where unit.inventory_item_id = p_inventory_item_id
      and unit.is_active
      and unit.status = 'AVAILABLE';
  end if;
end;
$$;

revoke all on function public.calculate_inventory_availability(
  uuid,
  timestamptz,
  timestamptz
) from public, anon, authenticated;
grant execute on function public.calculate_inventory_availability(
  uuid,
  timestamptz,
  timestamptz
) to service_role;

comment on function public.calculate_inventory_availability(uuid, timestamptz, timestamptz) is
  'Disponibilidad preliminar por intervalo. Considera stock actual o unidades AVAILABLE; reservas y préstamos se integran en sus fases operativas.';
