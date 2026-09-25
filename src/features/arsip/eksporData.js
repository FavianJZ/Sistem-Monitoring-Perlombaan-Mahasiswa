import { formatTanggal } from '@/lib/date'
import { CAPAIAN_LOMBA, JENIS_KEIKUTSERTAAN } from '@/config/domain'
import { namaPengguna } from '@/services/userService'

/**
 * Penyusunan data rekapitulasi untuk diekspor.
 *
 * Seluruh fungsi di sini murni dan tidak menyentuh berkas, sehingga isi
 * laporan bisa diuji tanpa benar-benar mengunduh apa pun.
 */

/** Definisi kolom laporan. Urutannya sama untuk CSV, XLSX, maupun PDF. */
export const KOLOM_EKSPOR = [
  { kunci: 'nama', judul: 'Nama Perlombaan', lebar: 38, ambil: (lomba) => lomba.nama },
  {
    kunci: 'penyelenggara',
    judul: 'Penyelenggara',
    lebar: 28,
    ambil: (lomba) => lomba.penyelenggara,
  },
  { kunci: 'bidang', judul: 'Bidang', lebar: 18, ambil: (lomba) => lomba.bidang },
  { kunci: 'tingkat', judul: 'Tingkat', lebar: 14, ambil: (lomba) => lomba.tingkat },
  {
    kunci: 'jenis',
    judul: 'Jenis',
    lebar: 14,
    ambil: (lomba) =>
      JENIS_KEIKUTSERTAAN.find((item) => item.value === lomba.jenis)?.label ?? lomba.jenis,
  },
  { kunci: 'namaTim', judul: 'Nama Tim', lebar: 22, ambil: (lomba) => lomba.namaTim ?? '-' },
  {
    kunci: 'ketua',
    judul: 'Ketua / Peserta',
    lebar: 24,
    ambil: (lomba) => lomba.anggota?.[0]?.nama ?? '-',
  },
  { kunci: 'nim', judul: 'NIM', lebar: 14, ambil: (lomba) => lomba.anggota?.[0]?.nim ?? '-' },
  {
    kunci: 'prodi',
    judul: 'Program Studi',
    lebar: 26,
    ambil: (lomba) => lomba.anggota?.[0]?.prodi ?? '-',
  },
  {
    kunci: 'anggota',
    judul: 'Anggota Lain',
    lebar: 34,
    ambil: (lomba) =>
      (lomba.anggota ?? [])
        .slice(1)
        .map((anggota) => anggota.nama)
        .join(', ') || '-',
  },
  {
    kunci: 'pembimbing',
    judul: 'Dosen Pembimbing',
    lebar: 30,
    ambil: (lomba) => (lomba.dosenPembimbingId ? namaPengguna(lomba.dosenPembimbingId) : '-'),
  },
  {
    kunci: 'capaian',
    judul: 'Capaian',
    lebar: 16,
    ambil: (lomba) => CAPAIAN_LOMBA[lomba.hasil?.capaian]?.label ?? 'Belum dilaporkan',
  },
  {
    kunci: 'pengumuman',
    judul: 'Tanggal Pengumuman',
    lebar: 20,
    ambil: (lomba) => {
      const tahap = (lomba.tahapan ?? []).find((item) => item.jenis === 'pengumuman')
      return tahap?.tanggalMulai ? formatTanggal(tahap.tanggalMulai) : '-'
    },
  },
  {
    kunci: 'dilaporkan',
    judul: 'Dilaporkan Pada',
    lebar: 18,
    ambil: (lomba) =>
      lomba.hasil?.dilaporkanPada ? formatTanggal(lomba.hasil.dilaporkanPada) : '-',
  },
  {
    kunci: 'sertifikat',
    judul: 'Sertifikat',
    lebar: 14,
    ambil: (lomba) =>
      (lomba.berkas ?? []).some((berkas) => berkas.tipe === 'sertifikat') ? 'Ada' : 'Belum ada',
  },
  {
    kunci: 'berita',
    judul: 'Tautan Berita',
    lebar: 34,
    ambil: (lomba) => lomba.hasil?.linkBerita ?? '-',
  },
]

/** Kolom yang cukup ringkas untuk dimuat pada PDF berorientasi lanskap. */
export const KOLOM_PDF = [
  'nama',
  'bidang',
  'tingkat',
  'ketua',
  'nim',
  'prodi',
  'capaian',
  'sertifikat',
]

export function judulKolom(kolom = KOLOM_EKSPOR) {
  return kolom.map((item) => item.judul)
}

/** Mengubah daftar lomba menjadi baris berisi teks siap tulis. */
export function barisEkspor(items = [], kolom = KOLOM_EKSPOR) {
  return items.map((lomba) =>
    kolom.map((item) => {
      const nilai = item.ambil(lomba)
      return nilai === null || nilai === undefined || nilai === '' ? '-' : String(nilai)
    }),
  )
}

/** Baris berbentuk objek, dipakai penulisan XLSX. */
export function objekEkspor(items = [], kolom = KOLOM_EKSPOR) {
  return items.map((lomba) =>
    Object.fromEntries(kolom.map((item) => [item.kunci, String(item.ambil(lomba) ?? '-')])),
  )
}

export function kolomTerpilih(kunciKolom) {
  return kunciKolom.map((kunci) => KOLOM_EKSPOR.find((item) => item.kunci === kunci)).filter(Boolean)
}

function bungkusSel(nilai) {
  const teks = String(nilai ?? '')
  // Tanda kutip dilipatgandakan, lalu sel dikutip bila mengandung karakter khusus.
  const perlu = /[",\n\r]/.test(teks)
  const aman = teks.replace(/"/g, '""')
  return perlu ? `"${aman}"` : aman
}

/**
 * Menyusun teks CSV. Diawali BOM UTF-8 agar huruf beraksen tetap benar
 * saat dibuka di Excel.
 */
export function keCsv(items = [], kolom = KOLOM_EKSPOR) {
  const baris = [judulKolom(kolom), ...barisEkspor(items, kolom)]
  const isi = baris.map((sel) => sel.map(bungkusSel).join(',')).join('\r\n')
  return `\uFEFF${isi}`
}

/** Nama berkas laporan, memuat tanggal agar mudah dibedakan. */
export function namaBerkasLaporan(ekstensi, acuan = new Date()) {
  const tahun = acuan.getFullYear()
  const bulan = String(acuan.getMonth() + 1).padStart(2, '0')
  const hari = String(acuan.getDate()).padStart(2, '0')
  return `rekap-prestasi-${tahun}${bulan}${hari}.${ekstensi}`
}

/** Ringkasan yang dicetak sebagai keterangan pada PDF. */
export function ringkasanLaporan(items = []) {
  const berprestasi = items.filter(
    (lomba) => lomba.hasil?.capaian && lomba.hasil.capaian !== 'peserta',
  ).length
  const bersertifikat = items.filter((lomba) =>
    (lomba.berkas ?? []).some((berkas) => berkas.tipe === 'sertifikat'),
  ).length

  return {
    total: items.length,
    berprestasi,
    bersertifikat,
  }
}
