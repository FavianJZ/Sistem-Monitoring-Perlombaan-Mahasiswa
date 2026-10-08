import { useEffect } from 'react'
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ToastProvider } from '@/components/ui/Toast'
import { AuthProvider } from '@/auth/AuthContext'
import { RequireAuth } from '@/auth/RequireAuth'
import DashboardMahasiswa from '@/pages/mahasiswa/DashboardMahasiswa'
import LombaSaya from '@/pages/mahasiswa/LombaSaya'
import PendaftaranLomba from '@/pages/mahasiswa/PendaftaranLomba'
import DetailLombaSaya from '@/pages/mahasiswa/DetailLombaSaya'
import Profil from '@/pages/mahasiswa/Profil'
import DashboardMonitoring from '@/pages/dosen/DashboardMonitoring'
import MonitoringLomba from '@/pages/dosen/MonitoringLomba'
import DetailLombaDosen from '@/pages/dosen/DetailLombaDosen'
import KalenderAgenda from '@/pages/dosen/KalenderAgenda'
import ArsipPrestasi from '@/pages/dosen/ArsipPrestasi'
import StyleGuide from '@/pages/StyleGuide'
import DataMock from '@/pages/DataMock'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import RegisterStaf from '@/pages/RegisterStaf'
import LupaPassword from '@/pages/LupaPassword'
import ResetPassword from '@/pages/ResetPassword'
import NotFound from '@/pages/NotFound'
import { supabase, apakahSupabaseAktif } from '@/lib/supabase'
import { MODE_DEMO } from '@/config/mode'

const ROLE_PEMANTAU = ['dosen', 'admin']

function DeteksiRedirectRecovery() {
  const navigate = useNavigate()
  const lokasi = useLocation()

  useEffect(() => {
    const hash = window.location.hash
    if (hash && (hash.includes('type=recovery') || hash.includes('access_token'))) {
      if (lokasi.pathname !== '/reset-password') {
        navigate(`/reset-password${hash}`, { replace: true })
        return
      }
    }

    if (apakahSupabaseAktif()) {
      const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') {
          if (lokasi.pathname !== '/reset-password') {
            navigate('/reset-password', { replace: true })
          }
        }
      })
      return () => authListener?.subscription?.unsubscribe()
    }
  }, [navigate, lokasi])

  return null
}

export default function App({ sesiAwal }) {
  return (
    <AuthProvider sesiAwal={sesiAwal}>
      <ToastProvider>
        <DeteksiRedirectRecovery />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/daftar" element={<Register />} />
          <Route path="/daftar-staf" element={<RegisterStaf />} />
          <Route path="/lupa-password" element={<LupaPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route element={<RequireAuth />}>
            <Route element={<AppShell />}>

              <Route element={<RequireAuth roles={['mahasiswa']} />}>
                <Route index element={<DashboardMahasiswa />} />
                <Route path="lomba-saya" element={<LombaSaya />} />
                <Route path="lomba-saya/baru" element={<PendaftaranLomba />} />
                <Route path="lomba-saya/:id" element={<DetailLombaSaya />} />
              </Route>

              <Route element={<RequireAuth roles={ROLE_PEMANTAU} />}>
                <Route path="monitoring" element={<DashboardMonitoring />} />
                <Route path="monitoring/lomba" element={<MonitoringLomba />} />
                <Route path="monitoring/lomba/:id" element={<DetailLombaDosen />} />
                <Route path="monitoring/kalender" element={<KalenderAgenda />} />
                <Route path="monitoring/arsip" element={<ArsipPrestasi />} />
              </Route>

              <Route path="profil" element={<Profil />} />
              {MODE_DEMO && <Route path="styleguide" element={<StyleGuide />} />}
              {MODE_DEMO && <Route path="data-mock" element={<DataMock />} />}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Route>
        </Routes>
      </ToastProvider>
    </AuthProvider>
  )
}
