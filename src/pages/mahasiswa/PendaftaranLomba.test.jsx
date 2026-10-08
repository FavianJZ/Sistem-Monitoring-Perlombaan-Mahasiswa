import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ACUAN_UJI, SESI_MAHASISWA, renderApp } from '@/test/utils'
import { daftarLomba, resetDataMock } from '@/services/competitionService'
import { kunciDraft } from '@/features/pendaftaran/draft'

beforeEach(() => {
  resetDataMock(ACUAN_UJI)
})

function renderWizard() {
  return renderApp('/lomba-saya/baru', { sesi: SESI_MAHASISWA() })
}

function draftTersimpan() {
  const mentah = window.localStorage.getItem(kunciDraft('mhs-1'))
  return mentah ? JSON.parse(mentah) : null
}

function buatBerkas(nama, tipe, ukuran) {
  const file = new File(['x'], nama, { type: tipe })
  Object.defineProperty(file, 'size', { value: ukuran })
  return file
}

function berkasPdf(nama, ukuran = 1024 * 200) {
  return buatBerkas(nama, 'application/pdf', ukuran)
}

function berkasGambar(nama, ukuran = 1024 * 300) {
  return buatBerkas(nama, 'image/png', ukuran)
}

async function isiDetailUmum(user, { jenis = 'individu', namaTim } = {}) {
  await user.type(screen.getByLabelText(/Nama Perlombaan/), 'Olimpiade Statistika Nasional')
  await user.type(screen.getByLabelText(/Instansi Penyelenggara/), 'Institut Teknologi Bandung')
  await user.selectOptions(screen.getByLabelText(/Bidang Lomba/), 'Riset')
  await user.selectOptions(screen.getByLabelText(/Tingkat Lomba/), 'Nasional')

  if (jenis === 'tim') {
    await user.click(screen.getByRole('radio', { name: /Tim \/ Kelompok/ }))
    if (namaTim) await user.type(screen.getByLabelText(/Nama Tim/), namaTim)
  }
}

describe('Wizard pendaftaran - langkah 1', () => {
  it('menampilkan stepper dengan langkah pertama aktif', () => {
    renderWizard()

    const stepper = screen.getByRole('navigation', { name: 'Langkah pendaftaran' })
    expect(within(stepper).getByRole('button', { current: 'step' })).toHaveTextContent(
      'Detail Umum',
    )
    expect(screen.getByText('Langkah 1 dari 4: Detail Umum')).toBeInTheDocument()
  })

  it('menyembunyikan langkah anggota tim untuk lomba perorangan', () => {
    renderWizard()

    const stepper = screen.getByRole('navigation', { name: 'Langkah pendaftaran' })
    expect(within(stepper).queryByText('Anggota Tim')).not.toBeInTheDocument()
  })

  it('menampilkan langkah anggota tim setelah jenis diubah menjadi kelompok', async () => {
    const user = userEvent.setup()
    renderWizard()

    await user.click(screen.getByRole('radio', { name: /Tim \/ Kelompok/ }))

    const stepper = screen.getByRole('navigation', { name: 'Langkah pendaftaran' })
    expect(within(stepper).getByText('Anggota Tim')).toBeInTheDocument()
    expect(screen.getByText('Langkah 1 dari 5: Detail Umum')).toBeInTheDocument()
  })

  it('memunculkan field nama tim hanya untuk lomba kelompok', async () => {
    const user = userEvent.setup()
    renderWizard()

    expect(screen.queryByLabelText(/Nama Tim/)).not.toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: /Tim \/ Kelompok/ }))
    expect(screen.getByLabelText(/Nama Tim/)).toBeInTheDocument()
  })

  it('menahan perpindahan langkah bila field wajib belum diisi', async () => {
    const user = userEvent.setup()
    renderWizard()

    await user.click(screen.getByRole('button', { name: /Lanjut/ }))

    expect(screen.getByText('Nama perlombaan wajib diisi.')).toBeInTheDocument()
    expect(screen.getByText('Instansi penyelenggara wajib diisi.')).toBeInTheDocument()
    expect(screen.getByText('Bidang lomba wajib dipilih.')).toBeInTheDocument()
    expect(screen.getByText('Tingkat lomba wajib dipilih.')).toBeInTheDocument()
    expect(screen.getByText('Langkah 1 dari 4: Detail Umum')).toBeInTheDocument()
  })

  it('memberi notifikasi saat validasi gagal', async () => {
    const user = userEvent.setup()
    renderWizard()

    await user.click(screen.getByRole('button', { name: /Lanjut/ }))

    expect(await screen.findByRole('status')).toHaveTextContent('Ada data yang perlu diperbaiki')
  })

  it('melanjutkan ke langkah bukti bila lomba perorangan sudah lengkap', async () => {
    const user = userEvent.setup()
    renderWizard()

    await isiDetailUmum(user)
    await user.click(screen.getByRole('button', { name: /Lanjut/ }))

    expect(screen.getByText('Langkah 2 dari 4: Bukti Pendaftaran')).toBeInTheDocument()
  })

  it('memuat daftar dosen pembimbing dari service', async () => {
    renderWizard()

    const pilihan = screen.getByLabelText(/Dosen Pembimbing/)
    await waitFor(() =>
      expect(within(pilihan).getByRole('option', { name: /Pandu Wicaksono/ })).toBeInTheDocument(),
    )
  })
})

