import { beforeEach, describe, expect, it } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ACUAN_UJI, SESI_DOSEN, alamatSekarang, renderApp } from '@/test/utils'
import { resetDataMock } from '@/services/competitionService'

beforeEach(() => {
  resetDataMock(ACUAN_UJI)
})

async function bukaKalender(alamat = '/monitoring/kalender?bulan=2026-09') {
  renderApp(alamat, { sesi: SESI_DOSEN() })
  return screen.findByRole('table', { name: /Kalender tahapan lomba bulan/ })
}

function kalender() {
  return screen.getByRole('table', { name: /Kalender tahapan lomba bulan/ })
}

describe('Kalender Agenda', () => {
  it('menampilkan judul bulan dan tujuh nama hari', async () => {
    await bukaKalender()

    expect(screen.getByRole('heading', { level: 2, name: 'September 2026' })).toBeInTheDocument()
    expect(within(kalender()).getAllByRole('columnheader')).toHaveLength(7)
    expect(within(kalender()).getByRole('columnheader', { name: 'Sen' })).toBeInTheDocument()
  })

  it('menampilkan enam baris tanggal', async () => {
    await bukaKalender()

    const baris = within(kalender()).getAllByRole('row')

    expect(baris).toHaveLength(7)
  })

  it('setiap tanggal punya label yang menyebut jumlah agendanya', async () => {
    await bukaKalender()

    expect(
      within(kalender()).getByRole('button', { name: /24 September 2026, \d+ agenda/ }),
    ).toBeInTheDocument()
    expect(
      within(kalender()).getAllByRole('button', { name: /tidak ada agenda/ }).length,
    ).toBeGreaterThan(0)
  })

  it('menandai tanggal yang punya tahapan dengan label tahapannya', async () => {
    await bukaKalender()

    const tanggal24 = within(kalender()).getByRole('button', { name: /^24 September 2026/ })
    expect(tanggal24.textContent).toMatch(/Penyisihan|Pendaftaran|Final|Technical/)
  })

  it('meminta pengguna memilih tanggal lebih dulu', async () => {
    await bukaKalender()

    expect(screen.getByText('Belum ada tanggal dipilih')).toBeInTheDocument()
  })

  it('menampilkan rincian agenda setelah tanggal diklik', async () => {
    const user = userEvent.setup()
    await bukaKalender()

    await user.click(within(kalender()).getByRole('button', { name: /^24 September 2026/ }))

    const daftar = await screen.findByRole('list', { name: 'Agenda tanggal terpilih' })
    expect(within(daftar).getAllByRole('listitem').length).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { name: /Agenda 24 September 2026/ })).toBeInTheDocument()
    expect(within(daftar).getAllByRole('link')[0]).toHaveAttribute(
      'href',
      expect.stringContaining('/monitoring/lomba/'),
    )
  })

  it('menyimpan tanggal terpilih pada alamat halaman', async () => {
    const user = userEvent.setup()
    await bukaKalender()

    await user.click(within(kalender()).getByRole('button', { name: /^24 September 2026/ }))

    await waitFor(() => expect(alamatSekarang(screen)).toContain('tanggal=2026-09-24'))
  })

  it('mengklik tanggal yang sama sekali lagi membatalkan pilihan', async () => {
    const user = userEvent.setup()
    await bukaKalender()

    const tanggal = () => within(kalender()).getByRole('button', { name: /^24 September 2026/ })
    await user.click(tanggal())
    await waitFor(() => expect(tanggal()).toHaveAttribute('aria-pressed', 'true'))

    await user.click(tanggal())
    await waitFor(() => expect(screen.getByText('Belum ada tanggal dipilih')).toBeInTheDocument())
  })

  it('tombol bulan berikutnya dan sebelumnya menggeser kalender', async () => {
    const user = userEvent.setup()
    await bukaKalender()

    await user.click(screen.getByRole('button', { name: 'Bulan berikutnya' }))
    expect(
      await screen.findByRole('heading', { level: 2, name: 'Oktober 2026' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Bulan sebelumnya' }))
    expect(
      await screen.findByRole('heading', { level: 2, name: 'September 2026' }),
    ).toBeInTheDocument()
  })

  it('membaca bulan dari alamat halaman', async () => {
    await bukaKalender('/monitoring/kalender?bulan=2026-11')

    expect(screen.getByRole('heading', { level: 2, name: 'November 2026' })).toBeInTheDocument()
  })

  it('menyaring agenda kalender berdasarkan bidang', async () => {
    const user = userEvent.setup()
    await bukaKalender()

    const sebelum = within(kalender()).getAllByRole('button', { name: /\d+ agenda/ }).length

    await user.selectOptions(screen.getByLabelText('Bidang'), 'Olahraga')

    await waitFor(() => {
      const sesudah = within(kalender()).getAllByRole('button', { name: /\d+ agenda/ }).length
      expect(sesudah).toBeLessThan(sebelum)
    })
    expect(alamatSekarang(screen)).toContain('bidang=Olahraga')
  })

  it('memberi tahu bila tanggal terpilih tidak punya agenda', async () => {

    await bukaKalender('/monitoring/kalender?bulan=2027-03&tanggal=2027-03-15')

    expect(await screen.findByText('Tidak ada agenda')).toBeInTheDocument()
  })
})
