import { LogOut, Menu } from 'lucide-react'
import { ROLE_LABELS } from '@/config/navigation'

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

/**
 * Bar atas: tombol menu untuk layar kecil dan identitas pengguna aktif.
 */
export function Topbar({ user, onMenuClick, onLogout }) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Buka menu navigasi"
        className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
      >
        <Menu className="size-5" aria-hidden="true" />
      </button>

      <p className="font-extrabold tracking-tight text-slate-900 lg:hidden">SiMonLomba</p>

      <div className="ml-auto flex items-center gap-3">
        {user ? (
          <>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold leading-tight text-slate-900">{user.nama}</p>
              <p className="text-xs text-slate-500">
                {ROLE_LABELS[user.role] ?? user.role}
                {user.nim ? ` - ${user.nim}` : ''}
              </p>
            </div>
            <span
              aria-hidden="true"
              className="grid size-10 place-items-center rounded-full bg-primary-100 text-sm font-bold text-primary-700"
            >
              {initials(user.nama)}
            </span>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="rounded-md p-2 text-slate-500 hover:bg-danger-50 hover:text-danger-600"
                aria-label="Keluar dari akun"
                title="Keluar"
              >
                <LogOut className="size-5" aria-hidden="true" />
              </button>
            )}
          </>
        ) : (
          <span className="text-sm text-slate-500">Belum masuk</span>
        )}
      </div>
    </header>
  )
}
