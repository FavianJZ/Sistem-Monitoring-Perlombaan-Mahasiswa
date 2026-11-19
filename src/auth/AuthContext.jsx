import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  ambilProfil,
  login as loginService,
  muatProfil,
  penggunaSinkron,
  registrasi as registrasiService,
  resetCacheProfil,
} from '@/services/userService'
import { resetCache as resetCacheLomba } from '@/services/supabaseStore'
import { supabase, apakahSupabaseAktif } from '@/lib/supabase'
import { SANDI_DEMO, penggunaSinkronDemo } from './akunDemo'
import { bacaSesi, berandaRole, hapusSesi, simpanSesi } from './sesi'

const AuthContext = createContext(null)

function sesiTersimpanYangValid() {
  const sesi = bacaSesi()
  if (!sesi) return null
  if (penggunaSinkron(sesi.user.id)) return sesi

  hapusSesi()
  return null
}

export const EMAIL_BELUM_TERVERIFIKASI = 'EMAIL_BELUM_TERVERIFIKASI'

const POLA_KODE_OTP = /^\d{6,8}$/

function normalisasiEmail(email) {
  return String(email ?? '').trim().toLowerCase()
}

function normalisasiKode(kode) {
  const bersih = String(kode ?? '').replace(/\s/g, '')
  if (!POLA_KODE_OTP.test(bersih)) throw new Error('Kode verifikasi terdiri dari 6 sampai 8 angka.')
  return bersih
}

function emailBelumTerverifikasi(error) {
  return error?.code === 'email_not_confirmed' || /email not confirmed/i.test(error?.message ?? '')
}

function terjemahkanGalatAuth(error) {
  const pesan = error?.message ?? ''
  if (/invalid login credentials/i.test(pesan)) return 'Email atau kata sandi tidak cocok.'
  if (emailBelumTerverifikasi(error)) {
    return 'Email akun ini belum diverifikasi. Masukkan kode yang kami kirim ke email Anda.'
  }
  if (error?.code === 'otp_expired' || /token has expired or is invalid|otp.*(expired|invalid)/i.test(pesan)) {
    return 'Kode verifikasi salah atau sudah kedaluwarsa. Minta kode baru.'
  }
  if (error?.code === 'same_password' || /should be different from the old password/i.test(pesan)) {
    return 'Kata sandi baru harus berbeda dari kata sandi lama.'
  }
  if (error?.code === 'weak_password' || /password should be/i.test(pesan)) {
    return 'Kata sandi terlalu lemah. Gunakan minimal 8 karakter berisi huruf dan angka.'
  }
  const tunggu = /after (\d+) seconds?/i.exec(pesan)
  if (tunggu) return `Tunggu ${tunggu[1]} detik sebelum meminta kode baru.`
  if (/error sending (confirmation|recovery|magic link)? ?email|smtp/i.test(pesan)) {
    return 'Email verifikasi gagal dikirim. Coba lagi nanti atau hubungi admin prodi.'
  }
  if (/already registered/i.test(pesan)) return 'Email ini sudah terdaftar. Silakan masuk.'
  if (/database error saving new user/i.test(pesan)) {
    return 'Pendaftaran ditolak: NIM atau email sudah terdaftar, atau email bukan domain BINUS.'
  }
  if (/rate limit|too many|security purposes/i.test(pesan)) {
    return 'Terlalu banyak percobaan. Coba lagi beberapa saat.'
  }
  return pesan || 'Terjadi kesalahan saat masuk.'
}

function metadataPendaftaran(data) {
  const metadata = { nama: data.nama?.trim(), role: data.role, prodi: data.prodi }
  if (data.role === 'mahasiswa') {
    metadata.nim = data.nim
    metadata.angkatan = Number(data.angkatan)
  }
  const kodePeran = data.role === 'admin' ? data.kodeAdmin : data.kodeDosen
  if (kodePeran) metadata.kode_peran = kodePeran.trim()
  return metadata
}

