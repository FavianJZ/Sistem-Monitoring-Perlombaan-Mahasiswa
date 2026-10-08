import {
  akhirBulan,
  akhirHari,
  awalBulan,
  awalHari,
  dalamRentang,
  selisihHari,
  toDate,
} from '@/lib/date'
import { CAPAIAN_LOMBA, JENIS_BERKAS, JENIS_TAHAPAN, STATUS_LOMBA } from '@/config/domain'

export const BERKAS_WAJIB = Object.entries(JENIS_BERKAS)
  .filter(([, meta]) => meta.wajib)
  .map(([tipe]) => tipe)

const URUTAN_TAHAPAN = JENIS_TAHAPAN.map((item) => item.value)

export function hitungKelengkapan(lomba) {
  const berkas = lomba?.berkas ?? []
  const tersedia = new Set(berkas.map((item) => item.tipe))
  const kurang = BERKAS_WAJIB.filter((tipe) => !tersedia.has(tipe))
  const ditolak = berkas.filter((item) => item.statusVerifikasi === 'ditolak')

  return {
    wajib: BERKAS_WAJIB.length,
    terunggah: BERKAS_WAJIB.length - kurang.length,
    lengkap: kurang.length === 0 && ditolak.length === 0,
    adaDitolak: ditolak.length > 0,
    ditolak,
    kurang,
    kurangLabel: kurang.map((tipe) => JENIS_BERKAS[tipe]?.label ?? tipe),
    persen: Math.round(((BERKAS_WAJIB.length - kurang.length) / BERKAS_WAJIB.length) * 100),
  }
}

export function tahapanTerurut(lomba) {
  return [...(lomba?.tahapan ?? [])]
    .filter((tahap) => tahap.tanggalMulai)
    .sort((a, b) => {
      const selisih = a.tanggalMulai.localeCompare(b.tanggalMulai)
      if (selisih !== 0) return selisih
      return URUTAN_TAHAPAN.indexOf(a.jenis) - URUTAN_TAHAPAN.indexOf(b.jenis)
    })
}

export function tahapanAktif(lomba, acuan = new Date()) {
  return (
    tahapanTerurut(lomba).find((tahap) =>
      dalamRentang(acuan, tahap.tanggalMulai, tahap.tanggalSelesai ?? tahap.tanggalMulai),
    ) ?? null
  )
}

export function tahapanBerikutnya(lomba, acuan = new Date()) {
  const batas = awalHari(acuan)

  return (
    tahapanTerurut(lomba).find((tahap) => {
      const akhir = akhirHari(tahap.tanggalSelesai ?? tahap.tanggalMulai)
      return akhir >= batas
    }) ?? null
  )
}

export function progresTahapan(lomba, acuan = new Date()) {
  const daftar = tahapanTerurut(lomba)
  const batas = awalHari(acuan)

  const lewat = daftar.filter((tahap) => {
    const akhir = akhirHari(tahap.tanggalSelesai ?? tahap.tanggalMulai)
    return akhir < batas
  }).length

  return {
    total: daftar.length,
    lewat,
    persen: daftar.length === 0 ? 0 : Math.round((lewat / daftar.length) * 100),
  }
}

export function tahapanTerakhir(lomba) {
  const daftar = tahapanTerurut(lomba)
  return daftar.length ? daftar[daftar.length - 1] : null
}

export function adaTahapanDiRentang(lomba, dari, sampai, jenisTahapan) {
  const batasAwal = dari ? awalHari(dari) : null
  const batasAkhir = sampai ? akhirHari(sampai) : null

  return tahapanTerurut(lomba).some((tahap) => {
    if (jenisTahapan && tahap.jenis !== jenisTahapan) return false

    const mulai = awalHari(tahap.tanggalMulai)
    const selesai = akhirHari(tahap.tanggalSelesai ?? tahap.tanggalMulai)
    if (!mulai || !selesai) return false

    if (batasAwal && selesai < batasAwal) return false
    if (batasAkhir && mulai > batasAkhir) return false
    return true
  })
}

export function rentangDariMode(filter = {}, acuan = new Date()) {
  const { mode = 'semua' } = filter

  if (mode === 'bulan-ini') {
    return { dari: awalBulan(acuan), sampai: akhirBulan(acuan) }
  }

  if (mode === 'tanggal') {
    const target = toDate(filter.tanggal)
    if (!target) return { dari: null, sampai: null }
    return { dari: awalHari(target), sampai: akhirHari(target) }
  }

  if (mode === 'rentang') {
    const dari = toDate(filter.dari)
    const sampai = toDate(filter.sampai)
    if (!dari && !sampai) return { dari: null, sampai: null }
    return {
      dari: dari ? awalHari(dari) : null,
      sampai: sampai ? akhirHari(sampai) : null,
    }
  }

  return { dari: null, sampai: null }
}

function normalkan(text) {
  return String(text ?? '').toLowerCase()
}

