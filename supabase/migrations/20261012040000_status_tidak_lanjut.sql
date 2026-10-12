-- =====================================================================
-- Status akhir "tidak_lanjut" untuk lomba yang tidak diteruskan
-- (tidak lolos seleksi, mundur, didiskualifikasi, dibatalkan).
-- Jalankan SETELAH 20261012030000_kunci_status_hasil.sql.
-- Aman dijalankan ulang (idempotent). Jalan turun ada di bagian bawah.
--
-- Mahasiswa pemilik boleh menandai lomba "tidak_lanjut" selama hasilnya
-- belum dilaporkan, dengan alasan yang sah. Setelah itu status, hasil, dan
-- keterangan tidak lanjut terkunci (hanya admin / SQL Editor yang bisa
-- mengubah).
-- =====================================================================

create or replace function public.alasan_tidak_lanjut_sah(a text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(a in ('tidak_lolos', 'mundur', 'diskualifikasi', 'dibatalkan'), false);
$$;

create or replace function public.transisi_lomba_sah(lama jsonb, baru jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  status_lama text := coalesce(lama->>'status', 'terdaftar');
  status_baru text := coalesce(baru->>'status', 'terdaftar');
  hasil_lama jsonb := nullif(lama->'hasil', 'null'::jsonb);
  hasil_baru jsonb := nullif(baru->'hasil', 'null'::jsonb);
  henti_lama jsonb := nullif(lama->'tidakLanjut', 'null'::jsonb);
  henti_baru jsonb := nullif(baru->'tidakLanjut', 'null'::jsonb);
begin
  if lama is null then
    return status_baru = 'terdaftar' and hasil_baru is null and henti_baru is null;
  end if;

  if status_lama = status_baru
     and hasil_lama is not distinct from hasil_baru
     and henti_lama is not distinct from henti_baru
  then
    return true;
  end if;

  if henti_lama is distinct from henti_baru then
    return status_lama in ('terdaftar', 'berlangsung')
      and status_baru = 'tidak_lanjut'
      and hasil_lama is null
      and hasil_baru is null
      and henti_lama is null
      and jsonb_typeof(henti_baru) = 'object'
      and public.alasan_tidak_lanjut_sah(henti_baru->>'alasan')
      and length(coalesce(henti_baru->>'catatan', '')) <= 500;
  end if;

  if hasil_baru is null
     or jsonb_typeof(hasil_baru) <> 'object'
     or not public.capaian_sah(hasil_baru->>'capaian')
     or status_baru <> 'selesai'
     or not public.punya_sertifikat(baru)
  then
    return false;
  end if;

  if hasil_lama is null then
    return status_lama in ('terdaftar', 'berlangsung');
  end if;

  return status_lama = 'selesai' and not public.punya_sertifikat(lama, 'diterima');
end;
$$;

-- =====================================================================
-- JALAN TURUN (jalankan manual bila perlu membatalkan):
--
-- Pastikan tidak ada lomba berstatus tidak_lanjut yang perlu dipertahankan:
--   select id from public.data_lomba where data->>'status' = 'tidak_lanjut';
-- Jalankan ulang definisi transisi_lomba_sah dari
-- 20261012030000_kunci_status_hasil.sql, lalu:
-- drop function if exists public.alasan_tidak_lanjut_sah(text);
-- =====================================================================
