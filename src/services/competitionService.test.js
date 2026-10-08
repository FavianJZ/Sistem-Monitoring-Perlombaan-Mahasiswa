import { beforeEach, describe, expect, it } from 'vitest'
import {
  ServiceError,
  agendaLomba,
  buatLomba,
  daftarLomba,
  detailLomba,
  hapusLomba,
  kalenderLomba,
  laporkanHasil,
  opsiFilter,
  perbaruiLomba,
  resetDataMock,
  semuaLombaTersaring,
  statistikLomba,
  unggahUlangBerkas,
  verifikasiBerkas,
} from './competitionService'
import { login, daftarDosen, namaPengguna } from './userService'
import { SANDI_DEMO } from '@/data/users'

const ACUAN = new Date(2026, 8, 24)
const OPSI = { acuan: ACUAN }

beforeEach(() => {
  resetDataMock(ACUAN)
})

describe('daftarLomba', () => {
  it('mengembalikan halaman pertama beserta metadata paginasi', async () => {
    const hasil = await daftarLomba({ pageSize: 6 }, OPSI)

    expect(hasil.items).toHaveLength(6)
    expect(hasil.total).toBe(20)
    expect(hasil.page).toBe(1)
    expect(hasil.totalPages).toBe(4)
  })

  it('melengkapi setiap item dengan data turunan', async () => {
    const hasil = await daftarLomba({ pageSize: 20 }, OPSI)
    const lomba = hasil.items.find((item) => item.id === 'lomba-09')

    expect(lomba.kelengkapan.lengkap).toBe(false)
    expect(lomba.kelengkapan.kurangLabel).toEqual(['Bukti Pembayaran'])
    expect(lomba.jumlahAnggota).toBe(4)
  })

  it('menghormati filter pemilik', async () => {
    const hasil = await daftarLomba({ createdBy: 'mhs-1', pageSize: 20 }, OPSI)

    expect(hasil.total).toBe(5)
    expect(hasil.items.every((item) => item.createdBy === 'mhs-1')).toBe(true)
  })

  it('menghormati pencarian teks', async () => {
    const hasil = await daftarLomba({ search: 'gemastik', pageSize: 20 }, OPSI)

    expect(hasil.total).toBe(1)
    expect(hasil.items[0].id).toBe('lomba-01')
  })
})

describe('semuaLombaTersaring', () => {
  it('mengembalikan seluruh hasil tanpa paginasi', async () => {
    const hasil = await semuaLombaTersaring({ status: 'selesai' }, OPSI)

    expect(hasil).toHaveLength(8)
    expect(hasil.every((lomba) => lomba.status === 'selesai')).toBe(true)
  })
})

describe('detailLomba', () => {
  it('mengembalikan detail lengkap', async () => {
    const lomba = await detailLomba('lomba-01', OPSI)

    expect(lomba.nama).toContain('GEMASTIK')
    expect(lomba.anggota).toHaveLength(3)
    expect(lomba.tahapan).toHaveLength(6)
    expect(lomba.anggota[0].peran).toBe('ketua')
  })

  it('melempar ServiceError 404 untuk id yang tidak ada', async () => {
    await expect(detailLomba('lomba-999', OPSI)).rejects.toThrow(ServiceError)
    await expect(detailLomba('lomba-999', OPSI)).rejects.toMatchObject({ status: 404 })
  })
})