describe('Wizard pendaftaran - langkah 2 anggota tim', () => {
  async function keLangkahAnggota(user) {
    renderWizard()
    await isiDetailUmum(user, { jenis: 'tim', namaTim: 'Angka Bicara' })
    await user.click(screen.getByRole('button', { name: /Lanjut/ }))
  }

  function barisAnggota() {
    return within(screen.getByRole('list', { name: 'Susunan anggota tim' })).getAllByRole(
      'listitem',
    )
  }

  it('mengisi ketua tim otomatis dari akun yang masuk dan menguncinya', async () => {
    const user = userEvent.setup()
    await keLangkahAnggota(user)

    expect(screen.getByText('Ketua Tim')).toBeInTheDocument()

    const barisKetua = within(barisAnggota()[0])
    expect(barisKetua.getByLabelText('NIM')).toHaveValue('2502019876')
    expect(barisKetua.getByLabelText('NIM')).toBeDisabled()
    expect(barisKetua.getByLabelText('Nama Lengkap')).toHaveValue('Aulia Rahmawati')
  })

  it('menolak lanjut bila tim hanya berisi ketua', async () => {
    const user = userEvent.setup()
    await keLangkahAnggota(user)

    await user.click(screen.getByRole('button', { name: /Lanjut/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent('minimal satu anggota selain ketua')
  })

  it('menambah dan menghapus baris anggota', async () => {
    const user = userEvent.setup()
    await keLangkahAnggota(user)

    await user.click(screen.getByRole('button', { name: 'Tambah anggota' }))
    expect(barisAnggota()).toHaveLength(2)

    await user.click(screen.getByRole('button', { name: 'Tambah anggota' }))
    expect(barisAnggota()).toHaveLength(3)

    await user.click(screen.getByRole('button', { name: 'Hapus anggota 2' }))
    expect(barisAnggota()).toHaveLength(2)
  })

  it('hanya menerima angka pada kolom NIM', async () => {
    const user = userEvent.setup()
    await keLangkahAnggota(user)
    await user.click(screen.getByRole('button', { name: 'Tambah anggota' }))

    const baris = within(barisAnggota()[1])
    await user.type(baris.getByLabelText(/NIM/), 'ab2502-021111xyz')

    expect(baris.getByLabelText(/NIM/)).toHaveValue('2502021111')
  })

  it('menandai NIM yang kurang dari sepuluh angka', async () => {
    const user = userEvent.setup()
    await keLangkahAnggota(user)
    await user.click(screen.getByRole('button', { name: 'Tambah anggota' }))

    const baris = within(barisAnggota()[1])
    await user.type(baris.getByLabelText(/NIM/), '25020')
    await user.type(baris.getByLabelText(/Nama Lengkap/), 'Gilang Ramadhan')
    await user.selectOptions(baris.getByLabelText(/Program Studi/), 'Sistem Informasi')

    await user.click(screen.getByRole('button', { name: /Lanjut/ }))

    expect(screen.getByText('NIM harus 10 angka.')).toBeInTheDocument()
  })

  it('melanjutkan bila anggota tambahan sudah lengkap', async () => {
    const user = userEvent.setup()
    await keLangkahAnggota(user)
    await user.click(screen.getByRole('button', { name: 'Tambah anggota' }))

    const baris = within(barisAnggota()[1])
    await user.type(baris.getByLabelText(/NIM/), '2502021111')
    await user.type(baris.getByLabelText(/Nama Lengkap/), 'Gilang Ramadhan')
    await user.selectOptions(baris.getByLabelText(/Program Studi/), 'Sistem Informasi')

    await user.click(screen.getByRole('button', { name: /Lanjut/ }))

    expect(screen.getByText('Langkah 3 dari 5: Bukti Pendaftaran')).toBeInTheDocument()
  })

  it('bisa kembali ke langkah sebelumnya lewat tombol dan stepper', async () => {
    const user = userEvent.setup()
    await keLangkahAnggota(user)

    await user.click(screen.getByRole('button', { name: /Sebelumnya/ }))
    expect(screen.getByText('Langkah 1 dari 5: Detail Umum')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Lanjut/ }))
    const stepper = screen.getByRole('navigation', { name: 'Langkah pendaftaran' })
    await user.click(within(stepper).getByRole('button', { name: /Detail Umum/ }))

    expect(screen.getByText('Langkah 1 dari 5: Detail Umum')).toBeInTheDocument()
  })
})

describe('Autosave draft', () => {
  it('menyimpan isian ke peramban sambil diketik', async () => {
    const user = userEvent.setup()
    renderWizard()

    await user.type(screen.getByLabelText(/Nama Perlombaan/), 'Olimpiade Statistika')

    await waitFor(() => expect(draftTersimpan()?.nama).toBe('Olimpiade Statistika'))
  })

  it('memulihkan isian dan posisi langkah setelah halaman dimuat ulang', async () => {
    const user = userEvent.setup()
    const { unmount } = renderWizard()

    await isiDetailUmum(user)
    await user.click(screen.getByRole('button', { name: /Lanjut/ }))
    expect(screen.getByText('Langkah 2 dari 4: Bukti Pendaftaran')).toBeInTheDocument()

    unmount()
    renderWizard()

    expect(screen.getByText('Langkah 2 dari 4: Bukti Pendaftaran')).toBeInTheDocument()
    expect(screen.getByText('Draft sebelumnya dilanjutkan')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Sebelumnya/ }))
    expect(screen.getByLabelText(/Nama Perlombaan/)).toHaveValue('Olimpiade Statistika Nasional')
  })

  it('tidak memberi tahu apa pun bila belum ada draft', () => {
    renderWizard()
    expect(screen.queryByText('Draft sebelumnya dilanjutkan')).not.toBeInTheDocument()
  })

  it('mengosongkan draft setelah dikonfirmasi', async () => {
    const user = userEvent.setup()
    renderWizard()

    await user.type(screen.getByLabelText(/Nama Perlombaan/), 'Olimpiade Statistika')
    await waitFor(() => expect(draftTersimpan()?.nama).toBe('Olimpiade Statistika'))

    await user.click(screen.getByRole('button', { name: 'Kosongkan draft' }))
    await user.click(screen.getByRole('button', { name: 'Kosongkan' }))

    expect(screen.getByLabelText(/Nama Perlombaan/)).toHaveValue('')
    await waitFor(() => expect(draftTersimpan()).toBeNull())
  })

  it('membatalkan pengosongan draft tidak mengubah isian', async () => {
    const user = userEvent.setup()
    renderWizard()

    await user.type(screen.getByLabelText(/Nama Perlombaan/), 'Olimpiade Statistika')
    await user.click(screen.getByRole('button', { name: 'Kosongkan draft' }))
    await user.click(screen.getByRole('button', { name: 'Batal' }))

    expect(screen.getByLabelText(/Nama Perlombaan/)).toHaveValue('Olimpiade Statistika')
  })
})

