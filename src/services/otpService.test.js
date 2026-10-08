import { beforeEach, describe, expect, it } from 'vitest'
import {
  kirimOtpAktivasi,
  verifikasiOtpAktivasi,
  apakahEmailTerverifikasi,
  mintaResetPassword,
  verifikasiTokenReset,
  konsumsiTokenReset,
} from './otpService'
import { login, perbaruiSandiPengguna } from './userService'
import { SANDI_DEMO } from '@/data/users'

describe('otpService & Password Reset System (100% Free Campus Implementation)', () => {
  beforeEach(() => {
    window.sessionStorage?.clear()
  })

  describe('Verifikasi Email Aktivasi OTP Mahasiswa', () => {
    it('membuat kode OTP 6-digit dan pesan bot email yang valid', () => {
      const email = 'nadia.putri@binus.ac.id'
      const emailPesan = kirimOtpAktivasi(email)

      expect(emailPesan).not.toBeNull()
      expect(emailPesan.penerima).toBe(email)
      expect(emailPesan.kodeOtp).toMatch(/^\d{6}$/)
      expect(emailPesan.pesan).toContain(emailPesan.kodeOtp)
      expect(apakahEmailTerverifikasi(email)).toBe(false)
    })

    it('berhasil memverifikasi kode OTP yang benar dan mengubah status akun', () => {
      const email = 'budi.santoso@binus.ac.id'
      const { kodeOtp } = kirimOtpAktivasi(email)

      const hasil = verifikasiOtpAktivasi({ email, kode: kodeOtp })
      expect(hasil).toBe(true)
      expect(apakahEmailTerverifikasi(email)).toBe(true)
    })

    it('menolak kode OTP yang salah', () => {
      const email = 'budi.santoso@binus.ac.id'
      kirimOtpAktivasi(email)

      expect(() =>
        verifikasiOtpAktivasi({ email, kode: '000000' }),
      ).toThrow(/Kode verifikasi tidak sesuai/)
      expect(apakahEmailTerverifikasi(email)).toBe(false)
    })
  })

  describe('Fitur Lupa Kata Sandi & Reset Password', () => {
    it('membuat token reset dan tautan URL yang valid', () => {
      const email = 'aulia.rahmawati@binus.ac.id'
      const pesan = mintaResetPassword(email)

      expect(pesan.token).toMatch(/^reset-/)
      expect(pesan.tautanReset).toContain(pesan.token)

      const validasi = verifikasiTokenReset(pesan.token)
      expect(validasi.email).toBe(email)
    })

    it('berhasil memperbarui kata sandi akun dan login dengan sandi baru', async () => {
      const email = 'aulia.rahmawati@binus.ac.id'
      const sandiBaru = 'SandiBaru2026!'

      const pesan = mintaResetPassword(email)

      await perbaruiSandiPengguna({ email, passwordBaru: sandiBaru })
      konsumsiTokenReset(pesan.token)

      expect(() => verifikasiTokenReset(pesan.token)).toThrow(/tidak valid atau sudah pernah digunakan/)

      const hasilLogin = await login({ email, password: sandiBaru })
      expect(hasilLogin.user.email).toBe(email)
      expect(hasilLogin.token).toBeDefined()
    })
  })
})
