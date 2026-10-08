import { cn } from '@/lib/cn'

export function Skeleton({ className, rounded = 'md', ...props }) {
  const radius = {
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  }[rounded]

  return (
    <span
      aria-hidden="true"
      data-testid="skeleton"
      className={cn('block animate-pulse bg-slate-200', radius, className)}
      {...props}
    />
  )
}

export function SkeletonText({ lines = 3, className }) {
  return (
    <span className={cn('block space-y-2', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn('h-3.5', index === lines - 1 ? 'w-2/3' : 'w-full')}
        />
      ))}
    </span>
  )
}

export function SkeletonTable({ rows = 5, columns = 4 }) {
  return (
    <div role="status" aria-label="Memuat data" className="space-y-3 p-5">
      <span className="sr-only">Memuat data</span>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}
