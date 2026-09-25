import { toISODate, tambahHari } from '@/lib/date'
import { posterDataUri } from '@/lib/posterPlaceholder'
import { MAHASISWA } from './users'

/**
 * Data mock perlombaan.
 *
 * Tanggal disusun relatif terhadap `acuan` (bawaannya hari ini) supaya
 * demo selalu punya lomba "bulan ini" kapan pun dibuka. Pengujian
 * memanggil `buatSeed` dengan acuan tetap agar hasilnya deterministik.
 */

const REKAN_TIM = [
  { nim: '2502021111', nama: 'Gilang Ramadhan', prodi: 'Teknik Informatika' },
  { nim: '2502022222', nama: 'Hana Puspita', prodi: 'Sistem Informasi' },
  { nim: '2502023333', nama: 'Ivan Kurniawan', prodi: 'Teknik Informatika' },
  { nim: '2502024444', nama: 'Jihan Salsabila', prodi: 'Desain Komunikasi Visual' },
  { nim: '2502025555', nama: 'Kevin Wijaya', prodi: 'Sistem Informasi' },
  { nim: '2502026666', nama: 'Laras Ayu Pertiwi', prodi: 'Manajemen' },
  { nim: '2502027777', nama: 'Miko Ardiansyah', prodi: 'Ilmu Komunikasi' },
  { nim: '2502028888', nama: 'Nadia Oktaviani', prodi: 'Akuntansi' },
  { nim: '2502029999', nama: 'Oscar Pratama', prodi: 'Teknik Informatika' },
  { nim: '2502020101', nama: 'Prita Anjani', prodi: 'Desain Komunikasi Visual' },
  { nim: '2502020202', nama: 'Rizky Hidayat', prodi: 'Manajemen' },
  { nim: '2502020303', nama: 'Salma Maulida', prodi: 'Ilmu Komunikasi' },
]

const BERKAS_CONTOH = {
  bukti_daftar: { namaFile: 'bukti-pendaftaran.pdf', mimeType: 'application/pdf', size: 384_512 },
  bukti_bayar: { namaFile: 'bukti-pembayaran.jpg', mimeType: 'image/jpeg', size: 612_340 },
  poster: { namaFile: 'poster-lomba.png', mimeType: 'image/png', size: 1_248_900 },
  sertifikat: { namaFile: 'sertifikat.pdf', mimeType: 'application/pdf', size: 502_118 },
  foto: { namaFile: 'dokumentasi-penghargaan.jpg', mimeType: 'image/jpeg', size: 1_904_222 },
}

/*
 * Offset tahapan dihitung dalam hari dari tanggal acuan.
 * Negatif berarti sudah lewat, positif berarti akan datang.
 */
