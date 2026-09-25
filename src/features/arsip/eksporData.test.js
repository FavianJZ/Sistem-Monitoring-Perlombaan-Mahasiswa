import { describe, expect, it } from 'vitest'
import {
  KOLOM_EKSPOR,
  KOLOM_PDF,
  barisEkspor,
  judulKolom,
  keCsv,
  kolomTerpilih,
  namaBerkasLaporan,
  objekEkspor,
  ringkasanLaporan,
} from './eksporData'

const LOMBA = {
  id: 'lomba-04',
  nama: 'Business Plan Competition Binus Festival',
  penyelenggara: 'Binus University',
  bidang: 'Bisnis',
  tingkat: 'Regional',
  jenis: 'tim',
  namaTim: 'Nusantara Venture',
  dosenPembimbingId: 'dsn-2',
  anggota: [
    { nim: '2502017890', nama: 'Elvira Nuraini', prodi: 'Manajemen', peran: 'ketua' },
    { nim: '2502026666', nama: 'Laras Ayu Pertiwi', prodi: 'Manajemen' },
    { nim: '2502020202', nama: 'Rizky Hidayat', prodi: 'Manajemen' },
  ],
  berkas: [
    { tipe: 'bukti_daftar', namaFile: 'daftar.pdf' },
    { tipe: 'sertifikat', namaFile: 'sertifikat.pdf' },
  ],
  tahapan: [
    { jenis: 'pendaftaran', tanggalMulai: '2026-04-27' },
    { jenis: 'pengumuman', tanggalMulai: '2026-06-23' },
  ],
  hasil: {
    capaian: 'juara_2',
    linkBerita: 'https://binus.ac.id/berita/bpc-2026',
    dilaporkanPada: '2026-06-25',
  },
}

const TANPA_HASIL = {
  id: 'lomba-99',
  nama: 'Lomba Tanpa Hasil',
  penyelenggara: 'Kampus',
  bidang: 'Seni',
  tingkat: 'Nasional',
  jenis: 'individu',
  namaTim: null,
  dosenPembimbingId: null,
  anggota: [{ nim: '2502011111', nama: 'Peserta Tunggal', prodi: 'Seni' }],
  berkas: [],
  tahapan: [],
  hasil: null,
}

describe('KOLOM_EKSPOR', () => {
  it('memuat kolom yang dibutuhkan laporan akreditasi', () => {
    const kunci = KOLOM_EKSPOR.map((kolom) => kolom.kunci)

    for (const wajib of ['nama', 'bidang', 'tingkat', 'nim', 'prodi', 'capaian', 'sertifikat']) {
      expect(kunci).toContain(wajib)
    }
  })

  it('judul kolom sesuai urutan definisinya', () => {
    expect(judulKolom().slice(0, 4)).toEqual([
      'Nama Perlombaan',
      'Penyelenggara',
      'Bidang',
      'Tingkat',
    ])
  })
})

describe('barisEkspor', () => {
  const [baris] = barisEkspor([LOMBA])
  const indeks = (kunci) => KOLOM_EKSPOR.findIndex((kolom) => kolom.kunci === kunci)

  it('menulis identitas lomba', () => {
    expect(baris[indeks('nama')]).toBe('Business Plan Competition Binus Festival')
    expect(baris[indeks('bidang')]).toBe('Bisnis')
    expect(baris[indeks('tingkat')]).toBe('Regional')
  })

  it('menerjemahkan jenis keikutsertaan ke label', () => {
    expect(baris[indeks('jenis')]).toBe('Tim / Kelompok')
    expect(barisEkspor([TANPA_HASIL])[0][indeks('jenis')]).toBe('Perorangan')
  })

  it('mengambil ketua tim beserta NIM dan program studinya', () => {
    expect(baris[indeks('ketua')]).toBe('Elvira Nuraini')
    expect(baris[indeks('nim')]).toBe('2502017890')
    expect(baris[indeks('prodi')]).toBe('Manajemen')
  })

  it('menggabungkan anggota lain dengan koma', () => {
    expect(baris[indeks('anggota')]).toBe('Laras Ayu Pertiwi, Rizky Hidayat')
    expect(barisEkspor([TANPA_HASIL])[0][indeks('anggota')]).toBe('-')
  })

  it('menerjemahkan capaian dan menandai yang belum dilaporkan', () => {
    expect(baris[indeks('capaian')]).toBe('Juara 2')
    expect(barisEkspor([TANPA_HASIL])[0][indeks('capaian')]).toBe('Belum dilaporkan')
  })

  it('memformat tanggal pengumuman dan tanggal pelaporan', () => {
    expect(baris[indeks('pengumuman')]).toBe('23 Jun 2026')
    expect(baris[indeks('dilaporkan')]).toBe('25 Jun 2026')
  })

  it('menandai ketersediaan sertifikat', () => {
    expect(baris[indeks('sertifikat')]).toBe('Ada')
    expect(barisEkspor([TANPA_HASIL])[0][indeks('sertifikat')]).toBe('Belum ada')
  })

  it('menulis nama dosen pembimbing atau tanda hubung', () => {
    expect(baris[indeks('pembimbing')]).toContain('Ratna Kusumawati')
    expect(barisEkspor([TANPA_HASIL])[0][indeks('pembimbing')]).toBe('-')
  })

  it('mengisi sel kosong dengan tanda hubung', () => {
    expect(barisEkspor([TANPA_HASIL])[0]).not.toContain('')
  })
})

