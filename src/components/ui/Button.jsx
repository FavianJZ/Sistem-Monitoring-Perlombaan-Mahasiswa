import { LoaderCircle } from 'lucide-react'
import { cn } from '@/lib/cn'

const VARIANTS = {
  primary:
    'bg-primary-600 text-white shadow-xs hover:bg-primary-700 active:bg-primary-800 disabled:bg-primary-300',
  secondary:
    'bg-slate-800 text-white shadow-xs hover:bg-slate-900 active:bg-slate-950 disabled:bg-slate-400',
  outline:
    'border border-slate-300 bg-white text-slate-700 shadow-xs hover:bg-slate-50 hover:text-slate-900 disabled:text-slate-400',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:text-slate-400',
  danger:
    'bg-danger-600 text-white shadow-xs hover:bg-danger-700 active:bg-danger-800 disabled:bg-danger-300',
  success:
    'bg-success-600 text-white shadow-xs hover:bg-success-700 active:bg-success-800 disabled:bg-success-300',
}

const SIZES = {
  sm: 'h-9 gap-1.5 px-3 text-sm',
  md: 'h-10 gap-2 px-4 text-sm',
  lg: 'h-11 gap-2 px-5 text-base',
  icon: 'size-10',
}

export function Button({
  as: Component = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  leadingIcon: LeadingIcon,
  trailingIcon: TrailingIcon,
  className,
  children,
  type,
  ...props
}) {
  const isNativeButton = Component === 'button'
  const isDisabled = disabled || loading

  return (
    <Component
      type={isNativeButton ? (type ?? 'button') : type}
      disabled={isNativeButton ? isDisabled : undefined}
      aria-disabled={!isNativeButton && isDisabled ? 'true' : undefined}
      aria-busy={loading ? 'true' : undefined}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-md font-semibold transition-colors',
        'disabled:cursor-not-allowed aria-disabled:pointer-events-none aria-disabled:opacity-60',
        VARIANTS[variant] ?? VARIANTS.primary,
        SIZES[size] ?? SIZES.md,
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading ? (
        <LoaderCircle className="size-4 shrink-0 animate-spin" aria-hidden="true" />
      ) : (
        LeadingIcon && <LeadingIcon className="size-4 shrink-0" aria-hidden="true" />
      )}
      {children}
      {TrailingIcon && !loading && (
        <TrailingIcon className="size-4 shrink-0" aria-hidden="true" />
      )}
    </Component>
  )
}
