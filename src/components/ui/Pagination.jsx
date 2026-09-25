import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './Button'

/**
 * Navigasi halaman sederhana beserta keterangan jumlah data.
 * Disembunyikan bila hanya ada satu halaman.
 */
export function Pagination({ page, pageSize, total, totalPages, onPageChange, label = 'data' }) {
  if (!total) return null

  const dari = (page - 1) * pageSize + 1
  const sampai = Math.min(page * pageSize, total)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-3">
      {/* Teks biasa, bukan live region, supaya tidak berebut dengan notifikasi.
          Pengumuman hasil filter ditangani terpisah di level halaman. */}
      <p className="text-sm text-slate-600">
        Menampilkan {dari}-{sampai} dari {total} {label}
      </p>

      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            leadingIcon={ChevronLeft}
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Sebelumnya
          </Button>
          <span className="px-1 text-sm font-medium text-slate-700">
            Halaman {page} dari {totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            trailingIcon={ChevronRight}
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Berikutnya
          </Button>
        </div>
      )}
    </div>
  )
}
