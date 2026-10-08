import { beforeEach, describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ACUAN_UJI, SESI_MAHASISWA, buatSesi, renderApp } from '@/test/utils'
import { perbaruiLomba, resetDataMock } from '@/services/competitionService'

beforeEach(() => {
  resetDataMock(ACUAN_UJI)
})

function kartu(label) {
  return screen.getByTestId(`stat-${label}`)
}

describe('Dashboard Mahasiswa', () => {
  it('menampilkan empat kartu statistik milik mahasiswa yang masuk', async () => {
    renderApp('/', { sesi: SESI_MAHASISWA() })

    expect(await screen.findByText('Lomba aktif')).toBeInTheDocument()
    expect(screen.getByText('Agenda bulan ini')).toBeInTheDocument()
    expect(screen.getByText('Dokumen belum lengkap')).toBeInTheDocument()
    expect(screen.getByText('Prestasi tercatat')).toBeInTheDocument()
  })

  it('menghitung lomba aktif sebagai gabungan terdaftar dan berlangsung', async () => {
    renderApp('/', { sesi: SESI_MAHASISWA() })
    await screen.findByText('Lomba aktif')

    expect(within(kartu('Lomba aktif')).getByText('5')).toBeInTheDocument()
    expect(
      screen.getByText('2 sedang berlangsung, 3 baru terdaftar'),
    ).toBeInTheDocument()
  })

  it('menghitung dokumen belum lengkap dan menandainya dengan nada peringatan', async () => {
    renderApp('/', { sesi: SESI_MAHASISWA() })
    await screen.findByText('Dokumen belum lengkap')

    expect(within(kartu('Dokumen belum lengkap')).getByText('3')).toBeInTheDocument()
  })

  it('menampilkan panel tahapan terdekat berisi agenda yang belum lewat', async () => {
    renderApp('/', { sesi: SESI_MAHASISWA() })

    const panel = (await screen.findByText('Tahapan terdekat')).closest('div.rounded-lg')
    const daftar = within(panel).getAllByRole('listitem')

    expect(daftar.length).toBeGreaterThan(0)
    expect(daftar.length).toBeLessThanOrEqual(5)
    expect(within(panel).getAllByRole('link').length).toBeGreaterThan(0)
  })

  it('menampilkan panel perlu dilengkapi beserta progres kelengkapan', async () => {
    renderApp('/', { sesi: SESI_MAHASISWA() })
    await screen.findByText('Perlu dilengkapi')

    const bar = screen.getAllByRole('progressbar')
    expect(bar.length).toBeGreaterThan(0)
    expect(bar[0]).toHaveAttribute('aria-valuemax', '100')
    expect(screen.getAllByText(/Belum ada Bukti/).length).toBeGreaterThan(0)
  })

  it('memberi tahu bila seluruh dokumen sudah lengkap', async () => {
    const lengkap = [
      { tipe: 'bukti_daftar', namaFile: 'daftar.pdf', mimeType: 'application/pdf', size: 1000 },
      { tipe: 'bukti_bayar', namaFile: 'bayar.jpg', mimeType: 'image/jpeg', size: 1000 },
    ]
    for (const id of ['lomba-09', 'lomba-14', 'lomba-20']) {
      await perbaruiLomba(id, { berkas: lengkap }, { acuan: ACUAN_UJI })
    }

    renderApp('/', { sesi: SESI_MAHASISWA() })

    expect(await screen.findByText('Semua dokumen lengkap')).toBeInTheDocument()
    expect(within(kartu('Dokumen belum lengkap')).getByText('0')).toBeInTheDocument()
  })

  it('menampilkan prestasi tercatat untuk mahasiswa yang sudah pernah menang', async () => {
    renderApp('/', { sesi: buatSesi('mhs-5') })
    await screen.findByText('Prestasi tercatat')

    expect(within(kartu('Prestasi tercatat')).getByText('2')).toBeInTheDocument()
  })

  it('menyediakan tombol daftarkan lomba di header', async () => {
    renderApp('/', { sesi: SESI_MAHASISWA() })
    await screen.findByText('Lomba aktif')

    const tombol = screen.getAllByRole('link', { name: 'Daftarkan Lomba' })
    expect(tombol[0]).toHaveAttribute('href', '/lomba-saya/baru')
  })

  it('kartu lomba aktif menuju halaman Lomba Saya', async () => {
    const user = userEvent.setup()
    renderApp('/', { sesi: SESI_MAHASISWA() })
    await screen.findByText('Lomba aktif')

    await user.click(screen.getByRole('link', { name: /Lomba aktif/ }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Lomba Saya' })).toBeInTheDocument()
  })
})
