import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { cn } from '@/lib/cn'
import { SkeletonTable } from './Skeleton'
import { Pagination } from './Pagination'

/**
 * Tabel data dengan pengurutan lewat header, paginasi, dan state kosong.
 *
 * Pengurutan bersifat terkendali: komponen hanya melaporkan kolom yang
 * diklik, penyaringan dan pengurutan datanya dilakukan pemanggil lewat
 * service. Dengan begitu perilakunya tetap sama saat data pindah ke API.
 *
 * @param {Array} columns [{ key, header, sortable, render, align, className }]
 */
export function DataTable({
  columns,
  rows,
  getRowKey = (row) => row.id,
  caption,
  loading = false,
  emptyState,
  sort,
  onSortChange,
  pagination,
  onPageChange,
  labelData = 'data',
  className,
}) {
  if (loading) {
    return (
      <div className={cn('overflow-hidden', className)}>
        <SkeletonTable rows={5} columns={columns.length} />
      </div>
    )
  }

  if (!rows?.length) {
    return <div className={className}>{emptyState}</div>
  }

  function ikonUrut(kolom) {
    if (sort?.key !== kolom.key) return ArrowUpDown
    return sort.order === 'asc' ? ArrowUp : ArrowDown
  }

  function ariaUrut(kolom) {
    if (!kolom.sortable) return undefined
    if (sort?.key !== kolom.key) return 'none'
    return sort.order === 'asc' ? 'ascending' : 'descending'
  }

  return (
    <div className={className}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          {caption && <caption className="sr-only">{caption}</caption>}

          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              {columns.map((kolom) => (
                <th
                  key={kolom.key}
                  scope="col"
                  aria-sort={ariaUrut(kolom)}
                  className={cn(
                    'px-5 py-3 font-semibold',
                    kolom.align === 'right' && 'text-right',
                    kolom.headerClassName,
                  )}
                >
                  {kolom.sortable && onSortChange ? (
                    <button
                      type="button"
                      onClick={() => onSortChange(kolom.key)}
                      className="inline-flex items-center gap-1.5 rounded-sm font-semibold uppercase tracking-wider text-slate-500 transition-colors hover:text-slate-900"
                    >
                      {kolom.header}
                      {(() => {
                        const Ikon = ikonUrut(kolom)
                        return (
                          <Ikon
                            className={cn(
                              'size-3.5',
                              sort?.key === kolom.key ? 'text-primary-600' : 'text-slate-400',
                            )}
                            aria-hidden="true"
                          />
                        )
                      })()}
                    </button>
                  ) : (
                    kolom.header
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={getRowKey(row)} className="align-top transition-colors hover:bg-slate-50/70">
                {columns.map((kolom) => (
                  <td
                    key={kolom.key}
                    className={cn(
                      'px-5 py-4',
                      kolom.align === 'right' && 'text-right',
                      kolom.className,
                    )}
                  >
                    {kolom.render ? kolom.render(row) : row[kolom.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && (
        <Pagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={pagination.total}
          totalPages={pagination.totalPages}
          onPageChange={onPageChange}
          label={labelData}
        />
      )}
    </div>
  )
}

/**
 * Menghitung state pengurutan berikutnya saat sebuah kolom diklik.
 * Kolom yang sama berganti arah, kolom lain dimulai dari naik.
 */
export function urutanBerikutnya(sort, key) {
  if (sort?.key !== key) return { key, order: 'asc' }
  return { key, order: sort.order === 'asc' ? 'desc' : 'asc' }
}
