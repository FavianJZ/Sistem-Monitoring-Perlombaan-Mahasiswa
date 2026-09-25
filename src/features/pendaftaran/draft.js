import { JENIS_TAHAPAN } from '@/config/domain'

/**
 * Draft pendaftaran lomba yang disimpan di peramban.
 *
 * Formulirnya panjang, jadi isian disimpan otomatis agar progres tidak
 * hilang saat halaman tertutup atau dimuat ulang.
 */

export function kunciDraft(idPengguna) {
  return `simonlomba.draft.${idPengguna}`
}

/** Baris anggota kosong, dipakai saat menambah anggota tim. */
export function anggotaKosong() {
  return { nim: '', nama: '', prodi: '', peran: 'anggota' }
}

/** Tahapan bawaan sesuai urutan di PRD, semuanya boleh dibiarkan kosong. */
export function tahapanAwal() {
  return JENIS_TAHAPAN.map((tahap) => ({
    jenis: tahap.jenis ?? tahap.value,
    label: null,
    tanggalMulai: '',
    tanggalSelesai: '',
  }))
}

export function draftAwal(pengguna) {
  return {
    langkah: 0,
    nama: '',
    penyelenggara: '',
    bidang: '',
    tingkat: '',
    jenis: 'individu',
    namaTim: '',
    dosenPembimbingId: '',
    anggota: [
      {
        nim: pengguna?.nim ?? '',
        nama: pengguna?.nama ?? '',
        prodi: pengguna?.prodi ?? '',
        peran: 'ketua',
      },
    ],
    berkas: {},
    posterMode: 'unggah',
    linkPublikasi: '',
    tahapan: tahapanAwal(),
  }
}

export function bacaDraft(kunci) {
  try {
    const mentah = window.localStorage.getItem(kunci)
    if (!mentah) return null

    const draft = JSON.parse(mentah)
    return typeof draft === 'object' && draft ? draft : null
  } catch {
    return null
  }
}

export function simpanDraft(kunci, draft) {
  try {
    window.localStorage.setItem(kunci, JSON.stringify(draft))
  } catch {
    // Penyimpanan penuh atau diblokir: formulir tetap bisa dilanjutkan.
  }
}

export function hapusDraft(kunci) {
  try {
    window.localStorage.removeItem(kunci)
  } catch {
    // Diabaikan dengan sengaja.
  }
}

/** Benar bila pengguna sudah mengisi sesuatu di luar data bawaan. */
export function draftTerisi(draft, pengguna) {
  if (!draft) return false

  const awal = draftAwal(pengguna)
  const bidangDicek = ['nama', 'penyelenggara', 'bidang', 'tingkat', 'namaTim', 'linkPublikasi']

  if (bidangDicek.some((kunci) => (draft[kunci] ?? '') !== awal[kunci])) return true
  if (draft.jenis !== awal.jenis) return true
  if (draft.dosenPembimbingId) return true
  if ((draft.anggota?.length ?? 0) > 1) return true
  if (Object.keys(draft.berkas ?? {}).length > 0) return true
  if ((draft.tahapan ?? []).some((tahap) => tahap.tanggalMulai || tahap.tanggalSelesai)) return true

  return false
}
