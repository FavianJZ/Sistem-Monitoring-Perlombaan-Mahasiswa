drop policy if exists "data_lomba ubah" on public.data_lomba;
create policy "data_lomba ubah"
  on public.data_lomba for update
  to authenticated
  using (
    created_by = (select auth.uid())
    or (select public.peran_saya()) = 'admin'
    or (
      (select public.peran_saya()) = 'dosen'
      and dosen_pembimbing_id = (select auth.uid())
    )
  )
  with check (
    created_by = (select auth.uid())
    or (select public.peran_saya()) = 'admin'
    or (
      (select public.peran_saya()) = 'dosen'
      and dosen_pembimbing_id = (select auth.uid())
    )
  );

create or replace function public.identitas_berkas(b jsonb)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select jsonb_build_object(
    'tipe', b->'tipe',
    'path', b->'path',
    'namaFile', b->'namaFile',
    'mimeType', b->'mimeType',
    'size', b->'size'
  );
$$;

create or replace function public.verifikasi_berkas(b jsonb)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select jsonb_build_object(
    'statusVerifikasi', coalesce(b->>'statusVerifikasi', 'menunggu'),
    'catatanPenolakan', b->'catatanPenolakan',
    'diverifikasiPada', b->'diverifikasiPada',
    'diverifikasiOleh', b->'diverifikasiOleh'
  );
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

drop trigger if exists data_lomba_jaga_isi on public.data_lomba;
create trigger data_lomba_jaga_isi
  before insert or update on public.data_lomba
  for each row execute procedure public.jaga_isi_data_lomba();

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

  if peran_final = 'mahasiswa' and alamat not like '%@binus.ac.id' then
    raise exception 'Pendaftaran mahasiswa wajib memakai email @binus.ac.id.'
      using errcode = '22023';
  end if;

  if peran_final <> 'mahasiswa'
     and alamat not like '%@binus.ac.id' and alamat not like '%@binus.edu' then
    raise exception 'Pendaftaran staf wajib memakai email @binus.ac.id atau @binus.edu.'
      using errcode = '22023';
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
revoke execute on function public.jaga_isi_data_lomba() from public, anon, authenticated;
