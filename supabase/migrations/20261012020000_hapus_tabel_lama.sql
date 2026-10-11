-- =====================================================================
-- Hapus tabel generasi pertama yang tidak lagi dipakai aplikasi:
-- public.lomba, public.berkas_lomba, public.anggota_lomba.
-- Seluruh data lomba sekarang tersimpan di public.data_lomba.
--
-- PERINGATAN: migrasi ini MEMBUANG TABEL. Ambil cadangan dulu.
-- Pengaman: tabel hanya dihapus bila KOSONG. Bila masih berisi data,
-- migrasi berhenti dengan galat dan tidak ada yang dihapus.
-- Aman dijalankan ulang (idempotent).
-- =====================================================================

do $$
declare
  nama text;
  jumlah bigint;
begin
  foreach nama in array array['anggota_lomba', 'berkas_lomba', 'lomba'] loop
    if to_regclass('public.' || nama) is not null then
      execute format('select count(*) from public.%I', nama) into jumlah;
      if jumlah > 0 then
        raise exception 'Tabel public.% masih berisi % baris; pindahkan atau cadangkan dulu.', nama, jumlah;
      end if;
    end if;
  end loop;
end;
$$;

-- Urutan mengikuti foreign key: anak dulu, induk terakhir.
drop table if exists public.anggota_lomba;
drop table if exists public.berkas_lomba;
drop table if exists public.lomba;

-- =====================================================================
-- JALAN TURUN: tabel dibuat ulang (tanpa data) dengan menjalankan bagian
-- "lomba", "berkas_lomba", dan "anggota_lomba" dari
-- 20261009000000_skema_awal.sql. Data yang sempat ada hanya bisa
-- dipulihkan dari cadangan.
-- =====================================================================
