import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { berandaRole } from './sesi'

/**
 * Pembatas rute berdasarkan status login dan role.
 *
 * Pengguna yang belum masuk dialihkan ke halaman login sambil membawa
 * alamat tujuan, sehingga setelah masuk bisa langsung dilanjutkan.
 * Pengguna dengan role yang tidak sesuai dikembalikan ke berandanya.
 */
export function RequireAuth({ roles }) {
  const { user } = useAuth()
  const lokasi = useLocation()

  if (!user) {
    return <Navigate to="/login" replace state={{ dari: lokasi.pathname + lokasi.search }} />
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={berandaRole(user.role)} replace />
  }

  return <Outlet />
}
