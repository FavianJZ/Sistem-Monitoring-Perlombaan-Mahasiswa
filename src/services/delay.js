/**
 * Jeda tiruan supaya state loading benar-benar terlihat saat demo.
 * Dimatikan otomatis di lingkungan pengujian agar test tidak melambat.
 */
const DI_PENGUJIAN = import.meta.env?.MODE === 'test' || import.meta.env?.TEST === true

export function jeda(ms = 220) {
  if (DI_PENGUJIAN || ms <= 0) return Promise.resolve()
  return new Promise((resolve) => setTimeout(resolve, ms))
}
