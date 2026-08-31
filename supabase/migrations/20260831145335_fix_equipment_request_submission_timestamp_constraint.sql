-- Una vez enviada, una solicitud conserva su fecha de envío aunque avance a
-- cualquier estado operativo (aprobada, preparada, entregada o cerrada).
alter table public.equipment_requests
  drop constraint if exists equipment_requests_check1;

alter table public.equipment_requests
  add constraint equipment_requests_submission_timestamp_matches_status check (
    (status = 'DRAFT') = (submitted_at is null)
  );