const SPEC_LOMBA = [
  {
    nama: 'GEMASTIK XIX Divisi Pemrograman',
    penyelenggara: 'Pusat Prestasi Nasional, Kemdikbudristek',
    bidang: 'Programming',
    tingkat: 'Nasional',
    jenis: 'tim',
    namaTim: 'Sanca Digital',
    anggotaTambahan: 2,
    pemilik: 'mhs-1',
    dosenPembimbingId: 'dsn-1',
    linkPublikasi: 'https://gemastik.kemdikbud.go.id',
    status: 'berlangsung',
    berkas: ['bukti_daftar', 'bukti_bayar', 'poster'],
    tahapan: [
      { jenis: 'pendaftaran', mulai: -45, selesai: -20 },
      { jenis: 'tm', mulai: -12 },
      { jenis: 'penyisihan', mulai: -5, selesai: 3 },
      { jenis: 'semifinal', mulai: 18 },
      { jenis: 'final', mulai: 32 },
      { jenis: 'pengumuman', mulai: 34 },
    ],
  },
  {
    nama: 'COMPFEST 18 UI/UX Design Competition',
    penyelenggara: 'Fakultas Ilmu Komputer Universitas Indonesia',
    bidang: 'UI/UX',
    tingkat: 'Nasional',
    jenis: 'tim',
    namaTim: 'Pixel Perkasa',
    anggotaTambahan: 2,
    pemilik: 'mhs-3',
    dosenPembimbingId: 'dsn-4',
    linkPublikasi: 'https://compfest.id',
    status: 'berlangsung',
    berkas: ['bukti_daftar', 'bukti_bayar', 'poster'],
    tahapan: [
      { jenis: 'pendaftaran', mulai: -60, selesai: -30 },
      { jenis: 'tm', mulai: -25 },
      { jenis: 'penyisihan', mulai: -24, selesai: -10 },
      { jenis: 'semifinal', mulai: 1 },
      { jenis: 'final', mulai: 15 },
      { jenis: 'pengumuman', mulai: 16 },
    ],
  },
  {
    nama: 'ICPC Asia Jakarta Regional Contest',
    penyelenggara: 'ICPC Foundation',
    bidang: 'Programming',
    tingkat: 'Internasional',
    jenis: 'tim',
    namaTim: 'Garuda Coders',
    anggotaTambahan: 2,
    pemilik: 'mhs-1',
    dosenPembimbingId: 'dsn-1',
    linkPublikasi: 'https://icpc.global',
    status: 'terdaftar',
    berkas: ['bukti_daftar', 'bukti_bayar'],
    tahapan: [
      { jenis: 'pendaftaran', mulai: 2, selesai: 25 },
      { jenis: 'tm', mulai: 30 },
      { jenis: 'penyisihan', mulai: 40 },
      { jenis: 'final', mulai: 55 },
      { jenis: 'pengumuman', mulai: 56 },
    ],
  },
  {
    nama: 'Business Plan Competition Binus Festival',
    penyelenggara: 'Binus University',
    bidang: 'Bisnis',
    tingkat: 'Regional',
    jenis: 'tim',
    namaTim: 'Nusantara Venture',
    anggotaTambahan: 3,
    pemilik: 'mhs-5',
    dosenPembimbingId: 'dsn-2',
    linkPublikasi: 'https://binus.ac.id/festival',
    status: 'selesai',
    berkas: ['bukti_daftar', 'bukti_bayar', 'poster', 'sertifikat', 'foto'],
    hasil: { capaian: 'juara_2', linkBerita: 'https://binus.ac.id/berita/bpc-2026', selisihLapor: 2 },
    tahapan: [
      { jenis: 'pendaftaran', mulai: -150, selesai: -130 },
      { jenis: 'tm', mulai: -125 },
      { jenis: 'penyisihan', mulai: -120, selesai: -110 },
      { jenis: 'semifinal', mulai: -100 },
      { jenis: 'final', mulai: -95 },
      { jenis: 'pengumuman', mulai: -93 },
    ],
  },
  {
    nama: 'Hackathon Bank Indonesia Digital Rupiah',
    penyelenggara: 'Bank Indonesia',
    bidang: 'Programming',
    tingkat: 'Nasional',
    jenis: 'tim',
    namaTim: 'Rupiah Labs',
    anggotaTambahan: 3,
    pemilik: 'mhs-2',
    dosenPembimbingId: 'dsn-3',
    linkPublikasi: 'https://www.bi.go.id/hackathon',
    status: 'selesai',
    berkas: ['bukti_daftar', 'bukti_bayar', 'poster', 'sertifikat', 'foto'],
    hasil: { capaian: 'juara_1', linkBerita: 'https://www.bi.go.id/berita/hackathon-2026', selisihLapor: 3 },
    tahapan: [
      { jenis: 'pendaftaran', mulai: -110, selesai: -95 },
      { jenis: 'tm', mulai: -90 },
      { jenis: 'penyisihan', mulai: -88, selesai: -80 },
      { jenis: 'final', mulai: -70 },
      { jenis: 'pengumuman', mulai: -68 },
    ],
  },
  {
    nama: 'Lomba Karya Tulis Ilmiah Nasional Unair',
    penyelenggara: 'Universitas Airlangga',
    bidang: 'Karya Tulis Ilmiah',
    tingkat: 'Nasional',
    jenis: 'individu',
    pemilik: 'mhs-4',
    dosenPembimbingId: 'dsn-2',
    linkPublikasi: 'https://unair.ac.id/lktin',
    status: 'selesai',
    berkas: ['bukti_daftar', 'bukti_bayar', 'sertifikat'],
    hasil: { capaian: 'finalis', selisihLapor: 5 },
    tahapan: [
      { jenis: 'pendaftaran', mulai: -200, selesai: -180 },
      { jenis: 'penyisihan', mulai: -175, selesai: -165 },
      { jenis: 'final', mulai: -150 },
      { jenis: 'pengumuman', mulai: -148 },
    ],
  },
  {
    nama: 'Kompetisi Debat Bahasa Indonesia Antar Kampus',
    penyelenggara: 'Kementerian Pemuda dan Olahraga',
    bidang: 'Debat',
    tingkat: 'Nasional',
    jenis: 'tim',
    namaTim: 'Lisan Merdeka',
    anggotaTambahan: 2,
    pemilik: 'mhs-6',
    dosenPembimbingId: 'dsn-2',
    linkPublikasi: 'https://kemenpora.go.id/debat',
    status: 'berlangsung',
    berkas: ['bukti_daftar', 'bukti_bayar', 'poster'],
    tahapan: [
      { jenis: 'pendaftaran', mulai: -30, selesai: -14 },
      { jenis: 'tm', mulai: -7 },
      { jenis: 'penyisihan', mulai: -2, selesai: 1 },
      { jenis: 'semifinal', mulai: 6 },
      { jenis: 'final', mulai: 7 },
      { jenis: 'pengumuman', mulai: 8 },
    ],
  },
  {
    nama: 'Turnamen Futsal LIMA Jakarta',
    penyelenggara: 'Liga Mahasiswa (LIMA) Futsal',
    bidang: 'Olahraga',
    tingkat: 'Regional',
    jenis: 'tim',
    namaTim: 'Binus Warriors',
    anggotaTambahan: 3,
    pemilik: 'mhs-4',
    dosenPembimbingId: 'dsn-3',
    linkPublikasi: 'https://ligamahasiswa.co.id',
    status: 'berlangsung',
    berkas: ['bukti_daftar', 'bukti_bayar'],
    tahapan: [
      { jenis: 'pendaftaran', mulai: -50, selesai: -35 },
      { jenis: 'tm', mulai: -20 },
      { jenis: 'penyisihan', mulai: -18, selesai: 5 },
      { jenis: 'final', mulai: 12 },
      { jenis: 'pengumuman', mulai: 12 },
    ],
  },
  {
    nama: 'Google Solution Challenge',
    penyelenggara: 'Google Developers',
    bidang: 'Programming',
    tingkat: 'Internasional',
    jenis: 'tim',
    namaTim: 'Solve for Nusantara',
    anggotaTambahan: 3,
    pemilik: 'mhs-1',
    dosenPembimbingId: 'dsn-1',
    linkPublikasi: 'https://developers.google.com/community/gdsc-solution-challenge',
    status: 'berlangsung',
    // Bukti pembayaran belum diunggah: dipakai menguji indikator kelengkapan.
    berkas: ['bukti_daftar', 'poster'],
    tahapan: [
      { jenis: 'pendaftaran', mulai: -70, selesai: -40 },
      { jenis: 'penyisihan', mulai: -35, selesai: 10 },
      { jenis: 'semifinal', mulai: 25 },
      { jenis: 'final', mulai: 45 },
      { jenis: 'pengumuman', mulai: 50 },
    ],
  },
  {
    nama: 'Festival Film Pendek Mahasiswa Nasional',
    penyelenggara: 'Kementerian Pendidikan dan Kebudayaan',
    bidang: 'Seni',
    tingkat: 'Nasional',
    jenis: 'tim',
    namaTim: 'Layar Kampus',
    anggotaTambahan: 2,
    pemilik: 'mhs-6',
    dosenPembimbingId: 'dsn-4',
    linkPublikasi: 'https://kemdikbud.go.id/ffpm',
    status: 'terdaftar',
    // Bukti pembayaran belum diunggah.
    berkas: ['bukti_daftar', 'poster'],
    tahapan: [
      { jenis: 'pendaftaran', mulai: 5, selesai: 35 },
      { jenis: 'tm', mulai: 40 },
      { jenis: 'penyisihan', mulai: 41, selesai: 60 },
      { jenis: 'final', mulai: 75 },
      { jenis: 'pengumuman', mulai: 76 },
    ],
  },
  {
    nama: 'Data Science Competition Telkom Indonesia',
    penyelenggara: 'Telkom Indonesia',
    bidang: 'Riset',
    tingkat: 'Nasional',
    jenis: 'individu',
    pemilik: 'mhs-2',
    dosenPembimbingId: 'dsn-3',
    linkPublikasi: 'https://digitalamoeba.id/competition',
    status: 'selesai',
    berkas: ['bukti_daftar', 'bukti_bayar', 'sertifikat', 'foto'],
    hasil: { capaian: 'juara_3', linkBerita: 'https://telkom.co.id/berita/dsc-2026', selisihLapor: 1 },
    tahapan: [
      { jenis: 'pendaftaran', mulai: -90, selesai: -75 },
      { jenis: 'penyisihan', mulai: -70, selesai: -60 },
      { jenis: 'final', mulai: -50 },
      { jenis: 'pengumuman', mulai: -48 },
    ],
  },
  {
    nama: 'UX Research Sprint Tokopedia Campus',
    penyelenggara: 'Tokopedia',
    bidang: 'UI/UX',
    tingkat: 'Nasional',
    jenis: 'individu',
    pemilik: 'mhs-3',
    dosenPembimbingId: 'dsn-4',
    linkPublikasi: 'https://tokopedia.com/campus',
    status: 'selesai',
    berkas: ['bukti_daftar', 'bukti_bayar', 'sertifikat'],
    hasil: { capaian: 'peserta', selisihLapor: 4 },
    tahapan: [
      { jenis: 'pendaftaran', mulai: -140, selesai: -125 },
      { jenis: 'penyisihan', mulai: -120, selesai: -115 },
      { jenis: 'final', mulai: -105 },
      { jenis: 'pengumuman', mulai: -103 },
    ],
  },
  {
    nama: 'Olimpiade Akuntansi Nasional Brawijaya',
    penyelenggara: 'Universitas Brawijaya',
    bidang: 'Bisnis',
    tingkat: 'Nasional',
    jenis: 'individu',
    pemilik: 'mhs-5',
    dosenPembimbingId: 'dsn-2',
    linkPublikasi: 'https://ub.ac.id/olimpiade-akuntansi',
    status: 'selesai',
    berkas: ['bukti_daftar', 'bukti_bayar', 'sertifikat'],
    hasil: { capaian: 'harapan', selisihLapor: 6 },
    tahapan: [
      { jenis: 'pendaftaran', mulai: -170, selesai: -155 },
      { jenis: 'penyisihan', mulai: -150, selesai: -145 },
      { jenis: 'semifinal', mulai: -135 },
      { jenis: 'final', mulai: -130 },
      { jenis: 'pengumuman', mulai: -128 },
    ],
  },
  {
    nama: 'Capture The Flag Cyber Jawara',
    penyelenggara: 'Badan Siber dan Sandi Negara',
    bidang: 'Programming',
    tingkat: 'Nasional',
    jenis: 'tim',
    namaTim: 'Benteng Siber',
    anggotaTambahan: 2,
    pemilik: 'mhs-1',
    dosenPembimbingId: 'dsn-1',
    linkPublikasi: 'https://cyberjawara.id',
    status: 'terdaftar',
    // Bukti pendaftaran resmi belum diunggah.
    berkas: ['bukti_bayar'],
    tahapan: [
      { jenis: 'pendaftaran', mulai: -3, selesai: 20 },
      { jenis: 'tm', mulai: 26 },
      { jenis: 'penyisihan', mulai: 33 },
      { jenis: 'final', mulai: 48 },
      { jenis: 'pengumuman', mulai: 49 },
    ],
  },
  {
    nama: 'Lomba Esai Ekonomi Digital UGM',
    penyelenggara: 'Universitas Gadjah Mada',
    bidang: 'Karya Tulis Ilmiah',
    tingkat: 'Nasional',
    jenis: 'individu',
    pemilik: 'mhs-5',
    dosenPembimbingId: 'dsn-2',
    linkPublikasi: 'https://ugm.ac.id/lomba-esai',
    status: 'berlangsung',
    berkas: ['bukti_daftar', 'bukti_bayar'],
    tahapan: [
      { jenis: 'pendaftaran', mulai: -25, selesai: -8 },
      { jenis: 'penyisihan', mulai: -7, selesai: 4 },
      { jenis: 'pengumuman', mulai: 20 },
    ],
  },
  {
    nama: 'Asian Robotics Competition',
    penyelenggara: 'Asian Robotics League',
    bidang: 'Riset',
    tingkat: 'Internasional',
    jenis: 'tim',
    namaTim: 'Mekatronika Nusantara',
    anggotaTambahan: 3,
    pemilik: 'mhs-4',
    dosenPembimbingId: 'dsn-3',
    linkPublikasi: 'https://asianroboticsleague.org',
    status: 'terdaftar',
    berkas: ['bukti_daftar', 'bukti_bayar', 'poster'],
    tahapan: [
      { jenis: 'pendaftaran', mulai: 10, selesai: 45 },
      { jenis: 'tm', mulai: 55 },
      { jenis: 'penyisihan', mulai: 70 },
      { jenis: 'semifinal', mulai: 85 },
      { jenis: 'final', mulai: 90 },
      { jenis: 'pengumuman', mulai: 92 },
    ],
  },
  {
    nama: 'Kompetisi Poster Ilmiah Kesehatan',
    penyelenggara: 'Universitas Indonesia',
    bidang: 'Seni',
    tingkat: 'Regional',
    jenis: 'individu',
    pemilik: 'mhs-3',
    dosenPembimbingId: 'dsn-4',
    linkPublikasi: 'https://ui.ac.id/poster-ilmiah',
    status: 'selesai',
    berkas: ['bukti_daftar', 'bukti_bayar', 'sertifikat'],
    hasil: { capaian: 'peserta', selisihLapor: 8 },
    tahapan: [
      { jenis: 'pendaftaran', mulai: -260, selesai: -245 },
      { jenis: 'penyisihan', mulai: -240, selesai: -235 },
      { jenis: 'pengumuman', mulai: -225 },
    ],
  },
  {
    nama: 'Startup Pitch Day Binus Incubator',
    penyelenggara: 'Binus Incubator',
    bidang: 'Bisnis',
    tingkat: 'Regional',
    jenis: 'tim',
    namaTim: 'Tumbuh Bersama',
    anggotaTambahan: 2,
    pemilik: 'mhs-5',
    dosenPembimbingId: 'dsn-2',
    linkPublikasi: 'https://binus.ac.id/incubator',
    status: 'berlangsung',
    berkas: ['bukti_daftar', 'bukti_bayar', 'poster'],
    tahapan: [
      { jenis: 'pendaftaran', mulai: -20, selesai: -6 },
      { jenis: 'tm', mulai: -3 },
      { jenis: 'penyisihan', mulai: 0, selesai: 2 },
      { jenis: 'final', mulai: 9 },
      { jenis: 'pengumuman', mulai: 9 },
    ],
  },
  {
    nama: 'Kejuaraan Bulu Tangkis Mahasiswa DKI',
    penyelenggara: 'BAPOMI DKI Jakarta',
    bidang: 'Olahraga',
    tingkat: 'Regional',
    jenis: 'individu',
    pemilik: 'mhs-6',
    dosenPembimbingId: 'dsn-3',
    linkPublikasi: 'https://bapomi-dki.or.id',
    status: 'selesai',
    berkas: ['bukti_daftar', 'bukti_bayar', 'sertifikat', 'foto'],
    hasil: { capaian: 'juara_1', linkBerita: 'https://bapomi-dki.or.id/berita/2026', selisihLapor: 2 },
    tahapan: [
      { jenis: 'pendaftaran', mulai: -80, selesai: -65 },
      { jenis: 'tm', mulai: -60 },
      { jenis: 'penyisihan', mulai: -58, selesai: -55 },
      { jenis: 'final', mulai: -52 },
      { jenis: 'pengumuman', mulai: -52 },
    ],
  },
  {
    nama: 'National Marketing Case Competition',
    penyelenggara: 'Universitas Padjadjaran',
    bidang: 'Bisnis',
    tingkat: 'Nasional',
    jenis: 'tim',
    namaTim: 'Pasar Cerdas',
    anggotaTambahan: 2,
    pemilik: 'mhs-1',
    dosenPembimbingId: 'dsn-2',
    linkPublikasi: 'https://unpad.ac.id/nmcc',
    status: 'terdaftar',
    // Kedua bukti wajib belum diunggah.
    berkas: [],
    tahapan: [
      { jenis: 'pendaftaran', mulai: 1, selesai: 18 },
      { jenis: 'tm', mulai: 22 },
      { jenis: 'penyisihan', mulai: 23, selesai: 30 },
      { jenis: 'final', mulai: 44 },
      { jenis: 'pengumuman', mulai: 45 },
    ],
  },
]

