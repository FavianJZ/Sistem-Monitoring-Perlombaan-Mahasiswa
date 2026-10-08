import { createClient } from '@supabase/supabase-js'
import {
  kirimOtpAktivasi as kirimOtpLokal,
  verifikasiOtpAktivasi as verifikasiOtpLokal,
  mintaResetPassword as mintaResetLokal,
} from '@/services/otpService'

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null

export function apakahSupabaseAktif() {
  return Boolean(supabase)
}

export async function kirimOtpEmail({ email }) {
  const target = String(email ?? '').trim().toLowerCase()
  if (!target) throw new Error('Email wajib diisi.')

  if (apakahSupabaseAktif()) {
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email: target,
        options: {
          shouldCreateUser: true,
        },
      })
      if (error) throw error
      return {
        sukses: true,
        metode: 'supabase',
        pesan: `Kode OTP verifikasi resmi telah dikirim ke ${target} via Supabase.`,
      }
    } catch (err) {
      console.warn('Supabase signInWithOtp gagal, beralih ke bot simulator:', err.message)

      return kirimOtpLokal(target)
    }
  }

  return kirimOtpLokal(target)
}

export async function verifikasiOtpEmail({ email, kode }) {
  const target = String(email ?? '').trim().toLowerCase()
  const kodeInput = String(kode ?? '').trim()

  if (apakahSupabaseAktif()) {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: target,
        token: kodeInput,
        type: 'email',
      })
      if (error) {

        const cobaSignup = await supabase.auth.verifyOtp({
          email: target,
          token: kodeInput,
          type: 'signup',
        })
        if (cobaSignup.error) throw cobaSignup.error
      }
      return true
    } catch (err) {

      return verifikasiOtpLokal({ email: target, kode: kodeInput })
    }
  }

  return verifikasiOtpLokal({ email: target, kode: kodeInput })
}

export async function kirimPermintaanResetPassword({ email }) {
  const target = String(email ?? '').trim().toLowerCase()
  if (!target) throw new Error('Email wajib diisi.')

  if (apakahSupabaseAktif()) {
    try {
      const redirectUrl = `${window.location.origin}/reset-password`
      const { data, error } = await supabase.auth.resetPasswordForEmail(target, {
        redirectTo: redirectUrl,
      })
      if (error) throw error
      return {
        sukses: true,
        metode: 'supabase',
        pesan: `Tautan reset kata sandi telah dikirim ke ${target}.`,
        tautanReset: redirectUrl,
      }
    } catch (err) {
      console.warn('Supabase reset password gagal, beralih ke bot simulator:', err.message)
      return mintaResetLokal(target)
    }
  }

  return mintaResetLokal(target)
}
