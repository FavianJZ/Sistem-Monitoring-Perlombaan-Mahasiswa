import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ACUAN_UJI, SESI_DOSEN, alamatSekarang, renderApp } from '@/test/utils'
import { resetDataMock } from '@/services/competitionService'

beforeEach(() => {
  resetDataMock(ACUAN_UJI)
})

async function bukaMonitoring(alamat = '/monitoring/lomba') {
  renderApp(alamat, { sesi: SESI_DOSEN() })
  await screen.findByRole('group', { name: 'Mode filter waktu' })
}

function jumlahKartu() {
  return screen.queryAllByRole('article').length
}

async function pindahKeTabel(user) {
  await user.click(screen.getByRole('button', { name: /Tabel/ }))
  return screen.findByRole('table', { name: 'Daftar lomba yang dipantau' })
}

describe('Monitoring Lomba - tampilan', () => {
  it('menampilkan kartu lomba beserta jumlah totalnya', async () => {
    await bukaMonitoring()

    await waitFor(() => expect(jumlahKartu()).toBe(9))
    expect(screen.getByText('Menampilkan 1-9 dari 20 lomba')).toBeInTheDocument()
  })

  it('bisa berganti ke tampilan tabel', async () => {
    const user = userEvent.setup()
    await bukaMonitoring()
    await waitFor(() => expect(jumlahKartu()).toBe(9))

    const tabel = await pindahKeTabel(user)

    expect(jumlahKartu()).toBe(0)
    expect(within(tabel).getAllByRole('row')).toHaveLength(10)
  })

  it('menyimpan bentuk tampilan pada alamat halaman', async () => {
    await bukaMonitoring('/monitoring/lomba?tampilan=tabel')

    expect(await screen.findByRole('table', { name: 'Daftar lomba yang dipantau' })).toBeInTheDocument()
    expect(jumlahKartu()).toBe(0)
  })

  it('berpindah halaman lewat paginasi', async () => {
    const user = userEvent.setup()
    await bukaMonitoring()
    await waitFor(() => expect(jumlahKartu()).toBe(9))

    await user.click(screen.getByRole('button', { name: /Berikutnya/ }))

    await waitFor(() =>
      expect(screen.getByText('Menampilkan 10-18 dari 20 lomba')).toBeInTheDocument(),
    )
  })
})

