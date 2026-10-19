drop policy if exists "Profil dapat dibaca oleh pengguna terotentikasi" on public.profiles;
drop policy if exists "profiles baca terbatas" on public.profiles;

create policy "profiles baca terbatas"
  on public.profiles for select
  to authenticated
  using (
    id = (select auth.uid())
    or role in ('dosen', 'admin')
    or (select public.peran_saya()) in ('dosen', 'admin')
  );
