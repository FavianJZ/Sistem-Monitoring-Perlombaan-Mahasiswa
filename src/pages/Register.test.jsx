import { describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SESI_MAHASISWA, renderApp } from '@/test/utils'
import { KUNCI_SESI } from '@/auth/sesi'
import { kekuatanSandi, validasiRegistrasi } from '@/auth/validasiRegistrasi'
import { KODE_ADMIN_DEMO, KUNCI_AKUN, login, registrasi } from '@/services/userService'

const SANDI_KUAT = 'Rahasia123'

async function isiDataUmum(user, { nama = 'Nadia Putri', email = 'nadia.putri@binus.ac.id' } = {}) {
  await user.type(screen.getByLabelText(/Nama lengkap/), nama)
  await user.type(screen.getByLabelText(/Email kampus/), email)
  await user.selectOptions(screen.getByLabelText(/Program studi/), 'Sistem Informasi')
  await user.type(screen.getByLabelText(/^Kata sandi/), SANDI_KUAT)
  await user.type(screen.getByLabelText(/Konfirmasi kata sandi/), SANDI_KUAT)
  await user.click(screen.getByRole('checkbox', { name: /ketentuan penggunaan/ }))
}

describe('validasiRegistrasi', () => {
  const dasar = {
    role: 'mahasiswa',
    nama: 'Nadia Putri',
    email: 'nadia.putri@binus.ac.id',
    nim: '2502099999',
    angkatan: '2026',
    prodi: 'Sistem Informasi',
    password: SANDI_KUAT,
    konfirmasi: SANDI_KUAT,
    setuju: true,
  }

  it('lolos untuk data mahasiswa yang lengkap', () => {
    expect(validasiRegistrasi(dasar)).toEqual({})
  })

  it('menolak email non-kampus, NIM tidak 10 digit, dan sandi yang tidak cocok', () => {
    const galat = validasiRegistrasi({
      ...dasar,
      email: 'nadia@gmail.com',
      nim: '123',
      konfirmasi: 'beda',
    })

    expect(galat.email).toMatch(/email kampus/)
    expect(galat.nim).toMatch(/10 digit/)
    expect(galat.konfirmasi).toMatch(/tidak cocok/)
  })

  it('tidak mewajibkan NIM untuk dosen, tapi mewajibkan kode untuk admin', () => {
    expect(validasiRegistrasi({ ...dasar, role: 'dosen', nim: '' })).toEqual({})
    expect(validasiRegistrasi({ ...dasar, role: 'admin', nim: '' }).kodeAdmin).toBeDefined()
  })

  it('menilai kekuatan kata sandi dari tiga syarat', () => {
    expect(kekuatanSandi('').skor).toBe(0)
    expect(kekuatanSandi('abcdefgh').skor).toBe(1)
    expect(kekuatanSandi('abcdefg1').skor).toBe(2)
    expect(kekuatanSandi(SANDI_KUAT).skor).toBe(3)
  })
})

describe('Service registrasi', () => {
  const data = {
    role: 'dosen',
    nama: '  Budi   Santoso ',
    email: 'Budi.Santoso@binus.ac.id',
    prodi: 'Manajemen',
    password: SANDI_KUAT,
    konfirmasi: SANDI_KUAT,
  }

  it('menyimpan akun baru sehingga bisa dipakai login', async () => {
    const hasil = await registrasi(data)

    expect(hasil.user).toMatchObject({
      nama: 'Budi Santoso',
      email: 'budi.santoso@binus.ac.id',
      role: 'dosen',
    })
    expect(hasil.user.nim).toBeUndefined()

    const masuk = await login({ email: 'budi.santoso@binus.ac.id', password: SANDI_KUAT })
    expect(masuk.user.id).toBe(hasil.user.id)
  })

  it('menolak email yang sudah dipakai akun demo dengan status 409', async () => {
    await expect(
      registrasi({ ...data, email: 'pandu.wicaksono@binus.ac.id' }),
    ).rejects.toMatchObject({ status: 409 })
  })

  it('menolak kode admin yang salah', async () => {
    await expect(
      registrasi({ ...data, role: 'admin', kodeAdmin: 'SALAH' }),
    ).rejects.toMatchObject({ status: 403 })
    expect(window.localStorage.getItem(KUNCI_AKUN)).toBeNull()
  })
})

