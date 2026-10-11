
export const SANDI_DEMO = 'demo1234'

export const MAHASISWA = [
  {
    id: 'mhs-1',
    nama: 'User-Mahasiswa(1)',
    email: 'user.mahasiswa1@binus.ac.id',
    role: 'mahasiswa',
    nim: '2502019876',
    prodi: 'Teknik Informatika',
    angkatan: 2025,
  },
  {
    id: 'mhs-2',
    nama: 'User-Mahasiswa(2)',
    email: 'user.mahasiswa2@binus.ac.id',
    role: 'mahasiswa',
    nim: '2502011234',
    prodi: 'Sistem Informasi',
    angkatan: 2025,
  },
  {
    id: 'mhs-3',
    nama: 'User-Mahasiswa(3)',
    email: 'user.mahasiswa3@binus.ac.id',
    role: 'mahasiswa',
    nim: '2502015678',
    prodi: 'Desain Komunikasi Visual',
    angkatan: 2025,
  },
  {
    id: 'mhs-4',
    nama: 'User-Mahasiswa(4)',
    email: 'user.mahasiswa4@binus.ac.id',
    role: 'mahasiswa',
    nim: '2502013456',
    prodi: 'Teknik Informatika',
    angkatan: 2024,
  },
  {
    id: 'mhs-5',
    nama: 'User-Mahasiswa(5)',
    email: 'user.mahasiswa5@binus.ac.id',
    role: 'mahasiswa',
    nim: '2502017890',
    prodi: 'Manajemen',
    angkatan: 2024,
  },
  {
    id: 'mhs-6',
    nama: 'User-Mahasiswa(6)',
    email: 'user.mahasiswa6@binus.ac.id',
    role: 'mahasiswa',
    nim: '2502012345',
    prodi: 'Ilmu Komunikasi',
    angkatan: 2025,
  },
]

export const DOSEN = [
  {
    id: 'dsn-1',
    nama: 'User-Dosen(1)',
    email: 'user.dosen1@binus.ac.id',
    role: 'dosen',
    prodi: 'Teknik Informatika',
  },
  {
    id: 'dsn-2',
    nama: 'User-Dosen(2)',
    email: 'user.dosen2@binus.ac.id',
    role: 'dosen',
    prodi: 'Manajemen',
  },
  {
    id: 'dsn-3',
    nama: 'User-Dosen(3)',
    email: 'user.dosen3@binus.ac.id',
    role: 'dosen',
    prodi: 'Sistem Informasi',
  },
  {
    id: 'dsn-4',
    nama: 'User-Dosen(4)',
    email: 'user.dosen4@binus.ac.id',
    role: 'dosen',
    prodi: 'Desain Komunikasi Visual',
  },
]

export const ADMIN = [
  {
    id: 'adm-1',
    nama: 'User-Admin(1)',
    email: 'user.admin1@binus.ac.id',
    role: 'admin',
    prodi: 'Program Studi',
  },
]

export const SEMUA_PENGGUNA = [...MAHASISWA, ...DOSEN, ...ADMIN]

export const AKUN_DEMO = [
  { id: 'mhs-1', label: 'Masuk sebagai Mahasiswa', keterangan: 'Mahasiswa - 2502019876' },
  { id: 'dsn-1', label: 'Masuk sebagai Dosen', keterangan: 'Dosen' },
]
