import { posterDataUri } from '@/lib/posterPlaceholder'
import { toISODate } from '@/lib/date'

/**
 * Mengubah draft formulir menjadi payload yang diterima service.
 *
 * Bentuk keluarannya sengaja dibuat sama dengan badan permintaan REST yang
 * nanti dipakai backend, sehingga peralihan ke API tidak mengubah formulir.
 */
export function draftKePayload(draft, pengguna) {
  const tim = draft.jenis === 'tim'

  const berkas = Object.entries(draft.berkas ?? {})
    .filter(([, meta]) => Boolean(meta))
    .map(([tipe, meta]) => ({
      tipe,
      namaFile: meta.namaFile,
      mimeType: meta.mimeType,
      size: meta.size,
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

  /*
   * Isi biner poster tidak disimpan di peramban, jadi pratinjau dibuat dari
   * nama lomba. Setelah tersambung ke backend, posterUrl diisi alamat berkas
   * hasil unggahan.
   */
  const posterUrl = draft.berkas?.poster
    ? posterDataUri({
        nama: draft.nama,
        bidang: draft.bidang,
        tingkat: draft.tingkat,
        seed: draft.nama?.length ?? 0,
      })
    : null

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
