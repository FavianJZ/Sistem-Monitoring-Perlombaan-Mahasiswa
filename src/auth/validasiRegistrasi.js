

export const DOMAIN_KAMPUS = '@binus.ac.id'

export const PERAN_REGISTRASI = [
  { value: 'mahasiswa', label: 'Mahasiswa', deskripsi: 'Catat & unggah bukti lomba' },
  { value: 'dosen', label: 'Dosen', deskripsi: 'Pantau lomba mahasiswa' },
  { value: 'admin', label: 'Admin Prodi', deskripsi: 'Kelola arsip & laporan' },
]

const POLA_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function kekuatanSandi(sandi = '') {
  const syarat = [
    { id: 'panjang', label: 'Minimal 8 karakter', ok: sandi.length >= 8 },
    {
      id: 'campuran',
      label: 'Huruf dan angka',
      ok: /[A-Za-z]/.test(sandi) && /\d/.test(sandi),
    },
    {
      id: 'variasi',
      label: 'Huruf besar-kecil atau simbol',
      ok: /[^A-Za-z0-9]/.test(sandi) || (/[A-Z]/.test(sandi) && /[a-z]/.test(sandi)),
    },
  ]

  return { syarat, skor: syarat.filter((item) => item.ok).length }
}

export function validasiRegistrasi(data, cek = {}) {
  const galat = {}
  const nama = data.nama?.trim() ?? ''
  const email = data.email?.trim().toLowerCase() ?? ''

  if (nama.length < 3) galat.nama = 'Nama lengkap minimal 3 karakter.'

  if (!email) galat.email = 'Email wajib diisi.'
  else if (!POLA_EMAIL.test(email)) galat.email = 'Format email tidak valid.'
  else if (!email.endsWith(DOMAIN_KAMPUS)) galat.email = `Gunakan email kampus (${DOMAIN_KAMPUS}).`
  else if (cek.emailTerpakai?.(email)) galat.email = 'Email ini sudah terdaftar. Silakan masuk.'

  if (data.role === 'mahasiswa') {
    if (!/^\d{10}$/.test(data.nim ?? '')) galat.nim = 'NIM harus 10 digit angka.'
    else if (cek.nimTerpakai?.(data.nim)) galat.nim = 'NIM ini sudah terdaftar.'
    if (!data.angkatan) galat.angkatan = 'Pilih tahun angkatan.'
  }

  if (!data.prodi) galat.prodi = 'Pilih program studi.'

  if (data.role === 'admin' && !data.kodeAdmin?.trim()) {
    galat.kodeAdmin = 'Kode verifikasi wajib diisi.'
  }

  if (!data.password) galat.password = 'Kata sandi wajib diisi.'
  else if (kekuatanSandi(data.password).skor < 3) {
    galat.password = 'Kata sandi belum memenuhi semua syarat.'
  }

  if (!data.konfirmasi) galat.konfirmasi = 'Ulangi kata sandi Anda.'
  else if (data.konfirmasi !== data.password) galat.konfirmasi = 'Konfirmasi kata sandi tidak cocok.'

  if (!data.setuju) galat.setuju = 'Anda perlu menyetujui ketentuan penggunaan.'

  return galat
}

export const FIELD_PER_LANGKAH = {
  dataDiri: ['nama', 'email', 'nim', 'angkatan', 'prodi', 'kodeAdmin'],
  sandi: ['password', 'konfirmasi'],
}
