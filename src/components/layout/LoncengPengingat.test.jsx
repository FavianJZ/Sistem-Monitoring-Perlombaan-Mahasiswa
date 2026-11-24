import { describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp, SESI_DOSEN, SESI_MAHASISWA } from '@/test/utils'
import { agendaLomba, buatLomba, HARI_PENGINGAT, pengingatJadwal } from '@/services/competitionService'
import { toISODate } from '@/lib/date'
import { contohEmail, teksSisaHari } from './LoncengPengingat'

describe('pengingatJadwal', () => {
  it('hanya mengambil tahapan yang mulai hari ini sampai 3 hari lagi', async () => {
    const mahasiswa = SESI_MAHASISWA().user
    const semua = await agendaLomba({ createdBy: mahasiswa.id }, { limit: 0 })
    const pengingat = await pengingatJadwal(mahasiswa)

    expect(semua.some((item) => item.sisaHari < 0 || item.sisaHari > HARI_PENGINGAT)).toBe(true)
    expect(pengingat).toEqual(semua.filter((item) => item.sisaHari >= 0 && item.sisaHari <= HARI_PENGINGAT))
  })

  it('memakai lomba bimbingan untuk dosen dan kosong tanpa pengguna', async () => {
    const dosen = SESI_DOSEN().user
    const bimbingan = await agendaLomba({ dosenPembimbingId: dosen.id }, { limit: 0 })
    const pengingat = await pengingatJadwal(dosen)

    expect(pengingat.every((item) => bimbingan.some((b) => b.lombaId === item.lombaId))).toBe(true)
    expect(await pengingatJadwal(null)).toEqual([])
  })
})

describe('teksSisaHari dan contohEmail', () => {
  it('menulis sisa hari dengan bahasa sehari-hari', () => {
    expect(teksSisaHari(0)).toBe('Hari ini')
    expect(teksSisaHari(1)).toBe('Besok')
    expect(teksSisaHari(3)).toBe('3 hari lagi')
  })

  it('membuat pratinjau email yang meloloskan HTML dari nama lomba', () => {
    const html = contohEmail({
      lombaId: 'lomba-01',
      namaLomba: '<script>alert(1)</script>',
      namaTim: null,
      tahap: { jenis: 'final', tanggalMulai: '2026-11-26' },
      sisaHari: 1,
    })
    expect(html).toContain('Final besok')
    expect(html).toContain('&lt;script&gt;')
    expect(html).not.toContain('<script>alert(1)</script>')
    expect(html).toContain('<base target="_blank">')
  })
})

describe('lonceng pengingat di topbar', () => {
  it('menampilkan jumlah dan daftar jadwal dekat, lalu pratinjau email', async () => {
    const pengguna = userEvent.setup()
    const sesi = SESI_MAHASISWA()
    await buatLomba({
      nama: 'Lomba Uji Pengingat',
      penyelenggara: 'Penyelenggara Uji',
      bidang: 'Programming',
      tingkat: 'Nasional',
      jenis: 'perorangan',
      createdBy: sesi.user.id,
      anggota: [{ nim: sesi.user.nim, nama: sesi.user.nama, peran: 'ketua' }],
      berkas: [],
      tahapan: [{ jenis: 'final', tanggalMulai: toISODate(new Date(Date.now() + 86400000)) }],
    })
    const harapan = await pengingatJadwal(sesi.user)
    expect(harapan.map((item) => item.namaLomba)).toContain('Lomba Uji Pengingat')
    renderApp('/', { sesi })

    const tombol = await screen.findByRole('button', { name: /^Pengingat jadwal/ })
    await pengguna.click(tombol)
    const panel = screen.getByRole('region', { name: 'Pengingat jadwal lomba' })

    expect(within(panel).getByText('Besok')).toBeInTheDocument()
    expect(tombol).toHaveAccessibleName(`Pengingat jadwal, ${harapan.length} jadwal dalam 3 hari ke depan`)
    expect(within(panel).getAllByRole('listitem')).toHaveLength(harapan.length)
    expect(within(panel).getByText(harapan[0].namaLomba)).toBeInTheDocument()

    await pengguna.click(within(panel).getAllByRole('button', { name: /Lihat email pengingat/ })[0])
    expect(await screen.findByRole('dialog', { name: 'Pratinjau email pengingat' })).toBeInTheDocument()
    expect(screen.getByTitle('Pratinjau email pengingat')).toHaveAttribute('sandbox', 'allow-popups')
  })

  it('menampilkan keadaan kosong bila tidak ada jadwal dekat', async () => {
    const pengguna = userEvent.setup()
    const sesi = SESI_MAHASISWA()
    renderApp('/', { sesi: { ...sesi, user: { ...sesi.user, id: 'mhs-tanpa-lomba' } } })

    const tombol = await screen.findByRole('button', { name: /^Pengingat jadwal/ })
    expect(tombol).toHaveAccessibleName('Pengingat jadwal, tidak ada jadwal dekat')
    await pengguna.click(tombol)
    expect(screen.getByText('Tidak ada jadwal lomba dalam 3 hari ke depan.')).toBeInTheDocument()
  })

  it('menutup panel dengan tombol Escape', async () => {
    const pengguna = userEvent.setup()
    renderApp('/', { sesi: SESI_MAHASISWA() })

    await pengguna.click(await screen.findByRole('button', { name: /^Pengingat jadwal/ }))
    expect(screen.getByRole('region', { name: 'Pengingat jadwal lomba' })).toBeInTheDocument()
    await pengguna.keyboard('{Escape}')
    expect(screen.queryByRole('region', { name: 'Pengingat jadwal lomba' })).not.toBeInTheDocument()
  })
})
