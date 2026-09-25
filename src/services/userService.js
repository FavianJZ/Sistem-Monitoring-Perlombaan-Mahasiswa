import { jeda } from './delay'
import { ServiceError } from './competitionService'
import { ADMIN, DOSEN, MAHASISWA, SANDI_DEMO, SEMUA_PENGGUNA } from '@/data/users'

/**
 * Service pengguna.
 *
 * Login di sini murni tiruan sisi klien untuk keperluan prototipe.
 * Verifikasi kredensial, penerbitan token, dan otorisasi per role
 * wajib dilakukan backend Spring Boot.
 */

export async function login({ email, password } = {}, opsi = {}) {
  await jeda(opsi.jeda)

  const alamat = String(email ?? '').trim().toLowerCase()
  if (!alamat) {
    throw new ServiceError('Email wajib diisi.', { kode: 'EMAIL_KOSONG' })
  }
  if (!password) {
    throw new ServiceError('Kata sandi wajib diisi.', { kode: 'SANDI_KOSONG' })
  }

  const pengguna = SEMUA_PENGGUNA.find((item) => item.email.toLowerCase() === alamat)
  if (!pengguna || password !== SANDI_DEMO) {
    throw new ServiceError('Email atau kata sandi tidak cocok.', {
      status: 401,
      kode: 'KREDENSIAL_SALAH',
    })
  }

  return {
    user: { ...pengguna },
    // Token tiruan. Backend nanti mengembalikan JWT sungguhan.
    token: `mock-token-${pengguna.id}`,
  }
}

export async function penggunaBerdasarkanId(id, opsi = {}) {
  await jeda(opsi.jeda)

  const pengguna = SEMUA_PENGGUNA.find((item) => item.id === id)
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
  return DOSEN.map((dosen) => ({ ...dosen }))
}

export async function daftarMahasiswa(opsi = {}) {
  await jeda(opsi.jeda)
  return MAHASISWA.map((mahasiswa) => ({ ...mahasiswa }))
}

export async function daftarAdmin(opsi = {}) {
  await jeda(opsi.jeda)
  return ADMIN.map((admin) => ({ ...admin }))
}

/** Pencarian sinkron untuk kebutuhan tampilan, misalnya menampilkan nama pembimbing. */
export function namaPengguna(id) {
  return SEMUA_PENGGUNA.find((item) => item.id === id)?.nama ?? '-'
}

export function penggunaSinkron(id) {
  const pengguna = SEMUA_PENGGUNA.find((item) => item.id === id)
  return pengguna ? { ...pengguna } : null
}
