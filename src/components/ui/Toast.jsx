import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react'
import { cn } from '@/lib/cn'

const ToastContext = createContext(null)

const VARIANTS = {
  info: { icon: Info, wrapper: 'border-slate-200', accent: 'text-primary-600' },
  success: { icon: CircleCheck, wrapper: 'border-success-200', accent: 'text-success-600' },
  warning: { icon: TriangleAlert, wrapper: 'border-warning-200', accent: 'text-warning-600' },
  danger: { icon: CircleAlert, wrapper: 'border-danger-200', accent: 'text-danger-600' },
}

function ToastItem({ toast, onDismiss }) {
  const variant = VARIANTS[toast.variant] ?? VARIANTS.info
  const Icon = variant.icon

  useEffect(() => {
    if (toast.duration === 0) return
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration)
    return () => clearTimeout(timer)
  }, [toast.duration, toast.id, onDismiss])

  return (
    <div
      role={toast.variant === 'danger' ? 'alert' : 'status'}
      className={cn(
        'pointer-events-auto flex w-full items-start gap-3 rounded-lg border bg-white p-4 shadow-pop',
        variant.wrapper,
      )}
    >
      <Icon className={cn('mt-0.5 size-5 shrink-0', variant.accent)} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900">{toast.title}</p>
        {toast.description && <p className="mt-0.5 text-sm text-slate-600">{toast.description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Tutup notifikasi"
        className="-mr-1 -mt-1 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}

/** Menyediakan fungsi `toast()` ke seluruh aplikasi. */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const counter = useRef(0)

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((item) => item.id !== id))
  }, [])

  const toast = useCallback((options) => {
    const id = `toast-${(counter.current += 1)}`
    const payload =
      typeof options === 'string' ? { title: options } : { ...options }

    setToasts((current) => [
      ...current,
      { id, variant: 'info', duration: 4500, ...payload },
    ])
    return id
  }, [])

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-label="Notifikasi"
        className="pointer-events-none fixed inset-x-4 top-4 z-60 flex flex-col gap-2 sm:left-auto sm:right-4 sm:w-96"
      >
        {toasts.map((item) => (
          <ToastItem key={item.id} toast={item} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast harus dipakai di dalam ToastProvider')
  }
  return context
}
