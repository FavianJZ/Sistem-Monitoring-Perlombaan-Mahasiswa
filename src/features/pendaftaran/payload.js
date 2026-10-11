import { toISODate } from '@/lib/date'

export function draftKePayload(draft, pengguna) {
  const tim = draft.jenis === 'tim'

  const berkas = Object.entries(draft.berkas ?? {})
    .filter(([, meta]) => Boolean(meta))
    .map(([tipe, meta]) => ({
      tipe,
      namaFile: meta.namaFile,
      mimeType: meta.mimeType,
      size: meta.size,
      url: meta.url ?? null,
      diunggahPada: toISODate(new Date()),
    }))

  const tahapan = (draft.tahapan ?? [])
    .filter((tahap) => tahap.tanggalMulai)
    .map((tahap) => ({
      jenis: tahap.jenis,
      label: tahap.jenis === 'kustom' ? (tahap.label?.trim() ?? null) : null,
      tanggalMulai: tahap.tanggalMulai,
      tanggalSelesai: tahap.tanggalSelesai || null,
    }))

  const anggota = (tim ? draft.anggota : draft.anggota.slice(0, 1)).map((item, index) => ({
    nim: String(item.nim ?? '').trim(),
    nama: String(item.nama ?? '').trim(),
    prodi: item.prodi ?? null,
    peran: index === 0 ? 'ketua' : 'anggota',
  }))

  // Pratinjau poster memakai gambar yang diunggah; poster PDF tidak bisa jadi <img>.
  const poster = draft.berkas?.poster
  const posterUrl = poster?.url && poster.mimeType?.startsWith('image/') ? poster.url : null

  return {
    nama: draft.nama?.trim(),
    penyelenggara: draft.penyelenggara?.trim(),
    bidang: draft.bidang,
    tingkat: draft.tingkat,
    jenis: draft.jenis,
    namaTim: tim ? draft.namaTim?.trim() : null,
    dosenPembimbingId: draft.dosenPembimbingId || null,
    linkPublikasi: draft.linkPublikasi?.trim() || null,
    posterUrl,
    status: 'terdaftar',
    createdBy: pengguna.id,
    anggota,
    berkas,
    tahapan,
  }
}
