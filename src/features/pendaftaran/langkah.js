/**
 * Definisi langkah wizard pendaftaran lomba.
 * Langkah anggota tim dilewati bila keikutsertaan bersifat perorangan.
 */
export const SEMUA_LANGKAH = [
  {
    id: 'detail',
    label: 'Detail Umum',
    keterangan: 'Nama, penyelenggara, bidang, tingkat',
  },
  {
    id: 'anggota',
    label: 'Anggota Tim',
    keterangan: 'NIM, nama, program studi',
    hanyaTim: true,
  },
  {
    id: 'bukti',
    label: 'Bukti Pendaftaran',
    keterangan: 'Bukti resmi dan pembayaran',
  },
  {
    id: 'poster',
    label: 'Poster & Publikasi',
    keterangan: 'Berkas poster atau tautan',
  },
  {
    id: 'timeline',
    label: 'Timeline',
    keterangan: 'Jadwal tiap tahapan',
  },
]

export function langkahUntuk(jenis) {
  return SEMUA_LANGKAH.filter((langkah) => !langkah.hanyaTim || jenis === 'tim')
}