describe('Halaman daftar', () => {
  it('bisa dibuka dari tautan di halaman login', async () => {
    const user = userEvent.setup()
    renderApp('/login')

    await user.click(screen.getByRole('link', { name: 'Daftar sekarang' }))

    expect(screen.getByRole('heading', { level: 2, name: 'Buat akun' })).toBeInTheDocument()
  })

  it('menampilkan pesan validasi saat dikirim kosong dan tidak membuat akun', async () => {
    const user = userEvent.setup()
    renderApp('/daftar')

    await user.click(screen.getByRole('button', { name: 'Buat akun' }))

    expect(screen.getByText('Nama lengkap minimal 3 karakter.')).toBeInTheDocument()
    expect(screen.getByText('NIM harus 10 digit angka.')).toBeInTheDocument()
    expect(screen.getByText('Pilih program studi.')).toBeInTheDocument()
    expect(screen.getByText('Anda perlu menyetujui ketentuan penggunaan.')).toBeInTheDocument()
    expect(screen.getByLabelText(/Nama lengkap/)).toHaveFocus()
    expect(window.localStorage.getItem(KUNCI_AKUN)).toBeNull()
  })

  it('menyesuaikan isian dengan peran yang dipilih', async () => {
    const user = userEvent.setup()
    renderApp('/daftar')

    expect(screen.getByLabelText(/^NIM/)).toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: /Dosen/ }))
    expect(screen.queryByLabelText(/^NIM/)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/Kode verifikasi/)).not.toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: /Admin Prodi/ }))
    expect(screen.getByLabelText(/Kode verifikasi/)).toBeInTheDocument()
  })

  it('mendaftarkan mahasiswa lalu langsung masuk ke dashboardnya', async () => {
    const user = userEvent.setup()
    renderApp('/daftar')

    await isiDataUmum(user)
    await user.type(screen.getByLabelText(/^NIM/), '25020abc99999')
    expect(screen.getByLabelText(/^NIM/)).toHaveValue('2502099999')

    await user.click(screen.getByRole('button', { name: 'Buat akun' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByText('Akun berhasil dibuat')).toBeInTheDocument()

    const sesi = JSON.parse(window.localStorage.getItem(KUNCI_SESI))
    expect(sesi.user).toMatchObject({ nama: 'Nadia Putri', nim: '2502099999', role: 'mahasiswa' })
  })

  it('mendaftarkan admin dengan kode verifikasi ke area monitoring', async () => {
    const user = userEvent.setup()
    renderApp('/daftar')

    await user.click(screen.getByRole('radio', { name: /Admin Prodi/ }))
    await isiDataUmum(user, { nama: 'Rina Admin', email: 'rina.admin@binus.ac.id' })
    await user.type(screen.getByLabelText(/Kode verifikasi/), KODE_ADMIN_DEMO)
    await user.click(screen.getByRole('button', { name: 'Buat akun' }))

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Dashboard Monitoring' }),
    ).toBeInTheDocument()
  })

  it('memberi tahu bila email sudah terdaftar', async () => {
    const user = userEvent.setup()
    renderApp('/daftar')

    await user.click(screen.getByRole('radio', { name: /Dosen/ }))
    await isiDataUmum(user, { email: 'pandu.wicaksono@binus.ac.id' })
    await user.click(screen.getByRole('button', { name: 'Buat akun' }))

    expect(screen.getByText(/sudah terdaftar/)).toBeInTheDocument()
  })

  it('menampilkan progres langkah di panel kiri', async () => {
    const user = userEvent.setup()
    renderApp('/daftar')

    const progres = screen.getByRole('list', { name: 'Progres pendaftaran' })
    expect(within(progres).getByText(/1 dari 5 isian lengkap/)).toBeInTheDocument()

    await user.type(screen.getByLabelText(/^Kata sandi/), SANDI_KUAT)
    expect(within(progres).getByText('Kekuatan: Kuat')).toBeInTheDocument()
  })

  it('mengalihkan pengguna yang sudah masuk ke berandanya', () => {
    renderApp('/daftar', { sesi: SESI_MAHASISWA() })

    expect(screen.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument()
  })
})
