import { cn } from '@/lib/cn'

const TONES = {
  neutral: 'bg-slate-100 text-slate-700 ring-slate-200',
  primary: 'bg-primary-50 text-primary-700 ring-primary-200',
  success: 'bg-success-50 text-success-700 ring-success-200',
  warning: 'bg-warning-50 text-warning-800 ring-warning-200',
  danger: 'bg-danger-50 text-danger-700 ring-danger-200',
  // Teks memakai nada 800 agar rasio kontras di atas latar terang lolos AA.
  accent: 'bg-accent-50 text-accent-800 ring-accent-200',
}

const SIZES = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
}

/** Label ringkas untuk status, kategori, atau tingkat lomba. */
export function Badge({
  tone = 'neutral',
  size = 'md',
  icon: Icon,
  dot = false,
  className,
  children,
  ...props
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-semibold ring-1 ring-inset',
        TONES[tone] ?? TONES.neutral,
        SIZES[size] ?? SIZES.md,
        className,
      )}
      {...props}
    >
      {dot && <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />}
      {Icon && <Icon className="size-3.5 shrink-0" aria-hidden="true" />}
      {children}
    </span>
  )
}

export const BADGE_TONES = Object.keys(TONES)
