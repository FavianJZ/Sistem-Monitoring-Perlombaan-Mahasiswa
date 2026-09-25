import { buatSeed } from '@/data/seed'

/**
 * Penyimpanan tiruan di memori.
 *
 * Satu-satunya tempat data mock dimutasi. Service membaca dan menulis
 * lewat modul ini sehingga penggantian ke REST API di Task 15 hanya
 * menyentuh lapisan service, bukan komponen.
 */

let daftarLomba = buatSeed()
let nomorBerikutnya = daftarLomba.length + 1

/** Mengembalikan salinan supaya pemanggil tidak bisa memutasi data asli. */
function salin(nilai) {
  return structuredClone(nilai)
}

/** Dipakai pengujian: menyetel ulang data dengan tanggal acuan tetap. */
export function resetStore(acuan) {
  daftarLomba = buatSeed(acuan)
  nomorBerikutnya = daftarLomba.length + 1
  return salin(daftarLomba)
}

export function bacaSemua() {
  return salin(daftarLomba)
}

export function bacaSatu(id) {
  const ditemukan = daftarLomba.find((lomba) => lomba.id === id)
  return ditemukan ? salin(ditemukan) : null
}

export function idLombaBaru() {
  const id = `lomba-${String(nomorBerikutnya).padStart(2, '0')}`
  nomorBerikutnya += 1
  return id
}

export function tambah(record) {
  daftarLomba = [...daftarLomba, salin(record)]
  return salin(record)
}

export function perbarui(id, pengubah) {
  const indeks = daftarLomba.findIndex((lomba) => lomba.id === id)
  if (indeks === -1) return null

  const hasil = pengubah(salin(daftarLomba[indeks]))
  daftarLomba = daftarLomba.map((lomba, posisi) => (posisi === indeks ? salin(hasil) : lomba))
  return salin(hasil)
}

export function hapus(id) {
  const sebelum = daftarLomba.length
  daftarLomba = daftarLomba.filter((lomba) => lomba.id !== id)
  return daftarLomba.length < sebelum
}
