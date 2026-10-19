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