describe('Monitoring Lomba - filter waktu', () => {
  it('membaca mode dari alamat halaman', async () => {
    await bukaMonitoring('/monitoring/lomba?mode=bulan-ini')

    const grup = screen.getByRole('group', { name: 'Mode filter waktu' })
    expect(within(grup).getByRole('button', { name: /Bulan ini/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    await waitFor(() =>
      expect(screen.getByText('Menampilkan 1-9 dari 11 lomba')).toBeInTheDocument(),
    )
  })

  it('mode tanggal menampilkan input tanggal dan menyaring berdasarkan hari itu', async () => {
    const user = userEvent.setup()
    await bukaMonitoring()

    await user.click(screen.getByRole('button', { name: /Tanggal tertentu/ }))
    isiTanggal(screen.getByLabelText('Tanggal'), '2026-09-24')

    await waitFor(() => expect(jumlahKartu()).toBeGreaterThan(0))
    const teks = screen.getAllByRole('article').map((node) => node.textContent).join(' ')
    expect(teks).toContain('Startup Pitch Day Binus Incubator')
  })

  it('mode rentang menampilkan dua input tanggal', async () => {
    const user = userEvent.setup()
    await bukaMonitoring()

    await user.click(screen.getByRole('button', { name: /Rentang kustom/ }))

    expect(screen.getByLabelText('Dari tanggal')).toBeInTheDocument()
    expect(screen.getByLabelText('Sampai tanggal')).toBeInTheDocument()

    isiTanggal(screen.getByLabelText('Dari tanggal'), '2026-12-01')
    isiTanggal(screen.getByLabelText('Sampai tanggal'), '2026-12-31')

    await waitFor(() =>
      expect(screen.getByText(/Menampilkan 1-\d+ dari \d+ lomba/)).toBeInTheDocument(),
    )
  })

  it('menyimpan seluruh kriteria filter pada alamat halaman', async () => {
    const user = userEvent.setup()
    await bukaMonitoring()

    await user.click(screen.getByRole('button', { name: /Bulan ini/ }))
    await user.selectOptions(screen.getByLabelText('Bidang'), 'Programming')

    await waitFor(() => expect(alamatSekarang(screen)).toContain('mode=bulan-ini'))
    expect(alamatSekarang(screen)).toContain('bidang=Programming')
  })
})

describe('Monitoring Lomba - filter kategori', () => {
  it('menyaring berdasarkan bidang', async () => {
    const user = userEvent.setup()
    await bukaMonitoring()

    await user.selectOptions(screen.getByLabelText('Bidang'), 'Olahraga')

    await waitFor(() =>
      expect(screen.getByText('Menampilkan 1-2 dari 2 lomba')).toBeInTheDocument(),
    )
  })

  it('menyaring berdasarkan tingkat', async () => {
    const user = userEvent.setup()
    await bukaMonitoring()

    await user.selectOptions(screen.getByLabelText('Tingkat'), 'Internasional')

    await waitFor(() =>
      expect(screen.getByText('Menampilkan 1-3 dari 3 lomba')).toBeInTheDocument(),
    )
  })

  it('menyaring berdasarkan status hasil', async () => {
    const user = userEvent.setup()
    await bukaMonitoring()

    await user.selectOptions(screen.getByLabelText('Hasil'), 'juara_1')

    await waitFor(() =>
      expect(screen.getByText('Menampilkan 1-2 dari 2 lomba')).toBeInTheDocument(),
    )
  })

  it('menyaring lomba yang hasilnya belum dilaporkan', async () => {
    const user = userEvent.setup()
    await bukaMonitoring()

    await user.selectOptions(screen.getByLabelText('Hasil'), 'belum')

    await waitFor(() =>
      expect(screen.getByText('Menampilkan 1-9 dari 12 lomba')).toBeInTheDocument(),
    )
  })

  it('menyaring berdasarkan jenis tahapan', async () => {
    const user = userEvent.setup()
    await bukaMonitoring()

    await user.selectOptions(screen.getByLabelText('Jenis tahapan'), 'semifinal')

    await waitFor(() =>
      expect(screen.getByText('Menampilkan 1-7 dari 7 lomba')).toBeInTheDocument(),
    )
  })

  it('menyaring berdasarkan program studi anggota', async () => {
    const user = userEvent.setup()
    await bukaMonitoring()

    await user.selectOptions(screen.getByLabelText('Program studi'), 'Manajemen')

    await waitFor(() =>
      expect(screen.getByText(/Menampilkan 1-\d+ dari \d+ lomba/)).toBeInTheDocument(),
    )
  })

  it('tombol dokumen belum lengkap menyaring empat lomba', async () => {
    const user = userEvent.setup()
    await bukaMonitoring()

    const tombol = screen.getByRole('button', { name: 'Dokumen belum lengkap' })
    expect(tombol).toHaveAttribute('aria-pressed', 'false')

    await user.click(tombol)

    await waitFor(() =>
      expect(screen.getByText('Menampilkan 1-4 dari 4 lomba')).toBeInTheDocument(),
    )
  })

  it('mencari lomba berdasarkan kata kunci', async () => {
    const user = userEvent.setup()
    await bukaMonitoring()

    await user.type(screen.getByLabelText('Cari lomba'), 'hackathon')

    await waitFor(() =>
      expect(screen.getByText('Menampilkan 1-1 dari 1 lomba')).toBeInTheDocument(),
    )
  })

  it('menampilkan empty state dan tombol bersihkan saat tidak ada hasil', async () => {
    const user = userEvent.setup()
    await bukaMonitoring()

    await user.type(screen.getByLabelText('Cari lomba'), 'lomba yang tidak ada')

    expect(await screen.findByText('Tidak ada lomba yang cocok')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Bersihkan filter' }))
    await waitFor(() => expect(jumlahKartu()).toBe(9))
  })
})

describe('Monitoring Lomba - tabel', () => {
  it('menampilkan kolom pemantauan lengkap', async () => {
    const user = userEvent.setup()
    await bukaMonitoring()
    await waitFor(() => expect(jumlahKartu()).toBe(9))

    const tabel = await pindahKeTabel(user)
    const header = within(tabel).getAllByRole('columnheader').map((node) => node.textContent)

    expect(header.join(' ')).toContain('Perlombaan')
    expect(header.join(' ')).toContain('Pembimbing')
    expect(header.join(' ')).toContain('Tahapan terdekat')
    expect(header.join(' ')).toContain('Dokumen')
  })

  it('mengurutkan lewat header kolom dan menyimpannya di alamat halaman', async () => {
    const user = userEvent.setup()
    await bukaMonitoring('/monitoring/lomba?tampilan=tabel')
    const tabel = () => screen.getByRole('table', { name: 'Daftar lomba yang dipantau' })
    await screen.findByRole('table', { name: 'Daftar lomba yang dipantau' })

    const headerNama = () => within(tabel()).getByRole('columnheader', { name: /Perlombaan/ })
    await user.click(within(headerNama()).getByRole('button'))

    await waitFor(() => expect(headerNama()).toHaveAttribute('aria-sort', 'ascending'))
    expect(alamatSekarang(screen)).toContain('sort=nama')
  })
})

function isiTanggal(input, nilai) {
  fireEvent.change(input, { target: { value: nilai } })
}
