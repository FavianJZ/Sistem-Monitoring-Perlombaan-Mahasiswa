import { useId, useRef } from 'react'
import { cn } from '@/lib/cn'
import { Badge } from './Badge'

/**
 * Tab terkendali dengan navigasi panah kiri/kanan, Home, dan End.
 * Panel dirender oleh pemanggil lewat komponen TabPanel.
 */
export function Tabs({ tabs, aktif, onGanti, idPrefix, className }) {
  const autoId = useId()
  const prefix = idPrefix ?? autoId
  const refs = useRef([])

  function handleKeyDown(event) {
    const indeksSekarang = tabs.findIndex((tab) => tab.id === aktif)
    let tujuan = null

    if (event.key === 'ArrowRight') tujuan = (indeksSekarang + 1) % tabs.length
    if (event.key === 'ArrowLeft') tujuan = (indeksSekarang - 1 + tabs.length) % tabs.length
    if (event.key === 'Home') tujuan = 0
    if (event.key === 'End') tujuan = tabs.length - 1

    if (tujuan === null) return

    event.preventDefault()
    onGanti(tabs[tujuan].id)
    refs.current[tujuan]?.focus()
  }

  return (
    <div
      role="tablist"
      aria-label="Bagian detail lomba"
      onKeyDown={handleKeyDown}
      className={cn('flex gap-1 overflow-x-auto border-b border-slate-200 px-2', className)}
    >
      {tabs.map((tab, indeks) => {
        const terpilih = tab.id === aktif

        return (
          <button
            key={tab.id}
            ref={(node) => {
              refs.current[indeks] = node
            }}
            type="button"
            role="tab"
            id={`${prefix}-tab-${tab.id}`}
            aria-selected={terpilih}
            aria-controls={`${prefix}-panel-${tab.id}`}
            tabIndex={terpilih ? 0 : -1}
            onClick={() => onGanti(tab.id)}
            className={cn(
              'flex shrink-0 items-center gap-2 border-b-2 px-3.5 py-3 text-sm font-semibold transition-colors',
              terpilih
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900',
            )}
          >
            {tab.label}
            {/* Angka hanya penanda visual; isinya tetap terbaca di dalam panel,
                dan menyembunyikannya menjaga nama tab tetap bersih untuk pembaca layar. */}
            {tab.badge !== undefined && tab.badge !== null && (
              <Badge aria-hidden="true" size="sm" tone={terpilih ? 'primary' : 'neutral'}>
                {tab.badge}
              </Badge>
            )}
          </button>
        )
      })}
    </div>
  )
}

export function TabPanel({ id, aktif, idPrefix, children, className }) {
  if (id !== aktif) return null

  return (
    <div
      role="tabpanel"
      id={`${idPrefix}-panel-${id}`}
      aria-labelledby={`${idPrefix}-tab-${id}`}
      tabIndex={0}
      className={className}
    >
      {children}
    </div>
  )
}
