import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { berandaRole } from './sesi'
import { adalahTautanPemulihan } from '@/lib/supabase'

export function RequireAuth({ roles }) {
  const { user } = useAuth()
  const lokasi = useLocation()

  // Harus dicek sebelum redirect ke /login, karena tautan reset sering
  // mendarat di "/" (Site URL) yang dijaga RequireAuth.
  if (typeof window !== 'undefined' && adalahTautanPemulihan(window.location)) {
    return (
      <Navigate to={`/reset-password${window.location.search}${window.location.hash}`} replace />
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ dari: lokasi.pathname + lokasi.search }} />
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={berandaRole(user.role)} replace />
  }

  return <Outlet />
}
