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

drop table if exists public.anggota_lomba;
drop table if exists public.berkas_lomba;
drop table if exists public.lomba;