describe('Wizard pendaftaran - langkah 3 bukti', () => {
  async function keLangkahBukti(user) {
    renderWizard()
    await isiDetailUmum(user)
    await user.click(screen.getByRole('button', { name: /Lanjut/ }))
  }

  it('menampilkan dua unggahan wajib', async () => {
    const user = userEvent.setup()
    await keLangkahBukti(user)

    expect(screen.getByLabelText(/Bukti Pendaftaran Resmi/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Bukti Pembayaran/)).toBeInTheDocument()
    expect(screen.getAllByText('PDF, JPG, atau PNG maksimal 5MB').length).toBe(2)
  })

  it('menolak lanjut bila bukti belum diunggah', async () => {
    const user = userEvent.setup()
    await keLangkahBukti(user)

    await user.click(screen.getByRole('button', { name: /Lanjut/ }))

    expect(screen.getByText('Bukti pendaftaran resmi wajib diunggah.')).toBeInTheDocument()
    expect(
      screen.getByText('Bukti pembayaran atau konfirmasi keikutsertaan wajib diunggah.'),
    ).toBeInTheDocument()
  })

  it('melanjutkan setelah kedua bukti diunggah dan menyimpannya ke draft', async () => {
    const user = userEvent.setup()
    await keLangkahBukti(user)

    await user.upload(screen.getByLabelText(/Bukti Pendaftaran Resmi/), berkasPdf('daftar.pdf'))
    await user.upload(screen.getByLabelText(/Bukti Pembayaran/), berkasPdf('bayar.pdf'))

    expect(screen.getByText('daftar.pdf')).toBeInTheDocument()
    expect(screen.getByText('bayar.pdf')).toBeInTheDocument()

    await waitFor(() => expect(draftTersimpan()?.berkas?.bukti_daftar?.namaFile).toBe('daftar.pdf'))

    await user.click(screen.getByRole('button', { name: /Lanjut/ }))
    expect(screen.getByText('Langkah 3 dari 4: Poster & Publikasi')).toBeInTheDocument()
  })

  it('menolak berkas yang melebihi 5MB', async () => {
    const user = userEvent.setup()
    await keLangkahBukti(user)

    await user.upload(
      screen.getByLabelText(/Bukti Pendaftaran Resmi/),
      berkasPdf('besar.pdf', 10 * 1024 * 1024),
    )

    expect(screen.getByText(/melebihi batas 5 MB/)).toBeInTheDocument()
    expect(screen.queryByText('besar.pdf')).not.toBeInTheDocument()
  })

  it('berkas yang sudah diunggah bisa dihapus kembali', async () => {
    const user = userEvent.setup()
    await keLangkahBukti(user)

    await user.upload(screen.getByLabelText(/Bukti Pendaftaran Resmi/), berkasPdf('daftar.pdf'))
    expect(screen.getByText('daftar.pdf')).toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: /Hapus/ })[0])

    expect(screen.queryByText('daftar.pdf')).not.toBeInTheDocument()
    await waitFor(() => expect(draftTersimpan()?.berkas?.bukti_daftar).toBeUndefined())
  })
})

