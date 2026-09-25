import { jeda } from './delay'
import * as store from './mockStore'
import {
  agendaTerdekat,
  filterLomba,
  hitungKelengkapan,
  hitungStatistik,
  paginasi,
  ringkasLomba,
  tahapanPerTanggal,
  urutkanLomba,
} from './competitionQuery'
import { akhirBulan, awalBulan, toISODate } from '@/lib/date'

/**
 * Service data perlombaan.
 *
 * Komponen hanya boleh memakai fungsi di modul ini, tidak pernah
 * menyentuh data mock langsung. Saat backend siap, isi fungsi diganti
 * pemanggilan fetch tanpa mengubah pemanggilnya.
 */

class ServiceError extends Error {
  constructor(message, { status = 400, kode } = {}) {
    super(message)
    this.name = 'ServiceError'
    this.status = status
    this.kode = kode
  }
}

export { ServiceError }

function sekarang(opsi) {
  return opsi?.acuan ?? new Date()
}

/** Daftar lomba dengan filter, pengurutan, dan paginasi. */
export async function daftarLomba(filter = {}, opsi = {}) {
  await jeda(opsi.jeda)
  const acuan = sekarang(opsi)

  const tersaring = filterLomba(store.bacaSemua(), filter, acuan)
  const terurut = urutkanLomba(tersaring, filter, acuan)
  const halaman = paginasi(terurut, filter)

  return {
    ...halaman,
    items: halaman.items.map((lomba) => ringkasLomba(lomba, acuan)),
  }
}

/** Seluruh lomba yang cocok filter tanpa paginasi, untuk ekspor dan kalender. */
export async function semuaLombaTersaring(filter = {}, opsi = {}) {
  await jeda(opsi.jeda)
  const acuan = sekarang(opsi)

  const tersaring = filterLomba(store.bacaSemua(), filter, acuan)
  return urutkanLomba(tersaring, filter, acuan).map((lomba) => ringkasLomba(lomba, acuan))
}

export async function detailLomba(id, opsi = {}) {
  await jeda(opsi.jeda)

  const lomba = store.bacaSatu(id)
  if (!lomba) {
    throw new ServiceError(`Lomba ${id} tidak ditemukan.`, { status: 404, kode: 'LOMBA_TIDAK_ADA' })
  }

  return ringkasLomba(lomba, sekarang(opsi))
}

function bersihkanTahapan(tahapan = [], lombaId) {
  return tahapan
    .filter((tahap) => tahap?.tanggalMulai)
    .map((tahap, index) => ({
      id: tahap.id ?? `${lombaId}-thp-${index + 1}`,
      competitionId: lombaId,
      jenis: tahap.jenis,
      label: tahap.label ?? null,
      tanggalMulai: tahap.tanggalMulai,
      tanggalSelesai: tahap.tanggalSelesai ?? null,
    }))
}

function bersihkanAnggota(anggota = [], lombaId) {
  return anggota
    .filter((item) => item?.nim || item?.nama)
    .map((item, index) => ({
      id: item.id ?? `${lombaId}-ang-${index + 1}`,
      competitionId: lombaId,
      nim: String(item.nim ?? '').trim(),
      nama: String(item.nama ?? '').trim(),
      prodi: item.prodi ?? null,
      peran: item.peran ?? (index === 0 ? 'ketua' : 'anggota'),
    }))
}

function bersihkanBerkas(berkas = [], lombaId) {
  return berkas
    .filter((item) => item?.tipe)
    .map((item, index) => ({
      id: item.id ?? `${lombaId}-brk-${index + 1}`,
      competitionId: lombaId,
      tipe: item.tipe,
      namaFile: item.namaFile ?? null,
      mimeType: item.mimeType ?? null,
      size: item.size ?? null,
      url: item.url ?? null,
      diunggahPada: item.diunggahPada ?? toISODate(new Date()),
    }))
}

/** Menyimpan pendaftaran lomba baru. */
export async function buatLomba(payload, opsi = {}) {
  await jeda(opsi.jeda)

  if (!payload?.nama?.trim()) {
    throw new ServiceError('Nama perlombaan wajib diisi.', { kode: 'NAMA_KOSONG' })
  }
  if (!payload?.createdBy) {
    throw new ServiceError('Pemilik data tidak diketahui.', { kode: 'PEMILIK_KOSONG' })
  }

  const id = store.idLombaBaru()
  const record = {
    id,
    nama: payload.nama.trim(),
    penyelenggara: payload.penyelenggara?.trim() ?? '',
    bidang: payload.bidang ?? null,
    tingkat: payload.tingkat ?? null,
    jenis: payload.jenis ?? 'individu',
    namaTim: payload.jenis === 'tim' ? (payload.namaTim?.trim() ?? null) : null,
    dosenPembimbingId: payload.dosenPembimbingId ?? null,
    linkPublikasi: payload.linkPublikasi?.trim() || null,
    posterUrl: payload.posterUrl ?? null,
    status: payload.status ?? 'terdaftar',
    createdBy: payload.createdBy,
    createdAt: toISODate(sekarang(opsi)),
    anggota: bersihkanAnggota(payload.anggota, id),
    berkas: bersihkanBerkas(payload.berkas, id),
    tahapan: bersihkanTahapan(payload.tahapan, id),
    hasil: null,
  }

  store.tambah(record)
  return ringkasLomba(record, sekarang(opsi))
}

