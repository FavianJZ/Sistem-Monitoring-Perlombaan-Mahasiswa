import { beforeEach, describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ACUAN_UJI, SESI_ADMIN, SESI_DOSEN, SESI_MAHASISWA, renderApp } from '@/test/utils'
import { perbaruiLomba, resetDataMock } from '@/services/competitionService'

beforeEach(() => {
  resetDataMock(ACUAN_UJI)
})

async function bukaDetail(idLomba = 'lomba-01', sesi = SESI_DOSEN()) {
  renderApp(`/monitoring/lomba/${idLomba}`, { sesi })
  await screen.findByRole('tablist', { name: 'Bagian detail lomba' })
}

function tablist() {
  return screen.getByRole('tablist', { name: 'Bagian detail lomba' })
}

describe('Detail lomba untuk dosen - tampilan', () => {
  it('menampilkan identitas lomba beserta badge', async () => {
    await bukaDetail()

    expect(
      screen.getByRole('heading', { level: 1, name: 'GEMASTIK XIX Divisi Pemrograman' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Berlangsung')).toBeInTheDocument()
    expect(screen.getAllByText('Programming').length).toBeGreaterThan(0)
  })

  it('menegaskan bahwa halaman ini hanya untuk memantau', async () => {
    await bukaDetail()

    expect(screen.getByText(/Halaman ini bersifat pemantauan/)).toBeInTheDocument()
    expect(screen.getByText(/tidak memerlukan persetujuan/)).toBeInTheDocument()
  })

  it('menampilkan dua ringkasan: kelengkapan bukti dan progres tahapan', async () => {
    await bukaDetail()

    expect(screen.getByText('Kelengkapan bukti wajib')).toBeInTheDocument()
    expect(screen.getByText('Progres tahapan')).toBeInTheDocument()
    expect(
      screen.getByRole('progressbar', {
        name: 'Kelengkapan dokumen GEMASTIK XIX Divisi Pemrograman',
      }),
    ).toHaveAttribute('aria-valuenow', '100')
    expect(
      screen.getByRole('progressbar', { name: 'Progres tahapan GEMASTIK XIX Divisi Pemrograman' }),
    ).toHaveAttribute('aria-valuenow', '33')
  })

  it('menyebut berkas yang belum diunggah mahasiswa', async () => {
    await bukaDetail('lomba-09')

    expect(screen.getByText('Mahasiswa belum mengunggah Bukti Pembayaran.')).toBeInTheDocument()
  })

  it('menyebut tahapan terdekat pada ringkasan progres', async () => {
    await bukaDetail()

    expect(
      screen.getByText(/Tahapan terdekat: Penyisihan \/ Pengumpulan Karya pada/),
    ).toBeInTheDocument()
  })

  it('menampilkan pesan bila lomba tidak ditemukan', async () => {
    renderApp('/monitoring/lomba/lomba-999', { sesi: SESI_DOSEN() })

    expect(await screen.findByText('Lomba tidak ditemukan')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Kembali ke monitoring/ })).toBeInTheDocument()
  })
})

describe('Detail lomba untuk dosen - isi tab', () => {
  it('menampilkan rincian dan poster pada tab Info', async () => {
    await bukaDetail()

    const panel = within(screen.getByRole('tabpanel'))
    expect(panel.getByText('Dosen pembimbing')).toBeInTheDocument()
    expect(panel.getByText('Pandu Wicaksono, S.Kom., M.Kom.')).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: 'Poster GEMASTIK XIX Divisi Pemrograman' }),
    ).toBeInTheDocument()
  })

  it('menampilkan susunan tim pada tab Tim', async () => {
    const user = userEvent.setup()
    await bukaDetail()

    await user.click(within(tablist()).getByRole('tab', { name: 'Tim' }))

    const tabel = screen.getByRole('table', { name: 'Anggota tim Sanca Digital' })
    expect(within(tabel).getByText('Aulia Rahmawati')).toBeInTheDocument()
    expect(within(tabel).getByText('2502019876')).toBeInTheDocument()
  })

  it('menampilkan bukti pendaftaran dan pembayaran pada tab Dokumen', async () => {
    const user = userEvent.setup()
    await bukaDetail()

    await user.click(within(tablist()).getByRole('tab', { name: 'Dokumen' }))

    const daftar = screen.getByRole('list', { name: 'Berkas pendukung' })
    expect(within(daftar).getByText('Bukti Pendaftaran')).toBeInTheDocument()
    expect(within(daftar).getByText('Bukti Pembayaran')).toBeInTheDocument()
    expect(within(daftar).getAllByText('Wajib')).toHaveLength(2)
  })

  it('menandai posisi tahapan pada tab Timeline', async () => {
    const user = userEvent.setup()
    await bukaDetail()

    await user.click(within(tablist()).getByRole('tab', { name: 'Timeline' }))

    const timeline = screen.getByRole('list', { name: 'Timeline tahapan' })
    expect(within(timeline).getAllByRole('listitem')).toHaveLength(6)
    expect(within(timeline).getByText('Sedang berlangsung')).toBeInTheDocument()
  })
})

