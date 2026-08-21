create type public.equipment_maintenance_type as enum ('PREVENTIVE', 'CORRECTIVE', 'INSPECTION');
create type public.equipment_maintenance_status as enum ('OPEN', 'COMPLETED', 'CANCELLED');

create table public.equipment_maintenances (
  id uuid primary key default extensions.gen_random_uuid(),
  inventory_unit_id uuid not null references public.inventory_units (id) on delete restrict,
  maintenance_type public.equipment_maintenance_type not null,
  status public.equipment_maintenance_status not null default 'OPEN',
  reason text not null check (char_length(btrim(reason)) > 0),
  description text,
  created_by_user_id uuid not null references public.users (id) on delete restrict,
  started_at timestamptz not null default now(),
  completed_by_user_id uuid references public.users (id) on delete restrict,
  completed_at timestamptz,
  resolution text,
  check ((status = 'OPEN') = (completed_at is null)),
  check ((completed_by_user_id is null) = (completed_at is null))
);
create unique index equipment_maintenances_one_open_unit_idx on public.equipment_maintenances (inventory_unit_id) where status = 'OPEN';
create index equipment_maintenances_open_started_idx on public.equipment_maintenances (started_at asc) where status = 'OPEN';

create table public.equipment_maintenance_evidences (
  id uuid primary key default extensions.gen_random_uuid(),
  equipment_maintenance_id uuid not null references public.equipment_maintenances (id) on delete restrict,
  storage_path text not null unique check (storage_path like '%.jpg' or storage_path like '%.jpeg' or storage_path like '%.png' or storage_path like '%.webp'),
  uploaded_by_user_id uuid not null references public.users (id) on delete restrict,
  created_at timestamptz not null default now()
);
create index equipment_maintenance_evidences_maintenance_idx on public.equipment_maintenance_evidences (equipment_maintenance_id);

create function public.start_equipment_maintenance(
  p_inventory_unit_id uuid, p_maintenance_type public.equipment_maintenance_type,
  p_reason text, p_description text, p_created_by_user_id uuid
) returns public.equipment_maintenances
language plpgsql security invoker set search_path = '' as $$
declare maintenance public.equipment_maintenances;
begin
  if not private.is_active_request_reviewer(p_created_by_user_id) then raise exception 'Solo el personal autorizado puede iniciar mantenimiento.'; end if;
  if nullif(btrim(p_reason),'') is null then raise exception 'Debe registrar el motivo del mantenimiento.'; end if;
  if not exists(select 1 from public.inventory_units where id=p_inventory_unit_id and is_active and status <> 'LOANED') then raise exception 'La unidad no existe, está prestada o está inactiva.'; end if;
  update public.inventory_units set status='MAINTENANCE' where id=p_inventory_unit_id and status <> 'MAINTENANCE';
  insert into public.equipment_maintenances(inventory_unit_id,maintenance_type,reason,description,created_by_user_id)
  values(p_inventory_unit_id,p_maintenance_type,nullif(btrim(p_reason),''),p_description,p_created_by_user_id) returning * into maintenance;
  return maintenance;
end;
$$;

create function public.finish_equipment_maintenance(
  p_equipment_maintenance_id uuid, p_resolution text, p_final_status public.inventory_unit_status,
  p_final_condition public.inventory_unit_condition, p_completed_by_user_id uuid
) returns public.equipment_maintenances
language plpgsql security invoker set search_path = '' as $$
declare maintenance public.equipment_maintenances;
begin
  if not private.is_active_request_reviewer(p_completed_by_user_id) then raise exception 'Solo el personal autorizado puede finalizar mantenimiento.'; end if;
  select * into maintenance from public.equipment_maintenances where id=p_equipment_maintenance_id for update;
  if not found or maintenance.status <> 'OPEN' then raise exception 'El mantenimiento no existe o ya fue cerrado.'; end if;
  if p_final_status not in ('AVAILABLE','MAINTENANCE','DISABLED') then raise exception 'El estado final no está permitido.'; end if;
  if p_final_status='AVAILABLE' and p_final_condition='DAMAGED' then raise exception 'Una unidad dañada no puede volver a estar disponible.'; end if;
  update public.inventory_units set status=p_final_status,condition=p_final_condition where id=maintenance.inventory_unit_id and status='MAINTENANCE';
  if not found then raise exception 'La unidad debe estar en mantenimiento para finalizarlo.'; end if;
  update public.equipment_maintenances set status='COMPLETED',completed_by_user_id=p_completed_by_user_id,completed_at=now(),resolution=p_resolution where id=maintenance.id returning * into maintenance;
  return maintenance;
