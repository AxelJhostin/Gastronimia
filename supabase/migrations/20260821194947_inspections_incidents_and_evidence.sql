create type public.equipment_inspection_stage as enum ('OUTBOUND', 'RETURN');
create type public.equipment_incident_type as enum (
  'DAMAGE', 'MISSING', 'BREAKAGE', 'DIRTINESS', 'INCOMPLETE', 'WEAR', 'FAILURE'
);
create type public.equipment_incident_severity as enum ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

create table public.equipment_inspections (
  id uuid primary key default extensions.gen_random_uuid(),
  equipment_request_id uuid not null references public.equipment_requests (id) on delete restrict,
  equipment_loan_id uuid references public.equipment_loans (id) on delete restrict,
  equipment_return_id uuid unique references public.equipment_returns (id) on delete restrict,
  stage public.equipment_inspection_stage not null,
  inspected_by_user_id uuid not null references public.users (id) on delete restrict,
  inspected_at timestamptz not null default now(),
  notes text,
  check (
    (stage = 'OUTBOUND' and equipment_loan_id is null and equipment_return_id is null)
    or (stage = 'RETURN' and equipment_loan_id is not null and equipment_return_id is not null)
  )
);
create unique index equipment_inspections_one_outbound_per_request_idx
on public.equipment_inspections (equipment_request_id) where stage = 'OUTBOUND';
create index equipment_inspections_loan_stage_idx
on public.equipment_inspections (equipment_loan_id, inspected_at desc) where stage = 'RETURN';

create table public.equipment_inspection_details (
  id uuid primary key default extensions.gen_random_uuid(),
  equipment_inspection_id uuid not null references public.equipment_inspections (id) on delete restrict,
  inventory_unit_id uuid not null references public.inventory_units (id) on delete restrict,
  outbound_condition public.inventory_unit_condition,
  observed_condition public.inventory_unit_condition not null,
  is_complete boolean not null default true,
  unique (equipment_inspection_id, inventory_unit_id)
);
create index equipment_inspection_details_unit_idx on public.equipment_inspection_details (inventory_unit_id);

create table public.equipment_incidents (
  id uuid primary key default extensions.gen_random_uuid(),
  equipment_inspection_detail_id uuid not null references public.equipment_inspection_details (id) on delete restrict,
  incident_type public.equipment_incident_type not null,
  severity public.equipment_incident_severity not null,
  description text not null check (char_length(btrim(description)) > 0),
  requires_unavailable boolean not null,
  created_at timestamptz not null default now()
);
create index equipment_incidents_detail_idx on public.equipment_incidents (equipment_inspection_detail_id);

create table public.equipment_incident_evidences (
  id uuid primary key default extensions.gen_random_uuid(),
  equipment_incident_id uuid not null references public.equipment_incidents (id) on delete restrict,
  storage_path text not null unique check (storage_path like '%.jpg' or storage_path like '%.jpeg' or storage_path like '%.png' or storage_path like '%.webp'),
  uploaded_by_user_id uuid not null references public.users (id) on delete restrict,
  created_at timestamptz not null default now()
);
create index equipment_incident_evidences_incident_idx on public.equipment_incident_evidences (equipment_incident_id);

create function private.require_outbound_inspection()
returns trigger language plpgsql set search_path = '' as $$
begin
  if not exists (
    select 1 from public.equipment_inspections as inspection
    where inspection.equipment_request_id = new.equipment_request_id and inspection.stage = 'OUTBOUND'
  ) then
    raise exception 'La entrega requiere una inspección previa completa.';
  end if;
  return new;
end;
$$;
create trigger equipment_loans_require_outbound_inspection
before insert on public.equipment_loans
for each row execute function private.require_outbound_inspection();

