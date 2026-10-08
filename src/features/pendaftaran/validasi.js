

export const NIM_POLA = /^\d{10}$/

function kosong(nilai) {
  return !String(nilai ?? '').trim()
}

export function validasiDetailUmum(draft = {}) {
  const error = {}

  if (kosong(draft.nama)) error.nama = 'Nama perlombaan wajib diisi.'
  if (kosong(draft.penyelenggara)) error.penyelenggara = 'Instansi penyelenggara wajib diisi.'
  if (kosong(draft.bidang)) error.bidang = 'Bidang lomba wajib dipilih.'
  if (kosong(draft.tingkat)) error.tingkat = 'Tingkat lomba wajib dipilih.'
  if (draft.jenis === 'tim' && kosong(draft.namaTim)) {
    error.namaTim = 'Nama tim wajib diisi untuk lomba kelompok.'
  }

  return { valid: Object.keys(error).length === 0, error }
}

export function validasiAnggota(draft = {}) {
  if (draft.jenis !== 'tim') return { valid: true, error: {}, anggota: [] }

  const daftar = draft.anggota ?? []
  const anggota = daftar.map(() => ({}))
  let umum

  if (daftar.length < 2) {
    umum = 'Lomba kelompok membutuhkan minimal satu anggota selain ketua tim.'
  }

  daftar.forEach((item, index) => {
    if (kosong(item.nama)) anggota[index].nama = 'Nama lengkap wajib diisi.'

    if (kosong(item.nim)) {
      anggota[index].nim = 'NIM wajib diisi.'
    } else if (!NIM_POLA.test(String(item.nim).trim())) {
      anggota[index].nim = 'NIM harus 10 angka.'
    }

    if (kosong(item.prodi)) anggota[index].prodi = 'Program studi wajib dipilih.'
  })

  const terlihat = new Map()
  daftar.forEach((item, index) => {
    const nim = String(item.nim ?? '').trim()
    if (!nim) return

    if (terlihat.has(nim)) {
      anggota[index].nim = 'NIM ini sudah dipakai anggota lain.'
    } else {
      terlihat.set(nim, index)
    }
  })

  const adaErrorBaris = anggota.some((baris) => Object.keys(baris).length > 0)

  return {
    valid: !umum && !adaErrorBaris,
    error: umum ? { umum } : {},
    anggota,
  }
}

export function validasiBukti(draft = {}) {
  const error = {}
  const berkas = draft.berkas ?? {}

  if (!berkas.bukti_daftar) error.bukti_daftar = 'Bukti pendaftaran resmi wajib diunggah.'
  if (!berkas.bukti_bayar) {
    error.bukti_bayar = 'Bukti pembayaran atau konfirmasi keikutsertaan wajib diunggah.'
  }

  return { valid: Object.keys(error).length === 0, error }
}

export function validasiPoster(draft = {}) {
  const error = {}
  const adaPoster = Boolean(draft.berkas?.poster)
  const adaTautan = !kosong(draft.linkPublikasi)

  if (!adaPoster && !adaTautan) {
    error.umum = 'Unggah poster lomba atau cantumkan tautan publikasi resminya.'
  }

  if (adaTautan && !/^https?:\/\/.+/i.test(String(draft.linkPublikasi).trim())) {
    error.linkPublikasi = 'Tautan harus dimulai dengan http:// atau https://'
  }

  return { valid: Object.keys(error).length === 0, error }
}

export function validasiTimeline(draft = {}) {
  const daftar = draft.tahapan ?? []
  const tahapan = daftar.map(() => ({}))
  let umum

  const adaTerisi = daftar.some((tahap) => tahap.tanggalMulai)
  if (!adaTerisi) {
    umum = 'Isi minimal satu tanggal tahapan supaya lomba bisa dipantau.'
  }

  daftar.forEach((tahap, index) => {

    if (tahap.jenis === 'kustom' && tahap.tanggalMulai && kosong(tahap.label)) {
      tahapan[index].label = 'Beri nama tahapan tambahan ini.'
    }

    if (!tahap.tanggalMulai && tahap.tanggalSelesai) {
      tahapan[index].tanggalMulai = 'Isi tanggal mulai lebih dulu.'
      return
    }

    if (
      tahap.tanggalMulai &&
      tahap.tanggalSelesai &&
      tahap.tanggalSelesai < tahap.tanggalMulai
    ) {
      tahapan[index].tanggalSelesai = 'Tanggal selesai tidak boleh sebelum tanggal mulai.'
    }
  })

  const adaErrorBaris = tahapan.some((baris) => Object.keys(baris).length > 0)

  return {
    valid: !umum && !adaErrorBaris,
    error: umum ? { umum } : {},
    tahapan,
  }
}

const VALIDATOR = {
  detail: validasiDetailUmum,
  anggota: validasiAnggota,
  bukti: validasiBukti,
  poster: validasiPoster,
  timeline: validasiTimeline,
}

export function validasiLangkah(idLangkah, draft) {
  const validator = VALIDATOR[idLangkah]
  if (!validator) return { valid: true, error: {} }
  return validator(draft)
}
