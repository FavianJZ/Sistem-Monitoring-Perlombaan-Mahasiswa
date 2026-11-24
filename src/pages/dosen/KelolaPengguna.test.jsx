import { describe, expect, it } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SESI_ADMIN, SESI_DOSEN, SESI_MAHASISWA, alamatSekarang, renderApp } from '@/test/utils'
import {
  daftarSemuaPengguna,
  kosongkanNimAkun,
  registrasi,
  ubahPeranAkun,
} from '@/services/userService'

const SANDI = 'SandiKuat123'

async function daftarMahasiswaBaru() {
  const { user } = await registrasi({
    role: 'mahasiswa',
    nama: 'User-Mahasiswa(20)',
    email: 'user.mahasiswa20@gmail.com',
    nim: '2502030000',
    angkatan: '2025',
    prodi: 'Teknik Informatika',
    password: SANDI,
    konfirmasi: SANDI,
  })
  return user
}

describe('Layanan admin akun', () => {
  it('admin menjadikan akun mahasiswa sebagai dosen, NIM ikut dilepas', async () => {
    const mhs = await daftarMahasiswaBaru()
    await ubahPeranAkun(SESI_ADMIN().user, mhs.id, 'dosen')

    const hasil = (await daftarSemuaPengguna()).find((p) => p.id === mhs.id)
    expect(hasil.role).toBe('dosen')
    expect(hasil.nim).toBeUndefined()
  })

  it('admin mengosongkan NIM yang diklaim akun yang salah', async () => {
    const mhs = await daftarMahasiswaBaru()
    await kosongkanNimAkun(SESI_ADMIN().user, mhs.id)

    const hasil = (await daftarSemuaPengguna()).find((p) => p.id === mhs.id)
    expect(hasil.role).toBe('mahasiswa')
    expect(hasil.nim).toBeUndefined()
  })

  it('menolak dosen dan mahasiswa yang mencoba mengubah peran', async () => {
    const mhs = await daftarMahasiswaBaru()
    await expect(ubahPeranAkun(SESI_DOSEN().user, mhs.id, 'admin')).rejects.toThrow(/Hanya admin/)
    await expect(ubahPeranAkun(SESI_MAHASISWA().user, mhs.id, 'admin')).rejects.toThrow(/Hanya admin/)
    await expect(kosongkanNimAkun(SESI_DOSEN().user, mhs.id)).rejects.toThrow(/Hanya admin/)
  })

  it('menolak admin mengubah perannya sendiri dan peran yang tidak dikenal', async () => {
    const admin = SESI_ADMIN().user
    const mhs = await daftarMahasiswaBaru()
    await expect(ubahPeranAkun(admin, admin.id, 'mahasiswa')).rejects.toThrow(/sendiri/)
    await expect(ubahPeranAkun(admin, mhs.id, 'superadmin')).rejects.toThrow(/tidak dikenal/)
  })
})

describe('Halaman Kelola Pengguna', () => {
  it('hanya untuk admin: dosen tidak bisa membukanya', async () => {
    renderApp('/monitoring/pengguna', { sesi: SESI_DOSEN() })
    await waitFor(() => expect(alamatSekarang(screen)).not.toBe('/monitoring/pengguna'))
    expect(screen.queryByRole('heading', { name: 'Kelola Pengguna' })).not.toBeInTheDocument()
  })

  it('admin mengubah peran akun lewat dialog konfirmasi', async () => {
    const pengguna = userEvent.setup()
    const mhs = await daftarMahasiswaBaru()
    renderApp('/monitoring/pengguna', { sesi: SESI_ADMIN() })

    await screen.findByRole('heading', { name: 'Kelola Pengguna' })
    const daftar = await screen.findByRole('list', { name: 'Daftar akun' })
    const pilihPeran = within(daftar).getByRole('combobox', { name: `Ubah peran ${mhs.nama}` })
    await pengguna.selectOptions(pilihPeran, 'dosen')

    const dialog = await screen.findByRole('dialog')
    await pengguna.click(within(dialog).getByRole('button', { name: 'Ubah peran' }))

    await waitFor(async () => {
      const hasil = (await daftarSemuaPengguna()).find((p) => p.id === mhs.id)
      expect(hasil.role).toBe('dosen')
    })
  })
})
