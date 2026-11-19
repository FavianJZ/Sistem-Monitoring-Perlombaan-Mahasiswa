alter table public.profiles drop constraint if exists profiles_avatar_url_sah;
alter table public.profiles
  add constraint profiles_avatar_url_sah check (
    avatar_url is null
    or avatar_url ~ ('^https://[^/]+/storage/v1/object/public/avatar/' || id::text || '/[A-Za-z0-9._-]+$')
    or avatar_url ~ '^https://lh3\.googleusercontent\.com/[A-Za-z0-9._~/=-]+$'
  ) not valid;

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
  alamat text := lower(new.email);
  foto text := coalesce(meta->>'avatar_url', meta->>'picture');
begin
  if peran_diminta in ('dosen', 'admin') and exists (
    select 1 from public.kode_otorisasi_peran k
    where k.role = peran_diminta and k.kode = trim(coalesce(meta->>'kode_peran', ''))
  ) then
    peran_final := peran_diminta;
  end if;

  if foto !~ '^https://lh3\.googleusercontent\.com/[A-Za-z0-9._~/=-]+$' then
    foto := null;
  end if;

  insert into public.profiles (id, nama, email, role, nim, angkatan, prodi, avatar_url)
  values (
    new.id,
    coalesce(
      nullif(trim(meta->>'nama'), ''),
      nullif(trim(meta->>'full_name'), ''),
      nullif(trim(meta->>'name'), ''),
      split_part(new.email, '@', 1)
    ),
    alamat,
    peran_final,
    case when peran_final = 'mahasiswa' then nullif(trim(meta->>'nim'), '') end,
    case when peran_final = 'mahasiswa' then nullif(meta->>'angkatan', '')::integer end,
    coalesce(nullif(meta->>'prodi', ''), 'Teknik Informatika'),
    foto
  )
  on conflict (id) do nothing;

  if meta ? 'kode_peran' then
    update auth.users
      set raw_user_meta_data = raw_user_meta_data - 'kode_peran'
      where id = new.id;
  end if;

  return new;
end;
$$;

revoke execute on function public.handle_user_terdaftar() from public, anon, authenticated;

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
    raise exception 'NIM ini sudah terdaftar pada akun lain.' using errcode = '23505';
  end if;

  update public.profiles
    set nim = p_nim, angkatan = p_angkatan, prodi = trim(p_prodi)
    where id = saya.id;
end;
$$;

revoke execute on function public.lengkapi_profil(text, integer, text) from public, anon;
grant execute on function public.lengkapi_profil(text, integer, text) to authenticated;
