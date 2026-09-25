import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ACUAN_UJI, SESI_DOSEN, alamatSekarang, renderApp } from '@/test/utils'
import { resetDataMock } from '@/services/competitionService'
import { keCsv } from '@/features/arsip/eksporData'

/*
 * Pembuatan berkas dipalsukan agar pengujian fokus pada data apa yang
 * dikirim ke pengekspor, bukan pada isi biner XLSX maupun PDF.
 */
vi.mock('@/features/arsip/eksporBerkas', () => ({
  unduhCsv: vi.fn(() => 'rekap-prestasi-20260924.csv'),
  unduhXlsx: vi.fn(async () => 'rekap-prestasi-20260924.xlsx'),
  unduhPdf: vi.fn(async () => 'rekap-prestasi-20260924.pdf'),
  simpanBlob: vi.fn(),
}))

const { unduhCsv, unduhPdf, unduhXlsx } = await import('@/features/arsip/eksporBerkas')

beforeEach(() => {
  resetDataMock(ACUAN_UJI)
  vi.clearAllMocks()
})

async function bukaArsip(alamat = '/monitoring/arsip') {
  renderApp(alamat, { sesi: SESI_DOSEN() })
  return screen.findByRole('table', { name: 'Arsip prestasi perlombaan' })
}

function tabel() {
  return screen.getByRole('table', { name: 'Arsip prestasi perlombaan' })
}

describe('Arsip Prestasi - tampilan', () => {
  it('hanya menampilkan lomba yang sudah selesai', async () => {
    await bukaArsip()

    // Delapan lomba berstatus selesai pada data tiruan.
    expect(screen.getByText('Menampilkan 1-8 dari 8 prestasi')).toBeInTheDocument()
    expect(within(tabel()).queryByText('Berlangsung')).not.toBeInTheDocument()
  })

  it('menampilkan kartu statistik arsip', async () => {
    await bukaArsip()

    expect(within(screen.getByTestId('stat-Lomba selesai')).getByText('8')).toBeInTheDocument()
    expect(within(screen.getByTestId('stat-Prestasi tercatat')).getByText('6')).toBeInTheDocument()
    expect(within(screen.getByTestId('stat-Hasil terfilter')).getByText('8')).toBeInTheDocument()
  })

  it('menampilkan sebaran capaian', async () => {
    await bukaArsip()

    expect(screen.getByText('Sebaran capaian')).toBeInTheDocument()
    expect(screen.getByText('Juara 1: 2')).toBeInTheDocument()
    expect(screen.getByText('Peserta: 2')).toBeInTheDocument()
  })

  it('menampilkan peserta, capaian, dan status sertifikat per baris', async () => {
    await bukaArsip()

    const isi = within(tabel())
    // Elvira punya dua lomba selesai, jadi namanya muncul lebih dari sekali.
    expect(isi.getAllByText('Elvira Nuraini').length).toBeGreaterThan(0)
    expect(isi.getAllByText('Juara 1').length).toBeGreaterThan(0)
    expect(isi.getAllByText('Ada').length).toBeGreaterThan(0)
    expect(isi.getAllByText(/Dilaporkan \d+ \w+ 2026/).length).toBeGreaterThan(0)
  })

  it('mengurutkan berdasarkan capaian secara bawaan', async () => {
    await bukaArsip()

    const barisPertama = within(tabel()).getAllByRole('row')[1]
    expect(barisPertama.textContent).toContain('Juara 1')
  })

  it('menyembunyikan filter status dan jenis tahapan', async () => {
    await bukaArsip()

    expect(screen.queryByLabelText('Status')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Jenis tahapan')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Hasil')).toBeInTheDocument()
  })
})