create function public.record_outbound_inspection(
  p_equipment_request_id uuid, p_inspected_by_user_id uuid, p_notes text, p_items jsonb
)
returns public.equipment_inspections
language plpgsql security invoker set search_path = '' as $$
declare request_record public.equipment_requests; inspection public.equipment_inspections; payload jsonb; prepared_unit record;
begin
  if not private.is_active_request_reviewer(p_inspected_by_user_id) then raise exception 'Solo el personal autorizado puede inspeccionar.'; end if;
  if jsonb_typeof(p_items) <> 'array' then raise exception 'Los elementos inspeccionados deben ser una lista.'; end if;
  select * into request_record from public.equipment_requests where id = p_equipment_request_id for update;
  if not found or request_record.status <> 'PREPARED' then raise exception 'Solo una solicitud preparada puede inspeccionarse antes de entregar.'; end if;
  insert into public.equipment_inspections (equipment_request_id, stage, inspected_by_user_id, notes)
  values (request_record.id, 'OUTBOUND', p_inspected_by_user_id, p_notes) returning * into inspection;
  for payload in select value from jsonb_array_elements(p_items) loop
    if not exists (
      select 1 from public.equipment_preparation_units pu join public.equipment_preparation_details pd on pd.id=pu.equipment_preparation_detail_id join public.equipment_preparations p on p.id=pd.equipment_preparation_id
      where p.equipment_request_id=request_record.id and pu.inventory_unit_id=(payload->>'inventory_unit_id')::uuid and pu.is_active
    ) then raise exception 'La unidad no pertenece a la preparación activa.'; end if;
    insert into public.equipment_inspection_details (equipment_inspection_id, inventory_unit_id, observed_condition, is_complete)
    values (inspection.id, (payload->>'inventory_unit_id')::uuid, (payload->>'observed_condition')::public.inventory_unit_condition, coalesce((payload->>'is_complete')::boolean, true));
  end loop;
  if exists (
    select 1 from public.equipment_preparation_units pu join public.equipment_preparation_details pd on pd.id=pu.equipment_preparation_detail_id join public.equipment_preparations p on p.id=pd.equipment_preparation_id
    where p.equipment_request_id=request_record.id and pu.is_active and not exists (select 1 from public.equipment_inspection_details d where d.equipment_inspection_id=inspection.id and d.inventory_unit_id=pu.inventory_unit_id)
  ) then raise exception 'La inspección previa debe cubrir todas las unidades preparadas.'; end if;
  return inspection;
end;
$$;

