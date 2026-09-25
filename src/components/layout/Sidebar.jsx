import { NavLink } from 'react-router-dom'
import { GraduationCap, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { DEV_NAV_ITEMS, ROLE_LABELS } from '@/config/navigation'

function NavItem({ item, onNavigate }) {
  const Icon = item.icon

  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
          isActive
            ? 'bg-primary-50 text-primary-700'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={cn('size-5 shrink-0', isActive ? 'text-primary-600' : 'text-slate-400')}
            aria-hidden="true"
          />
          <span className="truncate">{item.label}</span>
        </>
      )}
    </NavLink>
  )
}

/**
 * Sidebar navigasi. Di layar besar tampil permanen, di layar kecil
 * berubah menjadi drawer yang dikendalikan prop `open`.
 */
export function Sidebar({ items, role = 'mahasiswa', open = false, onClose }) {
  return (
    <>
      {/* Lapisan gelap di belakang drawer, hanya di layar kecil. */}
      {open && (
        <button
          type="button"
          aria-label="Tutup menu navigasi"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden"
        />
      )}

      <aside
        data-testid="sidebar"
        data-open={open ? 'true' : 'false'}
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary-600 text-white">
            <GraduationCap className="size-6" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-extrabold tracking-tight text-slate-900">SiMonLomba</p>
            <p className="truncate text-xs text-slate-500">Monitoring Perlombaan</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup menu navigasi"
            className="ml-auto rounded-md p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <nav aria-label="Navigasi utama" className="flex-1 overflow-y-auto px-3 py-4">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            {ROLE_LABELS[role] ?? 'Menu'}
          </p>
          <ul className="space-y-1">
            {items.map((item) => (
              <li key={item.to}>
                <NavItem item={item} onNavigate={onClose} />
              </li>
            ))}
          </ul>

          <p className="px-3 pb-2 pt-6 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Pengembangan
          </p>
          <ul className="space-y-1">
            {DEV_NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavItem item={item} onNavigate={onClose} />
              </li>
            ))}
          </ul>
        </nav>

        <p className="border-t border-slate-200 px-5 py-3 text-xs text-slate-400">
          Versi prototipe - data masih mock
        </p>
      </aside>
    </>
  )
}
