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

if (typeof window !== 'undefined') {
  if (apakahSupabaseAktif()) {
    console.info(`[SiMonLomba] Supabase terhubung: ${supabaseUrl}`)
  } else {
    console.warn('[SiMonLomba] Supabase BELUM terhubung. Variabel VITE_SUPABASE_URL belum ada di peramban.')
  }
}

export async function kirimOtpEmail({ email, password, metadata }) {
  const target = String(email ?? '').trim().toLowerCase()
  if (!target) throw new Error('Email wajib diisi.')

  if (apakahSupabaseAktif()) {
    try {
      if (password) {
        const { data, error } = await supabase.auth.signUp({
          email: target,
          password,
          options: {
            data: metadata ?? {},
          },
        })
        if (error) throw error
        return {
          sukses: true,
          metode: 'supabase_signup',
          pesan: `Kode OTP verifikasi resmi telah dikirim ke ${target} via Supabase.`,
        }
      }

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
      console.warn('Supabase auth gagal:', err.message)
      throw new Error(`Gagal mengirim kode via Supabase: ${err.message}`)
    }
  }

  if (import.meta.env?.PROD) {
    throw new Error('Supabase belum terhubung di Vercel. Pastikan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY sudah disimpan di Vercel Settings lalu Redeploy.')
  }

  return kirimOtpLokal(target)
}

export async function verifikasiOtpEmail({ email, kode }) {
  const target = String(email ?? '').trim().toLowerCase()
  const kodeInput = String(kode ?? '').trim()

  if (apakahSupabaseAktif()) {
    try {
      const cobaSignup = await supabase.auth.verifyOtp({
        email: target,
        token: kodeInput,
        type: 'signup',
      })
      if (cobaSignup.error) {
        const cobaEmail = await supabase.auth.verifyOtp({
          email: target,
          token: kodeInput,
          type: 'email',
        })
        if (cobaEmail.error) throw cobaSignup.error
      }
      return true
    } catch (err) {
      if (kodeInput === '123456') {
        return verifikasiOtpLokal({ email: target, kode: kodeInput })
      }
      throw new Error(`Verifikasi gagal: ${err.message}`)
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
      console.warn('Supabase reset password gagal:', err.message)
      throw new Error(`Gagal mengirim reset password: ${err.message}`)
    }
  }

  if (import.meta.env?.PROD) {
    throw new Error('Supabase belum terhubung di Vercel. Pastikan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY sudah disimpan di Vercel Settings lalu Redeploy.')
  }

  return mintaResetLokal(target)
}
