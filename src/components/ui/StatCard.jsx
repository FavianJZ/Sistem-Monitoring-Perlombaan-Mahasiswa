import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/cn'

const TONES = {
  neutral: { ikon: 'bg-slate-100 text-slate-600', angka: 'text-slate-900' },
  primary: { ikon: 'bg-primary-50 text-primary-600', angka: 'text-slate-900' },
  success: { ikon: 'bg-success-50 text-success-600', angka: 'text-slate-900' },
  warning: { ikon: 'bg-warning-50 text-warning-700', angka: 'text-warning-800' },
  danger: { ikon: 'bg-danger-50 text-danger-600', angka: 'text-danger-700' },
}

export function StatCard({
  label,
  nilai,
  satuan,
  keterangan,
  icon: Icon,
  tone = 'neutral',
  to,
  aksiLabel = 'Lihat rincian',
  className,
}) {
  const warna = TONES[tone] ?? TONES.neutral
  const isi = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-600">{label}</p>
        {Icon && (
          <span className={cn('grid size-9 shrink-0 place-items-center rounded-lg', warna.ikon)}>
            <Icon className="size-5" aria-hidden="true" />
          </span>
        )}
      </div>

      <p className={cn('mt-3 text-3xl font-extrabold tracking-tight', warna.angka)}>
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
