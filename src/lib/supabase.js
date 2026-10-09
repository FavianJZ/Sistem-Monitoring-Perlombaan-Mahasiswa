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
          // Implicit dipertahankan supaya tautan lama (#access_token) tetap jalan;
          // tautan baru memakai token_hash yang tidak bergantung pada flow ini.
          flowType: 'implicit',
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
        if (data?.user && (!data.user.identities || data.user.identities.length === 0)) {
          throw new Error('Email ini sudah terdaftar di sistem. Silakan Masuk (Login) atau gunakan Lupa Kata Sandi jika lupa kata sandi Anda.')
        }
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
      // Trigger pembuat profil gagal; penyebab paling umum NIM/email sudah dipakai profil lain.
      if (/database error saving new user/i.test(err.message)) {
        throw new Error('NIM atau email ini sudah terdaftar pada akun lain.')
      }
      if (/rate limit|security purposes/i.test(err.message)) {
        throw new Error('Terlalu sering meminta kode. Tunggu sekitar 1 menit lalu coba lagi.')
      }
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
      // Tidak ada kode cadangan: saat Supabase aktif, hanya kode dari email yang sah.
      throw new Error(`Verifikasi gagal: ${err.message}`)
    }
  }

  return verifikasiOtpLokal({ email: target, kode: kodeInput })
}

/**
 * Kirim ulang kode OTP pendaftaran tanpa membuat akun baru.
 * Memanggil signUp lagi bisa memicu rate limit dan email ganda.
 */
export async function kirimUlangOtpEmail({ email }) {
  const target = String(email ?? '').trim().toLowerCase()
  if (!target) throw new Error('Email wajib diisi.')

  if (apakahSupabaseAktif()) {
    const { error } = await supabase.auth.resend({ type: 'signup', email: target })
    if (error) throw new Error(`Gagal mengirim ulang kode: ${error.message}`)
    return { sukses: true, metode: 'supabase_resend' }
  }

  return kirimOtpLokal(target)
}

const PESAN_TAUTAN_KEDALUWARSA =
  'Tautan reset kata sandi tidak valid atau telah kedaluwarsa. Silakan minta tautan baru.'

/**
 * Menukar tautan reset dari email menjadi sesi pemulihan Supabase.
 * Mendukung tiga format tautan:
 *   1. ?token_hash=...&type=recovery  (template email yang disarankan)
 *   2. ?code=...                      (alur PKCE)
 *   3. #access_token=...&type=recovery (tautan bawaan / implicit)
 * Mengembalikan { email } atau melempar Error yang siap ditampilkan.
 */
const tukarBerjalan = new Map()

export function tukarTautanReset(url = window.location.href) {
  // token_hash hanya sekali pakai; StrictMode memanggil efek dua kali,
  // jadi hasil penukaran untuk URL yang sama dipakai bersama.
  if (!tukarBerjalan.has(url)) tukarBerjalan.set(url, prosesTautanReset(url))
  return tukarBerjalan.get(url)
}

async function prosesTautanReset(url) {
  if (!apakahSupabaseAktif()) throw new Error(PESAN_TAUTAN_KEDALUWARSA)

  const alamat = new URL(url)
  const query = alamat.searchParams
  const hash = new URLSearchParams(alamat.hash.replace(/^#/, ''))

  // Supabase menaruh error di hash/query, misalnya otp_expired.
  const galat = hash.get('error_description') || query.get('error_description')
  if (galat) throw new Error(`${galat.replace(/\+/g, ' ')}. Silakan minta tautan baru.`)

  const tokenHash = query.get('token_hash')
  const kode = query.get('code')

  if (tokenHash) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: 'recovery',
    })
    if (error) throw new Error(PESAN_TAUTAN_KEDALUWARSA)
    return { email: data.user?.email }
  }

  if (kode) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(kode)
    if (error) throw new Error(PESAN_TAUTAN_KEDALUWARSA)
    return { email: data.user?.email }
  }

  // Tautan implicit: supabase-js sudah memproses hash saat inisialisasi.
  const { data } = await supabase.auth.getSession()
  if (data.session?.user) return { email: data.session.user.email }

  throw new Error(PESAN_TAUTAN_KEDALUWARSA)
}

/** True bila alamat saat ini membawa parameter tautan pemulihan Supabase. */
export function adalahTautanPemulihan(loc = window.location) {
  const teks = `${loc.search}${loc.hash}`
  return (
    teks.includes('type=recovery') ||
    teks.includes('access_token=') ||
    teks.includes('token_hash=') ||
    (loc.pathname === '/' && new URLSearchParams(loc.search).has('code'))
  )
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
