import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { getNavItems } from '@/config/navigation'
import { useAuth } from '@/auth/AuthContext'

export function AppShell() {
  const { user, keluar } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const items = getNavItems(user?.role)

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!menuOpen) return

    function handleKeyDown(event) {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [menuOpen])

  return (
    <div className="min-h-dvh bg-slate-50">
      <a href="#main-content" className="skip-link">
        Lewati ke konten utama
      </a>

      <Sidebar
        items={items}
        role={user?.role}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />

      <div className="lg:pl-72">
        <Topbar user={user} onMenuClick={() => setMenuOpen(true)} onLogout={keluar} />
        <main id="main-content" className="px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
