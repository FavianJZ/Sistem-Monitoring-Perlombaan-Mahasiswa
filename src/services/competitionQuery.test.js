import { describe, expect, it } from 'vitest'
import { buatSeed } from '@/data/seed'
import {
  BERKAS_WAJIB,
  adaTahapanDiRentang,
  agendaTerdekat,
  bolehLaporHasil,
  cocokPencarian,
  filterLomba,
  hitungKelengkapan,
  hitungStatistik,
  paginasi,
  progresTahapan,
  rentangDariMode,
  ringkasLomba,
  tahapanBerikutnya,
  tahapanPerTanggal,
  tahapanTerurut,
  urutkanLomba,
} from './competitionQuery'

/* Acuan tetap supaya seluruh tanggal turunan bisa diprediksi. */
const ACUAN = new Date(2026, 8, 24) // 24 September 2026
const DATA = buatSeed(ACUAN)

describe('hitungKelengkapan', () => {
  it('menganggap bukti pendaftaran dan bukti pembayaran sebagai berkas wajib', () => {
    expect(BERKAS_WAJIB).toEqual(['bukti_daftar', 'bukti_bayar'])
  })

  it('menandai lengkap bila kedua bukti wajib terunggah', () => {
    const lomba = DATA.find((item) => item.id === 'lomba-01')
    const hasil = hitungKelengkapan(lomba)

    expect(hasil.lengkap).toBe(true)
    expect(hasil.terunggah).toBe(2)
    expect(hasil.persen).toBe(100)
    expect(hasil.kurang).toEqual([])
  })

  it('menyebut berkas yang masih kurang', () => {
    const lomba = DATA.find((item) => item.id === 'lomba-09')
    const hasil = hitungKelengkapan(lomba)

    expect(hasil.lengkap).toBe(false)
    expect(hasil.kurang).toEqual(['bukti_bayar'])
    expect(hasil.kurangLabel).toEqual(['Bukti Pembayaran'])
    expect(hasil.persen).toBe(50)
  })

  it('menangani lomba tanpa berkas sama sekali', () => {
    const lomba = DATA.find((item) => item.id === 'lomba-20')
    const hasil = hitungKelengkapan(lomba)

    expect(hasil.lengkap).toBe(false)
    expect(hasil.terunggah).toBe(0)
    expect(hasil.persen).toBe(0)
  })
})

describe('tahapan', () => {
  it('mengurutkan tahapan berdasarkan tanggal mulai', () => {
    const lomba = DATA.find((item) => item.id === 'lomba-01')
    const tanggal = tahapanTerurut(lomba).map((tahap) => tahap.tanggalMulai)

    expect(tanggal).toEqual([...tanggal].sort())
  })

  it('mengambil tahapan terdekat yang belum lewat', () => {
    const lomba = DATA.find((item) => item.id === 'lomba-01')
    const berikutnya = tahapanBerikutnya(lomba, ACUAN)

    // Penyisihan berlangsung dari 5 hari lalu sampai 3 hari ke depan,
    // jadi tahapan itulah yang masih relevan hari ini.
    expect(berikutnya.jenis).toBe('penyisihan')
  })

  it('mengembalikan null bila seluruh tahapan sudah lewat', () => {
    const lomba = DATA.find((item) => item.id === 'lomba-17')
    expect(tahapanBerikutnya(lomba, ACUAN)).toBeNull()
  })

  it('mendeteksi tahapan yang bersinggungan dengan rentang', () => {
    const lomba = DATA.find((item) => item.id === 'lomba-01')

    expect(adaTahapanDiRentang(lomba, new Date(2026, 8, 1), new Date(2026, 8, 30))).toBe(true)
    expect(adaTahapanDiRentang(lomba, new Date(2027, 0, 1), new Date(2027, 0, 31))).toBe(false)
  })

  it('menghormati filter jenis tahapan', () => {
    const lomba = DATA.find((item) => item.id === 'lomba-01')

    expect(
      adaTahapanDiRentang(lomba, new Date(2026, 8, 1), new Date(2026, 8, 30), 'penyisihan'),
    ).toBe(true)
    expect(adaTahapanDiRentang(lomba, new Date(2026, 8, 1), new Date(2026, 8, 30), 'final')).toBe(
      false,
    )
  })
})

