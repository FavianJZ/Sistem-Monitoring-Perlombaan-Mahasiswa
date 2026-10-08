import { beforeEach, describe, expect, it } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ACUAN_UJI, SESI_MAHASISWA, buatSesi, renderApp } from '@/test/utils'
import { hapusLomba, resetDataMock } from '@/services/competitionService'

beforeEach(() => {
  resetDataMock(ACUAN_UJI)
})

function tabel() {
  return screen.getByRole('table', { name: 'Daftar lomba yang saya ikuti' })
}

async function renderLombaSaya(sesi = SESI_MAHASISWA()) {
  renderApp('/lomba-saya', { sesi })
  await screen.findByRole('table', { name: 'Daftar lomba yang saya ikuti' })
}

describe('Halaman Lomba Saya', () => {
  it('hanya menampilkan lomba milik mahasiswa yang masuk', async () => {
    await renderLombaSaya()

    expect(screen.getByText('Menampilkan 1-5 dari 5 lomba')).toBeInTheDocument()

    const baris = within(tabel()).getAllByRole('row')

    expect(baris).toHaveLength(6)
    expect(within(tabel()).getByText('GEMASTIK XIX Divisi Pemrograman')).toBeInTheDocument()
    expect(
      within(tabel()).queryByText('COMPFEST 18 UI/UX Design Competition'),
    ).not.toBeInTheDocument()
  })

  it('menampilkan badge status, kelengkapan, dan tahapan terdekat', async () => {
    await renderLombaSaya()

    const isi = within(tabel())
    expect(isi.getAllByText('Berlangsung').length).toBeGreaterThan(0)
    expect(isi.getAllByText('Terdaftar').length).toBeGreaterThan(0)
    expect(isi.getAllByText('Dokumen Belum Lengkap').length).toBeGreaterThan(0)
    expect(isi.getAllByText('Penyisihan / Pengumpulan Karya').length).toBeGreaterThan(0)
  })

  it('menyebut berkas yang masih kurang pada lomba yang belum lengkap', async () => {
    await renderLombaSaya()

    expect(within(tabel()).getByText('Kurang Bukti Pembayaran')).toBeInTheDocument()
    expect(within(tabel()).getByText('Kurang Bukti Pendaftaran')).toBeInTheDocument()
    expect(
      within(tabel()).getByText('Kurang Bukti Pendaftaran dan Bukti Pembayaran'),
    ).toBeInTheDocument()
  })

  it('mencari lomba berdasarkan kata kunci', async () => {
    const user = userEvent.setup()
    await renderLombaSaya()

    await user.type(screen.getByLabelText('Cari lomba'), 'gemastik')

    await waitFor(() =>
      expect(screen.getByText('Menampilkan 1-1 dari 1 lomba')).toBeInTheDocument(),
    )
    expect(within(tabel()).getByText('GEMASTIK XIX Divisi Pemrograman')).toBeInTheDocument()
  })

  it('menyaring berdasarkan status', async () => {
    const user = userEvent.setup()
    await renderLombaSaya()

    await user.selectOptions(screen.getByLabelText('Status'), 'terdaftar')

    await waitFor(() =>
      expect(screen.getByText('Menampilkan 1-3 dari 3 lomba')).toBeInTheDocument(),
    )
    expect(within(tabel()).queryByText('Berlangsung')).not.toBeInTheDocument()
  })

  it('menampilkan empty state ketika pencarian tidak menemukan apa pun', async () => {
    const user = userEvent.setup()
    await renderLombaSaya()

    await user.type(screen.getByLabelText('Cari lomba'), 'lomba masak nasi goreng')

    expect(await screen.findByText('Tidak ada lomba yang cocok')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('tombol bersihkan filter memulihkan seluruh daftar', async () => {
    const user = userEvent.setup()
    await renderLombaSaya()

    await user.type(screen.getByLabelText('Cari lomba'), 'lomba masak nasi goreng')
    await screen.findByText('Tidak ada lomba yang cocok')

    await user.click(screen.getByRole('button', { name: 'Bersihkan filter' }))

    await waitFor(() =>
      expect(screen.getByText('Menampilkan 1-5 dari 5 lomba')).toBeInTheDocument(),
    )
  })

  it('mengurutkan lewat header kolom dan menandai arahnya untuk pembaca layar', async () => {
    const user = userEvent.setup()
    await renderLombaSaya()

    const headerNama = () => within(tabel()).getByRole('columnheader', { name: /Perlombaan/ })

    expect(headerNama()).toHaveAttribute('aria-sort', 'none')

    await user.click(within(headerNama()).getByRole('button'))
    await waitFor(() => expect(headerNama()).toHaveAttribute('aria-sort', 'ascending'))
    expect(within(tabel()).getAllByRole('row')[1].textContent).toContain(
      'Capture The Flag Cyber Jawara',
    )

    await user.click(within(headerNama()).getByRole('button'))
    await waitFor(() => expect(headerNama()).toHaveAttribute('aria-sort', 'descending'))
    expect(within(tabel()).getAllByRole('row')[1].textContent).toContain('National Marketing Case')
  })

  it('menampilkan empty state awal bila mahasiswa belum punya lomba', async () => {

    for (const id of ['lomba-02', 'lomba-12', 'lomba-17']) {
      await hapusLomba(id, { acuan: ACUAN_UJI })
    }

    renderApp('/lomba-saya', { sesi: buatSesi('mhs-3') })

    expect(await screen.findByText('Belum ada lomba terdaftar')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Daftarkan Lomba' }).length).toBeGreaterThan(0)
  })

  it('menyediakan tautan ke halaman detail tiap lomba', async () => {
    await renderLombaSaya()

    const tautanDetail = within(tabel()).getAllByRole('link', { name: 'Detail' })
    expect(tautanDetail.length).toBe(5)
    expect(tautanDetail[0]).toHaveAttribute('href', expect.stringContaining('/lomba-saya/lomba-'))
  })
})