describe('Detail lomba untuk dosen - hasil', () => {
  it('memberi tahu bahwa lomba masih berjalan bila hasil belum ada', async () => {
    const user = userEvent.setup()
    await bukaDetail()

    await user.click(within(tablist()).getByRole('tab', { name: 'Hasil' }))

    expect(screen.getByText('Hasil belum dilaporkan')).toBeInTheDocument()
    expect(screen.getByText(/masih berjalan/)).toBeInTheDocument()
  })

  it('menyebut mahasiswa belum melapor bila seluruh tahapan sudah lewat', async () => {
    const user = userEvent.setup()
    await perbaruiLomba(
      'lomba-01',
      { tahapan: [{ jenis: 'pengumuman', tanggalMulai: '2026-08-15' }] },
      { acuan: ACUAN_UJI },
    )
    await bukaDetail()

    await user.click(within(tablist()).getByRole('tab', { name: 'Hasil' }))

    expect(screen.getByText('Hasil belum dilaporkan')).toBeInTheDocument()
    expect(screen.getByText(/belum mengisi laporan capaian/)).toBeInTheDocument()
  })

  it('menampilkan capaian dan bukti prestasi untuk lomba yang sudah selesai', async () => {
    const user = userEvent.setup()
    await bukaDetail('lomba-05')

    await user.click(within(tablist()).getByRole('tab', { name: 'Hasil' }))

    expect(screen.getByText('Capaian akhir')).toBeInTheDocument()
    expect(screen.getAllByText('Juara 1').length).toBeGreaterThan(0)
    expect(screen.getByText('Bukti prestasi')).toBeInTheDocument()

    const bukti = screen.getAllByRole('list', { name: 'Berkas pendukung' }).at(-1)
    expect(within(bukti).getByText('Sertifikat')).toBeInTheDocument()
    expect(within(bukti).getByText('Foto Dokumentasi')).toBeInTheDocument()
  })
})

describe('Detail lomba untuk dosen - hanya baca', () => {
  it('tidak menyediakan kontrol unggah maupun penyimpanan', async () => {
    const user = userEvent.setup()
    await bukaDetail('lomba-09')

    for (const tab of ['Info', 'Tim', 'Dokumen', 'Timeline', 'Hasil']) {
      await user.click(within(tablist()).getByRole('tab', { name: tab }))

      expect(screen.queryByRole('button', { name: /Simpan/ })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Pilih berkas/ })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Setujui|Tolak|Verifikasi/ })).not.toBeInTheDocument()
      expect(screen.queryByLabelText(/Capaian Akhir/)).not.toBeInTheDocument()
    }
  })

  it('bisa dibuka admin program studi', async () => {
    await bukaDetail('lomba-01', SESI_ADMIN())

    expect(
      screen.getByRole('heading', { level: 1, name: 'GEMASTIK XIX Divisi Pemrograman' }),
    ).toBeInTheDocument()
  })

  it('tidak bisa dibuka mahasiswa', async () => {
    renderApp('/monitoring/lomba/lomba-01', { sesi: SESI_MAHASISWA() })

    expect(await screen.findByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.queryByText(/Halaman ini bersifat pemantauan/)).not.toBeInTheDocument()
  })
})
