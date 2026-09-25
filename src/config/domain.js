/**
 * Kosakata domain sesuai PRD. Dipakai bersama oleh komponen tampilan,
 * data mock, dan nantinya jadi acuan enum di backend.
 */

export const BIDANG_LOMBA = [
  'Programming',
  'UI/UX',
  'Bisnis',
  'Olahraga',
  'Seni',
  'Riset',
  'Karya Tulis Ilmiah',
  'Debat',
  'Lainnya',
]

export const TINGKAT_LOMBA = ['Regional', 'Nasional', 'Internasional']

export const JENIS_KEIKUTSERTAAN = [
  { value: 'individu', label: 'Perorangan' },
  { value: 'tim', label: 'Tim / Kelompok' },
]

/** Status keikutsertaan. Bukan status persetujuan: PRD menghapus alur approval. */
export const STATUS_LOMBA = {
  terdaftar: { label: 'Terdaftar', tone: 'primary' },
  berlangsung: { label: 'Berlangsung', tone: 'accent' },
  selesai: { label: 'Selesai', tone: 'success' },
}

/** Capaian akhir sesuai daftar di PRD. */
export const CAPAIAN_LOMBA = {
  juara_1: { label: 'Juara 1', tone: 'success', peringkat: 1 },
  juara_2: { label: 'Juara 2', tone: 'success', peringkat: 2 },
  juara_3: { label: 'Juara 3', tone: 'success', peringkat: 3 },
  harapan: { label: 'Juara Harapan', tone: 'primary', peringkat: 4 },
  finalis: { label: 'Finalis', tone: 'primary', peringkat: 5 },
  peserta: { label: 'Peserta', tone: 'neutral', peringkat: 6 },
}

/** Tahapan timeline bawaan sesuai PRD, urutan ini juga urutan tampilnya. */
export const JENIS_TAHAPAN = [
  { value: 'pendaftaran', label: 'Pendaftaran', rentang: true },
  { value: 'tm', label: 'Technical Meeting', rentang: false },
  { value: 'penyisihan', label: 'Penyisihan / Pengumpulan Karya', rentang: true },
  { value: 'semifinal', label: 'Semifinal', rentang: false },
  { value: 'final', label: 'Final', rentang: false },
  { value: 'pengumuman', label: 'Pengumuman Pemenang', rentang: false },
]

/** Jenis berkas yang diunggah mahasiswa. */
export const JENIS_BERKAS = {
  bukti_daftar: { label: 'Bukti Pendaftaran', wajib: true },
  bukti_bayar: { label: 'Bukti Pembayaran', wajib: true },
  poster: { label: 'Poster / Publikasi', wajib: false },
  sertifikat: { label: 'Sertifikat', wajib: false },
  foto: { label: 'Foto Dokumentasi', wajib: false },
}

/** Batas unggah sesuai PRD: PDF/JPG/PNG maksimal 5MB. */
export const UNGGAH_MAKS_BYTE = 5 * 1024 * 1024
export const UNGGAH_TIPE_DIIZINKAN = ['application/pdf', 'image/jpeg', 'image/png']
export const UNGGAH_EKSTENSI_LABEL = 'PDF, JPG, atau PNG maksimal 5MB'

export const PROGRAM_STUDI = [
  'Teknik Informatika',
  'Sistem Informasi',
  'Desain Komunikasi Visual',
  'Manajemen',
  'Akuntansi',
  'Ilmu Komunikasi',
]

export function labelBidang(value) {
  return value ?? '-'
}

export function labelStatus(value) {
  return STATUS_LOMBA[value]?.label ?? value ?? '-'
}

export function labelCapaian(value) {
  return CAPAIAN_LOMBA[value]?.label ?? value ?? '-'
}

export function labelTahapan(value) {
  return JENIS_TAHAPAN.find((item) => item.value === value)?.label ?? value ?? '-'
}
