/**
 * Wilayah pengumuman untuk pembaca layar.
 *
 * Perubahan jumlah hasil filter tidak terlihat oleh pengguna pembaca layar
 * karena tidak ada perpindahan fokus, jadi hasilnya diumumkan di sini.
 *
 * Sengaja memakai atribut aria-live tanpa role="status" agar tidak bercampur
 * dengan notifikasi toast yang memakai role tersebut.
 */
export function PengumumanLangsung({ pesan }) {
  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {pesan}
    </div>
  )
}
