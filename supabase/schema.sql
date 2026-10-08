

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  nama text not null,
  email text unique not null,
  role text not null check (role in ('mahasiswa', 'dosen', 'admin')),
  nim text unique,
  angkatan integer,
  prodi text not null,
  avatar_url text,
  dibuat_pada timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Profil dapat dibaca oleh pengguna terotentikasi"
  on public.profiles for select
  using (auth.role() = 'authenticated');

create policy "Pengguna dapat memperbarui profil miliknya sendiri"
  on public.profiles for update
  using (auth.uid() = id);

create table if not exists public.lomba (
  id uuid default gen_random_uuid() primary key,
  judul text not null,
  penyelenggara text not null,
  kategori text not null,
  tingkat text not null check (tingkat in ('Universitas', 'Regional', 'Nasional', 'Internasional')),
  status text not null default 'draft' check (status in ('draft', 'menunggu_verifikasi', 'berjalan', 'selesai', 'ditolak')),
  capaian text, -- misal: 'Juara 1', 'Finalis'
  url_situs text,
  deskripsi text,
  id_pemilik uuid references public.profiles(id) on delete cascade not null,
  id_pembimbing uuid references public.profiles(id),
  dibuat_pada timestamp with time zone default timezone('utc'::text, now()) not null,
  diperbarui_pada timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.lomba enable row level security;

create policy "Mahasiswa dapat melihat lomba miliknya"
  on public.lomba for select
  using (auth.uid() = id_pemilik);

create policy "Dosen dan Admin dapat melihat seluruh lomba"
  on public.lomba for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role in ('dosen', 'admin')
    )
  );

create policy "Mahasiswa dapat mendaftarkan lomba baru"
  on public.lomba for insert
  with check (auth.uid() = id_pemilik);

create policy "Pemilik atau Admin dapat mengubah lomba"
  on public.lomba for update
  using (
    auth.uid() = id_pemilik or
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create table if not exists public.berkas_lomba (
  id uuid default gen_random_uuid() primary key,
  id_lomba uuid references public.lomba(id) on delete cascade not null,
  nama_berkas text not null,
  jenis_berkas text not null check (jenis_berkas in ('surat_tugas', 'proposal', 'bukti_pembayaran', 'laporan_kegiatan', 'sertifikat', 'foto_kegiatan')),
  url_dokumen text not null,
  status text not null default 'menunggu_verifikasi' check (status in ('menunggu_verifikasi', 'disetujui', 'ditolak')),
  catatan_penolakan text,
  diunggah_pada timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.berkas_lomba enable row level security;

create policy "Pengguna yang punya akses lomba dapat melihat berkas"
  on public.berkas_lomba for select
  using (
    exists (
      select 1 from public.lomba
      where lomba.id = berkas_lomba.id_lomba and (
        lomba.id_pemilik = auth.uid() or
        exists (
          select 1 from public.profiles
          where profiles.id = auth.uid() and profiles.role in ('dosen', 'admin')
        )
      )
    )
  );

create table if not exists public.anggota_lomba (
  id uuid default gen_random_uuid() primary key,
  id_lomba uuid references public.lomba(id) on delete cascade not null,
  nama text not null,
  nim text,
  peran text not null check (peran in ('ketua', 'anggota')),
  prodi text
);

alter table public.anggota_lomba enable row level security;

create policy "Pengguna dapat melihat anggota tim lomba yang bisa diakses"
  on public.anggota_lomba for select
  using (
    exists (
      select 1 from public.lomba
      where lomba.id = anggota_lomba.id_lomba and (
        lomba.id_pemilik = auth.uid() or
        exists (
          select 1 from public.profiles
          where profiles.id = auth.uid() and profiles.role in ('dosen', 'admin')
        )
      )
    )
  );

create or replace function public.handle_user_terdaftar()
returns trigger as $$
begin
  insert into public.profiles (id, nama, email, role, nim, angkatan, prodi)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nama', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'mahasiswa'),
    new.raw_user_meta_data->>'nim',
    (new.raw_user_meta_data->>'angkatan')::integer,
    coalesce(new.raw_user_meta_data->>'prodi', 'Teknik Informatika')
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_user_terdaftar();
