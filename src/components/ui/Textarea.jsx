import { useId } from 'react'
import { controlClasses, describedBy, FieldShell } from './field'

export function Textarea({
  id,
  label,
  hint,
  error,
  required,
  rows = 4,
  className,
  wrapperClassName,
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
      <textarea
        id={fieldId}
        rows={rows}
        required={required}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy({ hint, error, hintId, errorId })}
        className={controlClasses({ error, className })}
        {...props}
      />
    </FieldShell>
  )
}
