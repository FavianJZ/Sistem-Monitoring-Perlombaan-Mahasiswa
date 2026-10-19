create or replace function public.capaian_sah(c text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(c in ('juara_1', 'juara_2', 'juara_3', 'harapan', 'finalis', 'peserta'), false);
$$;

create or replace function public.daftar_berkas(d jsonb)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select case when jsonb_typeof(d->'berkas') = 'array' then d->'berkas' else '[]'::jsonb end;
$$;

create or replace function public.punya_sertifikat(d jsonb, status_wajib text default null)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select exists (
    select 1 from jsonb_array_elements(public.daftar_berkas(d)) b
    where b->>'tipe' = 'sertifikat'
      and (status_wajib is null or coalesce(b->>'statusVerifikasi', 'menunggu') = status_wajib)
  );
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
begin
  if lama is null then
    return status_baru = 'terdaftar' and hasil_baru is null;
  end if;

  if status_lama = status_baru and hasil_lama is not distinct from hasil_baru then
    return true;
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

create or replace function public.jaga_isi_data_lomba()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  pengguna uuid := auth.uid();
  peran text;
  baru jsonb;
  lama jsonb;
  kunci text;
begin
  if pengguna is null then
    return new;
  end if;

  peran := public.peran_saya();
  if peran = 'admin' then
    return new;
  end if;

  if tg_op = 'UPDATE' and peran = 'dosen' and old.created_by <> pengguna then
    if (new.data - 'berkas') is distinct from (old.data - 'berkas')
       or new.dosen_pembimbing_id is distinct from old.dosen_pembimbing_id
       or (select coalesce(jsonb_agg(public.identitas_berkas(x) order by ord), '[]'::jsonb)
             from jsonb_array_elements(coalesce(new.data->'berkas', '[]'::jsonb)) with ordinality t(x, ord))
          is distinct from
          (select coalesce(jsonb_agg(public.identitas_berkas(x) order by ord), '[]'::jsonb)
             from jsonb_array_elements(coalesce(old.data->'berkas', '[]'::jsonb)) with ordinality t(x, ord))
    then
      raise exception 'Dosen hanya boleh memverifikasi berkas lomba.'
        using errcode = '42501';
    end if;
    return new;
  end if;

  if not public.transisi_lomba_sah(case when tg_op = 'UPDATE' then old.data end, new.data) then
    raise exception 'Status dan hasil lomba hanya bisa diubah lewat alur pelaporan di aplikasi.'
      using errcode = '42501';
  end if;

  for baru in
    select x from jsonb_array_elements(coalesce(new.data->'berkas', '[]'::jsonb)) x
  loop
    kunci := coalesce(baru->>'id', baru->>'tipe');
    lama := null;
    if tg_op = 'UPDATE' then
      select x into lama
        from jsonb_array_elements(coalesce(old.data->'berkas', '[]'::jsonb)) x
        where coalesce(x->>'id', x->>'tipe') = kunci
        limit 1;
    end if;

    if coalesce(baru->>'statusVerifikasi', 'menunggu') <> 'menunggu' then
      if lama is null
         or public.verifikasi_berkas(baru) is distinct from public.verifikasi_berkas(lama)
         or public.identitas_berkas(baru) is distinct from public.identitas_berkas(lama)
      then
        raise exception 'Status verifikasi berkas hanya bisa diubah dosen pembimbing.'
          using errcode = '42501';
      end if;
    elsif baru->>'diverifikasiOleh' is not null or baru->>'diverifikasiPada' is not null then
      raise exception 'Berkas berstatus menunggu tidak boleh memuat data verifikasi.'
        using errcode = '42501';
    end if;
  end loop;

  return new;
end;
$$;

revoke execute on function public.jaga_isi_data_lomba() from public, anon, authenticated;
