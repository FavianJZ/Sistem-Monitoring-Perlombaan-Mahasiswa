const pendengar = new Set()
let jadwal = null

export function langgananPerubahan(cb) {
  pendengar.add(cb)
  return () => pendengar.delete(cb)
}

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
