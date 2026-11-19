create table if not exists public.pengingat_terkirim (
  lomba_id text not null references public.data_lomba (id) on delete cascade,
  kunci_tahap text not null,
  jenis_pengingat text not null check (jenis_pengingat in ('h3', 'h0')),
  terkirim_pada timestamptz not null default now(),
  primary key (lomba_id, kunci_tahap, jenis_pengingat)
);

alter table public.pengingat_terkirim enable row level security;

revoke all on public.pengingat_terkirim from anon, authenticated;