function cariMahasiswa(id) {
  return MAHASISWA.find((item) => item.id === id)
}

function buatAnggota(spec, lombaId) {
  const ketua = cariMahasiswa(spec.pemilik)
  const anggota = [
    {
      id: `${lombaId}-ang-1`,
      competitionId: lombaId,
      nim: ketua.nim,
      nama: ketua.nama,
      prodi: ketua.prodi,
      peran: 'ketua',
    },
  ]

  if (spec.jenis !== 'tim') return anggota

  const jumlah = spec.anggotaTambahan ?? 0
  const mulai = Math.abs(spec.nama.length) % REKAN_TIM.length

  for (let index = 0; index < jumlah; index += 1) {
    const rekan = REKAN_TIM[(mulai + index) % REKAN_TIM.length]
    anggota.push({
      id: `${lombaId}-ang-${index + 2}`,
      competitionId: lombaId,
      nim: rekan.nim,
      nama: rekan.nama,
      prodi: rekan.prodi,
      peran: 'anggota',
    })
  }

  return anggota
}

function buatBerkas(spec, lombaId, acuan, tanggalUnggah) {
  return (spec.berkas ?? []).map((tipe, index) => ({
    id: `${lombaId}-brk-${index + 1}`,
    competitionId: lombaId,
    tipe,
    ...BERKAS_CONTOH[tipe],
    url: null,
    diunggahPada: tanggalUnggah,
  }))
}

