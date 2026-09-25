import { beforeEach, describe, expect, it } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ACUAN_UJI, SESI_MAHASISWA, buatSesi, renderApp } from '@/test/utils'
import { detailLomba, perbaruiLomba, resetDataMock } from '@/services/competitionService'

beforeEach(() => {
  resetDataMock(ACUAN_UJI)
})

function buatBerkas(nama, tipe, ukuran = 1024 * 100) {
  const file = new File(['x'], nama, { type: tipe })
  Object.defineProperty(file, 'size', { value: ukuran })
  return file
}

async function bukaDetail(idLomba = 'lomba-01', sesi = SESI_MAHASISWA()) {
  renderApp(`/lomba-saya/${idLomba}`, { sesi })
  await screen.findByRole('tablist', { name: 'Bagian detail lomba' })
}

function tablist() {
  return screen.getByRole('tablist', { name: 'Bagian detail lomba' })
}

describe('Detail lomba - tampilan umum', () => {
  it('menampilkan identitas lomba beserta badge statusnya', async () => {
    await bukaDetail()

    expect(
      screen.getByRole('heading', { level: 1, name: 'GEMASTIK XIX Divisi Pemrograman' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Berlangsung')).toBeInTheDocument()
    // Bidang dan tingkat tampil sebagai badge sekaligus di daftar rincian.
    expect(screen.getAllByText('Programming').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Nasional').length).toBeGreaterThan(0)
  })

  it('menampilkan progres kelengkapan dokumen wajib', async () => {
    await bukaDetail()

    const bar = screen.getByRole('progressbar', {
      name: 'Kelengkapan dokumen GEMASTIK XIX Divisi Pemrograman',
    })
    expect(bar).toHaveAttribute('aria-valuenow', '100')
    expect(screen.getByText('2 dari 2 berkas')).toBeInTheDocument()
    expect(
      screen.getByText('Bukti pendaftaran dan bukti pembayaran sudah lengkap.'),
    ).toBeInTheDocument()
  })

  it('menyebut berkas yang masih kurang pada lomba yang belum lengkap', async () => {
    await bukaDetail('lomba-09')

    const bar = screen.getByRole('progressbar', { name: /Kelengkapan dokumen/ })
    expect(bar).toHaveAttribute('aria-valuenow', '50')
    expect(screen.getByText('Masih perlu Bukti Pembayaran.')).toBeInTheDocument()
  })

  it('menampilkan pesan bila lomba tidak ditemukan', async () => {
    renderApp('/lomba-saya/lomba-999', { sesi: SESI_MAHASISWA() })

    expect(await screen.findByText('Lomba tidak ditemukan')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Kembali ke daftar lomba/ })).toBeInTheDocument()
  })
})

describe('Detail lomba - navigasi tab', () => {
  it('membuka tab Info secara bawaan', async () => {
    await bukaDetail()

    expect(within(tablist()).getByRole('tab', { selected: true })).toHaveTextContent('Info')
    expect(screen.getByText('Dosen pembimbing')).toBeInTheDocument()
  })

  it('menampilkan jumlah data pada label tab', async () => {
    await bukaDetail()

    const tabTim = within(tablist()).getByRole('tab', { name: 'Tim' })
    expect(tabTim).toHaveTextContent('3')

    const tabDokumen = within(tablist()).getByRole('tab', { name: 'Dokumen' })
    expect(tabDokumen).toHaveTextContent('3')
  })

  it('berpindah ke tab Tim dan menampilkan susunan anggota', async () => {
    const user = userEvent.setup()
    await bukaDetail()

    await user.click(within(tablist()).getByRole('tab', { name: 'Tim' }))

    const tabel = screen.getByRole('table', { name: 'Anggota tim Sanca Digital' })
    expect(within(tabel).getByText('Aulia Rahmawati')).toBeInTheDocument()
    expect(within(tabel).getByText('Ketua Tim')).toBeInTheDocument()
    expect(within(tabel).getAllByRole('row')).toHaveLength(4)
  })

  it('berpindah ke tab Dokumen dan menampilkan berkas', async () => {
    const user = userEvent.setup()
    await bukaDetail()

    await user.click(within(tablist()).getByRole('tab', { name: 'Dokumen' }))

    const daftar = screen.getByRole('list', { name: 'Berkas pendukung' })
    expect(within(daftar).getByText('Bukti Pendaftaran')).toBeInTheDocument()
    expect(within(daftar).getByText('Bukti Pembayaran')).toBeInTheDocument()
    expect(within(daftar).getByText('Poster / Publikasi')).toBeInTheDocument()
  })

  it('menandai berkas wajib yang belum diunggah pada tab Dokumen', async () => {
    const user = userEvent.setup()
    await bukaDetail('lomba-20')

    await user.click(within(tablist()).getByRole('tab', { name: 'Dokumen' }))

    expect(
      screen.getByText('Belum diunggah: Bukti Pendaftaran dan Bukti Pembayaran.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Belum ada berkas yang diunggah untuk lomba ini.'),
    ).toBeInTheDocument()
  })

  it('berpindah ke tab Timeline dan menandai posisi tiap tahapan', async () => {
    const user = userEvent.setup()
    await bukaDetail()

    await user.click(within(tablist()).getByRole('tab', { name: 'Timeline' }))

    const timeline = screen.getByRole('list', { name: 'Timeline tahapan' })
    expect(within(timeline).getAllByRole('listitem')).toHaveLength(6)
    // Penyisihan berjalan dari 5 hari lalu sampai 3 hari ke depan.
    expect(within(timeline).getByText('Sedang berlangsung')).toBeInTheDocument()
    expect(within(timeline).getAllByText('Sudah lewat').length).toBeGreaterThan(0)
  })

  it('tab bisa dipindah dengan tombol panah', async () => {
    const user = userEvent.setup()
    await bukaDetail()

    const tabInfo = within(tablist()).getByRole('tab', { name: 'Info' })
    tabInfo.focus()

    await user.keyboard('{ArrowRight}')
    expect(within(tablist()).getByRole('tab', { selected: true })).toHaveTextContent('Tim')

    await user.keyboard('{End}')
    expect(within(tablist()).getByRole('tab', { selected: true })).toHaveTextContent('Hasil')

    await user.keyboard('{Home}')
    expect(within(tablist()).getByRole('tab', { selected: true })).toHaveTextContent('Info')
  })
})

describe('Detail lomba - pelaporan hasil', () => {
  /** Menggeser seluruh tahapan ke masa lalu agar pelaporan terbuka. */
  async function bukaPelaporan(idLomba = 'lomba-01') {
    await perbaruiLomba(
      idLomba,
      {
        tahapan: [
          { jenis: 'pendaftaran', tanggalMulai: '2026-06-01', tanggalSelesai: '2026-06-20' },
          { jenis: 'final', tanggalMulai: '2026-08-10' },
          { jenis: 'pengumuman', tanggalMulai: '2026-08-15' },
        ],
      },
      { acuan: ACUAN_UJI },
    )
  }

  it('menahan formulir bila tanggal pengumuman belum lewat', async () => {
    const user = userEvent.setup()
    await bukaDetail()

    await user.click(within(tablist()).getByRole('tab', { name: 'Hasil' }))

    expect(screen.getByText('Belum bisa melaporkan hasil')).toBeInTheDocument()
    expect(
      screen.getByText('Pelaporan hasil dibuka setelah tanggal pengumuman pemenang.'),
    ).toBeInTheDocument()
    expect(screen.queryByLabelText(/Capaian Akhir/)).not.toBeInTheDocument()
  })

  it('menampilkan formulir setelah tanggal pengumuman lewat', async () => {
    const user = userEvent.setup()
    await bukaPelaporan()
    await bukaDetail()

    await user.click(within(tablist()).getByRole('tab', { name: 'Hasil' }))

    expect(screen.getByLabelText(/Capaian Akhir/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Sertifikat/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Foto Dokumentasi/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Tautan Berita/)).toBeInTheDocument()
  })

  it('mewajibkan capaian dan sertifikat', async () => {
    const user = userEvent.setup()
    await bukaPelaporan()
    await bukaDetail()

    await user.click(within(tablist()).getByRole('tab', { name: 'Hasil' }))
    await user.click(screen.getByRole('button', { name: /Simpan laporan hasil/ }))

    expect(screen.getByText('Capaian akhir wajib dipilih.')).toBeInTheDocument()
    expect(
      screen.getByText('Sertifikat wajib diunggah sebagai bukti capaian.'),
    ).toBeInTheDocument()
  })

  it('menolak tautan berita tanpa skema http', async () => {
    const user = userEvent.setup()
    await bukaPelaporan()
    await bukaDetail()

    await user.click(within(tablist()).getByRole('tab', { name: 'Hasil' }))
    await user.selectOptions(screen.getByLabelText(/Capaian Akhir/), 'juara_2')
    await user.upload(
      screen.getByLabelText(/Sertifikat/),
      buatBerkas('sertifikat.pdf', 'application/pdf'),
    )
    await user.type(screen.getByLabelText(/Tautan Berita/), 'contoh.id/berita')
    await user.click(screen.getByRole('button', { name: /Simpan laporan hasil/ }))

    expect(
      screen.getByText('Tautan harus dimulai dengan http:// atau https://'),
    ).toBeInTheDocument()
  })

  it('menyimpan Juara 2 beserta sertifikat lalu mengubah status menjadi selesai', async () => {
    const user = userEvent.setup()
    await bukaPelaporan()
    await bukaDetail()

    await user.click(within(tablist()).getByRole('tab', { name: 'Hasil' }))
    await user.selectOptions(screen.getByLabelText(/Capaian Akhir/), 'juara_2')
    await user.upload(
      screen.getByLabelText(/Sertifikat/),
      buatBerkas('sertifikat.pdf', 'application/pdf'),
    )
    await user.type(screen.getByLabelText(/Tautan Berita/), 'https://contoh.id/juara')
    await user.click(screen.getByRole('button', { name: /Simpan laporan hasil/ }))

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Hasil lomba tersimpan'),
    )

    // Panel hasil berganti menjadi ringkasan capaian.
    expect(await screen.findByText('Capaian akhir')).toBeInTheDocument()
    expect(screen.getAllByText('Juara 2').length).toBeGreaterThan(0)
    expect(screen.getByText('https://contoh.id/juara')).toBeInTheDocument()

    const tersimpan = await detailLomba('lomba-01', { acuan: ACUAN_UJI })
    expect(tersimpan.status).toBe('selesai')
    expect(tersimpan.hasil.capaian).toBe('juara_2')
    expect(tersimpan.berkas.some((berkas) => berkas.tipe === 'sertifikat')).toBe(true)
  })

  it('menampilkan ringkasan hasil untuk lomba yang sudah dilaporkan', async () => {
    const user = userEvent.setup()
    await bukaDetail('lomba-04', buatSesi('mhs-5'))

    await user.click(within(tablist()).getByRole('tab', { name: 'Hasil' }))

    expect(screen.getByText('Capaian akhir')).toBeInTheDocument()
    expect(screen.getAllByText('Juara 2').length).toBeGreaterThan(0)
    expect(screen.getByText('Dilaporkan pada')).toBeInTheDocument()
    expect(screen.getByText('Bukti prestasi')).toBeInTheDocument()
    expect(screen.queryByLabelText(/Capaian Akhir/)).not.toBeInTheDocument()
  })
})
