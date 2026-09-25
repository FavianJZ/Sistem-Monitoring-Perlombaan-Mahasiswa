import { useId } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'
import { controlClasses, describedBy, FieldShell } from './field'

/**
 * Select dengan opsi dari prop `options` ([{ value, label }] atau string)
 * maupun dari children bila butuh optgroup.
 */
export function Select({
  id,
  label,
  hint,
  error,
  required,
  options,
  placeholder,
  className,
  wrapperClassName,
  children,
  ...props
}) {
  const autoId = useId()
  const fieldId = id ?? autoId
  const hintId = `${fieldId}-hint`
  const errorId = `${fieldId}-error`

  return (
    <FieldShell
      id={fieldId}
      label={label}
      hint={hint}
      error={error}
      required={required}
      hintId={hintId}
      errorId={errorId}
      className={wrapperClassName}
    >
      <div className="relative">
        <select
          id={fieldId}
          required={required}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy({ hint, error, hintId, errorId })}
          className={controlClasses({
            error,
            className: cn('appearance-none pr-10', className),
          })}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options?.map((option) => {
            const value = typeof option === 'string' ? option : option.value
            const text = typeof option === 'string' ? option : option.label
            return (
              <option key={value} value={value}>
                {text}
              </option>
            )
          })}
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
      </div>
    </FieldShell>
  )
}
