import { jeda } from './delay'
import { ServiceError } from './competitionService'
import { SANDI_DEMO, SEMUA_PENGGUNA } from '@/data/users'
import { validasiRegistrasi } from '@/auth/validasiRegistrasi'
import { buatJwt } from '@/auth/jwt'
import { MODE_DEMO } from '@/config/mode'

const PENGGUNA_BAWAAN = MODE_DEMO ? SEMUA_PENGGUNA : []

export const KUNCI_AKUN = 'simonlomba.akun'

export const KODE_ADMIN_DEMO = 'PRODI2026'

export const KODE_DOSEN_DEMO = 'DOSEN2026'

function bacaAkun() {
  try {
    const mentah = window.localStorage.getItem(KUNCI_AKUN)
    const daftar = mentah ? JSON.parse(mentah) : []
    return Array.isArray(daftar) ? daftar.filter((item) => item?.user?.id) : []
  } catch {
    return []
  }
}

function simpanAkun(daftar) {
  try {
    window.localStorage.setItem(KUNCI_AKUN, JSON.stringify(daftar))
  } catch {

  }
}

function semuaPengguna() {
  return [...PENGGUNA_BAWAAN, ...bacaAkun().map((item) => item.user)]
}

function penggunaDenganRole(role) {
  return semuaPengguna()
    .filter((item) => item.role === role)
    .map((item) => ({ ...item }))
}

export function emailTerpakai(email) {
  const alamat = String(email ?? '').trim().toLowerCase()
  return semuaPengguna().some((item) => item.email.toLowerCase() === alamat)
}

export function nimTerpakai(nim) {
  return semuaPengguna().some((item) => item.nim && item.nim === nim)
}

function buatToken(pengguna) {

  return buatJwt(pengguna)
}

export async function login({ email, password } = {}, opsi = {}) {
  await jeda(opsi.jeda)

  const alamat = String(email ?? '').trim().toLowerCase()
  if (!alamat) {
    throw new ServiceError('Email wajib diisi.', { kode: 'EMAIL_KOSONG' })
  }
  if (!password) {
    throw new ServiceError('Kata sandi wajib diisi.', { kode: 'SANDI_KOSONG' })
  }

  const terdaftar = bacaAkun().find((item) => item.user.email.toLowerCase() === alamat)
  const demo = PENGGUNA_BAWAAN.find((item) => item.email.toLowerCase() === alamat)

  let pengguna = null
  if (terdaftar && terdaftar.password === password) pengguna = terdaftar.user
  else if (demo && password === SANDI_DEMO) pengguna = demo

  if (!pengguna) {
    throw new ServiceError('Email atau kata sandi tidak cocok.', {
      status: 401,
      kode: 'KREDENSIAL_SALAH',
    })
  }

  return { user: { ...pengguna }, token: buatToken(pengguna) }
}

export async function registrasi(data = {}, opsi = {}) {
  await jeda(opsi.jeda ?? 500)

  const galat = validasiRegistrasi({ ...data, setuju: true }, { emailTerpakai, nimTerpakai })
  const pertama = Object.values(galat)[0]
  if (pertama) {
    const duplikat = galat.email?.includes('terdaftar') || galat.nim?.includes('terdaftar')
    throw new ServiceError(pertama, {
      status: duplikat ? 409 : 422,
      kode: duplikat ? 'AKUN_SUDAH_ADA' : 'DATA_TIDAK_VALID',
    })
  }

  if (data.role === 'admin' && data.kodeAdmin?.trim() !== KODE_ADMIN_DEMO) {
    throw new ServiceError('Kode verifikasi Admin Prodi tidak valid.', {
      status: 403,
      kode: 'KODE_ADMIN_SALAH',
    })
  }

  if (data.role === 'dosen' && data.kodeDosen && data.kodeDosen.trim() !== KODE_DOSEN_DEMO) {
    throw new ServiceError('Kode otorisasi Dosen tidak valid.', {
      status: 403,
      kode: 'KODE_DOSEN_SALAH',
    })
  }

  const user = {
    id: `usr-${Date.now().toString(36)}`,
    nama: data.nama.trim().replace(/\s+/g, ' '),
    email: data.email.trim().toLowerCase(),
    role: data.role,
    prodi: data.prodi,
    ...(data.role === 'mahasiswa' ? { nim: data.nim, angkatan: Number(data.angkatan) } : {}),
  }

  simpanAkun([...bacaAkun(), { user, password: data.password }])

  return { user: { ...user }, token: buatToken(user) }
}

export async function perbaruiSandiPengguna({ email, passwordBaru }, opsi = {}) {
  await jeda(opsi.jeda ?? 300)
  const target = String(email ?? '').trim().toLowerCase()
  if (!target) throw new ServiceError('Email wajib diisi.', { kode: 'EMAIL_KOSONG' })
  if (!passwordBaru) throw new ServiceError('Kata sandi baru wajib diisi.', { kode: 'SANDI_KOSONG' })

  const daftar = bacaAkun()
  const indeks = daftar.findIndex((item) => item.user.email.toLowerCase() === target)

  if (indeks !== -1) {
    daftar[indeks].password = passwordBaru
    simpanAkun(daftar)
    return { ok: true, email: target }
  }

  const demo = PENGGUNA_BAWAAN.find((item) => item.email.toLowerCase() === target)
  if (demo) {
    simpanAkun([...daftar, { user: { ...demo }, password: passwordBaru }])
    return { ok: true, email: target }
  }

  throw new ServiceError('Akun dengan email tersebut tidak ditemukan.', {
    status: 404,
    kode: 'PENGGUNA_TIDAK_ADA',
  })
}

export async function penggunaBerdasarkanId(id, opsi = {}) {
  await jeda(opsi.jeda)

  const pengguna = semuaPengguna().find((item) => item.id === id)
  if (!pengguna) {
    throw new ServiceError(`Pengguna ${id} tidak ditemukan.`, {
      status: 404,
      kode: 'PENGGUNA_TIDAK_ADA',
    })
  }

  return { ...pengguna }
}

export async function daftarDosen(opsi = {}) {
  await jeda(opsi.jeda)
  return penggunaDenganRole('dosen')
}

export async function daftarMahasiswa(opsi = {}) {
  await jeda(opsi.jeda)
  return penggunaDenganRole('mahasiswa')
}

export async function daftarAdmin(opsi = {}) {
  await jeda(opsi.jeda)
  return penggunaDenganRole('admin')
}

export function namaPengguna(id) {
  return semuaPengguna().find((item) => item.id === id)?.nama ?? '-'
}

export function penggunaSinkron(id) {
  const pengguna = semuaPengguna().find((item) => item.id === id)
  return pengguna ? { ...pengguna } : null
}
