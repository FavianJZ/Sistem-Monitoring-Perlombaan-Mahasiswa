-- =====================================================================
-- Batasi penghapusan lomba oleh mahasiswa pemilik.
-- Jalankan SETELAH 20261012040000_status_tidak_lanjut.sql.
-- Aman dijalankan ulang (idempotent). Jalan turun ada di bagian bawah.
--
-- Pemilik hanya boleh menghapus lomba yang:
--   - belum berstatus akhir (selesai / tidak_lanjut) dan belum punya hasil;
--   - belum punya berkas yang diterima dosen pembimbing.
-- Selain itu lomba tersimpan sebagai riwayat; mahasiswa memakai status
-- "tidak_lanjut". Admin tetap boleh menghapus.
-- =====================================================================

create or replace function public.lomba_boleh_dihapus(d jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(d->>'status', 'terdaftar') in ('terdaftar', 'berlangsung')
    and nullif(d->'hasil', 'null'::jsonb) is null
    and not exists (
      select 1 from jsonb_array_elements(public.daftar_berkas(d)) b
      where b->>'statusVerifikasi' = 'diterima'
    );
$$;

drop policy if exists "data_lomba hapus" on public.data_lomba;
create policy "data_lomba hapus"
  on public.data_lomba for delete
  to authenticated
  using (
    (
      created_by = (select auth.uid())
      and public.lomba_boleh_dihapus(data)
    )
    or (select public.peran_saya()) = 'admin'
  );

-- =====================================================================
-- JALAN TURUN (jalankan manual bila perlu membatalkan):
--
-- drop policy if exists "data_lomba hapus" on public.data_lomba;
-- create policy "data_lomba hapus"
--   on public.data_lomba for delete
--   to authenticated
--   using (
--     created_by = (select auth.uid())
--     or (select public.peran_saya()) = 'admin'
--   );
-- drop function if exists public.lomba_boleh_dihapus(jsonb);
-- =====================================================================
