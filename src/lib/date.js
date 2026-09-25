/**
 * Utilitas tanggal berbahasa Indonesia.
 * Seluruh tanggal disimpan sebagai string ISO 'YYYY-MM-DD' agar aman
 * dipindahkan ke backend tanpa urusan zona waktu.
 */

const LOCALE = 'id-ID'

export const NAMA_BULAN = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
]

export const NAMA_HARI_SINGKAT = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

/** Mengubah nilai apa pun menjadi Date pada tengah hari lokal, atau null. */
export function toDate(value) {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value

  if (typeof value === 'string') {
    const cocok = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
    if (cocok) {
      const [, tahun, bulan, hari] = cocok
      return new Date(Number(tahun), Number(bulan) - 1, Number(hari))
    }
  }

  const hasil = new Date(value)
  return Number.isNaN(hasil.getTime()) ? null : hasil
}

/** Format 'YYYY-MM-DD' berdasarkan waktu lokal, bukan UTC. */
export function toISODate(value) {
  const date = toDate(value)
  if (!date) return null

  const bulan = String(date.getMonth() + 1).padStart(2, '0')
  const hari = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${bulan}-${hari}`
}

/** '24 Sep 2026', atau '24 September 2026' bila panjang. */
export function formatTanggal(value, { panjang = false } = {}) {
  const date = toDate(value)
  if (!date) return '-'

  return date.toLocaleDateString(LOCALE, {
    day: 'numeric',
    month: panjang ? 'long' : 'short',
    year: 'numeric',
  })
}

/** 'Kam, 24 Sep 2026' untuk agenda harian. */
export function formatTanggalDenganHari(value) {
  const date = toDate(value)
  if (!date) return '-'

  return date.toLocaleDateString(LOCALE, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** 'September 2026' untuk judul kalender. */
export function formatBulanTahun(value) {
  const date = toDate(value)
  if (!date) return '-'
  return `${NAMA_BULAN[date.getMonth()]} ${date.getFullYear()}`
}

/**
 * Menggabungkan tanggal mulai dan selesai menjadi satu teks ringkas.
 * Tanggal yang sama ditulis sekali, bulan yang sama tidak diulang.
 */
export function formatRentangTanggal(mulai, selesai) {
  const awal = toDate(mulai)
  const akhir = toDate(selesai)

  if (!awal && !akhir) return '-'
  if (!akhir || isSameDay(awal, akhir)) return formatTanggal(awal)
  if (!awal) return formatTanggal(akhir)

  const bulanSama = awal.getMonth() === akhir.getMonth() && awal.getFullYear() === akhir.getFullYear()
  if (bulanSama) {
    return `${awal.getDate()} - ${formatTanggal(akhir)}`
  }

  return `${formatTanggal(awal)} - ${formatTanggal(akhir)}`
}

export function isSameDay(a, b) {
  const kiri = toDate(a)
  const kanan = toDate(b)
  if (!kiri || !kanan) return false

  return (
    kiri.getFullYear() === kanan.getFullYear() &&
    kiri.getMonth() === kanan.getMonth() &&
    kiri.getDate() === kanan.getDate()
  )
}

export function awalHari(value) {
  const date = toDate(value)
  if (!date) return null
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function akhirHari(value) {
  const date = toDate(value)
  if (!date) return null
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
}

export function awalBulan(value) {
  const date = toDate(value)
  if (!date) return null
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function akhirBulan(value) {
  const date = toDate(value)
  if (!date) return null
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
}

export function tambahHari(value, jumlah) {
  const date = toDate(value)
  if (!date) return null
  const hasil = new Date(date)
  hasil.setDate(hasil.getDate() + jumlah)
  return hasil
}

export function tambahBulan(value, jumlah) {
  const date = toDate(value)
  if (!date) return null
  return new Date(date.getFullYear(), date.getMonth() + jumlah, 1)
}

/** Selisih hari kalender, positif bila `akhir` setelah `awal`. */
export function selisihHari(awal, akhir) {
  const kiri = awalHari(awal)
  const kanan = awalHari(akhir)
  if (!kiri || !kanan) return null

  const MS_PER_HARI = 24 * 60 * 60 * 1000
  return Math.round((kanan - kiri) / MS_PER_HARI)
}

/** Benar bila `value` berada di dalam rentang, batas ikut dihitung. */
export function dalamRentang(value, dari, sampai) {
  const target = awalHari(value)
  if (!target) return false

  const batasAwal = dari ? awalHari(dari) : null
  const batasAkhir = sampai ? akhirHari(sampai) : null

  if (batasAwal && target < batasAwal) return false
  if (batasAkhir && target > batasAkhir) return false
  return true
}

/** Teks relatif singkat: 'hari ini', 'besok', '3 hari lagi', '5 hari lalu'. */
export function jarakHari(value, acuan = new Date()) {
  const selisih = selisihHari(acuan, value)
  if (selisih === null) return '-'
  if (selisih === 0) return 'hari ini'
  if (selisih === 1) return 'besok'
  if (selisih === -1) return 'kemarin'
  return selisih > 0 ? `${selisih} hari lagi` : `${Math.abs(selisih)} hari lalu`
}

/**
 * Matriks 6x7 tanggal untuk tampilan kalender bulanan, dimulai hari Senin.
 * Menyertakan tanggal bulan sebelumnya dan sesudahnya sebagai pengisi.
 */
export function petakKalender(value) {
  const awal = awalBulan(value)
  if (!awal) return []

  const hariPertama = (awal.getDay() + 6) % 7
  const mulai = tambahHari(awal, -hariPertama)

  return Array.from({ length: 42 }, (_, index) => {
    const tanggal = tambahHari(mulai, index)
    return {
      tanggal,
      iso: toISODate(tanggal),
      bulanIni: tanggal.getMonth() === awal.getMonth(),
    }
  })
}
