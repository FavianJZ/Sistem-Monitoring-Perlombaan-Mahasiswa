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

export const STATUS_LOMBA = {
  terdaftar: { label: 'Terdaftar', tone: 'primary' },
  berlangsung: { label: 'Berlangsung', tone: 'accent' },
  selesai: { label: 'Selesai', tone: 'success' },
  tidak_lanjut: { label: 'Tidak Lanjut', tone: 'neutral' },
}

export const STATUS_AKHIR = ['selesai', 'tidak_lanjut']

export const ALASAN_TIDAK_LANJUT = {
  tidak_lolos: 'Tidak lolos seleksi',
  mundur: 'Mengundurkan diri',
  diskualifikasi: 'Didiskualifikasi',
  dibatalkan: 'Lomba dibatalkan penyelenggara',
}

export const CATATAN_TIDAK_LANJUT_MAKS = 500

export const CAPAIAN_LOMBA = {
  juara_1: { label: 'Juara 1', tone: 'success', peringkat: 1 },
  juara_2: { label: 'Juara 2', tone: 'success', peringkat: 2 },
  juara_3: { label: 'Juara 3', tone: 'success', peringkat: 3 },
  harapan: { label: 'Juara Harapan', tone: 'primary', peringkat: 4 },
  finalis: { label: 'Finalis', tone: 'primary', peringkat: 5 },
  peserta: { label: 'Peserta', tone: 'neutral', peringkat: 6 },
}

export const JENIS_TAHAPAN = [
  { value: 'pendaftaran', label: 'Pendaftaran', pendek: 'Daftar', rentang: true },
  { value: 'tm', label: 'Technical Meeting', pendek: 'TM', rentang: false },
  { value: 'penyisihan', label: 'Penyisihan / Pengumpulan Karya', pendek: 'Penyisihan', rentang: true },
  { value: 'semifinal', label: 'Semifinal', pendek: 'Semifinal', rentang: false },
  { value: 'final', label: 'Final', pendek: 'Final', rentang: false },
  { value: 'pengumuman', label: 'Pengumuman Pemenang', pendek: 'Pengumuman', rentang: false },
]

export const JENIS_BERKAS = {
  bukti_daftar: { label: 'Bukti Pendaftaran', wajib: true },
  bukti_bayar: { label: 'Bukti Pembayaran', wajib: true },
  poster: { label: 'Poster / Publikasi', wajib: false },
  sertifikat: { label: 'Sertifikat', wajib: false },
  foto: { label: 'Foto Dokumentasi', wajib: false },
}

export const UNGGAH_MAKS_BYTE = 5 * 1024 * 1024
export const UNGGAH_TIPE_DIIZINKAN = ['application/pdf', 'image/jpeg', 'image/png']
export const UNGGAH_EKSTENSI_LABEL = 'PDF, JPG, atau PNG maksimal 5MB'

export const PROGRAM_STUDI = [
  'Teknik Informatika',
  'Software Engineering',
  'Data Science',
  'Cyber Security',
  'Game Application and Technology',
  'Mobile Application and Technology',
  'Artificial Intelligence',
  'Sistem Informasi',
  'Business Information Systems',
  'Business Analytics',
  'Teknik Komputer',
]

export function labelBidang(value) {
  return value ?? '-'
}

export function labelStatus(value) {
  return STATUS_LOMBA[value]?.label ?? value ?? '-'
}

export function labelAlasanTidakLanjut(value) {
  return ALASAN_TIDAK_LANJUT[value] ?? value ?? '-'
}

export function labelCapaian(value) {
  return CAPAIAN_LOMBA[value]?.label ?? value ?? '-'
}

export function labelTahapan(value) {
  return JENIS_TAHAPAN.find((item) => item.value === value)?.label ?? value ?? '-'
}

export function labelTahapanPendek(value) {
  return JENIS_TAHAPAN.find((item) => item.value === value)?.pendek ?? labelTahapan(value)
}
