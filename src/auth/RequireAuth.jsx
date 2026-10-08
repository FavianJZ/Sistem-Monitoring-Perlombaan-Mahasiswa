import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { berandaRole } from './sesi'

export function RequireAuth({ roles }) {
  const { user } = useAuth()
  const lokasi = useLocation()

  if (typeof window !== 'undefined') {
    const hash = window.location.hash
    if (hash && (hash.includes('type=recovery') || hash.includes('access_token'))) {
      return <Navigate to={`/reset-password${hash}`} replace />
    }
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ dari: lokasi.pathname + lokasi.search }} />
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={berandaRole(user.role)} replace />
  }

  return <Outlet />
}
