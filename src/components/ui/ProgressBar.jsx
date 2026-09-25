import { cn } from '@/lib/cn'

const TONES = {
  primary: 'bg-primary-600',
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  danger: 'bg-danger-500',
}

/** Bilah progres dengan nilai yang bisa dibaca pembaca layar. */
export function ProgressBar({ nilai = 0, label, tone = 'primary', tinggi = 'h-2', className }) {
  const aman = Math.max(0, Math.min(100, Math.round(nilai)))

  return (
    <div className={cn('w-full overflow-hidden rounded-full bg-slate-100', tinggi, className)}>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={aman}
        aria-valuemin={0}
        aria-valuemax={100}
        style={{ width: `${aman}%` }}
        className={cn('h-full rounded-full transition-all', TONES[tone] ?? TONES.primary)}
      />
    </div>
  )
}
