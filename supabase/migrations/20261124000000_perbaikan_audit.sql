-- Anggota tim boleh membaca berkas lomba yang memuat NIM-nya.
-- Path berkas: <created_by>/<id lomba>/<nama berkas>. Subkueri tunduk pada RLS data_lomba,
-- jadi hanya lomba yang memang terlihat oleh pengguna ini yang membuka akses berkasnya.
drop policy if exists "berkas-lomba baca" on storage.objects;
create policy "berkas-lomba baca"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'berkas-lomba'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (select public.peran_saya()) in ('dosen', 'admin')
      or exists (
        select 1 from public.data_lomba d
        where d.id = (storage.foldername(name))[2]
          and d.created_by::text = (storage.foldername(name))[1]
      )
    )
  );

-- Admin boleh menghapus berkas saat menghapus lomba milik mahasiswa lain.
drop policy if exists "berkas-lomba hapus admin" on storage.objects;
create policy "berkas-lomba hapus admin"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'berkas-lomba'
    and (select public.peran_saya()) = 'admin'
  );

-- Admin mengubah peran akun, mis. dosen yang terlanjur masuk dengan Google.
create or replace function public.admin_ubah_peran(p_pengguna uuid, p_peran text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.peran_saya() is distinct from 'admin' then
    raise exception 'Hanya admin yang boleh mengubah peran akun.' using errcode = '42501';
  end if;
  if p_peran not in ('mahasiswa', 'dosen', 'admin') then
    raise exception 'Peran tidak dikenal.' using errcode = '22023';
  end if;
  if p_pengguna = auth.uid() then
    raise exception 'Admin tidak bisa mengubah perannya sendiri.' using errcode = '42501';
  end if;

  update public.profiles
    set role = p_peran,
        nim = case when p_peran = 'mahasiswa' then nim end,
        angkatan = case when p_peran = 'mahasiswa' then angkatan end
    where id = p_pengguna;
  if not found then
    raise exception 'Akun tidak ditemukan.' using errcode = 'P0002';
  end if;
end;
$$;

-- Admin melepas NIM yang diklaim akun yang salah. Pemilik akun itu akan diminta
-- melengkapi NIM lagi, dan pemilik NIM yang sah bisa mendaftar.
create or replace function public.admin_kosongkan_nim(p_pengguna uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.peran_saya() is distinct from 'admin' then
    raise exception 'Hanya admin yang boleh mengosongkan NIM.' using errcode = '42501';
  end if;

  update public.profiles
    set nim = null, angkatan = null
    where id = p_pengguna;
  if not found then
    raise exception 'Akun tidak ditemukan.' using errcode = 'P0002';
  end if;
end;
$$;

revoke execute on function public.admin_ubah_peran(uuid, text) from public, anon;
revoke execute on function public.admin_kosongkan_nim(uuid) from public, anon;
grant execute on function public.admin_ubah_peran(uuid, text) to authenticated;
grant execute on function public.admin_kosongkan_nim(uuid) to authenticated;

-- Pesan NIM ganda di lengkapi_profil sekarang menunjuk ke admin.
create or replace function public.lengkapi_profil(p_nim text, p_angkatan integer, p_prodi text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  saya public.profiles%rowtype;
begin
  select * into saya from public.profiles where id = auth.uid();
  if not found then
    raise exception 'Profil tidak ditemukan.' using errcode = '42501';
  end if;
  if saya.role <> 'mahasiswa' then
    raise exception 'Hanya akun mahasiswa yang perlu melengkapi NIM.' using errcode = '42501';
  end if;
  if saya.nim is not null then
    raise exception 'NIM sudah terisi. Hubungi admin program studi untuk mengubahnya.' using errcode = '42501';
  end if;
  if coalesce(p_nim, '') !~ '^\d{10}$' then
    raise exception 'NIM harus 10 digit angka.' using errcode = '22023';
  end if;
  if p_angkatan is null or p_angkatan < 2000 or p_angkatan > extract(year from now())::integer then
    raise exception 'Angkatan tidak valid.' using errcode = '22023';
  end if;
  if nullif(trim(coalesce(p_prodi, '')), '') is null or length(p_prodi) > 100 then
    raise exception 'Program studi wajib diisi.' using errcode = '22023';
  end if;
  if exists (select 1 from public.profiles where nim = p_nim) then
    raise exception 'NIM ini sudah dipakai akun lain. Bila ini NIM Anda, hubungi admin program studi.'
      using errcode = '23505';
  end if;

  update public.profiles
    set nim = p_nim, angkatan = p_angkatan, prodi = trim(p_prodi)
    where id = saya.id;
end;
$$;

revoke execute on function public.lengkapi_profil(text, integer, text) from public, anon;
grant execute on function public.lengkapi_profil(text, integer, text) to authenticated;
