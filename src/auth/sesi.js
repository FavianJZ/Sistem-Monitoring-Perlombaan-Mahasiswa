/**
 * Penyimpanan sesi di sisi klien.
 *
 * Catatan keamanan: ini hanya menyimpan hasil login tiruan agar halaman
 * tidak ikut logout saat direfresh. Token sungguhan dari Spring Boot
 * sebaiknya disimpan pada cookie HttpOnly, dan setiap endpoint wajib
 * memverifikasi token serta role-nya sendiri di sisi server.
 */
export const KUNCI_SESI = 'simonlomba.sesi'

export function bacaSesi() {
  try {
    const mentah = window.localStorage.getItem(KUNCI_SESI)
    if (!mentah) return null

    const sesi = JSON.parse(mentah)
    return sesi?.user?.id ? sesi : null
  } catch {
    // Data rusak atau storage diblokir: perlakukan sebagai belum masuk.
    return null
  }
}

export function simpanSesi(sesi) {
  try {
    window.localStorage.setItem(KUNCI_SESI, JSON.stringify(sesi))
  } catch {
    // Mode privat bisa menolak penulisan. Sesi tetap jalan di memori.
  }
}

export function hapusSesi() {
  try {
    window.localStorage.removeItem(KUNCI_SESI)
  } catch {
    // Diabaikan dengan sengaja.
  }
}

/** Halaman awal tiap role setelah berhasil masuk. */
export function berandaRole(role) {
  return role === 'dosen' || role === 'admin' ? '/monitoring' : '/'
}
