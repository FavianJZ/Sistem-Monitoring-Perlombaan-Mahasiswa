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
    alamat,
    peran_final,
    case when peran_final = 'mahasiswa' then nullif(trim(meta->>'nim'), '') end,
    case when peran_final = 'mahasiswa' then nullif(meta->>'angkatan', '')::integer end,
    coalesce(nullif(meta->>'prodi', ''), 'Teknik Informatika')
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
