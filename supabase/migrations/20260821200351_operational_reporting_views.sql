create view public.request_operational_summary
with (security_invoker = true) as
select request.id, request.teacher_id, request.course_section_id, request.laboratory_id,
  request.start_at, request.end_at, request.status, request.submitted_at,
  reservation.status as reservation_status, loan.id as equipment_loan_id, loan.status as loan_status
from public.equipment_requests as request
left join public.equipment_reservations as reservation on reservation.equipment_request_id = request.id
left join public.equipment_loans as loan on loan.equipment_request_id = request.id;

create view public.loan_operational_summary
with (security_invoker = true) as
select loan.id, loan.equipment_request_id, loan.responsible_teacher_id, loan.collected_by_name,
  loan.delivered_by_user_id, loan.delivered_at, loan.status, loan.closed_at,
  count(distinct loan_detail.id) as quantity_detail_count,
  count(distinct loan_unit.id) as unit_count,
  count(distinct returned.id) as return_count
from public.equipment_loans as loan
left join public.equipment_loan_details as loan_detail on loan_detail.equipment_loan_id = loan.id
left join public.equipment_loan_units as loan_unit on loan_unit.equipment_loan_id = loan.id
left join public.equipment_returns as returned on returned.equipment_loan_id = loan.id
group by loan.id;

create view public.incident_operational_summary
with (security_invoker = true) as
select incident.id, inspection.equipment_request_id, inspection.equipment_loan_id,
  detail.inventory_unit_id, incident.incident_type, incident.severity,
  incident.requires_unavailable, incident.description, incident.created_at,
  count(evidence.id) as evidence_count
from public.equipment_incidents as incident
join public.equipment_inspection_details as detail on detail.id = incident.equipment_inspection_detail_id
join public.equipment_inspections as inspection on inspection.id = detail.equipment_inspection_id
left join public.equipment_incident_evidences as evidence on evidence.equipment_incident_id = incident.id
group by incident.id, inspection.equipment_request_id, inspection.equipment_loan_id, detail.inventory_unit_id;

create view public.inventory_stock_summary
with (security_invoker = true) as
select stock.inventory_item_id, item.code as inventory_item_code, item.name as inventory_item_name,
  stock.location_id, location.name as location_name, stock.quantity, stock.updated_at
from public.inventory_quantity_stock as stock
join public.inventory_items as item on item.id = stock.inventory_item_id
join public.inventory_locations as location on location.id = stock.location_id;

revoke all on table public.request_operational_summary, public.loan_operational_summary, public.incident_operational_summary, public.inventory_stock_summary from anon, authenticated;
grant select on table public.request_operational_summary, public.loan_operational_summary, public.incident_operational_summary, public.inventory_stock_summary to authenticated, service_role;
