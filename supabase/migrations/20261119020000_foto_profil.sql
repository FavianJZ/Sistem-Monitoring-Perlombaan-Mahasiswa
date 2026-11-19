insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatar', 'avatar', true, 1048576, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

drop policy if exists "avatar unggah milik sendiri" on storage.objects;
create policy "avatar unggah milik sendiri"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatar'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "avatar baca milik sendiri" on storage.objects;
create policy "avatar baca milik sendiri"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'avatar'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "avatar hapus milik sendiri" on storage.objects;
create policy "avatar hapus milik sendiri"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatar'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

alter table public.profiles drop constraint if exists profiles_avatar_url_sah;
alter table public.profiles
  add constraint profiles_avatar_url_sah check (
    avatar_url is null
    or avatar_url ~ ('^https://[^/]+/storage/v1/object/public/avatar/' || id::text || '/[A-Za-z0-9._-]+$')
  ) not valid;
