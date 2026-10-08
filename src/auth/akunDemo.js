import { AKUN_DEMO, SANDI_DEMO } from '@/data/users'
import { penggunaSinkron } from '@/services/userService'

export { AKUN_DEMO, SANDI_DEMO }

export function penggunaSinkronDemo(id) {
  return penggunaSinkron(id)
}
