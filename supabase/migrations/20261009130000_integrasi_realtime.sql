-- =====================================================================
-- Integrasi penuh SiMonLomba ke Supabase: peran aman, data lomba,
-- penyimpanan berkas, dan Realtime.
-- Jalankan SETELAH skema awal & cek_ketersediaan_akun.
-- Aman dijalankan ulang (idempotent).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Kode otorisasi peran staf (tidak bisa dibaca klien sama sekali)
-- ---------------------------------------------------------------------
create table if not exists public.kode_otorisasi_peran (
  role text primary key check (role in ('dosen', 'admin')),
  kode text not null
);

alter table public.kode_otorisasi_peran enable row level security;
-- Sengaja TANPA policy: anon/authenticated tidak bisa membaca kode.

-- GANTI kode ini di SQL Editor sebelum dipakai sungguhan.
insert into public.kode_otorisasi_peran (role, kode) values
  ('dosen', 'DOSEN2026'),
  ('admin', 'PRODI2026')
on conflict (role) do nothing;

-- Dipakai halaman daftar staf untuk memberi tahu kode salah lebih awal.
create or replace function public.cek_kode_peran(p_role text, p_kode text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.kode_otorisasi_peran k
    where k.role = p_role and k.kode = trim(p_kode)
  );
$$;

revoke all on function public.cek_kode_peran(text, text) from public;
grant execute on function public.cek_kode_peran(text, text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 2. Profil dibuat otomatis saat sign up. Peran staf HANYA diberikan bila
--    kode otorisasinya benar; selain itu selalu 'mahasiswa'.
-- ---------------------------------------------------------------------
create or replace function public.handle_user_terdaftar()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  peran_diminta text := coalesce(meta->>'role', 'mahasiswa');
  peran_final text := 'mahasiswa';
begin
  if peran_diminta in ('dosen', 'admin') and exists (
    select 1 from public.kode_otorisasi_peran k
    where k.role = peran_diminta and k.kode = trim(coalesce(meta->>'kode_peran', ''))
  ) then
    peran_final := peran_diminta;
  end if;

  insert into public.profiles (id, nama, email, role, nim, angkatan, prodi)
  values (
    new.id,
    coalesce(nullif(trim(meta->>'nama'), ''), split_part(new.email, '@', 1)),
    lower(new.email),
    peran_final,
    case when peran_final = 'mahasiswa' then nullif(trim(meta->>'nim'), '') end,
    case when peran_final = 'mahasiswa' then nullif(meta->>'angkatan', '')::integer end,
    coalesce(nullif(meta->>'prodi', ''), 'Teknik Informatika')
  )
  on conflict (id) do nothing;

  -- Jangan biarkan kode otorisasi tersimpan di metadata pengguna.
  if meta ? 'kode_peran' then
    update auth.users
      set raw_user_meta_data = raw_user_meta_data - 'kode_peran'
      where id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_user_terdaftar();

-- Pengguna boleh mengubah nama/prodi/avatar miliknya, tapi TIDAK role, nim, email.
revoke update on public.profiles from authenticated, anon;
grant update (nama, prodi, avatar_url) on public.profiles to authenticated;

-- Helper tanpa rekursi RLS.
create or replace function public.peran_saya()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.nim_saya()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select nim from public.profiles where id = auth.uid();
$$;

grant execute on function public.peran_saya() to authenticated;
grant execute on function public.nim_saya() to authenticated;

-- ---------------------------------------------------------------------
-- 3. Data lomba. Satu baris = satu record lomba utuh (anggota, tahapan,
--    berkas, hasil) di kolom jsonb, sesuai model aplikasi.
-- ---------------------------------------------------------------------
create table if not exists public.data_lomba (
  id text primary key,
  created_by uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  dosen_pembimbing_id uuid references public.profiles (id) on delete set null,
  data jsonb not null,
  dibuat_pada timestamptz not null default now(),
  diperbarui_pada timestamptz not null default now()
);

create index if not exists data_lomba_created_by_idx on public.data_lomba (created_by);
create index if not exists data_lomba_pembimbing_idx on public.data_lomba (dosen_pembimbing_id);

create or replace function public.sentuh_diperbarui_pada()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.diperbarui_pada := now();
  -- Pemilik tidak boleh dipindahkan lewat update.
  new.created_by := old.created_by;
  return new;
end;
$$;

drop trigger if exists data_lomba_diperbarui on public.data_lomba;
create trigger data_lomba_diperbarui
  before update on public.data_lomba
  for each row execute procedure public.sentuh_diperbarui_pada();

alter table public.data_lomba enable row level security;

drop policy if exists "data_lomba baca" on public.data_lomba;
create policy "data_lomba baca"
  on public.data_lomba for select
  to authenticated
  using (
    created_by = (select auth.uid())
    or (select public.peran_saya()) in ('dosen', 'admin')
    or exists (
      select 1 from jsonb_array_elements(coalesce(data->'anggota', '[]'::jsonb)) a
      where a->>'nim' = (select public.nim_saya())
    )
  );

drop policy if exists "data_lomba tambah" on public.data_lomba;
create policy "data_lomba tambah"
  on public.data_lomba for insert
  to authenticated
  with check (
    created_by = (select auth.uid())
    and (select public.peran_saya()) = 'mahasiswa'
  );

drop policy if exists "data_lomba ubah" on public.data_lomba;
create policy "data_lomba ubah"
  on public.data_lomba for update
  to authenticated
  using (
    created_by = (select auth.uid())
    or (select public.peran_saya()) in ('dosen', 'admin')
  )
  with check (
    created_by = (select auth.uid())
    or (select public.peran_saya()) in ('dosen', 'admin')
  );

drop policy if exists "data_lomba hapus" on public.data_lomba;
create policy "data_lomba hapus"
  on public.data_lomba for delete
  to authenticated
  using (
    created_by = (select auth.uid())
    or (select public.peran_saya()) = 'admin'
  );

-- ---------------------------------------------------------------------
-- 4. Realtime
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'data_lomba'
  ) then
    alter publication supabase_realtime add table public.data_lomba;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 5. Storage berkas (privat). Path: <uid pemilik>/<id lomba>/<nama file>
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'berkas-lomba', 'berkas-lomba', false, 5242880,
  array['application/pdf', 'image/jpeg', 'image/png']
)
on conflict (id) do nothing;

drop policy if exists "berkas-lomba unggah milik sendiri" on storage.objects;
create policy "berkas-lomba unggah milik sendiri"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'berkas-lomba'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "berkas-lomba baca" on storage.objects;
create policy "berkas-lomba baca"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'berkas-lomba'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (select public.peran_saya()) in ('dosen', 'admin')
    )
  );

drop policy if exists "berkas-lomba ubah milik sendiri" on storage.objects;
create policy "berkas-lomba ubah milik sendiri"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'berkas-lomba'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "berkas-lomba hapus milik sendiri" on storage.objects;
create policy "berkas-lomba hapus milik sendiri"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'berkas-lomba'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
