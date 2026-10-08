import { buatSeed } from '@/data/seed'
import { MODE_DEMO } from '@/config/mode'

export const KUNCI_LOMBA = 'simonlomba.lomba'

function muatTersimpan() {
  try {
    const mentah = window.localStorage.getItem(KUNCI_LOMBA)
    const daftar = mentah ? JSON.parse(mentah) : []
    return Array.isArray(daftar) ? daftar.filter((item) => item?.id) : []
  } catch {
    return []
  }
}

function simpan() {
  if (MODE_DEMO) return
  try {
    window.localStorage.setItem(KUNCI_LOMBA, JSON.stringify(daftarLomba))
  } catch {

  }
}

function hitungNomorBerikutnya(daftar) {
  const terbesar = daftar.reduce((maks, lomba) => {
    const angka = Number(String(lomba.id).match(/(\d+)$/)?.[1] ?? 0)
    return Math.max(maks, angka)
  }, 0)
  return terbesar + 1
}

let daftarLomba = MODE_DEMO ? buatSeed() : muatTersimpan()
let nomorBerikutnya = hitungNomorBerikutnya(daftarLomba)

function salin(nilai) {
  return structuredClone(nilai)
}

export function resetStore(acuan) {
  daftarLomba = buatSeed(acuan)
  nomorBerikutnya = hitungNomorBerikutnya(daftarLomba)
  return salin(daftarLomba)
}

function pastikanSinkron() {
  if (!MODE_DEMO) {
    daftarLomba = muatTersimpan()
    nomorBerikutnya = hitungNomorBerikutnya(daftarLomba)
  }
}

export function bacaSemua() {
  pastikanSinkron()
  return salin(daftarLomba)
}

export function bacaSatu(id) {
  pastikanSinkron()
  const ditemukan = daftarLomba.find((lomba) => lomba.id === id)
  return ditemukan ? salin(ditemukan) : null
}

export function idLombaBaru() {
  pastikanSinkron()
  const id = `lomba-${String(nomorBerikutnya).padStart(2, '0')}`
  nomorBerikutnya += 1
  return id
}

export function tambah(record) {
  pastikanSinkron()
  daftarLomba = [...daftarLomba, salin(record)]
  simpan()
  return salin(record)
}

export function perbarui(id, pengubah) {
  pastikanSinkron()
  const indeks = daftarLomba.findIndex((lomba) => lomba.id === id)
  if (indeks === -1) return null

  const hasil = pengubah(salin(daftarLomba[indeks]))
  daftarLomba = daftarLomba.map((lomba, posisi) => (posisi === indeks ? salin(hasil) : lomba))
  simpan()
  return salin(hasil)
}

export function hapus(id) {
  pastikanSinkron()
  const sebelum = daftarLomba.length
  daftarLomba = daftarLomba.filter((lomba) => lomba.id !== id)
  const terhapus = daftarLomba.length < sebelum
  if (terhapus) simpan()
  return terhapus
}
