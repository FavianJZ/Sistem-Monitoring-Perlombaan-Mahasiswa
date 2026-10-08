import { verifikasiJwt } from './jwt'
import {
  COOKIE_TOKEN_NAME,
  COOKIE_SID_NAME,
  bacaCookie,
  simpanCookie,
  hapusCookie,
} from './cookie'

export { COOKIE_TOKEN_NAME, COOKIE_SID_NAME }

export const KUNCI_SESI = 'simonlomba.sesi'

export function verifikasiDanValidasiSesi(sesi) {
  if (!sesi || !sesi.user?.id) return null

  if (typeof sesi.token === 'string' && sesi.token.split('.').length === 3) {
    try {
      const payload = verifikasiJwt(sesi.token)

      return {
        ...sesi,
        user: {
          ...sesi.user,
          id: payload.id || sesi.user.id,
          nama: payload.nama || sesi.user.nama,
          email: payload.email || sesi.user.email,
          role: payload.role || sesi.user.role,
          ...(payload.prodi ? { prodi: payload.prodi } : {}),
          ...(payload.nim ? { nim: payload.nim } : {}),
          ...(payload.angkatan ? { angkatan: payload.angkatan } : {}),
        },
      }
    } catch {

      return null
    }
  }

  if (typeof sesi.token === 'string' && sesi.token.startsWith('mock-token-')) {
    return sesi
  }

  return null
}

export function bacaSesi() {
  try {

    const mentahSesi = window.sessionStorage?.getItem(KUNCI_SESI)
    if (mentahSesi) {
      const sesi = JSON.parse(mentahSesi)
      const sesiValid = verifikasiDanValidasiSesi(sesi)
      if (sesiValid) {
        return sesiValid
      }

      window.sessionStorage?.removeItem(KUNCI_SESI)
    }

    const tokenCookie = bacaCookie(COOKIE_TOKEN_NAME)
    if (tokenCookie && tokenCookie.split('.').length === 3) {
      try {
        const payload = verifikasiJwt(tokenCookie)
        const sesiDariCookie = {
          user: {
            id: payload.id,
            nama: payload.nama,
            email: payload.email,
            role: payload.role,
            prodi: payload.prodi,
            ...(payload.nim ? { nim: payload.nim, angkatan: payload.angkatan } : {}),
          },
          token: tokenCookie,
        }

        window.sessionStorage?.setItem(KUNCI_SESI, JSON.stringify(sesiDariCookie))
        return sesiDariCookie
      } catch {

        hapusCookie(COOKIE_TOKEN_NAME)
        hapusCookie(COOKIE_SID_NAME)
      }
    }

    const mentahLocal = window.localStorage?.getItem(KUNCI_SESI)
    if (mentahLocal) {
      const sesi = JSON.parse(mentahLocal)
      const sesiValid = verifikasiDanValidasiSesi(sesi)
      if (sesiValid) {
        window.sessionStorage?.setItem(KUNCI_SESI, JSON.stringify(sesiValid))
        return sesiValid
      }
      window.localStorage?.removeItem(KUNCI_SESI)
    }

    return null
  } catch {

    return null
  }
}

export function simpanSesi(sesi) {
  try {
    const data = JSON.stringify(sesi)
    window.sessionStorage?.setItem(KUNCI_SESI, data)
    window.localStorage?.setItem(KUNCI_SESI, data)

    if (sesi?.token) {
      simpanCookie(COOKIE_TOKEN_NAME, sesi.token, { maxAgeDetik: 86400, sameSite: 'Strict' })
    }
    if (sesi?.user?.id) {
      simpanCookie(COOKIE_SID_NAME, sesi.user.id, { maxAgeDetik: 86400, sameSite: 'Strict' })
    }
  } catch {

  }
}

export function hapusSesi() {
  try {
    window.sessionStorage?.removeItem(KUNCI_SESI)
    window.localStorage?.removeItem(KUNCI_SESI)
    hapusCookie(COOKIE_TOKEN_NAME)
    hapusCookie(COOKIE_SID_NAME)
  } catch {

  }
}

export function berandaRole(role) {
  return role === 'dosen' || role === 'admin' ? '/monitoring' : '/'
}
