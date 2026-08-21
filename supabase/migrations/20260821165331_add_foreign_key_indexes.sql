-- Índices de soporte para claves foráneas, RLS y operaciones de borrado/revisión.
-- Las PK existentes ya cubren user_roles(user_id, role_id), pero no role_id aislado.

create index course_sections_academic_period_id_idx
on public.course_sections (academic_period_id);

create index course_sections_teacher_id_idx
on public.course_sections (teacher_id);

create index user_roles_role_id_idx
on public.user_roles (role_id);
