import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/cn'

// Hanya angka yang diberi warna; kartu sengaja polos agar angka yang menonjol.
const WARNA_ANGKA = {
  neutral: 'text-slate-900',
  primary: 'text-slate-900',
  success: 'text-slate-900',
  warning: 'text-warning-800',
  danger: 'text-danger-700',
}

export function StatCard({
  label,
  nilai,
  satuan,
  keterangan,
  tone = 'neutral',
  to,
  aksiLabel = 'Lihat rincian',
  className,
}) {
  const isi = (
    <>
      <p className="text-sm font-medium text-slate-600">{label}</p>

      <p className={cn('mt-2 text-3xl font-bold tracking-tight', WARNA_ANGKA[tone] ?? WARNA_ANGKA.neutral)}>
        {nilai}
        {satuan && <span className="ml-1 text-base font-semibold text-slate-500">{satuan}</span>}
      </p>

      {keterangan && <p className="mt-1 text-xs text-slate-500">{keterangan}</p>}

      {to && (
        <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary-700">
          {aksiLabel}
          <ArrowRight className="size-4" aria-hidden="true" />
        </span>
      )}
    </>
  )

  const kelas = cn(
    'block rounded-lg border border-slate-200 bg-white p-5 shadow-card',
    to && 'transition-colors hover:border-primary-300 hover:bg-primary-50/40',
    className,
  )

  if (to) {
    return (
      <Link to={to} className={kelas} data-testid={`stat-${label}`}>
        {isi}
      </Link>
    )
  }

  return (
    <div className={kelas} data-testid={`stat-${label}`}>
      {isi}
    </div>
  )
}
