import { useId } from 'react'
import { cn } from '@/lib/cn'
import { controlClasses, describedBy, FieldShell } from './field'

export function Input({
  id,
  label,
  hint,
  error,
  required,
  leadingIcon: LeadingIcon,
  suffix,
  trailingAction,
  className,
  wrapperClassName,
  ...props
}) {
  const autoId = useId()
  const inputId = id ?? autoId
  const hintId = `${inputId}-hint`
  const errorId = `${inputId}-error`

  return (
    <FieldShell
      id={inputId}
      label={label}
      hint={hint}
      error={error}
      required={required}
      hintId={hintId}
      errorId={errorId}
      className={wrapperClassName}
    >
      <div className="relative">
        {LeadingIcon && (
          <LeadingIcon
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
        )}
        <input
          id={inputId}
          required={required}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy({ hint, error, hintId, errorId })}
          className={controlClasses({
            error,
            className: cn(
              LeadingIcon && 'pl-9',
              (suffix || trailingAction) && 'pr-12',
              className,
            ),
          })}
          {...props}
        />
        {suffix && !trailingAction && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
            {suffix}
          </span>
        )}

        {trailingAction && (
          <span className="absolute inset-y-0 right-1 flex items-center">{trailingAction}</span>
        )}
      </div>
    </FieldShell>
  )
}