describe('buatLomba', () => {
  const payload = {
    nama: '  Olimpiade Statistika Nasional  ',
    penyelenggara: 'Institut Teknologi Sepuluh Nopember',
    bidang: 'Riset',
    tingkat: 'Nasional',
    jenis: 'tim',
    namaTim: 'Angka Bicara',
    dosenPembimbingId: 'dsn-3',
    linkPublikasi: 'https://its.ac.id/osn',
    createdBy: 'mhs-2',
    anggota: [
      { nim: '2502011234', nama: 'Bagas Prayoga', prodi: 'Sistem Informasi', peran: 'ketua' },
      { nim: '2502022222', nama: 'Hana Puspita', prodi: 'Sistem Informasi' },
      { nim: '', nama: '' },
    ],
    berkas: [{ tipe: 'bukti_daftar', namaFile: 'daftar.pdf', mimeType: 'application/pdf', size: 1000 }],
    tahapan: [
      { jenis: 'pendaftaran', tanggalMulai: '2026-10-01', tanggalSelesai: '2026-10-20' },
      { jenis: 'final', tanggalMulai: '2026-11-15' },
      { jenis: 'semifinal', tanggalMulai: null },
    ],
  }

  it('menambah lomba baru ke daftar', async () => {
    const sebelum = await daftarLomba({ pageSize: 50 }, OPSI)
    const dibuat = await buatLomba(payload, OPSI)
    const sesudah = await daftarLomba({ pageSize: 50 }, OPSI)

    expect(sesudah.total).toBe(sebelum.total + 1)
    expect(dibuat.id).toBe('lomba-21')
    expect(dibuat.status).toBe('terdaftar')
  })

  it('merapikan spasi dan membuang baris kosong', async () => {
    const dibuat = await buatLomba(payload, OPSI)

    expect(dibuat.nama).toBe('Olimpiade Statistika Nasional')
    expect(dibuat.anggota).toHaveLength(2)
    expect(dibuat.tahapan).toHaveLength(2)
  })

  it('menghitung kelengkapan dokumen pada data baru', async () => {
    const dibuat = await buatLomba(payload, OPSI)

    expect(dibuat.kelengkapan.lengkap).toBe(false)
    expect(dibuat.kelengkapan.kurang).toEqual(['bukti_bayar'])
  })

  it('mengosongkan nama tim bila keikutsertaan perorangan', async () => {
    const dibuat = await buatLomba({ ...payload, jenis: 'individu' }, OPSI)
    expect(dibuat.namaTim).toBeNull()
  })

  it('menolak pendaftaran tanpa nama lomba', async () => {
    await expect(buatLomba({ ...payload, nama: '   ' }, OPSI)).rejects.toThrow(/Nama perlombaan/)
  })

  it('menolak pendaftaran tanpa pemilik data', async () => {
    await expect(buatLomba({ ...payload, createdBy: null }, OPSI)).rejects.toThrow(/Pemilik data/)
  })

  it('data baru bisa langsung dibaca kembali', async () => {
    const dibuat = await buatLomba(payload, OPSI)
    const dibaca = await detailLomba(dibuat.id, OPSI)

    expect(dibaca.nama).toBe('Olimpiade Statistika Nasional')
  })
})

describe('perbaruiLomba', () => {
  it('mengubah field yang dikirim saja', async () => {
    const hasil = await perbaruiLomba('lomba-01', { penyelenggara: 'Penyelenggara Baru' }, OPSI)

    expect(hasil.penyelenggara).toBe('Penyelenggara Baru')
    expect(hasil.nama).toContain('GEMASTIK')
  })

  it('tidak mengizinkan penggantian id maupun pemilik', async () => {
    const hasil = await perbaruiLomba('lomba-01', { id: 'lomba-palsu', createdBy: 'mhs-6' }, OPSI)

    expect(hasil.id).toBe('lomba-01')
    expect(hasil.createdBy).toBe('mhs-1')
  })

  it('memperbarui kelengkapan setelah berkas ditambahkan', async () => {
    const sebelum = await detailLomba('lomba-09', OPSI)
    expect(sebelum.kelengkapan.lengkap).toBe(false)

    const hasil = await perbaruiLomba(
      'lomba-09',
      {
        berkas: [
          ...sebelum.berkas,
          { tipe: 'bukti_bayar', namaFile: 'bayar.jpg', mimeType: 'image/jpeg', size: 2048 },
        ],
      },
      OPSI,
    )

    expect(hasil.kelengkapan.lengkap).toBe(true)
  })

  it('melempar 404 untuk id yang tidak ada', async () => {
    await expect(perbaruiLomba('lomba-999', { nama: 'x' }, OPSI)).rejects.toMatchObject({
      status: 404,
    })
  })
})

