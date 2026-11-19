export const TIPE_FOTO = ['image/jpeg', 'image/png', 'image/webp']
export const UKURAN_FOTO_MAKS = 5 * 1024 * 1024
export const SISI_FOTO = 256

export function validasiFileFoto(file) {
  if (!file) return 'Pilih berkas foto terlebih dahulu.'
  if (!TIPE_FOTO.includes(file.type)) return 'Foto harus berformat JPG, PNG, atau WebP.'
  if (file.size > UKURAN_FOTO_MAKS) return 'Ukuran foto maksimal 5 MB.'
  return null
}

export async function kecilkanFoto(file, sisi = SISI_FOTO) {
  const gambar = await createImageBitmap(file)
  const potong = Math.min(gambar.width, gambar.height)
  const kanvas = document.createElement('canvas')
  kanvas.width = sisi
  kanvas.height = sisi
  const konteks = kanvas.getContext('2d')
  konteks.imageSmoothingQuality = 'high'
  konteks.drawImage(
    gambar,
    (gambar.width - potong) / 2,
    (gambar.height - potong) / 2,
    potong,
    potong,
    0,
    0,
    sisi,
    sisi,
  )
  gambar.close?.()

  const blob = await new Promise((selesai) => kanvas.toBlob(selesai, 'image/webp', 0.85))
  if (!blob) throw new Error('Foto gagal diproses. Coba berkas lain.')
  return blob
}

export function blobKeDataUrl(blob) {
  return new Promise((selesai, gagal) => {
    const pembaca = new FileReader()
    pembaca.onload = () => selesai(pembaca.result)
    pembaca.onerror = () => gagal(new Error('Foto gagal dibaca.'))
    pembaca.readAsDataURL(blob)
  })
}
