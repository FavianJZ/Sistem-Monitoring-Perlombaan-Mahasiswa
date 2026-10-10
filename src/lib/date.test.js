import { describe, expect, it } from 'vitest'
import { toneSisaHari, waktuTahap } from './date'

const ACUAN = new Date(2026, 9, 11)

describe('waktuTahap', () => {
  it('menulis hitung mundur untuk tahap yang belum dimulai', () => {
    expect(waktuTahap({ tanggalMulai: '2026-10-14' }, ACUAN)).toBe('3 hari lagi')
    expect(waktuTahap({ tanggalMulai: '2026-10-12' }, ACUAN)).toBe('besok')
  })

  it('menyebut tahap yang sedang berjalan beserta tanggal selesainya', () => {
    const tahap = { tanggalMulai: '2026-09-06', tanggalSelesai: '2026-10-20' }
    expect(waktuTahap(tahap, ACUAN)).toMatch(/^berlangsung s\.d\. 20 Okt/)
  })

  it('menandai tahap yang berakhir hari ini', () => {
    const tahap = { tanggalMulai: '2026-10-01', tanggalSelesai: '2026-10-11' }
    expect(waktuTahap(tahap, ACUAN)).toBe('berakhir hari ini')
  })

  it('tetap memakai jarak hari untuk tahap satu hari yang sudah lewat', () => {
    expect(waktuTahap({ tanggalMulai: '2026-10-08' }, ACUAN)).toBe('3 hari lalu')
  })
})

describe('toneSisaHari', () => {
  it('membedakan tahap berjalan, mendesak, dan biasa', () => {
    expect(toneSisaHari(-4)).toBe('primary')
    expect(toneSisaHari(2)).toBe('warning')
    expect(toneSisaHari(10)).toBe('neutral')
  })
})
