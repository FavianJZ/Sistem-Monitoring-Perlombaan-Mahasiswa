import { describe, expect, it } from 'vitest'
import { filterLomba, filterPeserta, ikutLomba } from './competitionQuery'

const LOMBA = [
  { id: 'a', createdBy: 'uid-ketua', anggota: [{ nim: '2502010001' }, { nim: '2502010002' }] },
  { id: 'b', createdBy: 'uid-lain', anggota: [{ nim: '2502019999' }] },
  { id: 'c', createdBy: 'uid-lain', anggota: [{ nim: '' }, { nim: null }] },
]

describe('lomba yang diikuti mahasiswa', () => {
  it('memuat lomba milik sendiri dan lomba tempat NIM-nya tercatat sebagai anggota', () => {
    const anggota = { id: 'uid-anggota', nim: '2502010002' }
    expect(filterLomba(LOMBA, filterPeserta(anggota)).map((l) => l.id)).toEqual(['a'])

    const ketua = { id: 'uid-ketua', nim: '2502010001' }
    expect(filterLomba(LOMBA, filterPeserta(ketua)).map((l) => l.id)).toEqual(['a'])
  })

  it('tidak memuat lomba orang lain bila NIM tidak tercatat', () => {
    expect(filterLomba(LOMBA, filterPeserta({ id: 'uid-x', nim: '2502017777' }))).toEqual([])
  })

  it('akun tanpa NIM tidak cocok dengan anggota yang NIM-nya kosong', () => {
    expect(ikutLomba(LOMBA[2], { id: 'uid-x', nim: null })).toBe(false)
    expect(ikutLomba(LOMBA[2], { id: 'uid-x', nim: '' })).toBe(false)
    expect(ikutLomba(LOMBA[2], { id: 'uid-x' })).toBe(false)
  })

  it('cocok walau NIM tersimpan dengan spasi', () => {
    expect(ikutLomba({ createdBy: 'z', anggota: [{ nim: ' 2502010002 ' }] }, { id: 'y', nim: '2502010002' })).toBe(true)
  })
})
