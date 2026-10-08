import { NavLink } from 'react-router-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { BinusLogo, BinusMotif } from '@/components/brand/BinusLogo'
import { DEV_NAV_ITEMS, ROLE_LABELS } from '@/config/navigation'
import { MODE_DEMO } from '@/config/mode'

function NavItem({ item, onNavigate }) {
  const Icon = item.icon

  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-r-md border-l-[3px] px-3 py-2.5 text-sm font-medium transition-colors',
          isActive
            ? 'border-accent-500 bg-primary-50 text-primary-800'
            : 'border-transparent text-slate-600 hover:bg-slate-100 hover:text-accent-700',
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

export function Sidebar({ items, role = 'mahasiswa', open = false, onClose }) {
  return (
    <>

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
        <div className="relative flex h-20 items-center gap-3 border-b border-slate-200 pl-12 pr-4">
          <BinusMotif className="absolute left-0 top-0 h-full w-auto" />
          <BinusLogo className="h-10 shrink-0" />
          <div className="min-w-0 border-l border-slate-200 pl-3">
            <p className="truncate text-sm font-bold uppercase tracking-wide text-slate-700">
              SiMonLomba
            </p>
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

          {MODE_DEMO && (
            <>
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
            </>
          )}
        </nav>

        {MODE_DEMO && (
          <p className="border-t border-slate-200 px-5 py-3 text-xs text-slate-400">
            Versi prototipe - data masih mock
          </p>
        )}
      </aside>
    </>
  )
}