describe('rentangDariMode', () => {
  it('mode semua tidak membatasi tanggal', () => {
    expect(rentangDariMode({ mode: 'semua' }, ACUAN)).toEqual({ dari: null, sampai: null })
  })

  it('mode bulan-ini mencakup awal sampai akhir bulan acuan', () => {
    const { dari, sampai } = rentangDariMode({ mode: 'bulan-ini' }, ACUAN)

    expect(dari.getDate()).toBe(1)
    expect(dari.getMonth()).toBe(8)
    expect(sampai.getDate()).toBe(30)
  })

  it('mode tanggal membatasi pada satu hari penuh', () => {
    const { dari, sampai } = rentangDariMode({ mode: 'tanggal', tanggal: '2026-10-05' }, ACUAN)

    expect(dari.getDate()).toBe(5)
    expect(sampai.getDate()).toBe(5)
    expect(sampai.getHours()).toBe(23)
  })

  it('mode rentang memakai tanggal awal dan akhir yang diberikan', () => {
    const { dari, sampai } = rentangDariMode(
      { mode: 'rentang', dari: '2026-10-01', sampai: '2026-12-31' },
      ACUAN,
    )

    expect(dari.getMonth()).toBe(9)
    expect(sampai.getMonth()).toBe(11)
  })

  it('mengabaikan mode tanggal bila tanggalnya belum dipilih', () => {
    expect(rentangDariMode({ mode: 'tanggal' }, ACUAN)).toEqual({ dari: null, sampai: null })
  })
})

describe('cocokPencarian', () => {
  const lomba = DATA.find((item) => item.id === 'lomba-01')

  it('cocok tanpa kata kunci', () => {
    expect(cocokPencarian(lomba, '')).toBe(true)
  })

  it('cocok pada nama lomba tanpa peduli huruf besar kecil', () => {
    expect(cocokPencarian(lomba, 'gemastik')).toBe(true)
  })

  it('cocok pada nama tim dan nama anggota', () => {
    expect(cocokPencarian(lomba, 'Sanca')).toBe(true)
    expect(cocokPencarian(lomba, 'Aulia')).toBe(true)
  })

  it('cocok pada NIM anggota', () => {
    expect(cocokPencarian(lomba, '2502019876')).toBe(true)
  })

  it('tidak cocok pada kata yang tidak ada', () => {
    expect(cocokPencarian(lomba, 'kimia')).toBe(false)
  })
})

