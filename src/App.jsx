import { Route, Routes } from 'react-router-dom'
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
import NotFound from '@/pages/NotFound'

const ROLE_PEMANTAU = ['dosen', 'admin']

export default function App({ sesiAwal }) {
  return (
    <AuthProvider sesiAwal={sesiAwal}>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Seluruh halaman aplikasi butuh sesi. */}
          <Route element={<RequireAuth />}>
            <Route element={<AppShell />}>
              {/* Area mahasiswa. */}
              <Route element={<RequireAuth roles={['mahasiswa']} />}>
                <Route index element={<DashboardMahasiswa />} />
                <Route path="lomba-saya" element={<LombaSaya />} />
                <Route path="lomba-saya/baru" element={<PendaftaranLomba />} />
                <Route path="lomba-saya/:id" element={<DetailLombaSaya />} />
              </Route>

              {/* Area dosen dan admin program studi. */}
              <Route element={<RequireAuth roles={ROLE_PEMANTAU} />}>
                <Route path="monitoring" element={<DashboardMonitoring />} />
                <Route path="monitoring/lomba" element={<MonitoringLomba />} />
                <Route path="monitoring/lomba/:id" element={<DetailLombaDosen />} />
                <Route path="monitoring/kalender" element={<KalenderAgenda />} />
                <Route path="monitoring/arsip" element={<ArsipPrestasi />} />
              </Route>

              {/* Terbuka untuk semua role yang sudah masuk. */}
              <Route path="profil" element={<Profil />} />
              <Route path="styleguide" element={<StyleGuide />} />
              <Route path="data-mock" element={<DataMock />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Route>
        </Routes>
      </ToastProvider>
    </AuthProvider>
  )
}
