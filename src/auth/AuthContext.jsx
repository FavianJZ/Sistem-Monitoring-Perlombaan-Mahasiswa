import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import {
  login as loginService,
  penggunaSinkron,
  registrasi as registrasiService,
} from '@/services/userService'
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

export function AuthProvider({ children, sesiAwal }) {
  const [sesi, setSesi] = useState(() => sesiAwal ?? sesiTersimpanYangValid())
  const [memproses, setMemproses] = useState(false)

  const masuk = useCallback(async ({ email, password }) => {
    setMemproses(true)
    try {
      const hasil = await loginService({ email, password })
      const sesiBaru = { user: hasil.user, token: hasil.token }

      simpanSesi(sesiBaru)
      setSesi(sesiBaru)
      return sesiBaru.user
    } finally {
      setMemproses(false)
    }
  }, [])

  const daftar = useCallback(async (data) => {
    setMemproses(true)
    try {
      const hasil = await registrasiService(data)
      const sesiBaru = { user: hasil.user, token: hasil.token }

      simpanSesi(sesiBaru)
      setSesi(sesiBaru)
      return sesiBaru.user
    } finally {
      setMemproses(false)
    }
  }, [])

  const masukCepat = useCallback(
    async (idPengguna) => {
      const pengguna = penggunaSinkronDemo(idPengguna)
      if (!pengguna) throw new Error(`Akun demo ${idPengguna} tidak ditemukan.`)

      return masuk({ email: pengguna.email, password: SANDI_DEMO })
    },
    [masuk],
  )

  const keluar = useCallback(() => {
    hapusSesi()
    setSesi(null)
  }, [])

  const nilai = useMemo(
    () => ({
      user: sesi?.user ?? null,
      token: sesi?.token ?? null,
      sudahMasuk: Boolean(sesi?.user),
      role: sesi?.user?.role ?? null,
      beranda: berandaRole(sesi?.user?.role),
      memproses,
      masuk,
      masukCepat,
      daftar,
      keluar,
    }),
    [sesi, memproses, masuk, masukCepat, daftar, keluar],
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