describe('filterLomba', () => {
  it('menyaring berdasarkan pemilik data', () => {
    const hasil = filterLomba(DATA, { createdBy: 'mhs-1' }, ACUAN)

    expect(hasil).toHaveLength(5)
    expect(hasil.every((lomba) => lomba.createdBy === 'mhs-1')).toBe(true)
  })

  it('menyaring berdasarkan dosen pembimbing', () => {
    const hasil = filterLomba(DATA, { dosenPembimbingId: 'dsn-1' }, ACUAN)
    expect(hasil.every((lomba) => lomba.dosenPembimbingId === 'dsn-1')).toBe(true)
    expect(hasil.length).toBeGreaterThan(0)
  })

  it('menyaring berdasarkan bidang, tingkat, dan status', () => {
    expect(
      filterLomba(DATA, { bidang: 'Programming' }, ACUAN).every(
        (lomba) => lomba.bidang === 'Programming',
      ),
    ).toBe(true)
    expect(
      filterLomba(DATA, { tingkat: 'Internasional' }, ACUAN).every(
        (lomba) => lomba.tingkat === 'Internasional',
      ),
    ).toBe(true)
    expect(
      filterLomba(DATA, { status: 'selesai' }, ACUAN).every((lomba) => lomba.status === 'selesai'),
    ).toBe(true)
  })

  it('menyaring berdasarkan capaian, termasuk yang belum melapor', () => {
    const juara1 = filterLomba(DATA, { capaian: 'juara_1' }, ACUAN)
    expect(juara1.every((lomba) => lomba.hasil?.capaian === 'juara_1')).toBe(true)

    const belum = filterLomba(DATA, { capaian: 'belum' }, ACUAN)
    expect(belum.every((lomba) => lomba.hasil === null)).toBe(true)
  })

  it('menyaring lomba yang dokumennya belum lengkap', () => {
    const hasil = filterLomba(DATA, { hanyaDokumenBelumLengkap: true }, ACUAN)

    expect(hasil).toHaveLength(4)
    expect(hasil.every((lomba) => !hitungKelengkapan(lomba).lengkap)).toBe(true)
  })

  it('menyaring berdasarkan program studi anggota', () => {
    const hasil = filterLomba(DATA, { prodi: 'Manajemen' }, ACUAN)

    expect(hasil.length).toBeGreaterThan(0)
    expect(
      hasil.every((lomba) => lomba.anggota.some((anggota) => anggota.prodi === 'Manajemen')),
    ).toBe(true)
  })

  it('mode bulan-ini hanya menampilkan lomba dengan tahapan di bulan berjalan', () => {
    const hasil = filterLomba(DATA, { mode: 'bulan-ini' }, ACUAN)

    expect(hasil.length).toBeGreaterThan(0)
    expect(
      hasil.every((lomba) =>
        adaTahapanDiRentang(lomba, new Date(2026, 8, 1), new Date(2026, 8, 30)),
      ),
    ).toBe(true)
    expect(hasil.some((lomba) => lomba.id === 'lomba-17')).toBe(false)
  })

  it('mode tanggal menemukan lomba yang punya tahapan pada hari itu', () => {
    // Tahapan penyisihan lomba-18 berjalan dari hari acuan sampai dua hari sesudahnya.
    const hasil = filterLomba(DATA, { mode: 'tanggal', tanggal: '2026-09-24' }, ACUAN)
    expect(hasil.some((lomba) => lomba.id === 'lomba-18')).toBe(true)
  })

  it('mode rentang menghormati batas awal dan akhir', () => {
    const hasil = filterLomba(
      DATA,
      { mode: 'rentang', dari: '2026-12-01', sampai: '2026-12-31' },
      ACUAN,
    )

    expect(
      hasil.every((lomba) =>
        adaTahapanDiRentang(lomba, new Date(2026, 11, 1), new Date(2026, 11, 31)),
      ),
    ).toBe(true)
  })

  it('menggabungkan beberapa kriteria sekaligus', () => {
    const hasil = filterLomba(
      DATA,
      { bidang: 'Programming', tingkat: 'Nasional', status: 'berlangsung' },
      ACUAN,
    )

    expect(
      hasil.every(
        (lomba) =>
          lomba.bidang === 'Programming' &&
          lomba.tingkat === 'Nasional' &&
          lomba.status === 'berlangsung',
      ),
    ).toBe(true)
  })

  it('mengembalikan daftar kosong bila tidak ada yang cocok', () => {
    expect(filterLomba(DATA, { search: 'tidak ada lomba seperti ini' }, ACUAN)).toEqual([])
  })
})

describe('urutkanLomba', () => {
  it('mengurutkan berdasarkan nama naik dan turun', () => {
    const naik = urutkanLomba(DATA, { sort: 'nama', order: 'asc' }, ACUAN).map((item) => item.nama)
    const turun = urutkanLomba(DATA, { sort: 'nama', order: 'desc' }, ACUAN).map((item) => item.nama)

    expect(naik[0]).toBe([...naik].sort((a, b) => a.localeCompare(b, 'id-ID'))[0])
    expect(turun[0]).toBe(naik[naik.length - 1])
  })

  it('mengurutkan berdasarkan tahapan terdekat', () => {
    const hasil = urutkanLomba(DATA, { sort: 'tahapanTerdekat', order: 'asc' }, ACUAN)
    const tanggal = hasil
      .map((lomba) => tahapanBerikutnya(lomba, ACUAN)?.tanggalMulai ?? '9999-12-31')

    expect(tanggal).toEqual([...tanggal].sort())
  })

  it('mengurutkan berdasarkan peringkat capaian', () => {
    const selesai = DATA.filter((lomba) => lomba.hasil)
    const hasil = urutkanLomba(selesai, { sort: 'capaian', order: 'asc' }, ACUAN)

    expect(hasil[0].hasil.capaian).toBe('juara_1')
  })

  it('tidak mengubah array masukan', () => {
    const sebelum = DATA.map((lomba) => lomba.id)
    urutkanLomba(DATA, { sort: 'nama', order: 'desc' }, ACUAN)

    expect(DATA.map((lomba) => lomba.id)).toEqual(sebelum)
  })
})