export function cocokPencarian(lomba, kataKunci) {
  const kunci = normalkan(kataKunci).trim()
  if (!kunci) return true

  const sumber = [
    lomba.nama,
    lomba.penyelenggara,
    lomba.namaTim,
    lomba.bidang,
    lomba.tingkat,
    ...(lomba.anggota ?? []).flatMap((anggota) => [anggota.nama, anggota.nim]),
  ]

  return sumber.some((nilai) => normalkan(nilai).includes(kunci))
}

export function filterLomba(items = [], filter = {}, acuan = new Date()) {
  const { dari, sampai } = rentangDariMode(filter, acuan)

  return items.filter((lomba) => {
    if (filter.createdBy && lomba.createdBy !== filter.createdBy) return false
    if (filter.dosenPembimbingId && lomba.dosenPembimbingId !== filter.dosenPembimbingId) {
      return false
    }
    if (filter.bidang && lomba.bidang !== filter.bidang) return false
    if (filter.tingkat && lomba.tingkat !== filter.tingkat) return false
    if (filter.jenis && lomba.jenis !== filter.jenis) return false
    if (filter.status && lomba.status !== filter.status) return false

    if (filter.capaian) {
      if (filter.capaian === 'belum') {
        if (lomba.hasil) return false
      } else if (lomba.hasil?.capaian !== filter.capaian) {
        return false
      }
    }

    if (filter.prodi) {
      const adaProdi = (lomba.anggota ?? []).some((anggota) => anggota.prodi === filter.prodi)
      if (!adaProdi) return false
    }

    if (filter.hanyaDokumenBelumLengkap && hitungKelengkapan(lomba).lengkap) return false

    if ((dari || sampai) && !adaTahapanDiRentang(lomba, dari, sampai, filter.jenisTahapan)) {
      return false
    }

    if (filter.jenisTahapan && !(dari || sampai)) {
      const punya = (lomba.tahapan ?? []).some((tahap) => tahap.jenis === filter.jenisTahapan)
      if (!punya) return false
    }

    return cocokPencarian(lomba, filter.search)
  })
}

const PEMBANDING = {
  nama: (a, b) => a.nama.localeCompare(b.nama, 'id-ID'),
  penyelenggara: (a, b) => a.penyelenggara.localeCompare(b.penyelenggara, 'id-ID'),
  bidang: (a, b) => a.bidang.localeCompare(b.bidang, 'id-ID'),
  tingkat: (a, b) => a.tingkat.localeCompare(b.tingkat, 'id-ID'),
  status: (a, b) =>
    Object.keys(STATUS_LOMBA).indexOf(a.status) - Object.keys(STATUS_LOMBA).indexOf(b.status),
  terbaru: (a, b) => String(b.createdAt).localeCompare(String(a.createdAt)),
  capaian: (a, b) => {
    const kiri = CAPAIAN_LOMBA[a.hasil?.capaian]?.peringkat ?? 99
    const kanan = CAPAIAN_LOMBA[b.hasil?.capaian]?.peringkat ?? 99
    return kiri - kanan
  },
}

export function urutkanLomba(items = [], { sort = 'terbaru', order = 'asc' } = {}, acuan = new Date()) {
  const arah = order === 'desc' ? -1 : 1
  const salinan = [...items]

  if (sort === 'tahapanTerdekat') {
    salinan.sort((a, b) => {
      const kiri = tahapanBerikutnya(a, acuan)?.tanggalMulai ?? '9999-12-31'
      const kanan = tahapanBerikutnya(b, acuan)?.tanggalMulai ?? '9999-12-31'
      return kiri.localeCompare(kanan) * arah
    })
    return salinan
  }

  const pembanding = PEMBANDING[sort] ?? PEMBANDING.terbaru
  salinan.sort((a, b) => pembanding(a, b) * arah)
  return salinan
}

export function paginasi(items = [], { page = 1, pageSize = 10 } = {}) {
  const total = items.length
  const totalHalaman = Math.max(1, Math.ceil(total / pageSize))
  const halaman = Math.min(Math.max(1, page), totalHalaman)
  const mulai = (halaman - 1) * pageSize

  return {
    items: items.slice(mulai, mulai + pageSize),
    total,
    page: halaman,
    pageSize,
    totalPages: totalHalaman,
  }
}

export function bolehLaporHasil(lomba, acuan = new Date()) {
  if (lomba?.hasil) {
    return { boleh: false, alasan: 'Hasil lomba ini sudah dilaporkan.', kode: 'SUDAH_LAPOR' }
  }

  const batas = awalHari(acuan)
  const pengumuman = (lomba?.tahapan ?? []).find((tahap) => tahap.jenis === 'pengumuman')

  if (pengumuman?.tanggalMulai) {
    const tanggal = akhirHari(pengumuman.tanggalSelesai ?? pengumuman.tanggalMulai)
    if (tanggal >= batas) {
      return {
        boleh: false,
        alasan: 'Pelaporan hasil dibuka setelah tanggal pengumuman pemenang.',
        kode: 'BELUM_WAKTUNYA',
        tanggalPengumuman: pengumuman.tanggalMulai,
      }
    }

    return { boleh: true, alasan: null, kode: 'SIAP' }
  }

  if (tahapanBerikutnya(lomba, acuan)) {
    return {
      boleh: false,
      alasan: 'Masih ada tahapan yang belum selesai.',
      kode: 'TAHAPAN_BERJALAN',
    }
  }

  return { boleh: true, alasan: null, kode: 'SIAP' }
}