export async function perbaruiLomba(id, patch = {}, opsi = {}) {
  await jeda(opsi.jeda)

  const hasil = store.perbarui(id, (lomba) => ({
    ...lomba,
    ...patch,
    id: lomba.id,
    createdBy: lomba.createdBy,
    anggota: patch.anggota ? bersihkanAnggota(patch.anggota, id) : lomba.anggota,
    berkas: patch.berkas ? bersihkanBerkas(patch.berkas, id) : lomba.berkas,
    tahapan: patch.tahapan ? bersihkanTahapan(patch.tahapan, id) : lomba.tahapan,
  }))

  if (!hasil) {
    throw new ServiceError(`Lomba ${id} tidak ditemukan.`, { status: 404, kode: 'LOMBA_TIDAK_ADA' })
  }

  return ringkasLomba(hasil, sekarang(opsi))
}

/**
 * Menyimpan laporan hasil akhir dan menandai lomba selesai.
 * Berkas sertifikat atau foto yang disertakan akan ditambahkan.
 */
export async function laporkanHasil(id, laporan = {}, opsi = {}) {
  await jeda(opsi.jeda)

  if (!laporan.capaian) {
    throw new ServiceError('Capaian wajib dipilih.', { kode: 'CAPAIAN_KOSONG' })
  }

  const acuan = sekarang(opsi)
  const hasil = store.perbarui(id, (lomba) => {
    const berkasBaru = bersihkanBerkas(laporan.berkas ?? [], id).map((berkas, index) => ({
      ...berkas,
      id: `${id}-brk-hasil-${index + 1}`,
    }))

    return {
      ...lomba,
      status: 'selesai',
      berkas: [...lomba.berkas, ...berkasBaru],
      hasil: {
        id: `${id}-hasil`,
        competitionId: id,
        capaian: laporan.capaian,
        linkBerita: laporan.linkBerita?.trim() || null,
        dilaporkanPada: toISODate(acuan),
      },
    }
  })

  if (!hasil) {
    throw new ServiceError(`Lomba ${id} tidak ditemukan.`, { status: 404, kode: 'LOMBA_TIDAK_ADA' })
  }

  return ringkasLomba(hasil, acuan)
}

export async function hapusLomba(id, opsi = {}) {
  await jeda(opsi.jeda)

  const terhapus = store.hapus(id)
  if (!terhapus) {
    throw new ServiceError(`Lomba ${id} tidak ditemukan.`, { status: 404, kode: 'LOMBA_TIDAK_ADA' })
  }

  return { id }
}

/** Statistik agregat untuk kartu dashboard. */
export async function statistikLomba(filter = {}, opsi = {}) {
  await jeda(opsi.jeda)
  const acuan = sekarang(opsi)

  const tersaring = filterLomba(store.bacaSemua(), filter, acuan)
  return hitungStatistik(tersaring, acuan)
}

/** Agenda tahapan terdekat lintas lomba. */
export async function agendaLomba(filter = {}, opsi = {}) {
  await jeda(opsi.jeda)
  const acuan = sekarang(opsi)

  const tersaring = filterLomba(store.bacaSemua(), filter, acuan)
  return agendaTerdekat(tersaring, { limit: opsi.limit ?? 6, acuan })
}

/**
 * Peta tahapan per tanggal untuk satu bulan kalender.
 * Kunci peta berupa string ISO 'YYYY-MM-DD'.
 */
export async function kalenderLomba({ bulan, filter = {} } = {}, opsi = {}) {
  await jeda(opsi.jeda)
  const acuan = sekarang(opsi)
  const patokan = bulan ?? acuan

  const tersaring = filterLomba(store.bacaSemua(), { ...filter, mode: 'semua' }, acuan)
  const peta = tahapanPerTanggal(tersaring, {
    dari: awalBulan(patokan),
    sampai: akhirBulan(patokan),
  })

  return Object.fromEntries(peta)
}

/** Nilai unik yang tersedia di data, untuk mengisi dropdown filter. */
export async function opsiFilter(opsi = {}) {
  await jeda(opsi.jeda)
  const semua = store.bacaSemua()

  const ambilUnik = (kunci) =>
    [...new Set(semua.map((lomba) => lomba[kunci]).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, 'id-ID'),
    )

  return {
    bidang: ambilUnik('bidang'),
    tingkat: ambilUnik('tingkat'),
    prodi: [
      ...new Set(semua.flatMap((lomba) => (lomba.anggota ?? []).map((anggota) => anggota.prodi))),
    ]
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, 'id-ID')),
  }
}

/** Dipakai pengujian dan halaman debug untuk menyetel ulang data mock. */
export function resetDataMock(acuan) {
  return store.resetStore(acuan)
}

export { hitungKelengkapan }
