-- Datos visuales y operativos exclusivos para Supabase local.
-- Se ejecuta mediante scripts/seed-demo-local.sh, que valida la URL loopback.

begin;

update public.users set full_name = 'Axel Hernández', is_active = true where id = :'admin_id'::uuid;
update public.users set full_name = 'María Encargada', is_active = true where id = :'manager_id'::uuid;
update public.users set full_name = 'Daniela Docente', is_active = true where id = :'teacher_user_id'::uuid;

delete from public.user_roles where user_id in (:'manager_id'::uuid, :'teacher_user_id'::uuid);
insert into public.user_roles (user_id, role_id) values
  (:'admin_id'::uuid, 1),
  (:'manager_id'::uuid, 2),
  (:'teacher_user_id'::uuid, 3)
on conflict do nothing;

insert into public.teachers (id, user_id, employee_code) values
  ('10000000-0000-4000-8000-000000000001', :'teacher_user_id'::uuid, 'DOC-DEMO-01')
on conflict (id) do update set user_id = excluded.user_id, employee_code = excluded.employee_code, is_active = true;

insert into public.academic_periods (id, name, start_date, end_date) values
  ('20000000-0000-4000-8000-000000000001', 'Periodo demostración 2026', '2026-01-01', '2026-12-31')
on conflict (id) do update set name = excluded.name, start_date = excluded.start_date, end_date = excluded.end_date, is_active = true;

insert into public.subjects (id, code, name) values
  ('30000000-0000-4000-8000-000000000001', 'GAS-301', 'Cocina ecuatoriana'),
  ('30000000-0000-4000-8000-000000000002', 'PAS-204', 'Pastelería aplicada')
on conflict (id) do update set code = excluded.code, name = excluded.name, is_active = true;