export function ringkasLomba(lomba, acuan = new Date()) {
  const kelengkapan = hitungKelengkapan(lomba)
  const berikutnya = tahapanBerikutnya(lomba, acuan)

  return {
    ...lomba,
    kelengkapan,
    tahapanBerikutnya: berikutnya,
    tahapanAktif: tahapanAktif(lomba, acuan),
    sisaHariTahapan: berikutnya ? selisihHari(acuan, berikutnya.tanggalMulai) : null,
    jumlahAnggota: (lomba.anggota ?? []).length,
    pelaporan: bolehLaporHasil(lomba, acuan),
    progres: progresTahapan(lomba, acuan),
  }
}

function tambahHitungan(peta, kunci) {
  if (!kunci) return
  peta[kunci] = (peta[kunci] ?? 0) + 1
}

export function hitungStatistik(items = [], acuan = new Date()) {
  const awal = awalBulan(acuan)
  const akhir = akhirBulan(acuan)

  const perStatus = { terdaftar: 0, berlangsung: 0, selesai: 0 }
  const perTingkat = {}
  const perBidang = {}
  const perCapaian = {}
  const nimAktif = new Set()
  const nimSemua = new Set()

  let lombaBulanIni = 0
  let dokumenBelumLengkap = 0
  let totalPrestasi = 0

  for (const lomba of items) {
    tambahHitungan(perStatus, lomba.status)
    tambahHitungan(perTingkat, lomba.tingkat)
    tambahHitungan(perBidang, lomba.bidang)

    for (const anggota of lomba.anggota ?? []) {
      nimSemua.add(anggota.nim)
      if (lomba.status !== 'selesai') nimAktif.add(anggota.nim)
    }

    if (adaTahapanDiRentang(lomba, awal, akhir)) lombaBulanIni += 1
    if (!hitungKelengkapan(lomba).lengkap) dokumenBelumLengkap += 1

    if (lomba.hasil?.capaian) {
      tambahHitungan(perCapaian, lomba.hasil.capaian)
      if (lomba.hasil.capaian !== 'peserta') totalPrestasi += 1
    }
  }

  return {
    total: items.length,
    perStatus,
    perTingkat,
    perBidang,
    perCapaian,
    lombaBulanIni,
    dokumenBelumLengkap,
    totalPrestasi,
    mahasiswaAktif: nimAktif.size,
    mahasiswaTerlibat: nimSemua.size,
  }
}

export function agendaTerdekat(items = [], { limit = 6, acuan = new Date() } = {}) {
  const batas = awalHari(acuan)
  const agenda = []

  for (const lomba of items) {
    for (const tahap of tahapanTerurut(lomba)) {
      const akhir = akhirHari(tahap.tanggalSelesai ?? tahap.tanggalMulai)
      if (akhir < batas) continue

      agenda.push({
        lombaId: lomba.id,
        namaLomba: lomba.nama,
        namaTim: lomba.namaTim,
        tingkat: lomba.tingkat,
        bidang: lomba.bidang,
        tahap,
        sisaHari: selisihHari(acuan, tahap.tanggalMulai),
      })
    }
  }

  agenda.sort((a, b) => a.tahap.tanggalMulai.localeCompare(b.tahap.tanggalMulai))
  return limit ? agenda.slice(0, limit) : agenda
}

export function tahapanPerTanggal(items = [], { dari, sampai } = {}) {
  const peta = new Map()
  const batasAwal = dari ? awalHari(dari) : null
  const batasAkhir = sampai ? akhirHari(sampai) : null

  for (const lomba of items) {
    for (const tahap of tahapanTerurut(lomba)) {
      const mulai = awalHari(tahap.tanggalMulai)
      const selesai = awalHari(tahap.tanggalSelesai ?? tahap.tanggalMulai)
      if (!mulai || !selesai) continue

      for (const kursor = new Date(mulai); kursor <= selesai; kursor.setDate(kursor.getDate() + 1)) {
        if (batasAwal && kursor < batasAwal) continue
        if (batasAkhir && kursor > batasAkhir) continue

        const bulan = String(kursor.getMonth() + 1).padStart(2, '0')
        const hari = String(kursor.getDate()).padStart(2, '0')
        const iso = `${kursor.getFullYear()}-${bulan}-${hari}`

        if (!peta.has(iso)) peta.set(iso, [])
        peta.get(iso).push({
          lombaId: lomba.id,
          namaLomba: lomba.nama,
          namaTim: lomba.namaTim,
          bidang: lomba.bidang,
          tingkat: lomba.tingkat,
          tahap,
        })
      }
    }
  }

  return peta
}
