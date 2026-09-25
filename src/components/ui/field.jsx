import { CircleAlert } from 'lucide-react'
import { cn } from '@/lib/cn'

/**
 * Kelas dasar untuk kontrol form (input, select, textarea) agar
 * tampilan dan state error-nya konsisten.
 */
export function controlClasses({ error, className } = {}) {
  return cn(
    'block w-full rounded-md border bg-white px-3 py-2.5 text-sm text-slate-900 shadow-xs transition-colors',
    'placeholder:text-slate-400',
    'disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500',
    error
      ? 'border-danger-400 focus:border-danger-500'
      : 'border-slate-300 hover:border-slate-400 focus:border-primary-500',
    className,
  )
}

/**
 * Pembungkus label, teks bantuan, dan pesan error.
 * Menjaga hubungan aria antara kontrol dan deskripsinya.
 */
export function FieldShell({
  id,
  label,
  hint,
  error,
  required,
  hintId,
  errorId,
  className,
  children,
}) {
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
          {required && (
            <>
              <span aria-hidden="true" className="ml-0.5 text-danger-600">
                *
              </span>
              <span className="sr-only"> (wajib diisi)</span>
            </>
          )}
        </label>
      )}

      {children}

      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-xs text-slate-500">
          {hint}
        </p>
      )}

      {error && (
        <p id={errorId} className="mt-1.5 flex items-start gap-1.5 text-xs text-danger-700">
          <CircleAlert className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  )
}

/** Menyusun nilai aria-describedby dari id bantuan dan id error yang aktif. */
export function describedBy({ hint, error, hintId, errorId }) {
  const ids = []
  if (error) ids.push(errorId)
  else if (hint) ids.push(hintId)
  return ids.length ? ids.join(' ') : undefined
}
