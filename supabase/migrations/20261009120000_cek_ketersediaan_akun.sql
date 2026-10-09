-- Cek apakah email / NIM sudah dipakai, untuk halaman pendaftaran.
-- Dipanggil oleh pengunjung yang belum login (role anon), jadi fungsi berjalan
-- sebagai security definer dan HANYA mengembalikan dua boolean, bukan data akun.
create or replace function public.cek_ketersediaan_akun(p_email text, p_nim text default null)
returns table (email_terpakai boolean, nim_terpakai boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select
    exists (
      select 1 from auth.users u
      where lower(u.email) = lower(trim(p_email))
    ) as email_terpakai,
    (
      p_nim is not null
      and exists (select 1 from public.profiles p where p.nim = trim(p_nim))
    ) as nim_terpakai;
$$;

revoke all on function public.cek_ketersediaan_akun(text, text) from public;
grant execute on function public.cek_ketersediaan_akun(text, text) to anon, authenticated;
