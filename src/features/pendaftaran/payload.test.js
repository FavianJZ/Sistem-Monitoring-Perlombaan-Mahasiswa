import { describe, expect, it } from 'vitest'
import { draftKePayload } from './payload'

const PENGGUNA = {
  id: 'mhs-1',
  nama: 'Aulia Rahmawati',
  nim: '2502019876',
  prodi: 'Teknik Informatika',
}

const DRAFT = {
  nama: '  Olimpiade Statistika Nasional  ',
  penyelenggara: '  Institut Teknologi Bandung ',
  bidang: 'Riset',
  tingkat: 'Nasional',
  jenis: 'tim',
  namaTim: ' Angka Bicara ',
  dosenPembimbingId: 'dsn-3',
  linkPublikasi: '  https://itb.ac.id/osn  ',
  anggota: [
    { nim: '2502019876', nama: 'Aulia Rahmawati', prodi: 'Teknik Informatika', peran: 'ketua' },
    { nim: ' 2502021111 ', nama: ' Gilang Ramadhan ', prodi: 'Sistem Informasi' },
  ],
  berkas: {
    bukti_daftar: { namaFile: 'daftar.pdf', mimeType: 'application/pdf', size: 1000 },
    bukti_bayar: { namaFile: 'bayar.jpg', mimeType: 'image/jpeg', size: 2000 },
  },
  tahapan: [
    { jenis: 'pendaftaran', tanggalMulai: '2026-10-01', tanggalSelesai: '2026-10-20' },
    { jenis: 'tm', tanggalMulai: '', tanggalSelesai: '' },
    { jenis: 'final', tanggalMulai: '2026-11-15', tanggalSelesai: '' },
    { jenis: 'kustom', label: ' Presentasi Karya ', tanggalMulai: '2026-11-20' },
  ],
}

describe('draftKePayload', () => {
  it('merapikan spasi pada teks', () => {
    const payload = draftKePayload(DRAFT, PENGGUNA)

    expect(payload.nama).toBe('Olimpiade Statistika Nasional')
    expect(payload.penyelenggara).toBe('Institut Teknologi Bandung')
    expect(payload.namaTim).toBe('Angka Bicara')
    expect(payload.linkPublikasi).toBe('https://itb.ac.id/osn')
  })

  it('menyetel pemilik dan status awal', () => {
    const payload = draftKePayload(DRAFT, PENGGUNA)

    expect(payload.createdBy).toBe('mhs-1')
    expect(payload.status).toBe('terdaftar')
  })

  it('mengubah peta berkas menjadi larik bertipe', () => {
    const payload = draftKePayload(DRAFT, PENGGUNA)

    expect(payload.berkas).toHaveLength(2)
    expect(payload.berkas.map((berkas) => berkas.tipe)).toEqual(['bukti_daftar', 'bukti_bayar'])
    expect(payload.berkas[0]).toMatchObject({ namaFile: 'daftar.pdf', size: 1000 })
    expect(payload.berkas[0].diunggahPada).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('membuang tahapan tanpa tanggal mulai', () => {
    const payload = draftKePayload(DRAFT, PENGGUNA)

    expect(payload.tahapan).toHaveLength(3)
    expect(payload.tahapan.map((tahap) => tahap.jenis)).toEqual([
      'pendaftaran',
      'final',
      'kustom',
    ])
  })

  it('mengubah tanggal selesai kosong menjadi null', () => {
    const payload = draftKePayload(DRAFT, PENGGUNA)
    const final = payload.tahapan.find((tahap) => tahap.jenis === 'final')

    expect(final.tanggalSelesai).toBeNull()
  })

  it('menyimpan label hanya untuk tahapan tambahan', () => {
    const payload = draftKePayload(DRAFT, PENGGUNA)

    expect(payload.tahapan.find((tahap) => tahap.jenis === 'kustom').label).toBe('Presentasi Karya')
    expect(payload.tahapan.find((tahap) => tahap.jenis === 'pendaftaran').label).toBeNull()
  })

  it('menandai peran anggota berdasarkan urutan', () => {
    const payload = draftKePayload(DRAFT, PENGGUNA)

    expect(payload.anggota[0].peran).toBe('ketua')
    expect(payload.anggota[1].peran).toBe('anggota')
    expect(payload.anggota[1].nim).toBe('2502021111')
    expect(payload.anggota[1].nama).toBe('Gilang Ramadhan')
  })

  it('hanya menyertakan ketua dan mengosongkan nama tim untuk lomba perorangan', () => {
    const payload = draftKePayload({ ...DRAFT, jenis: 'individu' }, PENGGUNA)

    expect(payload.anggota).toHaveLength(1)
    expect(payload.anggota[0].peran).toBe('ketua')
    expect(payload.namaTim).toBeNull()
  })

  it('membuat pratinjau poster hanya bila ada berkas poster', () => {
    expect(draftKePayload(DRAFT, PENGGUNA).posterUrl).toBeNull()

    const denganPoster = draftKePayload(
      {
        ...DRAFT,
        berkas: { ...DRAFT.berkas, poster: { namaFile: 'poster.png', mimeType: 'image/png', size: 5 } },
      },
      PENGGUNA,
    )

    expect(denganPoster.posterUrl).toContain('data:image/svg+xml')
  })

  it('mengubah dosen pembimbing dan tautan kosong menjadi null', () => {
    const payload = draftKePayload(
      { ...DRAFT, dosenPembimbingId: '', linkPublikasi: '   ' },
      PENGGUNA,
    )

    expect(payload.dosenPembimbingId).toBeNull()
    expect(payload.linkPublikasi).toBeNull()
  })
})