create or replace function public.record_equipment_return(
  p_equipment_loan_id uuid, p_returned_by_name text, p_received_by_user_id uuid,
  p_quantity_details jsonb default '[]'::jsonb, p_loan_unit_ids jsonb default '[]'::jsonb
) returns public.equipment_returns
language plpgsql security invoker set search_path = '' as $$
declare loan_record public.equipment_loans; returned_record public.equipment_returns; payload jsonb; unit_id text; detail_record record; amount numeric; already_returned numeric; stock numeric; all_quantity_returned boolean; all_units_returned boolean;
begin
  if nullif(btrim(p_returned_by_name), '') is null or jsonb_typeof(p_quantity_details) <> 'array' or jsonb_typeof(p_loan_unit_ids) <> 'array' or (jsonb_array_length(p_quantity_details)=0 and jsonb_array_length(p_loan_unit_ids)=0) then raise exception 'La devolución debe incluir al menos una cantidad o una unidad.'; end if;
  if not private.is_active_request_reviewer(p_received_by_user_id) then raise exception 'Solo el personal autorizado puede recibir devoluciones.'; end if;
  select * into loan_record from public.equipment_loans where id=p_equipment_loan_id for update; if not found or loan_record.status='CLOSED' then raise exception 'El préstamo no existe o ya fue cerrado.'; end if;
  insert into public.equipment_returns (equipment_loan_id,returned_by_name,received_by_user_id) values (loan_record.id,nullif(btrim(p_returned_by_name),''),p_received_by_user_id) returning * into returned_record;
  for payload in select value from jsonb_array_elements(p_quantity_details) loop
    amount := (payload->>'returned_quantity')::numeric;
    select ld.id loan_detail_id, rd.inventory_item_id, ld.loaned_quantity into detail_record from public.equipment_loan_details ld join public.equipment_reservation_details rd on rd.id=ld.equipment_reservation_detail_id where ld.id=(payload->>'equipment_loan_detail_id')::uuid and ld.equipment_loan_id=loan_record.id;
    if not found or amount<=0 or (payload->>'location_id') is null then raise exception 'El detalle cuantitativo devuelto es inválido.'; end if;
    select coalesce(sum(x.returned_quantity),0) into already_returned from public.equipment_return_details x join public.equipment_returns r on r.id=x.equipment_return_id where r.equipment_loan_id=loan_record.id and x.equipment_loan_detail_id=detail_record.loan_detail_id;
    if already_returned+amount>detail_record.loaned_quantity then raise exception 'No se puede devolver más de lo prestado.'; end if;
    insert into public.inventory_quantity_stock(inventory_item_id,location_id,quantity) values(detail_record.inventory_item_id,(payload->>'location_id')::uuid,0) on conflict do nothing;
    select quantity into stock from public.inventory_quantity_stock where inventory_item_id=detail_record.inventory_item_id and location_id=(payload->>'location_id')::uuid for update;
    update public.inventory_quantity_stock set quantity=stock+amount,updated_at=now() where inventory_item_id=detail_record.inventory_item_id and location_id=(payload->>'location_id')::uuid;
    insert into public.inventory_movements(inventory_item_id,location_id,movement_type,quantity,balance_after,notes,performed_by_user_id) values(detail_record.inventory_item_id,(payload->>'location_id')::uuid,'RETURN_IN',amount,stock+amount,'Devolución de préstamo',p_received_by_user_id);
    insert into public.equipment_return_details(equipment_return_id,equipment_loan_detail_id,returned_quantity,location_id) values(returned_record.id,detail_record.loan_detail_id,amount,(payload->>'location_id')::uuid);
  end loop;
  for unit_id in select value from jsonb_array_elements_text(p_loan_unit_ids) loop
    update public.inventory_units u set status='MAINTENANCE' from public.equipment_loan_units lu join public.equipment_preparation_units pu on pu.id=lu.equipment_preparation_unit_id where lu.id=unit_id::uuid and lu.equipment_loan_id=loan_record.id and u.id=pu.inventory_unit_id and u.status='LOANED';
    if not found then raise exception 'La unidad no pertenece al préstamo o no está pendiente de devolución.'; end if;
    update public.equipment_preparation_units pu set is_active=false from public.equipment_loan_units lu where lu.id=unit_id::uuid and lu.equipment_loan_id=loan_record.id and pu.id=lu.equipment_preparation_unit_id;
    insert into public.equipment_return_units(equipment_return_id,equipment_loan_unit_id) values(returned_record.id,unit_id::uuid);
  end loop;
  select not exists(select 1 from public.equipment_loan_details ld where ld.equipment_loan_id=loan_record.id and coalesce((select sum(rd.returned_quantity) from public.equipment_return_details rd join public.equipment_returns r on r.id=rd.equipment_return_id where r.equipment_loan_id=loan_record.id and rd.equipment_loan_detail_id=ld.id),0)<ld.loaned_quantity) into all_quantity_returned;
  select not exists(select 1 from public.equipment_loan_units lu where lu.equipment_loan_id=loan_record.id and not exists(select 1 from public.equipment_return_units ru where ru.equipment_loan_unit_id=lu.id)) into all_units_returned;
  if all_quantity_returned and all_units_returned then update public.equipment_loans set status='CLOSED',closed_at=now() where id=loan_record.id; update public.equipment_requests set status='CLOSED' where id=loan_record.equipment_request_id; else update public.equipment_loans set status='PARTIALLY_RETURNED' where id=loan_record.id; end if;
  return returned_record;
end;
$$;

