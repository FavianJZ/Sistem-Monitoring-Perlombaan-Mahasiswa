# Backup database

Workflow `.github/workflows/backup-database.yml` mencadangkan database Supabase setiap
Senin pukul 01.00 WIB (Minggu 18.00 UTC), bisa juga dijalankan manual dari tab
**Actions → Backup database → Run workflow**. Hasilnya berkas `simonlomba-backup-YYYYMMDD.tar.gz.gpg`
di bagian **Artifacts** pada halaman run, disimpan 90 hari.

Isi backup: peran (`roles.sql`), struktur tabel/policy/fungsi (`schema.sql`), dan data
skema `public`, `auth`, `storage` (`data.sql`). Berkas yang diunggah (poster, bukti, foto)
**tidak** ikut; yang tercadang hanya catatan metadatanya.

## Secret yang dibutuhkan

Diisi di **GitHub → Settings → Secrets and variables → Actions → New repository secret**:

| Nama | Isi |
| --- | --- |
| `SUPABASE_DB_URL` | Connection string **Session pooler** dari Supabase → Connect (bukan Direct connection, karena runner GitHub tidak mendukung IPv6). Ganti `[YOUR-PASSWORD]` dengan kata sandi database. |
| `BACKUP_PASSPHRASE` | Kata sandi enkripsi buatan sendiri, panjang dan acak. **Simpan juga di pengelola sandi**; tanpa ini backup tidak bisa dibuka. |

## Membuka dan memulihkan backup

1. Unduh artifact dari halaman run, ekstrak zip-nya sampai dapat berkas `.tar.gz.gpg`.
2. Dekripsi dan ekstrak:

   ```bash
   gpg --decrypt simonlomba-backup-YYYYMMDD.tar.gz.gpg > backup.tar.gz
   tar -xzf backup.tar.gz
   ```

3. Pulihkan ke project Supabase **baru/kosong** (jangan ke project yang masih dipakai):

   ```bash
   psql --single-transaction --variable ON_ERROR_STOP=1 \
     --file backup/roles.sql --file backup/schema.sql \
     --command 'SET session_replication_role = replica' \
     --file backup/data.sql --dbname "<connection string project baru>"
   ```

Uji pemulihan setidaknya sekali setelah backup pertama berhasil, supaya yakin berkasnya bisa dipakai.
