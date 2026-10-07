-- La lectura directa debe respetar el mismo permiso ADMIN que FastAPI.
-- Las operaciones internas conservan sus grants y siguen generando auditoría.
drop policy if exists "inventory staff can read operational audit"
  on public.operational_audit_log;
drop policy if exists "admins can read operational audit"
  on public.operational_audit_log;

create policy "admins can read operational audit"
on public.operational_audit_log
for select
to authenticated
using ((select private.has_role('ADMIN'::public.role_code)));