describe('paginasi', () => {
  it('memotong daftar sesuai ukuran halaman', () => {
    const hasil = paginasi(DATA, { page: 1, pageSize: 5 })

    expect(hasil.items).toHaveLength(5)
    expect(hasil.total).toBe(20)
    expect(hasil.totalPages).toBe(4)
  })

  it('mengambil halaman terakhir yang mungkin bila nomor halaman melebihi batas', () => {
    const hasil = paginasi(DATA, { page: 99, pageSize: 5 })
    expect(hasil.page).toBe(4)
  })

  it('menjaga nomor halaman minimal satu', () => {
    expect(paginasi(DATA, { page: 0, pageSize: 5 }).page).toBe(1)
  })

  it('menangani daftar kosong', () => {
    const hasil = paginasi([], { page: 1, pageSize: 10 })

    expect(hasil.items).toEqual([])
    expect(hasil.total).toBe(0)
    expect(hasil.totalPages).toBe(1)
  })
})

describe('ringkasLomba', () => {
  it('menambahkan data turunan tanpa menghapus data asli', () => {
    const lomba = DATA.find((item) => item.id === 'lomba-01')
    const ringkas = ringkasLomba(lomba, ACUAN)

    expect(ringkas.nama).toBe(lomba.nama)
    expect(ringkas.kelengkapan.lengkap).toBe(true)
    expect(ringkas.tahapanBerikutnya.jenis).toBe('penyisihan')
    expect(ringkas.jumlahAnggota).toBe(3)
    expect(typeof ringkas.sisaHariTahapan).toBe('number')
  })
})

describe('hitungStatistik', () => {
  const statistik = hitungStatistik(DATA, ACUAN)

  it('menghitung total dan sebaran status', () => {
    expect(statistik.total).toBe(20)
    expect(statistik.perStatus.berlangsung).toBe(7)
    expect(statistik.perStatus.terdaftar).toBe(5)
    expect(statistik.perStatus.selesai).toBe(8)
  })

  it('menghitung dokumen yang belum lengkap', () => {
    expect(statistik.dokumenBelumLengkap).toBe(4)
  })

  it('menghitung mahasiswa yang sedang aktif berlomba', () => {
    expect(statistik.mahasiswaAktif).toBeGreaterThan(0)
    expect(statistik.mahasiswaAktif).toBeLessThanOrEqual(statistik.mahasiswaTerlibat)
  })

  it('menghitung prestasi tanpa memasukkan capaian peserta', () => {
    const pesertaSaja = statistik.perCapaian.peserta ?? 0
    const totalHasil = Object.values(statistik.perCapaian).reduce((jumlah, nilai) => jumlah + nilai, 0)

    expect(statistik.totalPrestasi).toBe(totalHasil - pesertaSaja)
  })

  it('menghitung lomba yang punya tahapan di bulan berjalan', () => {
    expect(statistik.lombaBulanIni).toBeGreaterThan(0)
    expect(statistik.lombaBulanIni).toBeLessThan(statistik.total)
  })
})

describe('agendaTerdekat', () => {
  it('mengembalikan tahapan yang belum lewat, terurut dari yang terdekat', () => {
    const agenda = agendaTerdekat(DATA, { limit: 8, acuan: ACUAN })
    const tanggal = agenda.map((item) => item.tahap.tanggalMulai)

    expect(agenda).toHaveLength(8)
    expect(tanggal).toEqual([...tanggal].sort())
  })

  it('menyertakan identitas lomba pada setiap agenda', () => {
    const [pertama] = agendaTerdekat(DATA, { limit: 1, acuan: ACUAN })

    expect(pertama.lombaId).toBeTruthy()
    expect(pertama.namaLomba).toBeTruthy()
    expect(typeof pertama.sisaHari).toBe('number')
  })
})

