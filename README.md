# SiMonLomba — Sistem Monitoring Perlombaan Mahasiswa

Aplikasi web untuk mencatat, memantau, dan mengarsipkan keikutsertaan mahasiswa dalam perlombaan:
mahasiswa mendaftarkan lomba beserta buktinya, dosen pembimbing memverifikasi, dan program studi
mendapat arsip prestasi yang siap diekspor untuk laporan akreditasi.

> **Ingin memasang SiMonLomba sendiri?** Ikuti **[docs/PANDUAN-SETUP.md](docs/PANDUAN-SETUP.md)** —
> langkah lengkap dari unduh ZIP sampai situs berjalan di Vercel + Supabase milik Anda,
> termasuk email Gmail, login Google, pengingat jadwal, dan troubleshooting.

---

## Fitur

**Mahasiswa**
- Pendaftaran lomba bertahap: detail lomba, anggota tim, timeline, poster, bukti daftar dan bayar.
- Dashboard dan daftar *Lomba Saya* dengan status, kelengkapan dokumen, dan tahapan terdekat.
- Lapor hasil beserta sertifikat; prestasi baru dihitung setelah sertifikat diverifikasi dosen.
- Anggota tim (dicocokkan lewat NIM) ikut melihat lomba dan berkasnya; hanya ketua yang bisa mengubah.
- Status *Tidak Lanjut* untuk lomba yang gugur, mundur, atau dibatalkan.

**Dosen pembimbing dan admin program studi**
- Dashboard monitoring: sebaran status, tingkat, bidang, dan prestasi terverifikasi.
- Verifikasi berkas (setujui/tolak dengan catatan), kalender agenda, filter lengkap.
- Arsip prestasi dengan ekspor CSV, Excel, dan PDF.
- Admin: menu **Kelola Pengguna** untuk mengubah peran akun dan melepas NIM yang diklaim akun yang salah.

**Akun dan notifikasi**
- Daftar dengan email pribadi; verifikasi email dengan **kode OTP**; lupa kata sandi dengan kode.
- **Masuk dengan Google** (opsional) dengan langkah *Lengkapi profil* (NIM, angkatan, prodi).
- Foto profil: unggah sendiri atau otomatis dari Google.
- **Pengingat jadwal**: lonceng di aplikasi untuk tahapan hari ini sampai 3 hari ke depan, dan
  email otomatis pukul 07.00 WIB pada H-3 dan hari H.
- Tampilan responsif untuk ponsel.

**Keamanan**
- Aturan akses dijaga di database (Row Level Security dan trigger), bukan hanya di tampilan:
  mahasiswa tidak bisa memalsukan status atau hasil, dosen hanya memverifikasi lomba bimbingannya,
  peran dosen/admin memerlukan kode otorisasi.

## Teknologi

| Bagian | Teknologi |
| --- | --- |
| Antarmuka | React 19, Vite 8, Tailwind CSS 4, React Router 7, Lucide |
| Backend | Supabase: Auth, Postgres + RLS, Storage, Realtime, Edge Functions (Deno), Cron |
| Email | SMTP Gmail (kode OTP lewat Supabase Auth, pengingat lewat Edge Function) |
| Hosting | Vercel |
| Ekspor | jsPDF, jspdf-autotable, write-excel-file |
| Pengujian | Vitest, React Testing Library |

## Struktur folder

```
src/
  auth/          sesi, AuthContext (daftar, masuk, OTP, Google), penjaga rute
  components/    komponen UI, layout (Topbar, lonceng pengingat), komponen auth
  features/      logika per fitur: lomba, pendaftaran, monitoring, arsip/ekspor
  pages/         halaman mahasiswa, dosen, masuk/daftar, privasi
  services/      akses data (Supabase atau data contoh lokal)
supabase/
  migrations/    14 berkas SQL, dijalankan berurutan
  templates/     template email kode OTP (Confirm sign up, Reset password)
  functions/     Edge Function kirim-pengingat
docs/            panduan setup dan dokumentasi
```

## Menjalankan di komputer sendiri

Perlu Node.js 22 LTS atau lebih baru.

```bash
npm ci
npm run dev
```

Buka <http://localhost:5173>. Tanpa konfigurasi, aplikasi memakai **data contoh** yang tersimpan
di browser. Untuk menyambungkan ke Supabase, salin `.env.example` menjadi `.env.local` dan isi
`VITE_SUPABASE_URL` serta `VITE_SUPABASE_ANON_KEY`.

Untuk menampilkan akun demo di mode data contoh, buat `.env.development.local` berisi
`VITE_MODE_DEMO=true` (kata sandi semua akun demo: `demo1234`).

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Server pengembangan |
| `npm test` | Menjalankan semua tes otomatis |
| `npm run build` | Build produksi ke folder `dist/` |
| `npm run preview` | Melihat hasil build di komputer |

## Variabel lingkungan

| Nama | Wajib | Keterangan |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Ya (produksi) | Project URL Supabase |
| `VITE_SUPABASE_ANON_KEY` | Ya (produksi) | Kunci `anon` public Supabase |
| `VITE_EMAIL_KONTAK` | Tidak | Email kontak di halaman `/privasi` |
| `VITE_MODE_DEMO` | Tidak | `true` hanya untuk situs demo berisi data contoh |

Secret Edge Function `kirim-pengingat` (diisi di Supabase, bukan di Vercel):
`SMTP_USER`, `SMTP_PASS`, `SITUS_URL`, dan `CRON_SECRET` (opsional, disarankan).

Jangan pernah menaruh kunci `service_role`, App Password Gmail, atau Client Secret Google di
repository maupun di Vercel.

## Pemecahan masalah

Daftar masalah yang sering terjadi beserta solusinya ada di
[docs/PANDUAN-SETUP.md → Troubleshooting](docs/PANDUAN-SETUP.md#16-troubleshooting).
