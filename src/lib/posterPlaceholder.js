/**
 * Membuat poster tiruan berupa data URI SVG.
 * Dipakai agar pratinjau gambar pada data mock tetap tampil tanpa
 * perlu berkas asli maupun koneksi internet.
 */

const PALET = [
  ['#1d3dd8', '#3b6bf6'],
  ['#065f46', '#10b981'],
  ['#92400e', '#f59e0b'],
  ['#7f1d1d', '#ef4444'],
  ['#172054', '#254feb'],
  ['#3f1d6b', '#8b5cf6'],
]

function escapeXml(text = '') {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function pecahBaris(text, maksKarakter = 18, maksBaris = 4) {
  const kata = String(text).split(/\s+/)
  const baris = []
  let sekarang = ''

  for (const item of kata) {
    const calon = sekarang ? `${sekarang} ${item}` : item
    if (calon.length > maksKarakter && sekarang) {
      baris.push(sekarang)
      sekarang = item
    } else {
      sekarang = calon
    }
  }
  if (sekarang) baris.push(sekarang)

  return baris.slice(0, maksBaris)
}

export function posterDataUri({ nama = 'Perlombaan', bidang = '', tingkat = '', seed = 0 } = {}) {
  const [gelap, terang] = PALET[Math.abs(seed) % PALET.length]
  const baris = pecahBaris(nama)

  const judul = baris
    .map(
      (teks, index) =>
        `<text x="60" y="${300 + index * 58}" font-family="Segoe UI, Arial, sans-serif" font-size="46" font-weight="800" fill="#ffffff">${escapeXml(teks)}</text>`,
    )
    .join('')

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="960" viewBox="0 0 720 960" role="img">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${gelap}"/>
      <stop offset="100%" stop-color="${terang}"/>
    </linearGradient>
  </defs>
  <rect width="720" height="960" fill="url(#bg)"/>
  <circle cx="620" cy="140" r="180" fill="#ffffff" opacity="0.08"/>
  <circle cx="90" cy="820" r="220" fill="#ffffff" opacity="0.06"/>
  <text x="60" y="140" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="700" letter-spacing="4" fill="#ffffff" opacity="0.75">${escapeXml(tingkat.toUpperCase())}</text>
  <text x="60" y="200" font-family="Segoe UI, Arial, sans-serif" font-size="26" font-weight="600" fill="#ffffff" opacity="0.9">${escapeXml(bidang)}</text>
  ${judul}
  <rect x="60" y="${320 + baris.length * 58}" width="120" height="6" rx="3" fill="#ffffff" opacity="0.8"/>
  <text x="60" y="900" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="600" fill="#ffffff" opacity="0.7">Poster contoh - data mock</text>
</svg>`

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}
