import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'

export function Stepper({ steps, current, onStepClick, className }) {
  return (
    <nav aria-label="Langkah pendaftaran" className={className}>
      <ol className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-0">
        {steps.map((step, index) => {
          const selesai = index < current
          const aktif = index === current
          const bisaDiklik = selesai && Boolean(onStepClick)

          return (
            <li key={step.id} className="flex flex-1 items-center gap-3">
              <button
                type="button"
                onClick={bisaDiklik ? () => onStepClick(index) : undefined}
                disabled={!bisaDiklik}
                aria-current={aktif ? 'step' : undefined}
                className={cn(
                  'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors',
                  bisaDiklik && 'hover:bg-slate-100',
                  !bisaDiklik && 'cursor-default',
                )}
              >
                <span
                  className={cn(
                    'grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold',
                    selesai && 'bg-primary-600 text-white',
                    aktif && 'bg-primary-50 text-primary-700 ring-2 ring-primary-600',
                    !selesai && !aktif && 'bg-slate-100 text-slate-500',
                  )}
                >
                  {selesai ? (
                    <>
                      <Check className="size-4" aria-hidden="true" />
                      <span className="sr-only">Selesai</span>
                    </>
                  ) : (
                    index + 1
                  )}
                </span>
                <span className="min-w-0">
                  <span
                    className={cn(
                      'block text-sm font-semibold',
                      aktif ? 'text-slate-900' : 'text-slate-600',
                    )}
                  >
                    {step.label}
                  </span>
                  {step.keterangan && (
                    <span className="hidden text-xs text-slate-500 lg:block">
                      {step.keterangan}
                    </span>
                  )}
                </span>
              </button>

              {index < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    'hidden h-0.5 flex-1 rounded-full sm:block',
                    selesai ? 'bg-primary-600' : 'bg-slate-200',
                  )}
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
