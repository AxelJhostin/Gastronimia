create function private.validate_teacher_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.user_roles as assigned_role
    join public.roles as role
      on role.id = assigned_role.role_id
    where assigned_role.user_id = new.user_id
      and role.code = 'TEACHER'
  ) then
    raise exception 'El usuario debe tener el rol TEACHER para crear un perfil docente.';
  end if;

  return new;
end;
$$;

revoke all on function private.validate_teacher_role() from public;
grant execute on function private.validate_teacher_role() to service_role;

create trigger teachers_require_teacher_role
before insert or update of user_id on public.teachers
for each row execute function private.validate_teacher_role();
