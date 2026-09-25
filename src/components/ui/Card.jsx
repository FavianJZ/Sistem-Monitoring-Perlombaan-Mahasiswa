import { cn } from '@/lib/cn'

export function Card({ as: Component = 'div', className, children, ...props }) {
  return (
    <Component
      className={cn('rounded-lg border border-slate-200 bg-white shadow-card', className)}
      {...props}
    >
      {children}
    </Component>
  )
}

export function CardHeader({ className, children, actions }) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-5 py-4',
        className,
      )}
    >
      <div className="min-w-0">{children}</div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}

export function CardTitle({ as: Component = 'h2', className, children }) {
  return (
    <Component className={cn('text-base font-bold tracking-tight text-slate-900', className)}>
      {children}
    </Component>
  )
}

export function CardDescription({ className, children }) {
  return <p className={cn('mt-0.5 text-sm text-slate-600', className)}>{children}</p>
}

export function CardContent({ className, children }) {
  return <div className={cn('px-5 py-4', className)}>{children}</div>
}

export function CardFooter({ className, children }) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-3 border-t border-slate-200 bg-slate-50/60 px-5 py-3',
        className,
      )}
    >
      {children}
    </div>
  )
}
