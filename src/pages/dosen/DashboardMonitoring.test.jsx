import { beforeEach, describe, expect, it } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ACUAN_UJI, SESI_ADMIN, SESI_DOSEN, renderApp } from '@/test/utils'
import { resetDataMock } from '@/services/competitionService'

beforeEach(() => {
  resetDataMock(ACUAN_UJI)
})

function kartu(label) {
  return screen.getByTestId(`stat-${label}`)
}

async function bukaDashboard(sesi = SESI_DOSEN()) {
  renderApp('/monitoring', { sesi })
  await screen.findByText('Sebaran keikutsertaan')
}

describe('Dashboard Monitoring - statistik', () => {
  it('menampilkan empat kartu rekapitulasi', async () => {
    await bukaDashboard()

    expect(screen.getByText('Mahasiswa aktif berlomba')).toBeInTheDocument()
    expect(screen.getByText('Lomba bulan ini')).toBeInTheDocument()
    expect(screen.getByText('Dokumen belum lengkap')).toBeInTheDocument()
    expect(screen.getByText('Prestasi tercatat')).toBeInTheDocument()
  })

  it('menghitung dokumen belum lengkap dari seluruh data', async () => {
    await bukaDashboard()

    expect(within(kartu('Dokumen belum lengkap')).getByText('4')).toBeInTheDocument()
  })

  it('menghitung prestasi dari lomba yang sudah selesai', async () => {
    await bukaDashboard()

    expect(within(kartu('Prestasi tercatat')).getByText('6')).toBeInTheDocument()
    expect(screen.getByText('Dari 8 lomba yang sudah selesai')).toBeInTheDocument()
  })

  it('menampilkan sebaran status, tingkat, dan bidang', async () => {
    await bukaDashboard()

    expect(screen.getByText('Terdaftar: 5')).toBeInTheDocument()
    expect(screen.getByText('Berlangsung: 7')).toBeInTheDocument()
    expect(screen.getByText('Selesai: 8')).toBeInTheDocument()

    expect(screen.getByText('Tingkat')).toBeInTheDocument()
    expect(screen.getByText('Bidang')).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: /Tingkat Nasional/ })).toBeInTheDocument()
  })

  it('kartu lomba bulan ini menuju monitoring dengan filter bulan ini', async () => {
    await bukaDashboard()

    expect(screen.getByRole('link', { name: /Lomba bulan ini/ })).toHaveAttribute(
      'href',
      '/monitoring/lomba?mode=bulan-ini',
    )
  })
})

describe('Dashboard Monitoring - agenda', () => {
  it('menampilkan hingga enam agenda tahapan terdekat', async () => {
    await bukaDashboard()

    const agenda = within(screen.getByRole('list', { name: 'Agenda tahapan terdekat' }))
    const item = agenda.getAllByRole('listitem')

    expect(item).toHaveLength(6)
    expect(agenda.getAllByRole('link')[0]).toHaveAttribute(
      'href',
      expect.stringContaining('/monitoring/lomba/'),
    )
  })
})

describe('Dashboard Monitoring - kartu lomba', () => {
  it('menampilkan enam kartu lomba beserta info pemantauan', async () => {
    await bukaDashboard()

    const kartuLomba = screen.getAllByRole('article')
    expect(kartuLomba).toHaveLength(6)

    const pertama = within(kartuLomba[0])
    expect(pertama.getByText('Progres tahapan')).toBeInTheDocument()
    expect(pertama.getByRole('link', { name: 'Lihat detail' })).toHaveAttribute(
      'href',
      expect.stringContaining('/monitoring/lomba/'),
    )
  })

  it('menyebut dosen pembimbing dan nama tim pada kartu', async () => {
    await bukaDashboard()

    const kartuLomba = screen.getAllByRole('article')
    const semuaTeks = kartuLomba.map((node) => node.textContent).join(' ')

    expect(semuaTeks).toMatch(/Tim /)
    expect(semuaTeks).toMatch(/Pandu Wicaksono|Ratna Kusumawati|Irfan Maulana|Sari Melati/)
  })

  it('menampilkan progres tahapan sebagai bilah', async () => {
    await bukaDashboard()

    const bar = screen.getAllByRole('progressbar', { name: /Progres tahapan/ })
    expect(bar.length).toBe(6)
    expect(bar[0]).toHaveAttribute('aria-valuemax', '100')
  })

  it('menautkan ke halaman monitoring lengkap beserta jumlah totalnya', async () => {
    await bukaDashboard()

    expect(screen.getByRole('link', { name: 'Lihat semua 20 lomba' })).toBeInTheDocument()
  })
})

describe('Dashboard Monitoring - penyaringan bimbingan', () => {
  it('dosen bisa membatasi tampilan hanya pada bimbingannya', async () => {
    const user = userEvent.setup()
    await bukaDashboard()

    const tombol = screen.getByRole('button', { name: 'Hanya bimbingan saya' })
    expect(tombol).toHaveAttribute('aria-pressed', 'false')

    await user.click(tombol)

    await waitFor(() =>
      expect(screen.getByRole('link', { name: 'Lihat semua 4 lomba' })).toBeInTheDocument(),
    )
    expect(screen.getByRole('button', { name: 'Hanya bimbingan saya' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('admin program studi tidak diberi tombol bimbingan', async () => {
    await bukaDashboard(SESI_ADMIN())

    expect(screen.queryByRole('button', { name: 'Hanya bimbingan saya' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Lihat semua 20 lomba' })).toBeInTheDocument()
  })
})
