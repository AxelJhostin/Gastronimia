create function private.audit_equipment_delivery()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  insert into public.operational_audit_log (
    action,
    entity_table,
    entity_id,
    performed_by_user_id,
    current_data
  ) values (
    'DELIVERY_RECORDED',
    'equipment_loans',
    new.id,
    new.delivered_by_user_id,
    to_jsonb(new)
  );
  return new;
end;
$$;

create trigger equipment_loans_audit_after_insert
after insert on public.equipment_loans
for each row execute function private.audit_equipment_delivery();

revoke all on function private.audit_equipment_delivery() from public;
grant execute on function private.audit_equipment_delivery() to service_role;