function buatTahapan(spec, lombaId, acuan) {
  return spec.tahapan.map((tahap, index) => ({
    id: `${lombaId}-thp-${index + 1}`,
    competitionId: lombaId,
    jenis: tahap.jenis,
    label: tahap.label ?? null,
    tanggalMulai: toISODate(tambahHari(acuan, tahap.mulai)),
    tanggalSelesai:
      tahap.selesai === undefined ? null : toISODate(tambahHari(acuan, tahap.selesai)),
  }))
}

function buatSatuLomba(spec, index, acuan) {
  const id = `lomba-${String(index + 1).padStart(2, '0')}`
  const tahapan = buatTahapan(spec, id, acuan)
  const pendaftaran = spec.tahapan.find((tahap) => tahap.jenis === 'pendaftaran')
  const dibuatPada = toISODate(tambahHari(acuan, (pendaftaran?.mulai ?? 0) - 2))
  const pengumuman = spec.tahapan.find((tahap) => tahap.jenis === 'pengumuman')

  const punyaPoster = (spec.berkas ?? []).includes('poster')

  return {
    id,
    nama: spec.nama,
    penyelenggara: spec.penyelenggara,
    bidang: spec.bidang,
    tingkat: spec.tingkat,
    jenis: spec.jenis,
    namaTim: spec.jenis === 'tim' ? spec.namaTim : null,
    dosenPembimbingId: spec.dosenPembimbingId,
    linkPublikasi: spec.linkPublikasi ?? null,
    posterUrl: punyaPoster
      ? posterDataUri({
          nama: spec.nama,
          bidang: spec.bidang,
          tingkat: spec.tingkat,
          seed: index,
        })
      : null,
    status: spec.status,
    createdBy: spec.pemilik,
    createdAt: dibuatPada,
    anggota: buatAnggota(spec, id),
    berkas: buatBerkas(spec, id, acuan, dibuatPada),
    tahapan,
    hasil: spec.hasil
      ? {
          id: `${id}-hasil`,
          competitionId: id,
          capaian: spec.hasil.capaian,
          linkBerita: spec.hasil.linkBerita ?? null,
          dilaporkanPada: toISODate(
            tambahHari(acuan, (pengumuman?.mulai ?? 0) + (spec.hasil.selisihLapor ?? 1)),
          ),
        }
      : null,
  }
}

/** Menghasilkan salinan data awal yang baru setiap kali dipanggil. */
export function buatSeed(acuan = new Date()) {
  return SPEC_LOMBA.map((spec, index) => buatSatuLomba(spec, index, acuan))
}

export const JUMLAH_LOMBA_SEED = SPEC_LOMBA.length
