import { describe, expect, it } from 'vitest'
import {
  validasiAnggota,
  validasiDetailUmum,
  validasiLangkah,
  validasiPoster,
  validasiTimeline,
} from './validasi'

const DETAIL_VALID = {
  nama: 'GEMASTIK XIX',
  penyelenggara: 'Pusat Prestasi Nasional',
  bidang: 'Programming',
  tingkat: 'Nasional',
  jenis: 'individu',
}

describe('validasiDetailUmum', () => {
  it('lolos bila seluruh field wajib terisi', () => {
    expect(validasiDetailUmum(DETAIL_VALID).valid).toBe(true)
  })

  it('menolak field wajib yang kosong', () => {
    const { valid, error } = validasiDetailUmum({})

    expect(valid).toBe(false)
    expect(error.nama).toBeTruthy()
    expect(error.penyelenggara).toBeTruthy()
    expect(error.bidang).toBeTruthy()
    expect(error.tingkat).toBeTruthy()
  })

  it('menolak isian yang hanya berisi spasi', () => {
    const { valid, error } = validasiDetailUmum({ ...DETAIL_VALID, nama: '   ' })

    expect(valid).toBe(false)
    expect(error.nama).toBeTruthy()
  })

  it('mewajibkan nama tim untuk lomba kelompok', () => {
    const { valid, error } = validasiDetailUmum({ ...DETAIL_VALID, jenis: 'tim' })

    expect(valid).toBe(false)
    expect(error.namaTim).toBeTruthy()
  })

  it('tidak mewajibkan nama tim untuk lomba perorangan', () => {
    const { error } = validasiDetailUmum({ ...DETAIL_VALID, namaTim: '' })
    expect(error.namaTim).toBeUndefined()
  })
})

describe('validasiAnggota', () => {
  const ketua = { nim: '2502019876', nama: 'Aulia Rahmawati', prodi: 'Teknik Informatika', peran: 'ketua' }

  it('langsung lolos untuk lomba perorangan', () => {
    expect(validasiAnggota({ jenis: 'individu', anggota: [ketua] }).valid).toBe(true)
  })

  it('menolak lomba kelompok yang hanya berisi ketua', () => {
    const { valid, error } = validasiAnggota({ jenis: 'tim', anggota: [ketua] })

    expect(valid).toBe(false)
    expect(error.umum).toContain('minimal satu anggota')
  })

  it('lolos bila anggota tambahan lengkap', () => {
    const hasil = validasiAnggota({
      jenis: 'tim',
      anggota: [ketua, { nim: '2502021111', nama: 'Gilang Ramadhan', prodi: 'Sistem Informasi' }],
    })

    expect(hasil.valid).toBe(true)
  })

  it('menolak NIM yang bukan sepuluh angka', () => {
    const hasil = validasiAnggota({
      jenis: 'tim',
      anggota: [ketua, { nim: '25020', nama: 'Gilang', prodi: 'Sistem Informasi' }],
    })

    expect(hasil.valid).toBe(false)
    expect(hasil.anggota[1].nim).toBe('NIM harus 10 angka.')
  })

  it('menandai field anggota yang kosong', () => {
    const hasil = validasiAnggota({
      jenis: 'tim',
      anggota: [ketua, { nim: '', nama: '', prodi: '' }],
    })

    expect(hasil.anggota[1].nim).toBeTruthy()
    expect(hasil.anggota[1].nama).toBeTruthy()
    expect(hasil.anggota[1].prodi).toBeTruthy()
  })

  it('menolak NIM ganda dan menandainya pada baris kedua', () => {
    const hasil = validasiAnggota({
      jenis: 'tim',
      anggota: [
        ketua,
        { nim: '2502021111', nama: 'Gilang', prodi: 'Sistem Informasi' },
        { nim: '2502021111', nama: 'Hana', prodi: 'Sistem Informasi' },
      ],
    })

    expect(hasil.valid).toBe(false)
    expect(hasil.anggota[1].nim).toBeUndefined()
    expect(hasil.anggota[2].nim).toContain('sudah dipakai')
  })
})

describe('validasiPoster', () => {
  it('menerima poster berupa berkas', () => {
    expect(validasiPoster({ berkas: { poster: { namaFile: 'poster.png' } } }).valid).toBe(true)
  })

  it('menerima tautan publikasi yang sah', () => {
    expect(validasiPoster({ linkPublikasi: 'https://gemastik.id' }).valid).toBe(true)
  })

  it('menolak bila poster dan tautan sama-sama kosong', () => {
    const { valid, error } = validasiPoster({})

    expect(valid).toBe(false)
    expect(error.umum).toBeTruthy()
  })

  it('menolak tautan tanpa skema http', () => {
    const { valid, error } = validasiPoster({ linkPublikasi: 'gemastik.id' })

    expect(valid).toBe(false)
    expect(error.linkPublikasi).toBeTruthy()
  })
})

describe('validasiTimeline', () => {
  it('menolak timeline yang seluruhnya kosong', () => {
    const hasil = validasiTimeline({ tahapan: [{ jenis: 'pendaftaran', tanggalMulai: '' }] })

    expect(hasil.valid).toBe(false)
    expect(hasil.error.umum).toBeTruthy()
  })

  it('lolos bila minimal satu tahapan terisi', () => {
    const hasil = validasiTimeline({
      tahapan: [{ jenis: 'pendaftaran', tanggalMulai: '2026-10-01', tanggalSelesai: '2026-10-20' }],
    })

    expect(hasil.valid).toBe(true)
  })

  it('menolak tanggal selesai yang lebih awal dari tanggal mulai', () => {
    const hasil = validasiTimeline({
      tahapan: [{ jenis: 'pendaftaran', tanggalMulai: '2026-10-20', tanggalSelesai: '2026-10-01' }],
    })

    expect(hasil.valid).toBe(false)
    expect(hasil.tahapan[0].tanggalSelesai).toContain('tidak boleh sebelum')
  })

  it('meminta tanggal mulai bila hanya tanggal selesai yang diisi', () => {
    const hasil = validasiTimeline({
      tahapan: [
        { jenis: 'pendaftaran', tanggalMulai: '2026-10-01' },
        { jenis: 'penyisihan', tanggalMulai: '', tanggalSelesai: '2026-11-01' },
      ],
    })

    expect(hasil.valid).toBe(false)
    expect(hasil.tahapan[1].tanggalMulai).toBeTruthy()
  })

  it('mengizinkan tahapan yang dilewati selama ada tahapan lain', () => {
    const hasil = validasiTimeline({
      tahapan: [
        { jenis: 'pendaftaran', tanggalMulai: '2026-10-01' },
        { jenis: 'tm', tanggalMulai: '' },
        { jenis: 'final', tanggalMulai: '' },
      ],
    })

    expect(hasil.valid).toBe(true)
  })
})

describe('validasiLangkah', () => {
  it('memilih validator sesuai id langkah', () => {
    expect(validasiLangkah('detail', DETAIL_VALID).valid).toBe(true)
    expect(validasiLangkah('detail', {}).valid).toBe(false)
  })

  it('melewatkan langkah yang tidak punya validator', () => {
    expect(validasiLangkah('langkah-asing', {}).valid).toBe(true)
  })
})