create function public.record_return_inspection(
  p_equipment_return_id uuid, p_inspected_by_user_id uuid, p_notes text, p_items jsonb
) returns public.equipment_inspections
language plpgsql security invoker set search_path = '' as $$
declare returned_record public.equipment_returns; inspection public.equipment_inspections; payload jsonb; detail_id uuid; incident jsonb; unavailable boolean;
begin
  if not private.is_active_request_reviewer(p_inspected_by_user_id) then raise exception 'Solo el personal autorizado puede inspeccionar.'; end if;
  if jsonb_typeof(p_items) <> 'array' then raise exception 'Los elementos inspeccionados deben ser una lista.'; end if;
  select * into returned_record from public.equipment_returns where id=p_equipment_return_id for update; if not found then raise exception 'La devolución no existe.'; end if;
  insert into public.equipment_inspections(equipment_request_id,equipment_loan_id,equipment_return_id,stage,inspected_by_user_id,notes)
  select loan.equipment_request_id,loan.id,returned_record.id,'RETURN',p_inspected_by_user_id,p_notes from public.equipment_loans loan where loan.id=returned_record.equipment_loan_id returning * into inspection;
  for payload in select value from jsonb_array_elements(p_items) loop
    if not exists(select 1 from public.equipment_return_units ru join public.equipment_loan_units lu on lu.id=ru.equipment_loan_unit_id join public.equipment_preparation_units pu on pu.id=lu.equipment_preparation_unit_id where ru.equipment_return_id=returned_record.id and pu.inventory_unit_id=(payload->>'inventory_unit_id')::uuid) then raise exception 'La unidad no pertenece a esta devolución.'; end if;
    insert into public.equipment_inspection_details(equipment_inspection_id,inventory_unit_id,outbound_condition,observed_condition,is_complete)
    select inspection.id,unit.id,outbound.observed_condition,(payload->>'observed_condition')::public.inventory_unit_condition,coalesce((payload->>'is_complete')::boolean,true) from public.inventory_units unit left join public.equipment_inspections outbound_i on outbound_i.equipment_request_id=inspection.equipment_request_id and outbound_i.stage='OUTBOUND' left join public.equipment_inspection_details outbound on outbound.equipment_inspection_id=outbound_i.id and outbound.inventory_unit_id=unit.id where unit.id=(payload->>'inventory_unit_id')::uuid returning id into detail_id;
    unavailable := not coalesce((payload->>'is_complete')::boolean,true) or (payload->>'observed_condition')='DAMAGED';
    for incident in select value from jsonb_array_elements(coalesce(payload->'incidents','[]'::jsonb)) loop
      unavailable := unavailable or (incident->>'incident_type') in ('DAMAGE','MISSING','BREAKAGE','FAILURE');
      insert into public.equipment_incidents(equipment_inspection_detail_id,incident_type,severity,description,requires_unavailable) values(detail_id,(incident->>'incident_type')::public.equipment_incident_type,(incident->>'severity')::public.equipment_incident_severity,incident->>'description',(incident->>'incident_type') in ('DAMAGE','MISSING','BREAKAGE','FAILURE'));
    end loop;
    update public.inventory_units set condition=(payload->>'observed_condition')::public.inventory_unit_condition,status=case when unavailable then 'MAINTENANCE'::public.inventory_unit_status else 'AVAILABLE'::public.inventory_unit_status end where id=(payload->>'inventory_unit_id')::uuid and status='MAINTENANCE';
  end loop;
  if exists(select 1 from public.equipment_return_units ru join public.equipment_loan_units lu on lu.id=ru.equipment_loan_unit_id join public.equipment_preparation_units pu on pu.id=lu.equipment_preparation_unit_id where ru.equipment_return_id=returned_record.id and not exists(select 1 from public.equipment_inspection_details d where d.equipment_inspection_id=inspection.id and d.inventory_unit_id=pu.inventory_unit_id)) then raise exception 'La inspección de devolución debe cubrir todas las unidades devueltas.'; end if;
  return inspection;
end;
$$;