describe('objekEkspor', () => {
  it('menghasilkan objek dengan kunci kolom', () => {
    const [objek] = objekEkspor([LOMBA])

    expect(objek.nama).toBe('Business Plan Competition Binus Festival')
    expect(objek.capaian).toBe('Juara 2')
    expect(Object.keys(objek)).toHaveLength(KOLOM_EKSPOR.length)
  })
})

describe('kolomTerpilih', () => {
  it('menyaring kolom sesuai daftar kunci untuk PDF', () => {
    const kolom = kolomTerpilih(KOLOM_PDF)

    expect(kolom).toHaveLength(KOLOM_PDF.length)
    expect(kolom.map((item) => item.kunci)).toEqual(KOLOM_PDF)
  })

  it('mengabaikan kunci yang tidak dikenal', () => {
    expect(kolomTerpilih(['nama', 'tidak-ada'])).toHaveLength(1)
  })
})

describe('keCsv', () => {
  it('diawali BOM agar huruf beraksen benar di Excel', () => {
    expect(keCsv([LOMBA]).startsWith('\uFEFF')).toBe(true)
  })

  it('baris pertama berisi judul kolom', () => {
    const [judul] = keCsv([LOMBA]).replace('\uFEFF', '').split('\r\n')
    expect(judul.startsWith('Nama Perlombaan,Penyelenggara,Bidang,Tingkat')).toBe(true)
  })

  it('menulis satu baris per lomba', () => {
    const baris = keCsv([LOMBA, TANPA_HASIL]).replace('\uFEFF', '').split('\r\n')
    expect(baris).toHaveLength(3)
  })

  it('mengutip sel yang memuat koma', () => {
    const isi = keCsv([LOMBA])
    expect(isi).toContain('"Laras Ayu Pertiwi, Rizky Hidayat"')
  })

  it('melipatgandakan tanda kutip di dalam sel', () => {
    const isi = keCsv([{ ...TANPA_HASIL, nama: 'Lomba "Spesial"' }])
    expect(isi).toContain('"Lomba ""Spesial"""')
  })

  it('menangani daftar kosong dengan hanya menulis judul', () => {
    const baris = keCsv([]).replace('\uFEFF', '').split('\r\n')
    expect(baris).toHaveLength(1)
  })
})

describe('namaBerkasLaporan', () => {
  it('memuat tanggal dan ekstensi', () => {
    expect(namaBerkasLaporan('csv', new Date(2026, 8, 24))).toBe('rekap-prestasi-20260924.csv')
    expect(namaBerkasLaporan('xlsx', new Date(2026, 11, 5))).toBe('rekap-prestasi-20261205.xlsx')
  })
})

describe('ringkasanLaporan', () => {
  it('menghitung total, berprestasi, dan bersertifikat', () => {
    const ringkasan = ringkasanLaporan([
      LOMBA,
      TANPA_HASIL,
      { ...LOMBA, hasil: { capaian: 'peserta' }, berkas: [] },
    ])

    expect(ringkasan.total).toBe(3)
    expect(ringkasan.berprestasi).toBe(1)
    expect(ringkasan.bersertifikat).toBe(1)
  })
})
