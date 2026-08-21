-- Bucket privado para fotografías y documentos de evidencias operativas.
-- El contenido se sirve mediante Storage API o URLs firmadas, nunca por URL pública.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'evidence',
  'evidence',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "evidence authenticated users upload to own folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'evidence'
  and (select private.is_active_user())
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "evidence users read own and staff read all"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'evidence'
  and (
    owner_id = (select auth.uid()::text)
    or (select private.has_any_role(array['ADMIN', 'MANAGER']::public.role_code[]))
  )
);

create policy "evidence users update own and staff update all"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'evidence'
  and (
    owner_id = (select auth.uid()::text)
    or (select private.has_any_role(array['ADMIN', 'MANAGER']::public.role_code[]))
  )
)
with check (
  bucket_id = 'evidence'
  and (
    (storage.foldername(name))[1] = (select auth.uid()::text)
    or (select private.has_any_role(array['ADMIN', 'MANAGER']::public.role_code[]))
  )
);

create policy "evidence users delete own and staff delete all"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'evidence'
  and (
    owner_id = (select auth.uid()::text)
    or (select private.has_any_role(array['ADMIN', 'MANAGER']::public.role_code[]))
  )
);
