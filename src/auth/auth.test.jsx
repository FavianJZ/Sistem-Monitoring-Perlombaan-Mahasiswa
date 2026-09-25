import { describe, expect, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SESI_ADMIN, SESI_DOSEN, SESI_MAHASISWA, renderApp } from '@/test/utils'
import { KUNCI_SESI, berandaRole } from './sesi'
import { SANDI_DEMO } from './akunDemo'

describe('berandaRole', () => {
  it('mengarahkan mahasiswa ke dashboard mahasiswa', () => {
    expect(berandaRole('mahasiswa')).toBe('/')
  })

  it('mengarahkan dosen dan admin ke area monitoring', () => {
    expect(berandaRole('dosen')).toBe('/monitoring')
    expect(berandaRole('admin')).toBe('/monitoring')
  })

  it('memakai dashboard mahasiswa sebagai cadangan untuk role tak dikenal', () => {
    expect(berandaRole(undefined)).toBe('/')
  })
})

describe('Pembatasan rute', () => {
  it('mengalihkan pengunjung yang belum masuk ke halaman login', () => {
    renderApp('/lomba-saya')

    expect(screen.getByRole('heading', { level: 2, name: 'Masuk' })).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Navigasi utama' })).not.toBeInTheDocument()
  })

  it('mengembalikan mahasiswa yang membuka area monitoring ke dashboardnya', () => {
    renderApp('/monitoring/arsip', { sesi: SESI_MAHASISWA() })

    expect(screen.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Arsip & Prestasi' })).not.toBeInTheDocument()
  })

  it('mengembalikan dosen yang membuka area mahasiswa ke dashboard monitoring', () => {
    renderApp('/lomba-saya', { sesi: SESI_DOSEN() })

    expect(
      screen.getByRole('heading', { level: 1, name: 'Dashboard Monitoring' }),
    ).toBeInTheDocument()
  })

  it('mengizinkan admin program studi masuk ke area monitoring', () => {
    renderApp('/monitoring/lomba', { sesi: SESI_ADMIN() })

    expect(screen.getByRole('heading', { level: 1, name: 'Monitoring Lomba' })).toBeInTheDocument()
  })

  it('mengizinkan semua role membuka halaman profil', () => {
    renderApp('/profil', { sesi: SESI_DOSEN() })

    expect(screen.getByRole('heading', { level: 1, name: 'Profil' })).toBeInTheDocument()
    // Nama juga tampil di topbar, jadi dicari lewat judul kartu profil.
    expect(
      screen.getByRole('heading', { level: 2, name: 'Pandu Wicaksono, S.Kom., M.Kom.' }),
    ).toBeInTheDocument()
  })
})

describe('Halaman login', () => {
  it('memvalidasi field kosong tanpa memanggil service', async () => {
    const user = userEvent.setup()
    renderApp('/login')

    await user.click(screen.getByRole('button', { name: 'Masuk' }))

    expect(screen.getByText('Email wajib diisi.')).toBeInTheDocument()
    expect(screen.getByText('Kata sandi wajib diisi.')).toBeInTheDocument()
  })

  it('menampilkan pesan kesalahan untuk kredensial yang salah', async () => {
    const user = userEvent.setup()
    renderApp('/login')

    await user.type(screen.getByLabelText(/Email/), 'aulia.rahmawati@binus.ac.id')
    await user.type(screen.getByLabelText(/Kata Sandi/), 'sandi-salah')
    await user.click(screen.getByRole('button', { name: 'Masuk' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Email atau kata sandi tidak cocok.')
  })

  it('mengantar mahasiswa ke dashboardnya setelah berhasil masuk', async () => {
    const user = userEvent.setup()
    renderApp('/login')

    await user.type(screen.getByLabelText(/Email/), 'aulia.rahmawati@binus.ac.id')
    await user.type(screen.getByLabelText(/Kata Sandi/), SANDI_DEMO)
    await user.click(screen.getByRole('button', { name: 'Masuk' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Lomba Saya' })).toBeInTheDocument()
  })

  it('mengantar dosen ke dashboard monitoring setelah berhasil masuk', async () => {
    const user = userEvent.setup()
    renderApp('/login')

    await user.click(screen.getByRole('button', { name: /Masuk sebagai Dosen/ }))

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Dashboard Monitoring' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Kalender Agenda' })).toBeInTheDocument()
  })

  it('melanjutkan ke halaman yang semula dituju setelah masuk', async () => {
    const user = userEvent.setup()
    renderApp('/monitoring/kalender')

    await user.click(screen.getByRole('button', { name: /Masuk sebagai Dosen/ }))

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Kalender Agenda' }),
    ).toBeInTheDocument()
  })

  it('menyimpan sesi ke localStorage agar tidak hilang saat halaman dimuat ulang', async () => {
    const user = userEvent.setup()
    renderApp('/login')

    await user.click(screen.getByRole('button', { name: /Masuk sebagai Mahasiswa/ }))
    await screen.findByRole('heading', { level: 1, name: 'Dashboard' })

    const tersimpan = JSON.parse(window.localStorage.getItem(KUNCI_SESI))
    expect(tersimpan.user.id).toBe('mhs-1')
    expect(tersimpan.token).toContain('mhs-1')
  })

  it('tidak menampilkan form login lagi bila sesi sudah ada', () => {
    renderApp('/login', { sesi: SESI_MAHASISWA() })

    expect(screen.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument()
  })
})

describe('Keluar', () => {
  it('menghapus sesi dan kembali ke halaman login', async () => {
    const user = userEvent.setup()
    renderApp('/', { sesi: SESI_MAHASISWA() })

    await user.click(screen.getByRole('button', { name: 'Keluar dari akun' }))

    expect(await screen.findByRole('heading', { level: 2, name: 'Masuk' })).toBeInTheDocument()
    await waitFor(() => expect(window.localStorage.getItem(KUNCI_SESI)).toBeNull())
  })

  it('bisa keluar dari halaman profil', async () => {
    const user = userEvent.setup()
    renderApp('/profil', { sesi: SESI_DOSEN() })

    await user.click(screen.getByRole('button', { name: 'Keluar' }))

    expect(await screen.findByRole('heading', { level: 2, name: 'Masuk' })).toBeInTheDocument()
  })
})