describe('laporkanHasil', () => {
  it('menyimpan capaian dan menandai lomba selesai', async () => {
    const hasil = await laporkanHasil(
      'lomba-01',
      { capaian: 'juara_2', linkBerita: 'https://contoh.id/berita' },
      OPSI,
    )

    expect(hasil.status).toBe('selesai')
    expect(hasil.hasil.capaian).toBe('juara_2')
    expect(hasil.hasil.linkBerita).toBe('https://contoh.id/berita')
    expect(hasil.hasil.dilaporkanPada).toBe('2026-09-24')
  })

  it('menambahkan berkas sertifikat tanpa menghapus berkas lama', async () => {
    const sebelum = await detailLomba('lomba-01', OPSI)
    const hasil = await laporkanHasil(
      'lomba-01',
      {
        capaian: 'juara_1',
        berkas: [{ tipe: 'sertifikat', namaFile: 'sertifikat.pdf', mimeType: 'application/pdf', size: 900 }],
      },
      OPSI,
    )

    expect(hasil.berkas).toHaveLength(sebelum.berkas.length + 1)
    expect(hasil.berkas.some((berkas) => berkas.tipe === 'sertifikat')).toBe(true)
  })

  it('mengubah statistik prestasi setelah dilaporkan', async () => {
    const sebelum = await statistikLomba({}, OPSI)
    await laporkanHasil('lomba-01', { capaian: 'juara_3' }, OPSI)
    const sesudah = await statistikLomba({}, OPSI)

    expect(sesudah.totalPrestasi).toBe(sebelum.totalPrestasi + 1)
    expect(sesudah.perStatus.selesai).toBe(sebelum.perStatus.selesai + 1)
  })

  it('menolak laporan tanpa capaian', async () => {
    await expect(laporkanHasil('lomba-01', {}, OPSI)).rejects.toThrow(/Capaian/)
  })

  it('mengosongkan link berita kosong menjadi null', async () => {
    const hasil = await laporkanHasil('lomba-01', { capaian: 'peserta', linkBerita: '   ' }, OPSI)
    expect(hasil.hasil.linkBerita).toBeNull()
  })
})

describe('hapusLomba', () => {
  it('menghapus data dan mengurangi total', async () => {
    await hapusLomba('lomba-01', OPSI)
    const sesudah = await daftarLomba({ pageSize: 50 }, OPSI)

    expect(sesudah.total).toBe(19)
    expect(sesudah.items.some((lomba) => lomba.id === 'lomba-01')).toBe(false)
  })

  it('melempar 404 bila data tidak ada', async () => {
    await expect(hapusLomba('lomba-999', OPSI)).rejects.toMatchObject({ status: 404 })
  })
})

describe('statistikLomba', () => {
  it('menghitung agregat seluruh data', async () => {
    const statistik = await statistikLomba({}, OPSI)

    expect(statistik.total).toBe(20)
    expect(statistik.dokumenBelumLengkap).toBe(4)
    expect(statistik.perTingkat.Internasional).toBeGreaterThan(0)
  })

  it('menghitung agregat untuk satu mahasiswa saja', async () => {
    const statistik = await statistikLomba({ createdBy: 'mhs-1' }, OPSI)
    expect(statistik.total).toBe(5)
  })
})

describe('agendaLomba', () => {
  it('mengembalikan agenda terdekat sebanyak limit', async () => {
    const agenda = await agendaLomba({}, { ...OPSI, limit: 5 })

    expect(agenda).toHaveLength(5)
    const tanggal = agenda.map((item) => item.tahap.tanggalMulai)
    expect(tanggal).toEqual([...tanggal].sort())
  })
})

describe('kalenderLomba', () => {
  it('mengelompokkan tahapan per tanggal dalam bulan yang diminta', async () => {
    const peta = await kalenderLomba({ bulan: ACUAN }, OPSI)
    const kunci = Object.keys(peta)

    expect(kunci.length).toBeGreaterThan(0)
    expect(kunci.every((iso) => iso.startsWith('2026-09'))).toBe(true)
  })

  it('bisa diminta untuk bulan lain', async () => {
    const peta = await kalenderLomba({ bulan: new Date(2026, 9, 1) }, OPSI)
    expect(Object.keys(peta).every((iso) => iso.startsWith('2026-10'))).toBe(true)
  })
})

describe('opsiFilter', () => {
  it('mengembalikan nilai unik yang tersedia di data', async () => {
    const opsi = await opsiFilter(OPSI)

    expect(opsi.tingkat).toEqual(['Internasional', 'Nasional', 'Regional'])
    expect(opsi.bidang).toContain('Programming')
    expect(new Set(opsi.bidang).size).toBe(opsi.bidang.length)
    expect(opsi.prodi.length).toBeGreaterThan(0)
  })
})

