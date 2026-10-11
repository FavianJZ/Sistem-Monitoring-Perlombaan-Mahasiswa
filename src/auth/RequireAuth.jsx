import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { berandaRole } from './sesi'

export function RequireAuth({ roles }) {
  const { user, siap } = useAuth()
  const lokasi = useLocation()

  if (!siap) {
    return (
      <p role="status" className="p-8 text-center text-sm text-slate-500">
        Memuat sesi...
      </p>
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
