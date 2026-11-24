# Panduan Setup SiMonLomba dari Nol

Panduan ini untuk siapa pun (dosen, admin prodi) yang ingin menjalankan **SiMonLomba milik sendiri**:
kode di GitHub sendiri, database di Supabase sendiri, situs di Vercel sendiri, dan email dikirim
dari Gmail sendiri. Tidak ada yang bergantung pada akun pembuat aplikasi.

Semua layanan yang dipakai **gratis** (paket free). Tidak perlu kartu kredit.

Perkiraan waktu: **60–90 menit** untuk pertama kali.

---

## Daftar isi

1. [Yang perlu disiapkan](#1-yang-perlu-disiapkan)
2. [Gambaran sistem](#2-gambaran-sistem)
3. [Unduh kode dan buat repository GitHub sendiri](#3-unduh-kode-dan-buat-repository-github-sendiri)
4. [Buat project Supabase](#4-buat-project-supabase)
5. [Jalankan migrasi database](#5-jalankan-migrasi-database)
6. [Ganti kode otorisasi dosen dan admin (WAJIB)](#6-ganti-kode-otorisasi-dosen-dan-admin-wajib)
7. [Siapkan Gmail untuk mengirim email (SMTP)](#7-siapkan-gmail-untuk-mengirim-email-smtp)
8. [Pasang SMTP Gmail dan template email di Supabase](#8-pasang-smtp-gmail-dan-template-email-di-supabase)
9. [Aktifkan verifikasi email (OTP)](#9-aktifkan-verifikasi-email-otp)
10. [Deploy situs ke Vercel](#10-deploy-situs-ke-vercel)
11. [Sambungkan alamat situs ke Supabase](#11-sambungkan-alamat-situs-ke-supabase)
12. [Pengingat jadwal lomba lewat email](#12-pengingat-jadwal-lomba-lewat-email)
13. [Login dengan Google (opsional)](#13-login-dengan-google-opsional)
14. [Membuat akun pertama](#14-membuat-akun-pertama)
15. [Daftar periksa akhir](#15-daftar-periksa-akhir)
16. [Troubleshooting](#16-troubleshooting)
17. [Perawatan rutin](#17-perawatan-rutin)
18. [Menjalankan di komputer sendiri (untuk pengembang)](#18-menjalankan-di-komputer-sendiri-untuk-pengembang)

---

## 1. Yang perlu disiapkan

| Kebutuhan | Keterangan |
| --- | --- |
| Akun **GitHub** | Tempat menyimpan kode. Daftar di <https://github.com/signup>. |
| Akun **Supabase** | Database, login, penyimpanan berkas. Daftar di <https://supabase.com> (bisa masuk pakai akun GitHub). |
| Akun **Vercel** | Tempat situs berjalan. Daftar di <https://vercel.com/signup> (pilih "Continue with GitHub"). |
| Akun **Gmail** | Pengirim email kode verifikasi dan pengingat. Disarankan **Gmail khusus**, misalnya `simonlomba.prodi@gmail.com`, bukan Gmail pribadi. |
| File ZIP SiMonLomba | Dari tombol **Code → Download ZIP** di halaman GitHub repository asal. |
| Komputer + browser Chrome | Tidak perlu memasang Node.js kecuali ingin mengubah kode (lihat bagian 18). |

> **Catat semua yang Anda buat** (password database, App Password Gmail, kode dosen) di pengelola
> kata sandi atau dokumen pribadi. Beberapa hanya ditampilkan **sekali**.

---

## 2. Gambaran sistem

```
Pengguna (browser/HP)
        │
        ▼
  Vercel  ── situs React (halaman, tombol, formulir)
        │
        ▼
  Supabase
   ├─ Auth ............ daftar, masuk, kode OTP, login Google
   ├─ Database ........ data lomba, profil, aturan keamanan (RLS)
   ├─ Storage ......... poster, bukti, sertifikat, foto profil
   ├─ Edge Function ... kirim-pengingat (email jadwal lomba)
   └─ Cron ............ menjalankan kirim-pengingat tiap 07.00 WIB
        │
        ▼
  Gmail (SMTP) ── mengirim email kode OTP, reset sandi, pengingat
```

Urutan pemasangan di panduan ini mengikuti ketergantungan: database dulu, lalu email, lalu situs,
lalu fitur tambahan.

---

## 3. Unduh kode dan buat repository GitHub sendiri

Vercel men-deploy situs **dari repository GitHub**, jadi kode harus ada di GitHub Anda sendiri.

### 3.1 Ekstrak ZIP

1. Klik kanan file ZIP → **Extract All…** (Windows) atau klik dua kali (macOS).
2. Hasilnya folder bernama kira-kira `Sistem-Monitoring-Perlombaan-Mahasiswa-main`.
3. Pastikan di dalamnya ada `package.json`, folder `src`, dan folder `supabase`.

### 3.2 Buat repository kosong di GitHub

1. Buka <https://github.com/new>.
2. **Repository name**: misalnya `simonlomba`.
3. Pilih **Private** (disarankan) atau Public.
4. **Jangan** centang "Add a README", ".gitignore", atau "license". Repository harus kosong.
5. Klik **Create repository**.

### 3.3 Unggah kode — pilih salah satu cara

#### Cara A — GitHub Desktop (paling mudah, disarankan)

1. Unduh dan pasang **GitHub Desktop**: <https://desktop.github.com>. Masuk dengan akun GitHub Anda.
2. **File → Add local repository…** → pilih folder hasil ekstrak.
3. Muncul pesan "This directory does not appear to be a Git repository" → klik **create a repository**
   → **Create repository**.
4. Klik **Publish repository** di kanan atas.
   - Name: sama dengan nama repository yang tadi dibuat (atau biarkan GitHub Desktop yang membuat).
   - Centang **Keep this code private** bila ingin privat.
5. Buka repository di GitHub; pastikan folder `src`, `supabase`, dan file `package.json` muncul.

#### Cara B — Upload lewat browser

1. Di halaman repository kosong, klik tautan **uploading an existing file**.
2. Seret **isi** folder hasil ekstrak (bukan foldernya) ke halaman.
3. Tunggu sampai semua berkas terunggah, lalu klik **Commit changes**.
4. Periksa berkas tersembunyi `.gitignore` dan `vercel.json` ikut terunggah. Bila `.gitignore`
   tidak ikut, buat manual: **Add file → Create new file**, nama `.gitignore`, isi:
   ```
   node_modules
   dist
   .env
   .env.*
   !.env.example
   .vercel
   ```

#### Cara C — Command line (bila sudah terbiasa git)

```bash
cd Sistem-Monitoring-Perlombaan-Mahasiswa-main
git init -b main
git add .
git commit -m "chore: impor SiMonLomba"
git remote add origin https://github.com/<akun-anda>/simonlomba.git
git push -u origin main
```

**Titik periksa:** halaman repository GitHub Anda menampilkan folder `src`, `supabase`, `public`,
dan berkas `package.json`, `vercel.json`.

---

## 4. Buat project Supabase

1. Buka <https://supabase.com/dashboard> → **New project**.
2. Isi:
   - **Name**: `simonlomba`
   - **Database Password**: klik **Generate a password**, lalu **simpan** (dipakai untuk backup).
   - **Region**: **Southeast Asia (Singapore)** — paling dekat ke Indonesia.
   - **Plan**: Free.
3. Klik **Create new project**, tunggu 1–2 menit sampai status **Healthy**.

### 4.1 Catat URL dan kunci API

Buka **Project Settings → API Keys**.

| Yang dicatat | Letak | Dipakai di |
| --- | --- | --- |
| **Project URL** (`https://xxxx.supabase.co`) | Project Settings → **Data API** (atau tombol **Connect**) | Vercel, Cron |
| **anon public key** (diawali `eyJ…`) | API Keys → tab **Legacy API keys** → `anon` `public` | Vercel, Cron |

> Kunci **anon** memang aman dibagikan ke browser (dilindungi aturan RLS).
> Kunci **service_role** / **secret** **JANGAN** pernah dipakai di Vercel atau ditaruh di GitHub.

Bila tab **Legacy API keys** tidak ada di project Anda, lihat
[Troubleshooting → Tidak ada legacy anon key](#tidak-ada-legacy-anon-key).

---

## 5. Jalankan migrasi database

Migrasi adalah berkas SQL yang membuat tabel, aturan keamanan, fungsi, dan tempat penyimpanan berkas.
Ada **14 berkas** di folder `supabase/migrations`, dan **harus dijalankan berurutan** dari nama
berkas paling kecil.

1. Di Supabase, buka **SQL Editor** → **New query**.
2. Buka berkas pertama dengan Notepad/VS Code, **salin seluruh isinya**, tempel ke SQL Editor,
   klik **Run** (atau `Ctrl + Enter`).
3. Pastikan muncul **Success. No rows returned**. Bila muncul peringatan
   *"Potential issue detected … destructive operations"*, klik **Run query** — perintah `drop … if exists`
   di berkas ini aman untuk database baru.
4. Kosongkan editor, ulangi untuk berkas berikutnya.

Urutan berkas:

| No | Berkas | Isi singkat |
| --- | --- | --- |
| 1 | `20261009000000_skema_awal.sql` | Tabel profil dan struktur awal |
| 2 | `20261009120000_cek_ketersediaan_akun.sql` | Cek email/NIM sudah terdaftar |
| 3 | `20261009130000_integrasi_realtime.sql` | Tabel data lomba, realtime, bucket berkas |
| 4 | `20261012000000_kunci_verifikasi_dosen.sql` | Aturan verifikasi oleh dosen |
| 5 | `20261012010000_batasi_baca_profil.sql` | Pembatasan baca profil |
| 6 | `20261012020000_hapus_tabel_lama.sql` | Bersih-bersih tabel versi lama |
| 7 | `20261012030000_kunci_status_hasil.sql` | Kunci status dan hasil lomba |
| 8 | `20261012040000_status_tidak_lanjut.sql` | Status "Tidak Lanjut" |
| 9 | `20261012050000_batasi_hapus_lomba.sql` | Aturan hapus lomba |
| 10 | `20261119000000_pengingat_jadwal.sql` | Catatan email pengingat |
| 11 | `20261119010000_email_pribadi_bebas.sql` | Boleh daftar dengan email pribadi |
| 12 | `20261119020000_foto_profil.sql` | Penyimpanan foto profil |
| 13 | `20261119030000_login_google.sql` | Login Google dan lengkapi profil |
| 14 | `20261124000000_perbaikan_audit.sql` | Akses berkas anggota tim, alat admin (ubah peran, lepas NIM) |

**Titik periksa** — jalankan query ini di SQL Editor:

```sql
select
  (select count(*) from information_schema.tables
     where table_schema = 'public'
       and table_name in ('profiles', 'data_lomba', 'kode_otorisasi_peran', 'pengingat_terkirim')) as tabel_utama,
  (select count(*) from storage.buckets where id in ('berkas-lomba', 'avatar')) as bucket,
  (select count(*) from pg_proc where proname in ('handle_user_terdaftar', 'lengkapi_profil', 'admin_ubah_peran', 'admin_kosongkan_nim')) as fungsi;
```

Hasil yang benar: `tabel_utama = 4`, `bucket = 2`, `fungsi = 4`.

> Migrasi sudah diuji berurutan pada database kosong: 14/14 berhasil.
> Bila satu berkas gagal, **jangan lanjut** — lihat [Troubleshooting → Migrasi gagal](#migrasi-gagal).

---

## 6. Ganti kode otorisasi dosen dan admin (WAJIB)

Peran dosen dan admin dilindungi **kode otorisasi**. Migrasi nomor 3 mengisi keduanya dengan
**kode acak yang tidak diketahui siapa pun**, jadi sebelum langkah ini **belum ada yang bisa
mendaftar sebagai dosen**. Tetapkan kode Anda sendiri:

Di SQL Editor, ganti teks di dalam tanda kutip dengan kode rahasia Anda sendiri
(minimal 12 karakter, campuran huruf dan angka, tanpa spasi):

```sql
update public.kode_otorisasi_peran set kode = 'GANTI-KODE-DOSEN-ANDA' where role = 'dosen';
update public.kode_otorisasi_peran set kode = 'GANTI-KODE-ADMIN-ANDA' where role = 'admin';
select role, length(kode) as panjang_kode from public.kode_otorisasi_peran;
```

**Titik periksa:** muncul dua baris (`dosen`, `admin`) dengan `panjang_kode` sesuai kode baru.

> Kode bawaan versi lama (`DOSEN2026`, `PRODI2026`) tertulis di dokumentasi dan riwayat kode.
> Bila database Anda dibuat dari versi lama, perintah di atas sekaligus mengganti kode tersebut.

Bagikan kode dosen hanya kepada dosen pembimbing (misalnya lewat grup dosen), **bukan** ke mahasiswa.
Bila kode bocor, cukup jalankan ulang perintah `update` di atas dengan kode baru.

---

## 7. Siapkan Gmail untuk mengirim email (SMTP)

Supabase bawaan hanya boleh mengirim **beberapa email per jam** dan hanya ke anggota tim project.
Agar kode OTP dan pengingat sampai ke semua mahasiswa, email dikirim lewat Gmail Anda.

### 7.1 Aktifkan Verifikasi 2 Langkah

1. Masuk ke Gmail pengirim, buka <https://myaccount.google.com/security>.
2. Di bagian **Cara Anda login ke Google**, aktifkan **Verifikasi 2 Langkah** dan ikuti petunjuknya.

### 7.2 Buat App Password (Sandi Aplikasi)

1. Buka <https://myaccount.google.com/apppasswords>
   (bila halaman tidak tersedia, Verifikasi 2 Langkah belum aktif).
2. **Nama aplikasi**: `SiMonLomba` → klik **Buat**.
3. Muncul **sandi 16 huruf** (contoh bentuk: `abcd efgh ijkl mnop`).
   **Salin dan simpan sekarang** — Google tidak akan menampilkannya lagi.

> App Password ini dipakai **dua kali**: di SMTP Supabase (bagian 8) dan di secret Edge Function
> (bagian 12). Bila hilang, buat App Password baru lalu ganti di kedua tempat.
> Jangan pernah menaruh App Password di GitHub, chat, atau email.

---

## 8. Pasang SMTP Gmail dan template email di Supabase

### 8.1 SMTP

1. Supabase → **Authentication → Emails → SMTP Settings**.
2. Nyalakan **Enable custom SMTP**, lalu isi:

| Kolom | Isi |
| --- | --- |
| Sender email address | alamat Gmail pengirim, mis. `simonlomba.prodi@gmail.com` |
| Sender name | `SiMonLomba` |
| Host | `smtp.gmail.com` |
| Port number | `465` |
| Username | alamat Gmail pengirim (sama dengan sender email) |
| Password | **App Password 16 huruf** dari bagian 7.2 (spasi boleh dihapus) |

3. Klik **Save changes**. Peringatan kuning *"designed for sending personal … messages"* boleh diabaikan
   untuk skala prodi (batas Gmail ±500 email/hari).
4. Buka **Authentication → Rate Limits**, naikkan **Rate limit for sending emails** ke `100` per jam
   (bawaan custom SMTP hanya 30/jam) → **Save**.

### 8.2 Template email berisi kode

Template bawaan Supabase berisi **tautan**, sedangkan SiMonLomba memakai **kode angka**. Ganti dua template:

1. **Authentication → Emails → Templates → Confirm sign up**
   - **Subject**: `Kode pendaftaran SiMonLomba`
   - **Body**: hapus semua isi, tempel seluruh isi berkas `supabase/templates/confirmation.html`.
   - Klik **Save changes**.
2. **Authentication → Emails → Templates → Reset password**
   - **Subject**: `Kode ganti kata sandi SiMonLomba`
   - **Body**: tempel seluruh isi berkas `supabase/templates/recovery.html`.
   - Klik **Save changes**.

**Titik periksa:** di tab **Preview** kedua template, tampak kotak besar berisi kode
(di template tertulis `{{ .Token }}`).

---

## 9. Aktifkan verifikasi email (OTP)

1. **Authentication → Sign In / Providers**.
2. Bagian **User Signups**: pastikan **Allow new users to sign up** menyala, lalu nyalakan
   **Confirm email** → **Save changes**.
3. Klik baris provider **Email**:
   - **Email OTP Expiration**: `3600` (detik = 1 jam)
   - **Email OTP Length**: `8`
   - **Secure email change**: nyala
   - **Save**.

Dengan ini, setiap akun baru wajib memasukkan kode dari email sebelum bisa masuk.

---

## 10. Deploy situs ke Vercel

1. Buka <https://vercel.com/new>. Bila diminta, klik **Install** untuk menghubungkan Vercel ke
   GitHub dan beri akses ke repository `simonlomba`.
2. Di daftar repository, klik **Import** pada `simonlomba`.
3. **Framework Preset** otomatis **Vite** (diatur oleh `vercel.json`). Jangan ubah Build/Output.
4. Buka **Environment Variables**, tambahkan:

| Key | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | Project URL dari bagian 4.1 |
| `VITE_SUPABASE_ANON_KEY` | anon public key dari bagian 4.1 |
| `VITE_EMAIL_KONTAK` | (opsional) email yang tampil di halaman Kebijakan Privasi, mis. email prodi |

   **Jangan** menambahkan `VITE_MODE_DEMO` — variabel itu hanya untuk situs demo berisi data contoh.

5. Klik **Deploy**, tunggu 1–2 menit sampai muncul **Congratulations**.
6. Catat alamat situs, contohnya `https://simonlomba-prodi.vercel.app`
   (lihat **Project → Settings → Domains**). Alamat ini disebut **ALAMAT_SITUS** di langkah berikutnya.

**Titik periksa:** buka ALAMAT_SITUS → muncul halaman **Masuk**. Tekan `F12` → tab **Console**:
harus ada tulisan `[SiMonLomba] Supabase terhubung`. Bila tertulis `Supabase BELUM terhubung`,
lihat [Troubleshooting → Situs memakai data contoh / Supabase belum terhubung](#situs-memakai-data-contoh--supabase-belum-terhubung).

> Setiap kali Anda mengubah Environment Variables di Vercel, lakukan **Deployments → ⋯ → Redeploy**,
> karena nilainya dibaca saat build.

---

## 11. Sambungkan alamat situs ke Supabase

Supabase perlu tahu alamat situs Anda agar login (terutama login Google) kembali ke situs yang benar.

1. Supabase → **Authentication → URL Configuration**.
2. **Site URL**: isi ALAMAT_SITUS, mis. `https://simonlomba-prodi.vercel.app` → **Save changes**.
3. **Redirect URLs** → **Add URL**, tambahkan:
   - `https://simonlomba-prodi.vercel.app/**` (ganti dengan ALAMAT_SITUS Anda)
   - `http://localhost:5173/**` (hanya bila ingin menjalankan di komputer sendiri)
4. **Save URLs**.

---

## 12. Pengingat jadwal lomba lewat email

Fitur ini mengirim email ke peserta lomba setiap pagi **07.00 WIB** untuk tahapan yang jatuh
**3 hari lagi (H-3)** dan **hari itu (hari H)**. Tanpa langkah ini, aplikasi tetap jalan; lonceng
pengingat di dalam situs tetap ada, hanya email pengingat yang tidak terkirim.

### 12.1 Buat Edge Function

1. Supabase → **Edge Functions → Deploy a new function → Via Editor**.
2. Di panel **Files** sudah ada `index.ts`. Hapus isinya, lalu tempel **seluruh isi** berkas
   `supabase/functions/kirim-pengingat/index.js` dari repository.
3. Klik **Add File**, ganti namanya (klik dua kali) menjadi **`pengingat.js`**, lalu tempel
   **seluruh isi** `supabase/functions/kirim-pengingat/pengingat.js`.
4. **Function name** (kanan bawah): `kirim-pengingat` → **Deploy function**.
5. Di halaman fungsi → tab **Settings**, pastikan **Verify JWT with legacy secret** **menyala**.

### 12.2 Isi secret fungsi

**Edge Functions → Secrets → Add or replace secrets**, tambahkan tiga secret (klik **Add another**
untuk baris berikutnya), lalu **Save**:

| Name | Value |
| --- | --- |
| `SMTP_USER` | alamat Gmail pengirim |
| `SMTP_PASS` | App Password 16 huruf (bagian 7.2) |
| `SITUS_URL` | ALAMAT_SITUS, mis. `https://simonlomba-prodi.vercel.app` |
| `CRON_SECRET` | *(disarankan)* teks acak panjang; buat di SQL Editor dengan `select encode(gen_random_bytes(24), 'hex');` lalu salin hasilnya |

Dengan `CRON_SECRET`, fungsi hanya mau dijalankan oleh pemanggil yang mengirim header
`x-cron-secret` berisi nilai yang sama (bagian 12.4). Tanpa secret ini fungsi tetap berjalan, tetapi
siapa pun yang memegang anon key bisa memicunya (email ganda tetap dicegah).

### 12.3 Uji fungsi sekali

1. Halaman fungsi `kirim-pengingat` → tombol **Test** (kanan atas).
2. Method `POST`, body `{}`. Bila Anda mengisi `CRON_SECRET`, tambahkan header `x-cron-secret`
   berisi nilai yang sama → **Send Request**.
3. Hasil yang benar (contoh): `{"tanggal":"2026-12-01","ditemukan":0,"terkirim":0,"dilewati":0,"gagal":0}`
   - `tanggal` harus tanggal hari ini (WIB).
   - `ditemukan` = jumlah jadwal yang jatuh hari ini/H-3. Angka 0 normal bila belum ada lomba.

Bila muncul `SMTP_USER atau SMTP_PASS belum diisi`, ulangi bagian 12.2.
Bila muncul `SITUS_URL belum diisi`, tambahkan secret `SITUS_URL`.
Bila muncul `Pemanggil tidak dikenal.` (HTTP 401), header `x-cron-secret` tidak ada atau nilainya
berbeda dari secret `CRON_SECRET`.

### 12.4 Jadwalkan setiap pagi

1. Supabase → **Integrations → Cron** → **Install integration** (memasang `pg_cron`).
2. Tab **Jobs** → **Create job**:
   - **Name**: `kirim-pengingat-harian`
   - **Schedule**: `0 0 * * *` (00.00 UTC = **07.00 WIB**)
   - **Type**: **Supabase Edge Function**. Bila tertulis *pg_net needs to be installed*, klik
     **Install pg_net extension** → **Enable**.
   - **Method**: `POST`; **Edge Function**: `kirim-pengingat`; **Timeout**: `5000`
   - **HTTP Headers** → **Add header**: name `Authorization`, value `Bearer ` (dengan satu spasi)
     diikuti **anon public key** dari bagian 4.1.
     **Jangan** memakai kunci service_role.
   - Bila Anda mengisi `CRON_SECRET`: **Add header** lagi, name `x-cron-secret`, value sama dengan
     secret `CRON_SECRET`.
   - **HTTP Request Body**: biarkan kosong.
3. **Create cron job**.

**Titik periksa:** di tab Jobs ada `kirim-pengingat-harian` dengan **Next run** pukul 07.00 (+0700).
Keesokan harinya, kolom **Last run** terisi.

---

## 13. Login dengan Google (opsional)

Menambah tombol **Masuk dengan Google**. Foto Google otomatis menjadi foto profil, dan pengguna
baru diarahkan ke halaman **Lengkapi profil** (NIM, angkatan, prodi). Login Google selalu membuat
akun **mahasiswa**; dosen tetap mendaftar lewat `/daftar-staf`.

Tombol Google tampil otomatis di situs; sebelum langkah ini selesai, menekannya akan menampilkan
pesan *provider is not enabled*.

### 13.1 Layar persetujuan Google (OAuth consent)

1. Buka <https://console.cloud.google.com> dengan Gmail Anda. Gunakan project yang sudah ada,
   atau buat baru (**tidak perlu** billing).
2. Menu **Google Auth Platform → Overview → Get started**:
   - **App name**: `SiMonLomba`; **User support email**: Gmail Anda → **Next**
   - **Audience**: **External** → **Next**
   - **Contact information**: Gmail Anda → **Next**
   - Centang **I agree to the Google API Services: User Data Policy** → **Continue** → **Create**.
3. **Branding**:
   - **Application home page**: ALAMAT_SITUS
   - **Application privacy policy link**: `ALAMAT_SITUS/privasi`
   - **Save**.

### 13.2 Buat OAuth Client

1. **Clients → Create client** → **Application type**: **Web application**, **Name**: `SiMonLomba`.
2. **Authorised JavaScript origins** → **Add URI**: ALAMAT_SITUS
   (tambahkan juga `http://localhost:5173` bila perlu).
3. **Authorised redirect URIs** → **Add URI**:
   `https://<project-ref>.supabase.co/auth/v1/callback`
   — salin persis dari Supabase **Authentication → Sign In / Providers → Google → Callback URL**.
4. **Create**. Salin **Client ID** dan **Client secret** (secret hanya tampil sekali; boleh klik
   **Download JSON** sebagai cadangan, tapi jangan taruh berkasnya di repository).

### 13.3 Publikasikan aplikasi

**Audience → Publish app → Confirm**. Status berubah menjadi **In production**. Tanpa ini, hanya
akun yang didaftarkan sebagai *test user* yang bisa login. Verifikasi Google **tidak** diperlukan
karena aplikasi hanya meminta nama, email, dan foto.

### 13.4 Aktifkan provider Google di Supabase

1. Supabase → **Authentication → Sign In / Providers → Google**.
2. Nyalakan **Enable Sign in with Google**, isi **Client IDs** dan **Client Secret** → **Save**.

**Titik periksa:** buka ALAMAT_SITUS di jendela samaran → **Masuk dengan Google** → pilih akun →
kembali ke SiMonLomba di halaman **Lengkapi profil**. (Pengaturan Google kadang perlu
5–30 menit sebelum aktif.)

---

## 14. Membuat akun pertama

### Akun dosen

1. Buka `ALAMAT_SITUS/daftar-staf` (halaman ini sengaja tidak ditautkan dari halaman masuk).
2. Isi nama, email, prodi, **kode otorisasi dosen** dari bagian 6, dan kata sandi.
3. Masukkan **kode verifikasi** yang masuk ke email (cek juga folder Spam).
4. Anda masuk ke **Dashboard Monitoring**.

### Akun admin program studi

Halaman pendaftaran tidak menyediakan pilihan admin. Daftarkan dulu sebagai dosen, lalu ubah
perannya di SQL Editor (ganti emailnya):

```sql
update public.profiles set role = 'admin' where email = 'email.admin@contoh.ac.id';
select email, role from public.profiles where role = 'admin';
```

Keluar lalu masuk lagi agar peran baru terbaca.

Admin pertama dibuat lewat SQL; admin berikutnya cukup lewat menu **Kelola Pengguna** di aplikasi
(hanya terlihat oleh admin): pilih akun → ubah perannya → konfirmasi.

### Akun mahasiswa

Mahasiswa mendaftar sendiri lewat tombol **Daftar sekarang** di halaman masuk (atau **Daftar
dengan Google**). Email pribadi diperbolehkan.

---

## 15. Daftar periksa akhir

Centang semuanya sebelum situs dibagikan ke mahasiswa:

- [ ] Ke-14 migrasi berhasil; query periksa di bagian 5 menghasilkan `4 / 2 / 4`.
- [ ] Kode dosen dan admin **sudah diganti** (bagian 6).
- [ ] SMTP Gmail tersimpan; dua template email berisi kode (bagian 8).
- [ ] **Confirm email** menyala (bagian 9).
- [ ] Console situs menulis `Supabase terhubung` (bagian 10).
- [ ] Site URL dan Redirect URLs berisi ALAMAT_SITUS (bagian 11).
- [ ] Daftar akun mahasiswa uji → kode OTP masuk email → bisa masuk.
- [ ] **Lupa kata sandi** dengan akun uji → kode masuk email → kata sandi baru berlaku.
- [ ] Daftar akun dosen dengan kode baru berhasil; dengan kode salah akun menjadi mahasiswa.
- [ ] Mahasiswa uji mendaftarkan lomba + unggah bukti; dosen bisa melihat dan memverifikasi.
- [ ] Unggah foto profil berhasil.
- [ ] Uji Edge Function mengembalikan JSON berisi `tanggal` hari ini (bagian 12.3).
- [ ] (Bila dipasang) Masuk dengan Google kembali ke situs Anda, bukan situs lain.
- [ ] Akun-akun uji dihapus: **Authentication → Users → ⋯ → Delete user**.

---

## 16. Troubleshooting

### Situs memakai data contoh / Supabase belum terhubung

**Gejala:** muncul akun demo di halaman masuk, data hilang saat ganti browser, atau Console menulis
`Supabase BELUM terhubung`.
**Penyebab:** `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` belum diisi, salah ketik, atau situs
belum di-deploy ulang setelah diisi.
**Perbaikan:** Vercel → **Settings → Environment Variables** → periksa kedua nilai (tanpa spasi atau
tanda kutip) untuk environment **Production** → **Deployments → ⋯ → Redeploy**. Pastikan
`VITE_MODE_DEMO` **tidak** ada.

### Halaman 404 saat refresh

**Penyebab:** berkas `vercel.json` tidak ikut terunggah ke GitHub.
**Perbaikan:** pastikan `vercel.json` ada di akar repository (lihat bagian 3), lalu redeploy.

### Migrasi gagal

| Pesan | Penyebab | Perbaikan |
| --- | --- | --- |
| `relation "public.profiles" does not exist` | Urutan berkas terlewat | Jalankan dari berkas nomor 1 secara berurutan |
| `already exists` | Berkas dijalankan dua kali | Umumnya aman diabaikan; lanjutkan berkas berikutnya |
| `permission denied for schema auth` | Dijalankan bukan dari SQL Editor dashboard | Jalankan lewat **SQL Editor** Supabase |
| Pesan lain | — | Jangan lanjut; salin pesan galatnya, periksa kembali isi berkas tersalin utuh |

### Email kode verifikasi tidak masuk

Periksa berurutan:
1. Folder **Spam/Junk** penerima (terutama email kampus berbasis Outlook). Minta penerima menandai
   *Bukan spam*.
2. **Authentication → Emails → SMTP Settings**: host `smtp.gmail.com`, port `465`, username = alamat
   Gmail, password = **App Password** (bukan sandi Gmail biasa).
3. App Password dicabut atau Verifikasi 2 Langkah dimatikan → buat App Password baru (bagian 7.2),
   pasang ulang di SMTP **dan** di secret `SMTP_PASS`.
4. **Authentication → Rate Limits**: batas email per jam tercapai → naikkan, atau tunggu satu jam.
5. **Logs → Auth** di Supabase: cari baris berisi `smtp` untuk pesan galat detail.

### "Tunggu xx detik sebelum meminta kode baru"

Supabase membatasi permintaan kode setiap 60 detik per email. Tunggu, lalu tekan **Kirim ulang kode**.

### "Kode verifikasi salah atau sudah kedaluwarsa"

- Kode berlaku **1 jam** dan hanya kode **terakhir** yang berlaku. Minta kode baru lalu pakai yang terbaru.
- Pastikan panjang kode di bagian 9 (`8`) sesuai dengan kode yang diterima.

### "Email akun ini belum diverifikasi"

Akun dibuat tetapi kodenya belum dimasukkan. Di halaman masuk, isi email + sandi → kode dikirim
ulang otomatis → masukkan kode.

### Pendaftaran ditolak / "Database error saving new user"

- Email atau NIM sudah dipakai akun lain.
- Migrasi nomor 11–14 belum dijalankan (fungsi pendaftaran versi lama).
- Lihat **Logs → Postgres** untuk pesan dari fungsi `handle_user_terdaftar`.

### Dosen terdaftar sebagai mahasiswa

Dua penyebab umum:
- Kode otorisasi yang diketik tidak sama dengan kode di tabel `kode_otorisasi_peran`
  (huruf besar/kecil berpengaruh).
- Dosen menekan **Masuk dengan Google**. Login Google selalu membuat akun mahasiswa (di bawah
  tombolnya tertulis *Khusus mahasiswa*).

Perbaiki perannya: admin membuka **Kelola Pengguna** → cari email dosen itu → ubah peran ke
**Dosen Pembimbing** → konfirmasi. Dosen tersebut lalu keluar dan masuk lagi (bila diarahkan ke
*Lengkapi profil*, tidak perlu diisi).

Bila belum ada admin, jalankan di SQL Editor:
```sql
update public.profiles set role = 'dosen', nim = null, angkatan = null where email = 'email.dosen@contoh.com';
```

### NIM sudah dipakai akun lain

Mahasiswa mendapat pesan *NIM ini sudah dipakai akun lain* padahal belum pernah mendaftar, artinya
ada akun lain yang memakai NIM tersebut (salah ketik atau sengaja). Karena email pribadi
diperbolehkan, NIM tidak diverifikasi otomatis.

Admin membuka **Kelola Pengguna** → cari NIM tersebut → periksa email pemakainya → **Kosongkan
NIM**. Setelah itu pemilik NIM yang sah bisa mendaftar atau melengkapi profil.

Alternatif lewat SQL Editor:

```sql
select id, nama, email, nim from public.profiles where nim = '2502000000';
update public.profiles set nim = null, angkatan = null where nim = '2502000000' and email = 'email.akun.yang.salah@contoh.com';
```

Akun yang NIM-nya dikosongkan akan diminta mengisi NIM lagi saat masuk berikutnya.

### Lupa kode otorisasi dosen

Kode tidak bisa dibaca dari aplikasi. Tetapkan kode baru dengan perintah di bagian 6.

### Login Google gagal

| Gejala | Perbaikan |
| --- | --- |
| `provider is not enabled` | Bagian 13.4 belum disimpan |
| `redirect_uri_mismatch` (halaman Google) | Callback URL di Google Client tidak sama persis dengan yang ditampilkan Supabase (13.2 langkah 3) |
| Setelah login Google kembali ke situs lain / localhost | Site URL dan Redirect URLs (bagian 11) belum berisi ALAMAT_SITUS |
| `Access blocked: … has not completed the Google verification process` / hanya akun tertentu bisa | Aplikasi masih **Testing**; lakukan **Publish app** (13.3) |
| Tombol **Publish app** abu-abu | Isi Application home page dan privacy policy link di **Branding** (13.1 langkah 3) |
| Login Google berhasil tapi terus diminta Lengkapi profil | NIM belum tersimpan; cek pesan merah di formulir (NIM 10 digit, belum dipakai akun lain) |

### Unggah foto profil gagal

- Foto lebih dari 5 MB atau bukan JPG/PNG/WebP.
- Migrasi nomor 12 belum dijalankan (bucket `avatar` belum ada). Periksa: **Storage** harus berisi
  bucket `avatar` dan `berkas-lomba`.

### Email pengingat tidak terkirim

1. **Edge Functions → kirim-pengingat → Test** (bagian 12.3) dan baca hasilnya.
2. `ditemukan: 0` → memang tidak ada tahapan yang jatuh hari ini/H-3 (normal).
3. `dilewati` > 0 → peserta lomba tidak punya akun (anggota tim hanya tercatat NIM) atau email
   pengingat untuk tahapan itu sudah pernah dikirim.
4. `gagal` > 0 → buka tab **Logs** fungsi; biasanya App Password salah di secret `SMTP_PASS`.
5. Cron tidak jalan → **Integrations → Cron → Jobs**: pastikan job aktif dan header Authorization
   diawali `Bearer ` diikuti anon key. Klik job → riwayat run untuk melihat status HTTP
   (`401` = kunci salah/tanpa `Bearer`).

### Tidak ada legacy anon key

Project Supabase yang sangat baru mungkin hanya menampilkan **Publishable key** (`sb_publishable_…`).
- Untuk Vercel (`VITE_SUPABASE_ANON_KEY`) publishable key bisa dipakai.
- Untuk Cron (bagian 12.4), fungsi memakai **Verify JWT with legacy secret** yang membutuhkan
  kunci `anon` berbentuk JWT (diawali `eyJ`). Bila halaman **API Keys** Anda tidak punya tab
  *Legacy API keys*, hubungi pengembang untuk menyesuaikan pemeriksaan kunci pada fungsi.

### Situs tidak bisa dibuka / login gagal setelah lama tidak dipakai

Project Supabase gratis **dijeda otomatis** setelah ±7 hari tanpa aktivitas.
Supabase → dashboard project → **Restore project**, tunggu sampai **Healthy** (beberapa menit).

### Data hilang di HP / browser lain

Itu tanda situs berjalan dalam mode data contoh. Lihat bagian pertama troubleshooting.

### Anggota tim tidak melihat lomba atau berkasnya

Anggota tim melihat lomba di **Lomba Saya** bila NIM di profilnya sama dengan NIM yang dicatat
ketua tim. Mereka bisa membuka berkas, tetapi hanya ketua (yang mendaftarkan lomba) yang bisa
mengubah data, mengunggah berkas, dan melaporkan hasil.

- Lomba tidak muncul → cocokkan NIM di **Profil** anggota dengan NIM di tab **Tim** lomba.
- Berkas tidak bisa dibuka → migrasi nomor 14 belum dijalankan.

### Pesan "data ini sedang diubah orang lain"

Dua orang menyimpan lomba yang sama pada saat bersamaan. Aplikasi sudah mencoba ulang otomatis;
bila pesan tetap muncul, muat ulang halaman (`F5`) lalu ulangi perubahan.

---

## 17. Perawatan rutin

| Kapan | Apa |
| --- | --- |
| Setiap minggu | Buka situs sekali agar project Supabase tidak dijeda. |
| Setiap semester | Ganti kode otorisasi dosen (bagian 6). |
| Bila Gmail pengirim diganti / App Password dicabut | Perbarui SMTP Supabase **dan** secret `SMTP_USER` / `SMTP_PASS`. |
| Bila alamat situs berubah | Perbarui Site URL/Redirect URLs (bagian 11), secret `SITUS_URL` (bagian 12.2), dan URL di Google (bagian 13). |
| Berkala | **Advisors → Security Advisor** di Supabase; tindak lanjuti peringatan berwarna merah. |
| Sebelum perubahan besar | Cadangkan data: **Database → Backups** (paket berbayar) atau ekspor tabel lewat **Table Editor → Export to CSV**. |

---

## 18. Menjalankan di komputer sendiri (untuk pengembang)

Perlu **Node.js 22 LTS atau lebih baru** (<https://nodejs.org>) dan Git.

```bash
npm ci
npm run dev
```

Buka <http://localhost:5173>.

- Tanpa berkas `.env.local`: aplikasi berjalan dengan **data contoh** di browser.
- Dengan Supabase: salin `.env.example` menjadi `.env.local`, isi `VITE_SUPABASE_URL` dan
  `VITE_SUPABASE_ANON_KEY`, lalu jalankan ulang `npm run dev`.
- Akun demo (hanya mode data contoh): buat `.env.development.local` berisi `VITE_MODE_DEMO=true`.
  Kata sandi semua akun demo: `demo1234`.

Perintah lain:

```bash
npm test          # menjalankan semua tes otomatis
npm run build     # membuat versi produksi di folder dist/
```