function pastikanPeran(profil, rolePermintaan) {
  if (!profil) throw new Error('Profil gagal dibuat. Coba lagi atau hubungi admin prodi.')
  if (rolePermintaan && profil.role !== rolePermintaan) {
    throw new Error(
      `Akun dibuat sebagai ${profil.role} karena kode otorisasi ${rolePermintaan} tidak valid.`,
    )
  }
  return profil
}

const PAKAI_SUPABASE = apakahSupabaseAktif()

export function AuthProvider({ children, sesiAwal }) {
  const modeSupabase = PAKAI_SUPABASE && !sesiAwal
  const [sesi, setSesi] = useState(() =>
    modeSupabase ? null : (sesiAwal ?? sesiTersimpanYangValid()),
  )
  const [siap, setSiap] = useState(!modeSupabase)
  const [memproses, setMemproses] = useState(false)

  const pakaiSesiSupabase = useCallback(async (sesiSb) => {
    if (!sesiSb?.user) {
      resetCacheLomba()
      resetCacheProfil()
      setSesi(null)
      return null
    }
    const profil = await ambilProfil(sesiSb.user.id)
    if (!profil) {
      setSesi(null)
      return null
    }
    setSesi((lama) => {
      if (lama?.user?.id !== profil.id) {
        resetCacheLomba()
        resetCacheProfil()
      }
      return { user: profil, token: sesiSb.access_token }
    })
    muatProfil()
    return profil
  }, [])

  useEffect(() => {
    if (!modeSupabase) return
    let aktif = true

    supabase.auth.getSession().then(async ({ data }) => {
      try {
        await pakaiSesiSupabase(data.session)
      } catch (e) {
        console.warn('[SiMonLomba] gagal memulihkan sesi:', e.message)
      } finally {
        if (aktif) setSiap(true)
      }
    })

    const { data: langganan } = supabase.auth.onAuthStateChange((event, sesiSb) => {
      if (event === 'INITIAL_SESSION') return
      if (event === 'TOKEN_REFRESHED') {
        setSesi((lama) => (lama ? { ...lama, token: sesiSb?.access_token } : lama))
        return
      }
      setTimeout(() => {
        pakaiSesiSupabase(sesiSb).catch((e) => console.warn('[SiMonLomba]', e.message))
      }, 0)
    })

    return () => {
      aktif = false
      langganan?.subscription?.unsubscribe()
    }
  }, [modeSupabase, pakaiSesiSupabase])

  const masuk = useCallback(
    async ({ email, password }) => {
      setMemproses(true)
      try {
        if (modeSupabase) {
          const alamat = String(email ?? '').trim().toLowerCase()
          if (!alamat) throw new Error('Email wajib diisi.')
          if (!password) throw new Error('Kata sandi wajib diisi.')

          const { data, error } = await supabase.auth.signInWithPassword({
            email: alamat,
            password,
          })
          if (error) {
            const galat = new Error(terjemahkanGalatAuth(error))
            if (emailBelumTerverifikasi(error)) {
              galat.kode = EMAIL_BELUM_TERVERIFIKASI
              galat.email = alamat
            }
            throw galat
          }
          const profil = await pakaiSesiSupabase(data.session)
          if (!profil) throw new Error('Profil akun tidak ditemukan. Hubungi admin prodi.')
          return profil
        }

        const hasil = await loginService({ email, password })
        const sesiBaru = { user: hasil.user, token: hasil.token }
        simpanSesi(sesiBaru)
        setSesi(sesiBaru)
        return sesiBaru.user
      } finally {
        setMemproses(false)
      }
    },
    [modeSupabase, pakaiSesiSupabase],
  )

  const daftar = useCallback(
    async (data) => {
      setMemproses(true)
      try {
        if (modeSupabase) {
          const { data: hasil, error } = await supabase.auth.signUp({
            email: String(data.email ?? '').trim().toLowerCase(),
            password: data.password,
            options: { data: metadataPendaftaran(data) },
          })
          if (error) throw new Error(terjemahkanGalatAuth(error))
          if (hasil.user && hasil.user.identities?.length === 0) {
            throw new Error('Email ini sudah terdaftar. Silakan masuk.')
          }
          if (!hasil.session) {
            return { perluVerifikasi: true, email: normalisasiEmail(data.email) }
          }
          return pastikanPeran(await pakaiSesiSupabase(hasil.session), data?.role)
        }

        const hasil = await registrasiService(data)
        const sesiBaru = { user: hasil.user, token: hasil.token }
        simpanSesi(sesiBaru)
        setSesi(sesiBaru)
        return sesiBaru.user
      } finally {
        setMemproses(false)
      }
    },
    [modeSupabase, pakaiSesiSupabase],
  )

  const verifikasiEmail = useCallback(
    async ({ email, kode, role }) => {
      setMemproses(true)
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          email: normalisasiEmail(email),
          token: normalisasiKode(kode),
          type: 'email',
        })
        if (error) throw new Error(terjemahkanGalatAuth(error))
        return pastikanPeran(await pakaiSesiSupabase(data.session), role)
      } finally {
        setMemproses(false)
      }
    },
    [pakaiSesiSupabase],
  )

  const kirimUlangVerifikasi = useCallback(async (email) => {
    const { error } = await supabase.auth.resend({ type: 'signup', email: normalisasiEmail(email) })
    if (error) throw new Error(terjemahkanGalatAuth(error))
  }, [])

  const mintaKodeReset = useCallback(async (email) => {
    const alamat = normalisasiEmail(email)
    if (!alamat) throw new Error('Email wajib diisi.')
    const { error } = await supabase.auth.resetPasswordForEmail(alamat)
    if (error) throw new Error(terjemahkanGalatAuth(error))
  }, [])

  const aturUlangSandi = useCallback(
    async ({ email, kode, password }) => {
      setMemproses(true)
      try {
        const alamat = normalisasiEmail(email)
        const { data: aktif } = await supabase.auth.getSession()
        let sesiSb = aktif.session?.user?.email === alamat ? aktif.session : null

        if (!sesiSb) {
          const { data, error } = await supabase.auth.verifyOtp({
            email: alamat,
            token: normalisasiKode(kode),
            type: 'recovery',
          })
          if (error) throw new Error(terjemahkanGalatAuth(error))
          sesiSb = data.session
        }

        const { error: galatSandi } = await supabase.auth.updateUser({ password })
        if (galatSandi) throw new Error(terjemahkanGalatAuth(galatSandi))

        const profil = await pakaiSesiSupabase(sesiSb)
        if (!profil) throw new Error('Profil akun tidak ditemukan. Hubungi admin prodi.')
        return profil
      } finally {
        setMemproses(false)
      }
    },
    [pakaiSesiSupabase],
  )

  const masukCepat = useCallback(
    async (idPengguna) => {
      const pengguna = penggunaSinkronDemo(idPengguna)
      if (!pengguna) throw new Error(`Akun demo ${idPengguna} tidak ditemukan.`)

      return masuk({ email: pengguna.email, password: SANDI_DEMO })
    },
    [masuk],
  )

  const keluar = useCallback(async () => {
    hapusSesi()
    setSesi(null)
    if (modeSupabase) {
      resetCacheLomba()
      resetCacheProfil()
      await supabase.auth.signOut()
    }
  }, [modeSupabase])

  const nilai = useMemo(
    () => ({
      user: sesi?.user ?? null,
      token: sesi?.token ?? null,
      sudahMasuk: Boolean(sesi?.user),
      role: sesi?.user?.role ?? null,
      beranda: berandaRole(sesi?.user?.role),
      siap,
      modeSupabase,
      memproses,
      masuk,
      masukCepat,
      daftar,
      verifikasiEmail,
      kirimUlangVerifikasi,
      mintaKodeReset,
      aturUlangSandi,
      keluar,
    }),
    [
      sesi,
      siap,
      modeSupabase,
      memproses,
      masuk,
      masukCepat,
      daftar,
      verifikasiEmail,
      kirimUlangVerifikasi,
      mintaKodeReset,
      aturUlangSandi,
      keluar,
    ],
  )

  return <AuthContext.Provider value={nilai}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const konteks = useContext(AuthContext)
  if (!konteks) {
    throw new Error('useAuth harus dipakai di dalam AuthProvider')
  }
  return konteks
}
