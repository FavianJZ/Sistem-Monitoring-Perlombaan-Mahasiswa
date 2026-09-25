import { Inbox } from 'lucide-react'
import { cn } from '@/lib/cn'

/** Tampilan saat tidak ada data, termasuk saat filter tidak menemukan hasil. */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  tone = 'neutral',
  className,
}) {
  const iconTone = {
    neutral: 'bg-slate-100 text-slate-500',
    warning: 'bg-warning-100 text-warning-700',
    danger: 'bg-danger-100 text-danger-700',
  }[tone]

  return (
    <div className={cn('px-6 py-12 text-center', className)}>
      <span className={cn('mx-auto grid size-12 place-items-center rounded-full', iconTone)}>
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <p className="mt-4 font-semibold text-slate-900">{title}</p>
      {description && (
        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-600">{description}</p>
      )}
      {action && <div className="mt-5 flex justify-center gap-2">{action}</div>}
    </div>
  )
}
