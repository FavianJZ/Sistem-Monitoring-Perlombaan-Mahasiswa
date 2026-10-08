import { describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SESI_DOSEN, SESI_MAHASISWA, renderApp } from '@/test/utils'

describe('AppShell', () => {
  it('menampilkan menu mahasiswa pada halaman awal', () => {
    renderApp('/', { sesi: SESI_MAHASISWA() })

    const nav = screen.getByRole('navigation', { name: 'Navigasi utama' })
    expect(within(nav).getByRole('link', { name: 'Lomba Saya' })).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: 'Daftarkan Lomba' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument()
  })

  it('menampilkan menu dosen saat masuk sebagai dosen', () => {
    renderApp('/monitoring', { sesi: SESI_DOSEN() })

    expect(screen.getByRole('link', { name: 'Kalender Agenda' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Arsip & Prestasi' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Lomba Saya' })).not.toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 1, name: 'Dashboard Monitoring' }),
    ).toBeInTheDocument()
  })

  it('menampilkan identitas pengguna pada topbar', () => {
    renderApp('/', { sesi: SESI_MAHASISWA() })

    expect(screen.getByText('Aulia Rahmawati')).toBeInTheDocument()
    expect(screen.getByText(/2502019876/)).toBeInTheDocument()
  })

  it('berpindah halaman lewat sidebar', async () => {
    const user = userEvent.setup()
    renderApp('/', { sesi: SESI_MAHASISWA() })

    const nav = screen.getByRole('navigation', { name: 'Navigasi utama' })
    await user.click(within(nav).getByRole('link', { name: 'Lomba Saya' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Lomba Saya' })).toBeInTheDocument()
  })

  it('membuka dan menutup drawer navigasi pada layar kecil', async () => {
    const user = userEvent.setup()
    renderApp('/', { sesi: SESI_MAHASISWA() })

    const sidebar = screen.getByTestId('sidebar')
    expect(sidebar).toHaveAttribute('data-open', 'false')

    await user.click(screen.getByRole('button', { name: 'Buka menu navigasi' }))
    expect(sidebar).toHaveAttribute('data-open', 'true')

    await user.keyboard('{Escape}')
    expect(sidebar).toHaveAttribute('data-open', 'false')
  })

  it('menyediakan tautan lewati ke konten utama', () => {
    renderApp('/', { sesi: SESI_MAHASISWA() })

    expect(screen.getByRole('link', { name: 'Lewati ke konten utama' })).toHaveAttribute(
      'href',
      '#main-content',
    )
  })

  it('menampilkan halaman tidak ditemukan untuk alamat asing', () => {
    renderApp('/alamat-yang-tidak-ada', { sesi: SESI_MAHASISWA() })

    expect(
      screen.getByRole('heading', { level: 1, name: 'Halaman tidak ditemukan' }),
    ).toBeInTheDocument()
  })
})