describe('tahapanPerTanggal', () => {
  it('menyebar tahapan berentang ke setiap hari yang dilaluinya', () => {
    const peta = tahapanPerTanggal(DATA, {
      dari: new Date(2026, 8, 1),
      sampai: new Date(2026, 8, 30),
    })

    expect(peta.size).toBeGreaterThan(0)
    for (const [iso, isi] of peta) {
      expect(iso).toMatch(/^2026-09-\d{2}$/)
      expect(isi.length).toBeGreaterThan(0)
    }
  })

  it('membatasi hasil pada rentang yang diminta', () => {
    const peta = tahapanPerTanggal(DATA, {
      dari: new Date(2026, 8, 24),
      sampai: new Date(2026, 8, 24),
    })

    expect([...peta.keys()]).toEqual(['2026-09-24'])
  })
})

describe('bolehLaporHasil', () => {
  it('menolak bila hasil sudah dilaporkan', () => {
    const lomba = DATA.find((item) => item.id === 'lomba-05')
    const hasil = bolehLaporHasil(lomba, ACUAN)

    expect(hasil.boleh).toBe(false)
    expect(hasil.kode).toBe('SUDAH_LAPOR')
  })

  it('menolak bila tanggal pengumuman belum lewat', () => {
    const lomba = DATA.find((item) => item.id === 'lomba-01')
    const hasil = bolehLaporHasil(lomba, ACUAN)

    expect(hasil.boleh).toBe(false)
    expect(hasil.kode).toBe('BELUM_WAKTUNYA')
    expect(hasil.alasan).toContain('pengumuman pemenang')
  })

  it('mengizinkan bila tanggal pengumuman sudah lewat dan hasil belum dilaporkan', () => {
    const lomba = {
      tahapan: [
        { jenis: 'pendaftaran', tanggalMulai: '2026-07-01', tanggalSelesai: '2026-07-20' },
        { jenis: 'pengumuman', tanggalMulai: '2026-09-01' },
      ],
      hasil: null,
    }

    expect(bolehLaporHasil(lomba, ACUAN)).toMatchObject({ boleh: true, kode: 'SIAP' })
  })

  it('menolak pada hari pengumuman itu sendiri', () => {
    const lomba = { tahapan: [{ jenis: 'pengumuman', tanggalMulai: '2026-09-24' }], hasil: null }
    expect(bolehLaporHasil(lomba, ACUAN).boleh).toBe(false)
  })

  it('memakai akhir seluruh tahapan bila tidak ada tahapan pengumuman', () => {
    const selesai = {
      tahapan: [{ jenis: 'final', tanggalMulai: '2026-09-01' }],
      hasil: null,
    }
    const masihJalan = {
      tahapan: [{ jenis: 'final', tanggalMulai: '2026-10-10' }],
      hasil: null,
    }

    expect(bolehLaporHasil(selesai, ACUAN).boleh).toBe(true)
    expect(bolehLaporHasil(masihJalan, ACUAN)).toMatchObject({
      boleh: false,
      kode: 'TAHAPAN_BERJALAN',
    })
  })
})

describe('posisi tahapan pada ringkasan', () => {
  it('ringkasLomba menyertakan aturan pelaporan', () => {
    const lomba = DATA.find((item) => item.id === 'lomba-01')
    expect(ringkasLomba(lomba, ACUAN).pelaporan.kode).toBe('BELUM_WAKTUNYA')
  })
})

describe('progresTahapan', () => {
  it('menghitung tahapan yang sudah terlewati', () => {
    const lomba = DATA.find((item) => item.id === 'lomba-01')
    const progres = progresTahapan(lomba, ACUAN)

    // Pendaftaran dan technical meeting sudah lewat, penyisihan masih berjalan.
    expect(progres.total).toBe(6)
    expect(progres.lewat).toBe(2)
    expect(progres.persen).toBe(33)
  })

  it('menandai lomba yang seluruh tahapannya selesai sebagai seratus persen', () => {
    const lomba = DATA.find((item) => item.id === 'lomba-17')
    expect(progresTahapan(lomba, ACUAN).persen).toBe(100)
  })

  it('menghasilkan nol persen untuk lomba yang belum dimulai', () => {
    const lomba = DATA.find((item) => item.id === 'lomba-16')
    const progres = progresTahapan(lomba, ACUAN)

    expect(progres.lewat).toBe(0)
    expect(progres.persen).toBe(0)
  })

  it('aman untuk lomba tanpa tahapan', () => {
    expect(progresTahapan({ tahapan: [] }, ACUAN)).toEqual({ total: 0, lewat: 0, persen: 0 })
  })
})
