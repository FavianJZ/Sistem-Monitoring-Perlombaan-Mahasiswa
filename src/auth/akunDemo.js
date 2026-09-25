import { AKUN_DEMO, SANDI_DEMO } from '@/data/users'
import { penggunaSinkron } from '@/services/userService'

/**
 * Jembatan tipis ke akun demo.
 *
 * Dipisah supaya AuthContext tidak bergantung langsung pada berkas data
 * mock. Saat login pindah ke backend, cukup berkas ini yang dihapus.
 */
export { AKUN_DEMO, SANDI_DEMO }

export function penggunaSinkronDemo(id) {
  return penggunaSinkron(id)
}