insert into public.course_sections (id, subject_id, teacher_id, academic_period_id, section, semester) values
  ('40000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'A', '5'),
  ('40000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'B', '4')
on conflict (id) do update set subject_id = excluded.subject_id, teacher_id = excluded.teacher_id, academic_period_id = excluded.academic_period_id, section = excluded.section, semester = excluded.semester, is_active = true;

insert into public.laboratories (id, code, name, location_description) values
  ('50000000-0000-4000-8000-000000000001', 'LAB-COC-01', 'Cocina caliente', 'Bloque gastronómico, planta baja'),
  ('50000000-0000-4000-8000-000000000002', 'LAB-PAS-02', 'Laboratorio de pastelería', 'Bloque gastronómico, primer piso')
on conflict (id) do update set code = excluded.code, name = excluded.name, location_description = excluded.location_description, is_active = true;

insert into public.inventory_categories (id, name, description) values
  ('60000000-0000-4000-8000-000000000001', 'Cuchillería demo', 'Cuchillos y herramientas de corte para prácticas'),
  ('60000000-0000-4000-8000-000000000002', 'Equipos eléctricos demo', 'Equipos individualizados con trazabilidad'),
  ('60000000-0000-4000-8000-000000000003', 'Menaje demo', 'Utensilios y recipientes de cocina')
on conflict (id) do update set name = excluded.name, description = excluded.description, is_active = true;

insert into public.inventory_locations (id, code, name, description) values
  ('70000000-0000-4000-8000-000000000001', 'BOD-A', 'Bodega principal', 'Estanterías A–D'),
  ('70000000-0000-4000-8000-000000000002', 'LAB-RES', 'Reserva de laboratorio', 'Material preparado para clases')
on conflict (id) do update set code = excluded.code, name = excluded.name, description = excluded.description, is_active = true;

insert into public.inventory_items (id, category_id, code, name, description, tracking_mode, unit_of_measure) values
  ('80000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000001', 'CUCH-001', 'Cuchillo de chef 8 pulgadas', 'Acero inoxidable, mango antideslizante', 'QUANTITY', 'unidad'),
  ('80000000-0000-4000-8000-000000000002', '60000000-0000-4000-8000-000000000003', 'BOWL-002', 'Bowl de acero mediano', 'Capacidad de 3 litros', 'QUANTITY', 'unidad'),
  ('80000000-0000-4000-8000-000000000003', '60000000-0000-4000-8000-000000000003', 'MANGA-003', 'Manga pastelera reutilizable', 'Manga reforzada de 40 cm', 'QUANTITY', 'unidad'),
  ('80000000-0000-4000-8000-000000000004', '60000000-0000-4000-8000-000000000002', 'BAT-004', 'Batidora planetaria', 'Equipo de 7 litros con accesorios', 'INDIVIDUAL', 'equipo'),
  ('80000000-0000-4000-8000-000000000005', '60000000-0000-4000-8000-000000000002', 'LIC-005', 'Licuadora industrial', 'Vaso de acero inoxidable de 2 litros', 'INDIVIDUAL', 'equipo')
on conflict (id) do update set category_id = excluded.category_id, code = excluded.code, name = excluded.name, description = excluded.description, tracking_mode = excluded.tracking_mode, unit_of_measure = excluded.unit_of_measure, is_active = true;

insert into public.inventory_quantity_stock (inventory_item_id, location_id, quantity) values
  ('80000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000001', 24),
  ('80000000-0000-4000-8000-000000000002', '70000000-0000-4000-8000-000000000001', 18),
  ('80000000-0000-4000-8000-000000000003', '70000000-0000-4000-8000-000000000001', 6)
on conflict (inventory_item_id, location_id) do update set quantity = excluded.quantity, updated_at = now();

insert into public.inventory_units (id, inventory_item_id, location_id, asset_tag, serial_number, status, condition, notes) values
  ('90000000-0000-4000-8000-000000000001', '80000000-0000-4000-8000-000000000004', '70000000-0000-4000-8000-000000000001', 'EQ-BAT-001', 'BAT-DEMO-001', 'AVAILABLE', 'GOOD', 'Lista para prácticas'),
  ('90000000-0000-4000-8000-000000000002', '80000000-0000-4000-8000-000000000004', '70000000-0000-4000-8000-000000000001', 'EQ-BAT-002', 'BAT-DEMO-002', 'MAINTENANCE', 'FAIR', 'Ruido en el cabezal'),
  ('90000000-0000-4000-8000-000000000003', '80000000-0000-4000-8000-000000000005', '70000000-0000-4000-8000-000000000001', 'EQ-LIC-001', 'LIC-DEMO-001', 'AVAILABLE', 'NEW', 'Ingreso reciente')
on conflict (id) do update set inventory_item_id = excluded.inventory_item_id, location_id = excluded.location_id, asset_tag = excluded.asset_tag, serial_number = excluded.serial_number, status = excluded.status, condition = excluded.condition, notes = excluded.notes, is_active = true;

insert into public.equipment_requests (id, teacher_id, course_section_id, laboratory_id, start_at, end_at, purpose, status, submitted_at, created_at) values
  ('a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000001', now() + interval '2 days', now() + interval '2 days 3 hours', 'Práctica de cortes y fondos ecuatorianos', 'PENDING', now() - interval '2 hours', now() - interval '1 day'),
  ('a0000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000002', '50000000-0000-4000-8000-000000000002', now() + interval '5 days', now() + interval '5 days 4 hours', 'Producción de masas y cremas', 'DRAFT', null, now() - interval '3 hours'),
  ('a0000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000001', now() - interval '8 days', now() - interval '8 days' + interval '3 hours', 'Técnicas de mise en place y cocción', 'CLOSED', now() - interval '10 days', now() - interval '11 days')
on conflict (id) do update set teacher_id = excluded.teacher_id, course_section_id = excluded.course_section_id, laboratory_id = excluded.laboratory_id, start_at = excluded.start_at, end_at = excluded.end_at, purpose = excluded.purpose, status = excluded.status, submitted_at = excluded.submitted_at, updated_at = now();

insert into public.equipment_request_items (id, equipment_request_id, inventory_item_id, requested_quantity) values
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', '80000000-0000-4000-8000-000000000001', 12),
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', '80000000-0000-4000-8000-000000000002', 8),
  ('b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000002', '80000000-0000-4000-8000-000000000003', 10),
  ('b0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000002', '80000000-0000-4000-8000-000000000004', 1)
on conflict (id) do update set equipment_request_id = excluded.equipment_request_id, inventory_item_id = excluded.inventory_item_id, requested_quantity = excluded.requested_quantity;

insert into public.equipment_inspections (id, equipment_request_id, stage, inspected_by_user_id, inspected_at, notes) values
  ('c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000003', 'OUTBOUND', :'manager_id'::uuid, now() - interval '8 days 45 minutes', 'Inspección de salida completada para el préstamo histórico')
on conflict (id) do update set inspected_by_user_id = excluded.inspected_by_user_id, inspected_at = excluded.inspected_at, notes = excluded.notes;

insert into public.equipment_loans (id, equipment_request_id, responsible_teacher_id, collected_by_name, delivered_by_user_id, delivered_at, created_at, status, closed_at) values
  ('aa000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', 'Daniela Docente', :'manager_id'::uuid, now() - interval '8 days 30 minutes', now() - interval '8 days 30 minutes', 'CLOSED', now() - interval '8 days' + interval '4 hours')
on conflict (id) do update set responsible_teacher_id = excluded.responsible_teacher_id, collected_by_name = excluded.collected_by_name, delivered_by_user_id = excluded.delivered_by_user_id, delivered_at = excluded.delivered_at, status = excluded.status, closed_at = excluded.closed_at;

insert into public.equipment_inspections (id, equipment_request_id, stage, inspected_by_user_id, inspected_at, notes) values
  ('c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'OUTBOUND', :'manager_id'::uuid, now() - interval '6 days', 'Control visual de equipo de demostración')
on conflict (id) do update set inspected_by_user_id = excluded.inspected_by_user_id, notes = excluded.notes;

insert into public.equipment_inspection_details (id, equipment_inspection_id, inventory_unit_id, observed_condition, is_complete) values
  ('d0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', '90000000-0000-4000-8000-000000000002', 'FAIR', true)
on conflict (id) do update set observed_condition = excluded.observed_condition, is_complete = excluded.is_complete;

insert into public.equipment_incidents (id, equipment_inspection_detail_id, incident_type, severity, description, requires_unavailable, created_at) values
  ('e0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', 'FAILURE', 'HIGH', 'La batidora presenta vibración y ruido irregular durante el uso.', true, now() - interval '1 day')
on conflict (id) do update set severity = excluded.severity, description = excluded.description, requires_unavailable = excluded.requires_unavailable;

insert into public.equipment_maintenances (id, inventory_unit_id, maintenance_type, status, reason, description, created_by_user_id, started_at) values
  ('f0000000-0000-4000-8000-000000000001', '90000000-0000-4000-8000-000000000002', 'CORRECTIVE', 'OPEN', 'Vibración irregular', 'Revisar acople, lubricación y fijación del cabezal.', :'manager_id'::uuid, now() - interval '20 hours')
on conflict (id) do update set status = 'OPEN', reason = excluded.reason, description = excluded.description, created_by_user_id = excluded.created_by_user_id, completed_by_user_id = null, completed_at = null, resolution = null;

commit;
