/**
 * Bus perubahan data sederhana. Lapisan service memanggil beriTahuPerubahan()
 * setiap kali data berubah (termasuk dari event Realtime Supabase), dan
 * useAsync berlangganan supaya halaman memuat ulang datanya sendiri.
 */
const pendengar = new Set()
let jadwal = null

export function langgananPerubahan(cb) {
  pendengar.add(cb)
  return () => pendengar.delete(cb)
}

/** Digabung per tick supaya banyak event beruntun hanya memicu satu muat ulang. */
export function beriTahuPerubahan(sumber = 'lokal') {
  if (jadwal) return
  jadwal = setTimeout(() => {
    jadwal = null
    for (const cb of [...pendengar]) {
      try {
        cb(sumber)
      } catch (e) {
        console.warn('[SiMonLomba] pendengar perubahan gagal:', e)
      }
    }
  }, 50)
}
