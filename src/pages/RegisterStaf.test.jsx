import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '@/test/utils'
import { KODE_ADMIN_DEMO, KODE_DOSEN_DEMO } from '@/services/userService'

describe('Halaman RegisterStaf (Portal Dosen & Admin Prodi)', () => {
  it('dapat diakses dari tautan portal staf di halaman login', async () => {
    const user = userEvent.setup()
    renderApp('/login')

    const linkStaf = screen.getByRole('link', { name: /Portal Pendaftaran Staf/ })
    await user.click(linkStaf)

    expect(await screen.findByRole('heading', { level: 2, name: 'Daftar Akun Staf' })).toBeInTheDocument()
  })

  it('menolak pendaftaran dosen jika kode otorisasi salah', async () => {
    const user = userEvent.setup()
    renderApp('/daftar-staf')

    await user.type(screen.getByLabelText(/Nama lengkap/), 'Dr. Ir. Hendra S.Kom.')
    await user.type(screen.getByLabelText(/Email resmi/), 'hendra.dosen@binus.ac.id')
    await user.selectOptions(screen.getByLabelText(/Program studi/), 'Teknik Informatika')
    await user.type(screen.getByLabelText(/Kode Otorisasi/), 'SALAH123')
    await user.type(screen.getByLabelText(/^Kata sandi/), 'Rahasia123!')
    await user.type(screen.getByLabelText(/Konfirmasi kata sandi/), 'Rahasia123!')
    await user.click(screen.getByRole('checkbox'))

    await user.click(screen.getByRole('button', { name: /Daftarkan Akun Staf/ }))

    expect(await screen.findByText(/Kode otorisasi Dosen tidak valid/)).toBeInTheDocument()
  })

  it('berhasil mendaftarkan dosen dengan kode otorisasi DOSEN2026', async () => {
    const user = userEvent.setup()
    renderApp('/daftar-staf')

    await user.type(screen.getByLabelText(/Nama lengkap/), 'Dr. Hendra Baru, M.Kom.')
    await user.type(screen.getByLabelText(/Email resmi/), 'hendra.baru@binus.ac.id')
    await user.selectOptions(screen.getByLabelText(/Program studi/), 'Teknik Informatika')
    await user.type(screen.getByLabelText(/Kode Otorisasi/), KODE_DOSEN_DEMO)
    await user.type(screen.getByLabelText(/^Kata sandi/), 'Rahasia123!')
    await user.type(screen.getByLabelText(/Konfirmasi kata sandi/), 'Rahasia123!')
    await user.click(screen.getByRole('checkbox'))

    await user.click(screen.getByRole('button', { name: /Daftarkan Akun Staf/ }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Dashboard Monitoring' })).toBeInTheDocument()
  })
})
