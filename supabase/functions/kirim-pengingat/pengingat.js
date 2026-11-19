export const ZONA_WAKTU = 'Asia/Jakarta'

export const JADWAL_PENGINGAT = [
  { kode: 'h3', selisihHari: 3, judul: '3 hari lagi' },
  { kode: 'h0', selisihHari: 0, judul: 'hari ini' },
]

const STATUS_AKHIR = ['selesai', 'tidak_lanjut']

const LABEL_TAHAPAN = {
  pendaftaran: 'Pendaftaran',
  tm: 'Technical Meeting',
  penyisihan: 'Penyisihan / Pengumpulan Karya',
  semifinal: 'Semifinal',
  final: 'Final',
  pengumuman: 'Pengumuman Pemenang',
}

const POLA_TANGGAL = /^\d{4}-\d{2}-\d{2}$/

export function tanggalHariIni(sekarang = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_WAKTU,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(sekarang)
}

export function geserTanggal(iso, hari) {
  const [tahun, bulan, tanggal] = iso.split('-').map(Number)
  const hasil = new Date(Date.UTC(tahun, bulan - 1, tanggal + hari))
  return hasil.toISOString().slice(0, 10)
}

export function formatTanggal(iso) {
  const [tahun, bulan, tanggal] = iso.split('-').map(Number)
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(Date.UTC(tahun, bulan - 1, tanggal)))
}

export function labelTahap(tahap) {
  if (tahap.jenis === 'kustom') return tahap.label?.trim() || 'Agenda lomba'
  return LABEL_TAHAPAN[tahap.jenis] ?? tahap.label ?? 'Agenda lomba'
}

export function daftarPengingat(barisLomba, hariIni) {
  const hasil = []

  for (const baris of barisLomba) {
    const lomba = baris.data ?? {}
    if (STATUS_AKHIR.includes(lomba.status)) continue

    ;(lomba.tahapan ?? []).forEach((tahap, indeks) => {
      if (!POLA_TANGGAL.test(tahap?.tanggalMulai ?? '')) return

      for (const jadwal of JADWAL_PENGINGAT) {
        if (tahap.tanggalMulai !== geserTanggal(hariIni, jadwal.selisihHari)) continue
        hasil.push({
          lombaId: baris.id,
          pemilikId: baris.created_by,
          namaLomba: lomba.nama ?? 'Lomba',
          namaTim: lomba.namaTim ?? null,
          nimAnggota: (lomba.anggota ?? []).map((a) => String(a?.nim ?? '').trim()).filter(Boolean),
          tahap,
          kunciTahap: `${indeks}:${tahap.jenis}:${tahap.tanggalMulai}`,
          jadwal,
        })
      }
    })
  }

  return hasil
}

export function penerimaPengingat(pengingat, profil) {
  const email = new Set()
  const pemilik = profil.find((p) => p.id === pengingat.pemilikId)
  if (pemilik?.email) email.add(pemilik.email.toLowerCase())

  for (const nim of pengingat.nimAnggota) {
    const anggota = profil.find((p) => p.nim && p.nim === nim)
    if (anggota?.email) email.add(anggota.email.toLowerCase())
  }

  return [...email]
}

function amankan(teks) {
  return String(teks ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function isiEmailPengingat(pengingat, situsUrl) {
  const label = labelTahap(pengingat.tahap)
  const tanggal = formatTanggal(pengingat.tahap.tanggalMulai)
  const sampai = pengingat.tahap.tanggalSelesai
    ? ` sampai ${formatTanggal(pengingat.tahap.tanggalSelesai)}`
    : ''
  const hariIni = pengingat.jadwal.selisihHari === 0
  const subjek = hariIni
    ? `Hari ini: ${label} - ${pengingat.namaLomba}`
    : `${label} ${pengingat.jadwal.judul} - ${pengingat.namaLomba}`
  const ajakan = hariIni
    ? 'Jadwal ini berlangsung hari ini. Pastikan tim sudah siap.'
    : 'Masih ada waktu untuk bersiap. Cek kembali berkas dan kebutuhan tim.'
  const tautan = `${situsUrl.replace(/\/$/, '')}/lomba-saya/${encodeURIComponent(pengingat.lombaId)}`
  const tim = pengingat.namaTim ? ` (Tim ${pengingat.namaTim})` : ''

  const teks = [
    `${label} ${hariIni ? 'berlangsung hari ini' : pengingat.jadwal.judul}`,
    '',
    `Lomba: ${pengingat.namaLomba}${tim}`,
    `Jadwal: ${tanggal}${sampai}`,
    '',
    ajakan,
    `Lihat detail lomba: ${tautan}`,
    '',
    'Email ini dikirim otomatis oleh SiMonLomba berdasarkan jadwal yang diisi di aplikasi.',
  ].join('\n')

  const html = `<div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; color: #334155;">
  <div style="border-top: 4px solid #0096d6; padding: 24px; background: #ffffff;">
    <p style="margin: 0; font-size: 13px; font-weight: 700; color: #00557f;">SiMonLomba &middot; Pengingat jadwal lomba</p>
    <h2 style="margin: 12px 0 8px; font-size: 20px; color: #1e293b;">${amankan(label)} ${hariIni ? 'berlangsung hari ini' : amankan(pengingat.jadwal.judul)}</h2>
    <table style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; border-collapse: collapse;">
      <tr><td style="padding: 2px 12px 2px 0; color: #64748b;">Lomba</td><td style="font-weight: 700;">${amankan(pengingat.namaLomba)}${amankan(tim)}</td></tr>
      <tr><td style="padding: 2px 12px 2px 0; color: #64748b;">Jadwal</td><td style="font-weight: 700;">${amankan(tanggal)}${amankan(sampai)}</td></tr>
    </table>
    <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6;">${amankan(ajakan)}</p>
    <p style="margin: 0 0 16px;">
      <a href="${amankan(tautan)}" style="display: inline-block; padding: 12px 20px; background: #0077b3; color: #ffffff; font-weight: 700; font-size: 14px; text-decoration: none; border-radius: 6px;">Lihat detail lomba</a>
    </p>
    <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.6;">Email ini dikirim otomatis oleh SiMonLomba berdasarkan jadwal yang diisi di aplikasi.</p>
  </div>
</div>`

  return { subjek, teks, html }
}
