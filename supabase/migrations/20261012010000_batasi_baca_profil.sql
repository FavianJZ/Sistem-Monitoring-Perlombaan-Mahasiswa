-- =====================================================================
-- Batasi siapa yang bisa membaca profil.
-- Sebelumnya setiap pengguna yang login bisa membaca email, NIM, dan
-- angkatan semua pengguna. Sekarang:
--   - setiap orang membaca profilnya sendiri;
--   - profil dosen/admin terbuka bagi pengguna login (nama pembimbing,
--     daftar dosen di formulir);
--   - dosen/admin membaca semua profil untuk keperluan monitoring.
-- Realtime ikut aturan ini karena postgres_changes menghormati RLS.
-- Aman dijalankan ulang (idempotent). Jalan turun ada di bagian bawah.
-- =====================================================================

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

-- =====================================================================
-- JALAN TURUN (jalankan manual bila perlu membatalkan):
--
-- drop policy if exists "profiles baca terbatas" on public.profiles;
-- create policy "Profil dapat dibaca oleh pengguna terotentikasi"
--   on public.profiles for select
--   using (auth.role() = 'authenticated');
-- =====================================================================
