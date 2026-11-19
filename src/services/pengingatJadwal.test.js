import { describe, expect, it } from 'vitest'
import {
  daftarPengingat,
  geserTanggal,
  isiEmailPengingat,
  penerimaPengingat,
  tanggalHariIni,
} from '../../supabase/functions/kirim-pengingat/pengingat.js'

const HARI_INI = '2026-11-19'

function baris(id, data, createdBy = 'uid-pemilik') {
  return { id, created_by: createdBy, data }
}

const PROFIL = [
  { id: 'uid-pemilik', email: 'User.Mahasiswa1@binus.ac.id', nim: '2502019876' },
  { id: 'uid-anggota', email: 'user.mahasiswa2@binus.ac.id', nim: '2502011234' },
]

describe('tanggal pengingat', () => {
  it('memakai tanggal Jakarta, bukan UTC', () => {
    expect(tanggalHariIni(new Date('2026-11-19T18:30:00Z'))).toBe('2026-11-20')
    expect(tanggalHariIni(new Date('2026-11-19T16:59:00Z'))).toBe('2026-11-19')
  })

  it('menggeser tanggal melewati batas bulan dan tahun', () => {
    expect(geserTanggal('2026-11-29', 3)).toBe('2026-12-02')
    expect(geserTanggal('2026-12-30', 3)).toBe('2027-01-02')
  })
})

describe('daftarPengingat', () => {
  const lomba = baris('lomba-01', {
    nama: 'GEMASTIK XIX',
    status: 'berlangsung',
    anggota: [{ nim: '2502019876' }, { nim: '2502011234' }],
    tahapan: [
      { jenis: 'tm', tanggalMulai: '2026-11-22' },
      { jenis: 'final', tanggalMulai: HARI_INI },
      { jenis: 'semifinal', tanggalMulai: '2026-11-21' },
      { jenis: 'pengumuman', tanggalMulai: '2026-11-20' },
    ],
  })

  it('memilih tahapan H-3 dan hari H saja', () => {
    const hasil = daftarPengingat([lomba], HARI_INI)
    expect(hasil.map((p) => [p.tahap.jenis, p.jadwal.kode])).toEqual([
      ['tm', 'h3'],
      ['final', 'h0'],
    ])
    expect(hasil[0].kunciTahap).toBe('0:tm:2026-11-22')
  })

  it('melewati lomba yang sudah selesai atau tidak lanjut', () => {
    const selesai = baris('lomba-02', { ...lomba.data, status: 'selesai' })
    const berhenti = baris('lomba-03', { ...lomba.data, status: 'tidak_lanjut' })
    expect(daftarPengingat([selesai, berhenti], HARI_INI)).toEqual([])
  })

  it('melewati tahapan tanpa tanggal yang sah', () => {
    const rusak = baris('lomba-04', {
      status: 'terdaftar',
      tahapan: [{ jenis: 'tm' }, { jenis: 'final', tanggalMulai: '22/11/2026' }, null],
    })
    expect(daftarPengingat([rusak, baris('lomba-05', {})], HARI_INI)).toEqual([])
  })
})

describe('penerimaPengingat', () => {
  it('mengirim ke pemilik dan anggota yang punya akun, tanpa duplikat', () => {
    const [pengingat] = daftarPengingat(
      [
        baris('lomba-01', {
          status: 'terdaftar',
          anggota: [{ nim: '2502019876' }, { nim: '2502011234' }, { nim: '9999999999' }],
          tahapan: [{ jenis: 'final', tanggalMulai: HARI_INI }],
        }),
      ],
      HARI_INI,
    )
    expect(penerimaPengingat(pengingat, PROFIL)).toEqual([
      'user.mahasiswa1@binus.ac.id',
      'user.mahasiswa2@binus.ac.id',
    ])
  })

  it('mengembalikan daftar kosong bila tidak ada akun yang cocok', () => {
    expect(
      penerimaPengingat({ pemilikId: 'uid-hilang', nimAnggota: ['123'] }, PROFIL),
    ).toEqual([])
  })
})

describe('isiEmailPengingat', () => {
  const pengingat = (selisihHari, nama = 'GEMASTIK XIX') => ({
    lombaId: 'lomba-01',
    namaLomba: nama,
    namaTim: 'Sanca Digital',
    tahap: { jenis: 'final', tanggalMulai: '2026-11-22' },
    jadwal: { kode: selisihHari ? 'h3' : 'h0', selisihHari, judul: selisihHari ? '3 hari lagi' : 'hari ini' },
  })

  it('menulis subjek berbeda untuk H-3 dan hari H', () => {
    expect(isiEmailPengingat(pengingat(3), 'https://situs.test').subjek).toBe(
      'Final 3 hari lagi - GEMASTIK XIX',
    )
    expect(isiEmailPengingat(pengingat(0), 'https://situs.test').subjek).toBe(
      'Hari ini: Final - GEMASTIK XIX',
    )
  })

  it('memuat tanggal dan tautan detail lomba', () => {
    const { teks, html } = isiEmailPengingat(pengingat(3), 'https://situs.test/')
    expect(teks).toContain('Minggu, 22 November 2026')
    expect(html).toContain('https://situs.test/lomba-saya/lomba-01')
  })

  it('meloloskan HTML dari nama lomba isian pengguna', () => {
    const { html } = isiEmailPengingat(pengingat(3, '<img src=x onerror=alert(1)>'), 'https://situs.test')
    expect(html).not.toContain('<img src=x')
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;')
  })
})
