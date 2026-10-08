import { beforeEach, describe, expect, it } from 'vitest'
import {
  buatJwt,
  dekodeJwt,
  verifikasiJwt,
  apakahJwtValid,
  encodeBase64Url,
  decodeBase64Url,
} from './jwt'
import {
  COOKIE_TOKEN_NAME,
  COOKIE_SID_NAME,
  bacaCookie,
  simpanCookie,
  hapusCookie,
} from './cookie'
import { bacaSesi, simpanSesi, hapusSesi, KUNCI_SESI } from './sesi'

describe('JWT & Cookie Authentication System', () => {
  const penggunaDummy = {
    id: 'mhs-1',
    nama: 'Budi Santoso',
    email: 'budi.santoso@binus.ac.id',
    role: 'mahasiswa',
    prodi: 'Teknik Informatika',
    nim: '2501982736',
  }

  beforeEach(() => {
    hapusSesi()
  })

  describe('JWT Generator & Verifier', () => {
    it('menghasilkan token dengan 3 segmen standar RFC 7519', () => {
      const token = buatJwt(penggunaDummy)
      expect(typeof token).toBe('string')

      const parts = token.split('.')
      expect(parts).toHaveLength(3)

      expect(token).toContain('mhs-1')
    })

    it('bisa didekode tanpa verifikasi dengan dekodeJwt', () => {
      const token = buatJwt(penggunaDummy)
      const hasil = dekodeJwt(token)

      expect(hasil).not.toBeNull()
      expect(hasil.header).toEqual({ alg: 'HS256', typ: 'JWT' })
      expect(hasil.payload.sub).toBe('mhs-1')
      expect(hasil.payload.nama).toBe('Budi Santoso')
      expect(hasil.payload.role).toBe('mahasiswa')
      expect(hasil.payload.exp).toBeGreaterThan(hasil.payload.iat)
    })

    it('berhasil memverifikasi tanda tangan kriptografis token yang sah', () => {
      const token = buatJwt(penggunaDummy)
      const payload = verifikasiJwt(token)

      expect(payload.id).toBe('mhs-1')
      expect(payload.email).toBe('budi.santoso@binus.ac.id')
      expect(apakahJwtValid(token)).toBe(true)
    })

    it('menolak token jika payload dimanipulasi (misal eskalasi role)', () => {
      const token = buatJwt(penggunaDummy)
      const [headerB64, payloadB64, sig] = token.split('.')

      const payloadAsli = JSON.parse(decodeBase64Url(payloadB64))
      payloadAsli.role = 'admin'
      const payloadPalsuB64 = encodeBase64Url(JSON.stringify(payloadAsli))

      const tokenPalsu = `${headerB64}.${payloadPalsuB64}.${sig}`

      expect(() => verifikasiJwt(tokenPalsu)).toThrow(
        /Tanda tangan \(signature\) JWT tidak valid atau token telah dimanipulasi/,
      )
      expect(apakahJwtValid(tokenPalsu)).toBe(false)
    })

    it('menolak token yang telah kedaluwarsa (expired)', () => {

      const tokenKadaluwarsa = buatJwt(penggunaDummy, { durasiDetik: -10 })

      expect(() => verifikasiJwt(tokenKadaluwarsa, { toleransiWaktu: 0 })).toThrow(
        /Sesi telah kedaluwarsa \(Token JWT Expired\)/,
      )
      expect(apakahJwtValid(tokenKadaluwarsa, { toleransiWaktu: 0 })).toBe(false)
    })

    it('menolak format token rusak atau tidak memiliki 3 bagian', () => {
      expect(() => verifikasiJwt('token-rusak-tanpa-titik')).toThrow(/Format JWT tidak valid/)
      expect(apakahJwtValid('token.palsu')).toBe(false)
    })
  })

  describe('Cookie Management', () => {
    it('bisa menyimpan, membaca, dan menghapus cookie di peramban', () => {
      simpanCookie('uji_cookie', 'nilai_rahasia_123', { maxAgeDetik: 3600 })
      expect(bacaCookie('uji_cookie')).toBe('nilai_rahasia_123')

      hapusCookie('uji_cookie')
      expect(bacaCookie('uji_cookie')).toBeNull()
    })
  })

  describe('Integrasi Sesi dengan JWT dan Cookie', () => {
    it('simpanSesi menulis token JWT ke sessionStorage, localStorage, dan Cookie', () => {
      const token = buatJwt(penggunaDummy)
      const sesi = { user: penggunaDummy, token }

      simpanSesi(sesi)

      const tersimpanLocal = JSON.parse(window.localStorage.getItem(KUNCI_SESI))
      expect(tersimpanLocal.user.id).toBe('mhs-1')
      expect(tersimpanLocal.token).toBe(token)

      const tersimpanSession = JSON.parse(window.sessionStorage.getItem(KUNCI_SESI))
      expect(tersimpanSession.user.id).toBe('mhs-1')

      expect(bacaCookie(COOKIE_TOKEN_NAME)).toBe(token)
      expect(bacaCookie(COOKIE_SID_NAME)).toBe('mhs-1')

      const sesiAktif = bacaSesi()
      expect(sesiAktif).not.toBeNull()
      expect(sesiAktif.user.id).toBe('mhs-1')
    })

    it('bacaSesi menolak dan membersihkan sesi jika JWT di storage telah kadaluwarsa', () => {
      const tokenKadaluwarsa = buatJwt(penggunaDummy, { durasiDetik: -3600 })
      const sesiBasi = { user: penggunaDummy, token: tokenKadaluwarsa }

      window.sessionStorage.setItem(KUNCI_SESI, JSON.stringify(sesiBasi))
      window.localStorage.setItem(KUNCI_SESI, JSON.stringify(sesiBasi))

      const hasil = bacaSesi()
      expect(hasil).toBeNull()
      expect(window.sessionStorage.getItem(KUNCI_SESI)).toBeNull()
    })

    it('hapusSesi membersihkan token dari sessionStorage, localStorage, dan Cookie', () => {
      const token = buatJwt(penggunaDummy)
      simpanSesi({ user: penggunaDummy, token })

      hapusSesi()

      expect(window.sessionStorage.getItem(KUNCI_SESI)).toBeNull()
      expect(window.localStorage.getItem(KUNCI_SESI)).toBeNull()
      expect(bacaCookie(COOKIE_TOKEN_NAME)).toBeNull()
      expect(bacaCookie(COOKIE_SID_NAME)).toBeNull()
    })
  })
})