describe('Wizard pendaftaran - langkah 4 poster', () => {
  async function keLangkahPoster(user) {
    renderWizard()
    await isiDetailUmum(user)
    await user.click(screen.getByRole('button', { name: /Lanjut/ }))
    await user.upload(screen.getByLabelText(/Bukti Pendaftaran Resmi/), berkasPdf('daftar.pdf'))
    await user.upload(screen.getByLabelText(/Bukti Pembayaran/), berkasPdf('bayar.pdf'))
    await user.click(screen.getByRole('button', { name: /Lanjut/ }))
  }

  it('menawarkan dua cara melampirkan publikasi', async () => {
    const user = userEvent.setup()
    await keLangkahPoster(user)

    const grup = screen.getByRole('group', { name: 'Cara melampirkan publikasi lomba' })
    expect(within(grup).getByRole('button', { name: /Unggah poster/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(within(grup).getByRole('button', { name: /Cantumkan tautan/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('berganti ke mode tautan dan menampilkan input url', async () => {
    const user = userEvent.setup()
    await keLangkahPoster(user)

    await user.click(screen.getByRole('button', { name: /Cantumkan tautan/ }))

    expect(screen.getByLabelText(/Tautan Publikasi Lomba/)).toBeInTheDocument()
    expect(screen.queryByLabelText(/Poster Perlombaan/)).not.toBeInTheDocument()
  })

  it('menolak lanjut bila poster dan tautan sama-sama kosong', async () => {
    const user = userEvent.setup()
    await keLangkahPoster(user)

    await user.click(screen.getByRole('button', { name: /Lanjut/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unggah poster lomba atau cantumkan tautan publikasi resminya.',
    )
  })

  it('menolak tautan tanpa skema http', async () => {
    const user = userEvent.setup()
    await keLangkahPoster(user)

    await user.click(screen.getByRole('button', { name: /Cantumkan tautan/ }))
    await user.type(screen.getByLabelText(/Tautan Publikasi Lomba/), 'gemastik.id')
    await user.click(screen.getByRole('button', { name: /Lanjut/ }))

    expect(screen.getByText('Tautan harus dimulai dengan http:// atau https://')).toBeInTheDocument()
  })

  it('menerima poster berupa gambar dan melanjutkan ke timeline', async () => {
    const user = userEvent.setup()
    await keLangkahPoster(user)

    await user.upload(
      screen.getByLabelText(/Poster Perlombaan/),
      berkasGambar('poster.png', 1024 * 512),
    )
    await user.click(screen.getByRole('button', { name: /Lanjut/ }))

    expect(screen.getByText('Langkah 4 dari 4: Timeline')).toBeInTheDocument()
  })

  it('menerima tautan yang sah dan melanjutkan ke timeline', async () => {
    const user = userEvent.setup()
    await keLangkahPoster(user)

    await user.click(screen.getByRole('button', { name: /Cantumkan tautan/ }))
    await user.type(screen.getByLabelText(/Tautan Publikasi Lomba/), 'https://gemastik.id')
    await user.click(screen.getByRole('button', { name: /Lanjut/ }))

    expect(screen.getByText('Langkah 4 dari 4: Timeline')).toBeInTheDocument()
  })

  it('memberi tahu bahwa poster tetap tersimpan saat berpindah ke mode tautan', async () => {
    const user = userEvent.setup()
    await keLangkahPoster(user)

    await user.upload(screen.getByLabelText(/Poster Perlombaan/), berkasGambar('poster.png'))
    await user.click(screen.getByRole('button', { name: /Cantumkan tautan/ }))

    expect(screen.getByText(/Poster tersimpan:/)).toBeInTheDocument()
  })
})

function isiTanggal(input, nilai) {
  fireEvent.change(input, { target: { value: nilai } })
}

async function keLangkahTimeline(user) {
  renderWizard()
  await isiDetailUmum(user)
  await user.click(screen.getByRole('button', { name: /Lanjut/ }))
  await user.upload(screen.getByLabelText(/Bukti Pendaftaran Resmi/), berkasPdf('daftar.pdf'))
  await user.upload(screen.getByLabelText(/Bukti Pembayaran/), berkasPdf('bayar.pdf'))
  await user.click(screen.getByRole('button', { name: /Lanjut/ }))
  await user.click(screen.getByRole('button', { name: /Cantumkan tautan/ }))
  await user.type(screen.getByLabelText(/Tautan Publikasi Lomba/), 'https://itb.ac.id')
  await user.click(screen.getByRole('button', { name: /Lanjut/ }))
}

function barisTahapan() {
  return within(screen.getByRole('list', { name: 'Tahapan perlombaan' })).getAllByRole('listitem')
}

describe('Wizard pendaftaran - langkah 5 timeline', () => {
  it('menampilkan enam tahapan bawaan sesuai PRD', async () => {
    const user = userEvent.setup()
    await keLangkahTimeline(user)

    expect(screen.getByText('Langkah 4 dari 4: Timeline')).toBeInTheDocument()
    expect(barisTahapan()).toHaveLength(6)

    for (const label of [
      'Pendaftaran',
      'Technical Meeting',
      'Penyisihan / Pengumpulan Karya',
      'Semifinal',
      'Final',
      'Pengumuman Pemenang',
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })

  it('memberi rentang tanggal hanya pada tahapan yang membutuhkannya', async () => {
    const user = userEvent.setup()
    await keLangkahTimeline(user)

    const pendaftaran = within(barisTahapan()[0])
    expect(pendaftaran.getByLabelText('Tanggal Mulai')).toBeInTheDocument()
    expect(pendaftaran.getByLabelText('Tanggal Selesai')).toBeInTheDocument()

    const technicalMeeting = within(barisTahapan()[1])
    expect(technicalMeeting.getByLabelText('Tanggal')).toBeInTheDocument()
    expect(technicalMeeting.queryByLabelText('Tanggal Selesai')).not.toBeInTheDocument()
  })

  it('menolak tinjauan bila seluruh tanggal masih kosong', async () => {
    const user = userEvent.setup()
    await keLangkahTimeline(user)

    await user.click(screen.getByRole('button', { name: /Tinjau & Simpan/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Isi minimal satu tanggal tahapan supaya lomba bisa dipantau.',
    )
  })

  it('menolak tanggal selesai yang lebih awal dari tanggal mulai', async () => {
    const user = userEvent.setup()
    await keLangkahTimeline(user)

    const pendaftaran = within(barisTahapan()[0])
    isiTanggal(pendaftaran.getByLabelText('Tanggal Mulai'), '2026-10-20')
    isiTanggal(pendaftaran.getByLabelText('Tanggal Selesai'), '2026-10-01')

    await user.click(screen.getByRole('button', { name: /Tinjau & Simpan/ }))

    expect(
      screen.getByText('Tanggal selesai tidak boleh sebelum tanggal mulai.'),
    ).toBeInTheDocument()
  })

  it('menambah dan menghapus tahapan tambahan', async () => {
    const user = userEvent.setup()
    await keLangkahTimeline(user)

    await user.click(screen.getByRole('button', { name: 'Tambah tahapan lain' }))
    expect(barisTahapan()).toHaveLength(7)
    expect(screen.getByText('Tambahan')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Hapus Tahapan tambahan/ }))
    expect(barisTahapan()).toHaveLength(6)
  })

  it('meminta nama untuk tahapan tambahan yang sudah diberi tanggal', async () => {
    const user = userEvent.setup()
    await keLangkahTimeline(user)

    await user.click(screen.getByRole('button', { name: 'Tambah tahapan lain' }))
    isiTanggal(within(barisTahapan()[6]).getByLabelText('Tanggal Mulai'), '2026-11-20')

    await user.click(screen.getByRole('button', { name: /Tinjau & Simpan/ }))

    expect(screen.getByText('Beri nama tahapan tambahan ini.')).toBeInTheDocument()
  })

  it('mengizinkan tahapan yang tidak relevan dibiarkan kosong', async () => {
    const user = userEvent.setup()
    await keLangkahTimeline(user)

    isiTanggal(within(barisTahapan()[0]).getByLabelText('Tanggal Mulai'), '2026-10-01')
    await user.click(screen.getByRole('button', { name: /Tinjau & Simpan/ }))

    expect(screen.getByText('Tinjau sebelum disimpan')).toBeInTheDocument()
  })
})

describe('Tinjauan dan penyimpanan', () => {
  async function keTinjauan(user) {
    await keLangkahTimeline(user)
    isiTanggal(within(barisTahapan()[0]).getByLabelText('Tanggal Mulai'), '2026-10-01')
    isiTanggal(within(barisTahapan()[0]).getByLabelText('Tanggal Selesai'), '2026-10-20')
    isiTanggal(within(barisTahapan()[4]).getByLabelText('Tanggal'), '2026-11-15')
    await user.click(screen.getByRole('button', { name: /Tinjau & Simpan/ }))
  }

  it('menampilkan ringkasan seluruh isian', async () => {
    const user = userEvent.setup()
    await keTinjauan(user)

    for (const judul of ['Detail Umum', 'Bukti dan Publikasi', 'Timeline']) {
      expect(screen.getByRole('heading', { level: 3, name: judul })).toBeInTheDocument()
    }

    expect(screen.getByText('Olimpiade Statistika Nasional')).toBeInTheDocument()
    expect(screen.getByText('Institut Teknologi Bandung')).toBeInTheDocument()
    expect(screen.getByText('daftar.pdf - 200 KB')).toBeInTheDocument()
    expect(screen.getByText('https://itb.ac.id')).toBeInTheDocument()
  })

  it('hanya menampilkan tahapan yang terisi pada ringkasan', async () => {
    const user = userEvent.setup()
    await keTinjauan(user)

    const ringkasan = within(screen.getByRole('list', { name: 'Ringkasan timeline' }))
    expect(ringkasan.getAllByRole('listitem')).toHaveLength(2)
    expect(ringkasan.getByText('Pendaftaran')).toBeInTheDocument()
    expect(ringkasan.getByText('Final')).toBeInTheDocument()
    expect(ringkasan.queryByText('Semifinal')).not.toBeInTheDocument()
  })

  it('tombol Ubah membawa kembali ke langkah yang bersangkutan', async () => {
    const user = userEvent.setup()
    await keTinjauan(user)

    const bagianDetail = screen
      .getByRole('heading', { level: 3, name: 'Detail Umum' })
      .closest('section')
    await user.click(within(bagianDetail).getByRole('button', { name: /Ubah/ }))

    expect(screen.getByText('Langkah 1 dari 4: Detail Umum')).toBeInTheDocument()
    expect(screen.getByLabelText(/Nama Perlombaan/)).toHaveValue('Olimpiade Statistika Nasional')
  })

  it('tombol kembali mengubah keluar dari tinjauan', async () => {
    const user = userEvent.setup()
    await keTinjauan(user)

    await user.click(screen.getByRole('button', { name: /Kembali mengubah/ }))

    expect(screen.getByText('Langkah 4 dari 4: Timeline')).toBeInTheDocument()
  })

  it('menyimpan pendaftaran lalu mengarahkan ke daftar lomba', async () => {
    const user = userEvent.setup()
    await keTinjauan(user)

    await user.click(screen.getByRole('button', { name: /Simpan pendaftaran/ }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Lomba Saya' })).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByText('Menampilkan 1-6 dari 6 lomba')).toBeInTheDocument(),
    )
    expect(screen.getByText('Olimpiade Statistika Nasional')).toBeInTheDocument()
  })

  it('memberi notifikasi sukses dan mengosongkan draft setelah tersimpan', async () => {
    const user = userEvent.setup()
    await keTinjauan(user)

    await user.click(screen.getByRole('button', { name: /Simpan pendaftaran/ }))

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Pendaftaran lomba tersimpan'),
    )
    expect(draftTersimpan()).toBeNull()
  })

  it('data yang disimpan lengkap beserta berkas dan tahapannya', async () => {
    const user = userEvent.setup()
    await keTinjauan(user)

    await user.click(screen.getByRole('button', { name: /Simpan pendaftaran/ }))
    await screen.findByRole('heading', { level: 1, name: 'Lomba Saya' })

    const halaman = await daftarLomba(
      { createdBy: 'mhs-1', search: 'Olimpiade Statistika', pageSize: 5 },
      { acuan: ACUAN_UJI },
    )
    const tersimpan = halaman.items[0]

    expect(tersimpan.penyelenggara).toBe('Institut Teknologi Bandung')
    expect(tersimpan.bidang).toBe('Riset')
    expect(tersimpan.tingkat).toBe('Nasional')
    expect(tersimpan.jenis).toBe('individu')
    expect(tersimpan.linkPublikasi).toBe('https://itb.ac.id')
    expect(tersimpan.anggota).toHaveLength(1)
    expect(tersimpan.berkas.map((berkas) => berkas.tipe)).toEqual(['bukti_daftar', 'bukti_bayar'])
    expect(tersimpan.kelengkapan.lengkap).toBe(true)
    expect(tersimpan.tahapan).toHaveLength(2)
    expect(tersimpan.status).toBe('terdaftar')
  })
})