end;
$$;

create function public.cancel_equipment_maintenance(
  p_equipment_maintenance_id uuid, p_resolution text, p_final_status public.inventory_unit_status,
  p_completed_by_user_id uuid
) returns public.equipment_maintenances
language plpgsql security invoker set search_path = '' as $$
declare maintenance public.equipment_maintenances; unit_condition public.inventory_unit_condition;
begin
  if not private.is_active_request_reviewer(p_completed_by_user_id) then raise exception 'Solo el personal autorizado puede cancelar mantenimiento.'; end if;
  select * into maintenance from public.equipment_maintenances where id=p_equipment_maintenance_id for update;
  if not found or maintenance.status <> 'OPEN' then raise exception 'El mantenimiento no existe o ya fue cerrado.'; end if;
  select condition into unit_condition from public.inventory_units where id=maintenance.inventory_unit_id for update;
  if p_final_status not in ('AVAILABLE','MAINTENANCE','DISABLED') or (p_final_status='AVAILABLE' and unit_condition='DAMAGED') then raise exception 'El estado final no es seguro.'; end if;
  update public.inventory_units set status=p_final_status where id=maintenance.inventory_unit_id and status='MAINTENANCE';
  update public.equipment_maintenances set status='CANCELLED',completed_by_user_id=p_completed_by_user_id,completed_at=now(),resolution=p_resolution where id=maintenance.id returning * into maintenance;
  return maintenance;
end;
$$;

create function public.register_equipment_maintenance_evidence(p_equipment_maintenance_id uuid,p_storage_path text,p_uploaded_by_user_id uuid)
returns public.equipment_maintenance_evidences language plpgsql security invoker set search_path = '' as $$
declare evidence public.equipment_maintenance_evidences;
begin
  if not private.is_active_request_reviewer(p_uploaded_by_user_id) then raise exception 'Solo el personal autorizado puede registrar evidencias.'; end if;
  if split_part(p_storage_path,'/',1) <> p_uploaded_by_user_id::text then raise exception 'La evidencia debe pertenecer a la carpeta del usuario que la registra.'; end if;
  if not exists(select 1 from public.equipment_maintenances where id=p_equipment_maintenance_id) then raise exception 'El mantenimiento no existe.'; end if;
  insert into public.equipment_maintenance_evidences(equipment_maintenance_id,storage_path,uploaded_by_user_id) values(p_equipment_maintenance_id,p_storage_path,p_uploaded_by_user_id) returning * into evidence;
  return evidence;
end;
$$;

revoke all on function public.start_equipment_maintenance(uuid,public.equipment_maintenance_type,text,text,uuid),public.finish_equipment_maintenance(uuid,text,public.inventory_unit_status,public.inventory_unit_condition,uuid),public.cancel_equipment_maintenance(uuid,text,public.inventory_unit_status,uuid),public.register_equipment_maintenance_evidence(uuid,text,uuid) from public,anon,authenticated;
grant execute on function public.start_equipment_maintenance(uuid,public.equipment_maintenance_type,text,text,uuid),public.finish_equipment_maintenance(uuid,text,public.inventory_unit_status,public.inventory_unit_condition,uuid),public.cancel_equipment_maintenance(uuid,text,public.inventory_unit_status,uuid),public.register_equipment_maintenance_evidence(uuid,text,uuid) to service_role;
revoke all on table public.equipment_maintenances,public.equipment_maintenance_evidences from anon,authenticated;
grant select on table public.equipment_maintenances,public.equipment_maintenance_evidences to authenticated;
grant all on table public.equipment_maintenances,public.equipment_maintenance_evidences to service_role;
alter table public.equipment_maintenances enable row level security;
alter table public.equipment_maintenance_evidences enable row level security;
create policy "inventory staff read maintenances" on public.equipment_maintenances for select to authenticated using ((select private.has_any_role(array['ADMIN','MANAGER']::public.role_code[])));
create policy "inventory staff read maintenance evidences" on public.equipment_maintenance_evidences for select to authenticated using ((select private.has_any_role(array['ADMIN','MANAGER']::public.role_code[])));