create function public.register_equipment_incident_evidence(p_equipment_incident_id uuid,p_storage_path text,p_uploaded_by_user_id uuid)
returns public.equipment_incident_evidences language plpgsql security invoker set search_path = '' as $$
declare evidence public.equipment_incident_evidences;
begin
  if not private.is_active_request_reviewer(p_uploaded_by_user_id) then raise exception 'Solo el personal autorizado puede registrar evidencias.'; end if;
  if split_part(p_storage_path,'/',1) <> p_uploaded_by_user_id::text then raise exception 'La evidencia debe pertenecer a la carpeta del usuario que la registra.'; end if;
  if not exists(select 1 from public.equipment_incidents where id=p_equipment_incident_id) then raise exception 'La novedad no existe.'; end if;
  insert into public.equipment_incident_evidences(equipment_incident_id,storage_path,uploaded_by_user_id) values(p_equipment_incident_id,p_storage_path,p_uploaded_by_user_id) returning * into evidence;
  return evidence;
end;
$$;

revoke all on function public.record_outbound_inspection(uuid,uuid,text,jsonb), public.record_return_inspection(uuid,uuid,text,jsonb), public.register_equipment_incident_evidence(uuid,text,uuid) from public,anon,authenticated;
grant execute on function public.record_outbound_inspection(uuid,uuid,text,jsonb), public.record_return_inspection(uuid,uuid,text,jsonb), public.register_equipment_incident_evidence(uuid,text,uuid) to service_role;
revoke all on table public.equipment_inspections,public.equipment_inspection_details,public.equipment_incidents,public.equipment_incident_evidences from anon,authenticated;
grant select on table public.equipment_inspections,public.equipment_inspection_details,public.equipment_incidents,public.equipment_incident_evidences to authenticated;
grant all on table public.equipment_inspections,public.equipment_inspection_details,public.equipment_incidents,public.equipment_incident_evidences to service_role;
alter table public.equipment_inspections enable row level security;
alter table public.equipment_inspection_details enable row level security;
alter table public.equipment_incidents enable row level security;
alter table public.equipment_incident_evidences enable row level security;
create policy "request owners and staff can read inspections" on public.equipment_inspections for select to authenticated using (exists(select 1 from public.equipment_requests request where request.id=equipment_inspections.equipment_request_id and (request.teacher_id=(select private.current_teacher_id()) or (select private.has_any_role(array['ADMIN','MANAGER']::public.role_code[])))));
create policy "request owners and staff can read inspection details" on public.equipment_inspection_details for select to authenticated using (exists(select 1 from public.equipment_inspections inspection join public.equipment_requests request on request.id=inspection.equipment_request_id where inspection.id=equipment_inspection_details.equipment_inspection_id and (request.teacher_id=(select private.current_teacher_id()) or (select private.has_any_role(array['ADMIN','MANAGER']::public.role_code[])))));
create policy "request owners and staff can read incidents" on public.equipment_incidents for select to authenticated using (exists(select 1 from public.equipment_inspection_details detail join public.equipment_inspections inspection on inspection.id=detail.equipment_inspection_id join public.equipment_requests request on request.id=inspection.equipment_request_id where detail.id=equipment_incidents.equipment_inspection_detail_id and (request.teacher_id=(select private.current_teacher_id()) or (select private.has_any_role(array['ADMIN','MANAGER']::public.role_code[])))));
create policy "request owners and staff can read incident evidences" on public.equipment_incident_evidences for select to authenticated using (exists(select 1 from public.equipment_incidents incident join public.equipment_inspection_details detail on detail.id=incident.equipment_inspection_detail_id join public.equipment_inspections inspection on inspection.id=detail.equipment_inspection_id join public.equipment_requests request on request.id=inspection.equipment_request_id where incident.id=equipment_incident_evidences.equipment_incident_id and (request.teacher_id=(select private.current_teacher_id()) or (select private.has_any_role(array['ADMIN','MANAGER']::public.role_code[])))));