describe('Arsip Prestasi - filter', () => {
  it('menyaring berdasarkan capaian', async () => {
    const user = userEvent.setup()
    await bukaArsip()

    await user.selectOptions(screen.getByLabelText('Hasil'), 'juara_1')

    await waitFor(() =>
      expect(screen.getByText('Menampilkan 1-2 dari 2 prestasi')).toBeInTheDocument(),
    )
    expect(alamatSekarang(screen)).toContain('capaian=juara_1')
  })

  it('menyaring berdasarkan tingkat dan memperbarui jumlah baris terekspor', async () => {
    const user = userEvent.setup()
    await bukaArsip()

    await user.selectOptions(screen.getByLabelText('Tingkat'), 'Regional')

    await waitFor(() =>
      expect(within(screen.getByTestId('stat-Hasil terfilter')).getByText('3')).toBeInTheDocument(),
    )
  })

  it('menyaring berdasarkan rentang waktu', async () => {
    await bukaArsip('/monitoring/arsip?mode=rentang&dari=2026-01-01&sampai=2026-03-31')

    await waitFor(() =>
      expect(screen.getByText(/Menampilkan 1-\d+ dari \d+ prestasi/)).toBeInTheDocument(),
    )
    const jumlah = Number(
      /dari (\d+) prestasi/.exec(screen.getByText(/dari \d+ prestasi/).textContent)[1],
    )
    expect(jumlah).toBeLessThan(8)
  })

  it('menampilkan empty state ketika filter tidak menemukan apa pun', async () => {
    const user = userEvent.setup()
    await bukaArsip()

    await user.type(screen.getByLabelText('Cari lomba'), 'prestasi yang tidak ada')

    expect(await screen.findByText('Tidak ada prestasi yang cocok')).toBeInTheDocument()
  })
})

describe('Arsip Prestasi - ekspor', () => {
  it('mengekspor CSV berisi seluruh baris terfilter', async () => {
    const user = userEvent.setup()
    await bukaArsip()

    await user.click(screen.getByRole('button', { name: 'CSV' }))

    expect(unduhCsv).toHaveBeenCalledTimes(1)
    const [items] = unduhCsv.mock.calls[0]
    expect(items).toHaveLength(8)
    expect(items.every((lomba) => lomba.status === 'selesai')).toBe(true)
  })

  it('mengekspor Excel dan PDF lewat tombol terpisah', async () => {
    const user = userEvent.setup()
    await bukaArsip()

    await user.click(screen.getByRole('button', { name: 'Excel' }))
    await waitFor(() => expect(unduhXlsx).toHaveBeenCalledTimes(1))

    await user.click(screen.getByRole('button', { name: 'PDF' }))
    await waitFor(() => expect(unduhPdf).toHaveBeenCalledTimes(1))
  })

  it('memberi notifikasi berisi nama berkas dan jumlah data', async () => {
    const user = userEvent.setup()
    await bukaArsip()

    await user.click(screen.getByRole('button', { name: 'CSV' }))

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Laporan berhasil diunduh'),
    )
    expect(screen.getByRole('status')).toHaveTextContent('memuat 8 perlombaan')
  })

  it('hanya mengekspor data yang lolos filter', async () => {
    const user = userEvent.setup()
    await bukaArsip()

    await user.selectOptions(screen.getByLabelText('Hasil'), 'juara_1')
    await waitFor(() =>
      expect(screen.getByText('Menampilkan 1-2 dari 2 prestasi')).toBeInTheDocument(),
    )

    await user.click(screen.getByRole('button', { name: 'CSV' }))

    const [items] = unduhCsv.mock.calls[0]
    expect(items).toHaveLength(2)
    expect(items.every((lomba) => lomba.hasil.capaian === 'juara_1')).toBe(true)
  })

  it('menolak ekspor saat tidak ada data dan memberi peringatan', async () => {
    const user = userEvent.setup()
    await bukaArsip()

    await user.type(screen.getByLabelText('Cari lomba'), 'prestasi yang tidak ada')
    await screen.findByText('Tidak ada prestasi yang cocok')

    await user.click(screen.getByRole('button', { name: 'CSV' }))

    expect(unduhCsv).not.toHaveBeenCalled()
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Tidak ada data untuk diekspor'),
    )
  })

  it('memberi notifikasi galat bila pembuatan berkas gagal', async () => {
    const user = userEvent.setup()
    unduhXlsx.mockRejectedValueOnce(new Error('Penulisan berkas gagal'))
    await bukaArsip()

    await user.click(screen.getByRole('button', { name: 'Excel' }))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Gagal membuat laporan'),
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Penulisan berkas gagal')
  })

  it('isi CSV yang dihasilkan memuat kolom akreditasi untuk data terfilter', async () => {
    const user = userEvent.setup()
    await bukaArsip()

    await user.click(screen.getByRole('button', { name: 'CSV' }))

    // Pengekspor dipalsukan, jadi isi berkas diperiksa langsung dari data yang dikirim.
    const [items] = unduhCsv.mock.calls[0]
    const csv = keCsv(items)

    expect(csv).toContain('Nama Perlombaan')
    expect(csv).toContain('Hackathon Bank Indonesia Digital Rupiah')
    expect(csv).toContain('Juara 1')
    expect(csv.replace('\uFEFF', '').split('\r\n')).toHaveLength(9)
  })
})