describe('isolasi store', () => {
  it('memutasi hasil bacaan tidak memengaruhi data tersimpan', async () => {
    const lomba = await detailLomba('lomba-01', OPSI)
    lomba.nama = 'Diubah sembarangan'
    lomba.anggota.push({ nim: '999', nama: 'Penyusup' })

    const lagi = await detailLomba('lomba-01', OPSI)
    expect(lagi.nama).toContain('GEMASTIK')
    expect(lagi.anggota).toHaveLength(3)
  })

  it('resetDataMock memulihkan data ke kondisi awal', async () => {
    await hapusLomba('lomba-01', OPSI)
    resetDataMock(ACUAN)

    const hasil = await daftarLomba({ pageSize: 50 }, OPSI)
    expect(hasil.total).toBe(20)
  })
})

describe('userService', () => {
  it('menerima kredensial demo yang benar', async () => {
    const hasil = await login({ email: 'aulia.rahmawati@binus.ac.id', password: SANDI_DEMO })

    expect(hasil.user.role).toBe('mahasiswa')
    expect(hasil.user.nim).toBe('2502019876')
    expect(hasil.token).toContain('mhs-1')
  })

  it('tidak peduli huruf besar kecil pada email', async () => {
    const hasil = await login({ email: 'AULIA.RAHMAWATI@BINUS.AC.ID', password: SANDI_DEMO })
    expect(hasil.user.id).toBe('mhs-1')
  })

  it('menolak kata sandi yang salah dengan status 401', async () => {
    await expect(
      login({ email: 'aulia.rahmawati@binus.ac.id', password: 'salah' }),
    ).rejects.toMatchObject({ status: 401 })
  })

  it('menolak email yang tidak terdaftar', async () => {
    await expect(login({ email: 'bukan@binus.ac.id', password: SANDI_DEMO })).rejects.toMatchObject({
      status: 401,
    })
  })

  it('meminta email dan kata sandi diisi', async () => {
    await expect(login({ email: '', password: SANDI_DEMO })).rejects.toThrow(/Email/)
    await expect(login({ email: 'aulia.rahmawati@binus.ac.id', password: '' })).rejects.toThrow(
      /Kata sandi/,
    )
  })

  it('menyediakan daftar dosen pembimbing', async () => {
    const dosen = await daftarDosen()

    expect(dosen).toHaveLength(4)
    expect(dosen[0].role).toBe('dosen')
  })

  it('mencari nama pengguna secara sinkron', () => {
    expect(namaPengguna('dsn-1')).toContain('Pandu')
    expect(namaPengguna('tidak-ada')).toBe('-')
  })

  it('dosen atau admin dapat menolak dan menyetujui berkas', async () => {
    const awal = await detailLomba('lomba-01', OPSI)
    const berkasId = awal.berkas[0].id

    const ditolak = await verifikasiBerkas(
      'lomba-01',
      berkasId,
      {
        statusVerifikasi: 'ditolak',
        catatanPenolakan: 'Bukti pendaftaran buram, mohon unggah ulang.',
        diverifikasiOleh: 'Dosen Pandu',
      },
      OPSI,
    )

    const berkasDitolak = ditolak.berkas.find((b) => b.id === berkasId)
    expect(berkasDitolak.statusVerifikasi).toBe('ditolak')
    expect(berkasDitolak.catatanPenolakan).toBe('Bukti pendaftaran buram, mohon unggah ulang.')
    expect(ditolak.kelengkapan.adaDitolak).toBe(true)

    const diunggahUlang = await unggahUlangBerkas(
      'lomba-01',
      berkasId,
      {
        namaFile: 'bukti_pendaftaran_baru_jelas.pdf',
        mimeType: 'application/pdf',
        size: 102400,
        url: 'data:application/pdf;base64,mock',
      },
      OPSI,
    )

    const berkasBaru = diunggahUlang.berkas.find((b) => b.id === berkasId)
    expect(berkasBaru.namaFile).toBe('bukti_pendaftaran_baru_jelas.pdf')
    expect(berkasBaru.statusVerifikasi).toBe('menunggu')
    expect(berkasBaru.catatanPenolakan).toBeNull()

    const disetujui = await verifikasiBerkas(
      'lomba-01',
      berkasId,
      { statusVerifikasi: 'diterima', diverifikasiOleh: 'Dosen Pandu' },
      OPSI,
    )

    const berkasValid = disetujui.berkas.find((b) => b.id === berkasId)
    expect(berkasValid.statusVerifikasi).toBe('diterima')
  })
})
