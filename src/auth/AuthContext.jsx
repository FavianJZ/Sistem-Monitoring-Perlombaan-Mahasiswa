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

/** Pesan Supabase Auth -> bahasa Indonesia. */
function terjemahkanGalatAuth(error) {
  const pesan = error?.message ?? ''
  if (/invalid login credentials/i.test(pesan)) return 'Email atau kata sandi tidak cocok.'
  if (/email not confirmed/i.test(pesan)) {
    return 'Email belum diverifikasi. Selesaikan verifikasi kode OTP saat mendaftar.'
  }
  if (/rate limit|too many/i.test(pesan)) return 'Terlalu banyak percobaan. Coba lagi beberapa saat.'
  return pesan || 'Terjadi kesalahan saat masuk.'
}

/*
 * Dua mode:
 * - Supabase aktif (env VITE_SUPABASE_* ada): sesi dari Supabase Auth, profil
 *   dari tabel public.profiles. Token diurus supabase-js (refresh otomatis).
 * - Tanpa Supabase (pengujian / demo): akun mock lokal seperti sebelumnya.
 */
const PAKAI_SUPABASE = apakahSupabaseAktif()

export function AuthProvider({ children, sesiAwal }) {
  const modeSupabase = PAKAI_SUPABASE && !sesiAwal
  const [sesi, setSesi] = useState(() =>
    modeSupabase ? null : (sesiAwal ?? sesiTersimpanYangValid()),
  )
  // Di mode Supabase, tunggu sesi tersimpan dipulihkan sebelum RequireAuth memutuskan.
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
      // Akun auth tanpa profil (mis. profil dihapus manual): anggap tidak valid.
      setSesi(null)
      return null
    }
    setSesi((lama) => {
      // Pengguna berganti: kosongkan cache agar data tidak bocor antar akun.
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
      // Jangan await di dalam callback (anjuran supabase-js untuk menghindari deadlock).
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
          if (error) throw new Error(terjemahkanGalatAuth(error))
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

  /**
   * Mode Supabase: akun sudah dibuat oleh signUp di modal OTP dan sesi aktif
   * setelah verifyOtp; di sini cukup memuat profil hasil trigger database.
   */
  const daftar = useCallback(
    async (data) => {
      setMemproses(true)
      try {
        if (modeSupabase) {
          const { data: sesiData } = await supabase.auth.getSession()
          if (!sesiData.session) {
            throw new Error('Sesi verifikasi tidak ditemukan. Ulangi verifikasi kode OTP.')
          }
          const profil = await pakaiSesiSupabase(sesiData.session)
          if (!profil) throw new Error('Profil gagal dibuat. Coba lagi atau hubungi admin prodi.')
          if (data?.role && profil.role !== data.role) {
            throw new Error(
              `Akun dibuat sebagai ${profil.role} karena kode otorisasi ${data.role} tidak valid.`,
            )
          }
          return profil
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
      keluar,
    }),
    [sesi, siap, modeSupabase, memproses, masuk, masukCepat, daftar, keluar],
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
