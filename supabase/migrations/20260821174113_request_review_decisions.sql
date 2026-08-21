-- PostgreSQL hace visibles los nuevos valores del enum a partir de la siguiente
-- transacción. La estructura de revisión se crea en la migración siguiente.
alter type public.equipment_request_status add value if not exists 'APPROVED';
alter type public.equipment_request_status add value if not exists 'PARTIALLY_APPROVED';
alter type public.equipment_request_status add value if not exists 'REJECTED';
