

const SATUAN = ['B', 'KB', 'MB', 'GB']

export function formatUkuran(byte) {
  if (byte === null || byte === undefined || Number.isNaN(Number(byte))) return '-'

  let nilai = Number(byte)
  let indeks = 0

  while (nilai >= 1024 && indeks < SATUAN.length - 1) {
    nilai /= 1024
    indeks += 1
  }

  const dibulatkan = indeks === 0 ? Math.round(nilai) : Math.round(nilai * 10) / 10
  const angka = Number.isInteger(dibulatkan)
    ? String(dibulatkan)
    : dibulatkan.toFixed(1).replace('.', ',')

  return `${angka} ${SATUAN[indeks]}`
}

export function potongNamaBerkas(nama = '', maks = 32) {
  if (nama.length <= maks) return nama

  const titik = nama.lastIndexOf('.')
  if (titik === -1) return `${nama.slice(0, maks - 3)}...`

  const ekstensi = nama.slice(titik)
  const dasar = nama.slice(0, titik)
  const sisa = Math.max(4, maks - ekstensi.length - 3)

  return `${dasar.slice(0, sisa)}...${ekstensi}`
}
