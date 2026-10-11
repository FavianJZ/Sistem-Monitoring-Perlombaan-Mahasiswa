import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '@/test/utils'
import { KODE_DOSEN_DEMO } from '@/services/userService'

describe('Halaman RegisterStaf (khusus dosen)', () => {
  it('tidak menampilkan tautan pendaftaran staf di halaman login publik', () => {
    renderApp('/login')
    expect(screen.queryByRole('link', { name: /Portal Pendaftaran Staf/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Portal Staf/ })).not.toBeInTheDocument()
  })

  it('dapat diakses secara langsung melalui rute khusus /daftar-staf', async () => {
    renderApp('/daftar-staf')
    expect(await screen.findByRole('heading', { level: 2, name: 'Daftar Akun Dosen' })).toBeInTheDocument()
  })

  it('menolak pendaftaran dosen jika kode otorisasi salah', async () => {
    const user = userEvent.setup()
    renderApp('/daftar-staf')

    await user.type(screen.getByLabelText(/Nama lengkap/), 'User-Dosen(6)')
    await user.type(screen.getByLabelText(/Email resmi/), 'user.dosen6@binus.ac.id')
    await user.selectOptions(screen.getByLabelText(/Program studi/), 'Teknik Informatika')
    await user.type(screen.getByLabelText(/Kode otorisasi/i), 'SALAH123')
    await user.type(screen.getByLabelText(/^Kata sandi/), 'Rahasia123!')
    await user.type(screen.getByLabelText(/Konfirmasi kata sandi/), 'Rahasia123!')
    await user.click(screen.getByRole('checkbox'))

    await user.click(screen.getByRole('button', { name: /Daftarkan Akun Dosen/ }))

    expect(await screen.findByText(/Kode otorisasi dosen tidak valid/)).toBeInTheDocument()
  })

  it('tidak menawarkan pilihan peran admin prodi', () => {
    renderApp('/daftar-staf')
    expect(screen.queryByText(/Admin Program Studi/)).not.toBeInTheDocument()
  })

  it('berhasil mendaftarkan dosen dengan kode otorisasi DOSEN2026', async () => {
    const user = userEvent.setup()
    renderApp('/daftar-staf')

    await user.type(screen.getByLabelText(/Nama lengkap/), 'User-Dosen(7)')
    await user.type(screen.getByLabelText(/Email resmi/), 'user.dosen7@binus.ac.id')
    await user.selectOptions(screen.getByLabelText(/Program studi/), 'Teknik Informatika')
    await user.type(screen.getByLabelText(/Kode otorisasi/i), KODE_DOSEN_DEMO)
    await user.type(screen.getByLabelText(/^Kata sandi/), 'Rahasia123!')
    await user.type(screen.getByLabelText(/Konfirmasi kata sandi/), 'Rahasia123!')
    await user.click(screen.getByRole('checkbox'))

    await user.click(screen.getByRole('button', { name: /Daftarkan Akun Dosen/ }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Dashboard Monitoring' })).toBeInTheDocument()
  })
})
