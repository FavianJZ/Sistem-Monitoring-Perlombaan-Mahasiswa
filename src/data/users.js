
export const SANDI_DEMO = 'demo1234'

export const MAHASISWA = [
  {
    id: 'mhs-1',
    nama: 'Aulia Rahmawati',
    email: 'aulia.rahmawati@binus.ac.id',
    role: 'mahasiswa',
    nim: '2502019876',
    prodi: 'Teknik Informatika',
    angkatan: 2025,
  },
  {
    id: 'mhs-2',
    nama: 'Bagas Prayoga',
    email: 'bagas.prayoga@binus.ac.id',
    role: 'mahasiswa',
    nim: '2502011234',
    prodi: 'Sistem Informasi',
    angkatan: 2025,
  },
  {
    id: 'mhs-3',
    nama: 'Citra Maheswari',
    email: 'citra.maheswari@binus.ac.id',
    role: 'mahasiswa',
    nim: '2502015678',
    prodi: 'Desain Komunikasi Visual',
    angkatan: 2025,
  },
  {
    id: 'mhs-4',
    nama: 'Damar Saputra',
    email: 'damar.saputra@binus.ac.id',
    role: 'mahasiswa',
    nim: '2502013456',
    prodi: 'Teknik Informatika',
    angkatan: 2024,
  },
  {
    id: 'mhs-5',
    nama: 'Elvira Nuraini',
    email: 'elvira.nuraini@binus.ac.id',
    role: 'mahasiswa',
    nim: '2502017890',
    prodi: 'Manajemen',
    angkatan: 2024,
  },
  {
    id: 'mhs-6',
    nama: 'Fajar Nugroho',
    email: 'fajar.nugroho@binus.ac.id',
    role: 'mahasiswa',
    nim: '2502012345',
    prodi: 'Ilmu Komunikasi',
    angkatan: 2025,
  },
]

export const DOSEN = [
  {
    id: 'dsn-1',
    nama: 'Pandu Wicaksono, S.Kom., M.Kom.',
    email: 'pandu.wicaksono@binus.ac.id',
    role: 'dosen',
    prodi: 'Teknik Informatika',
  },
  {
    id: 'dsn-2',
    nama: 'Ratna Kusumawati, S.T., M.T.',
    email: 'ratna.kusumawati@binus.ac.id',
    role: 'dosen',
    prodi: 'Manajemen',
  },
  {
    id: 'dsn-3',
    nama: 'Irfan Maulana, S.Kom., M.Sc.',
    email: 'irfan.maulana@binus.ac.id',
    role: 'dosen',
    prodi: 'Sistem Informasi',
  },
  {
    id: 'dsn-4',
    nama: 'Sari Melati, S.Des., M.Ds.',
    email: 'sari.melati@binus.ac.id',
    role: 'dosen',
    prodi: 'Desain Komunikasi Visual',
  },
]

export const ADMIN = [
  {
    id: 'adm-1',
    nama: 'Yulia Hartanti',
    email: 'yulia.hartanti@binus.ac.id',
    role: 'admin',
    prodi: 'Program Studi',
  },
]

export const SEMUA_PENGGUNA = [...MAHASISWA, ...DOSEN, ...ADMIN]

export const AKUN_DEMO = [
  { id: 'mhs-1', label: 'Masuk sebagai Mahasiswa', keterangan: 'Mahasiswa - 2502019876' },
  { id: 'dsn-1', label: 'Masuk sebagai Dosen', keterangan: 'Dosen' },
  { id: 'adm-1', label: 'Masuk sebagai Admin Prodi', keterangan: 'Admin Prodi' },
]
