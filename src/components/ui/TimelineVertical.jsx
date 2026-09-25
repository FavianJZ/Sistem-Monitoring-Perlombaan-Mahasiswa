import { Check, Dot } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Badge } from './Badge'
import { akhirHari, awalHari, dalamRentang, formatRentangTanggal, jarakHari } from '@/lib/date'
import { labelTahapan } from '@/config/domain'

/** Menentukan posisi tahapan terhadap hari ini. */
export function posisiTahapan(tahap, acuan = new Date()) {
  const akhir = akhirHari(tahap.tanggalSelesai ?? tahap.tanggalMulai)
  const batas = awalHari(acuan)

  if (dalamRentang(acuan, tahap.tanggalMulai, tahap.tanggalSelesai ?? tahap.tanggalMulai)) {
    return 'berjalan'
  }

  return akhir < batas ? 'lewat' : 'akanDatang'
}

const PENANDA = {
  lewat: {
    titik: 'bg-success-500 text-white',
    teks: 'text-slate-500',
    badge: { tone: 'neutral', label: 'Sudah lewat' },
  },
  berjalan: {
    titik: 'bg-accent-500 text-white ring-4 ring-accent-500/20',
    teks: 'text-slate-900',
    badge: { tone: 'accent', label: 'Sedang berlangsung' },
  },
  akanDatang: {
    titik: 'bg-white text-slate-400 ring-2 ring-slate-300',
    teks: 'text-slate-700',
    badge: null,
  },
}

function judul(tahap) {
  if (tahap.jenis === 'kustom') return tahap.label?.trim() || 'Tahapan tambahan'
  return labelTahapan(tahap.jenis)
}

/**
 * Timeline vertikal tahapan perlombaan.
 * Menandai tahapan yang sudah lewat, yang sedang berjalan, dan yang akan datang.
 */
export function TimelineVertical({ tahapan = [], acuan = new Date(), className }) {
  if (tahapan.length === 0) return null

  return (
    <ol aria-label="Timeline tahapan" className={cn('relative', className)}>
      {tahapan.map((tahap, indeks) => {
        const posisi = posisiTahapan(tahap, acuan)
        const gaya = PENANDA[posisi]
        const terakhir = indeks === tahapan.length - 1

        return (
          <li key={tahap.id ?? `${tahap.jenis}-${indeks}`} className="relative flex gap-4 pb-6 last:pb-0">
            {!terakhir && (
              <span
                aria-hidden="true"
                className={cn(
                  'absolute left-4 top-8 h-full w-0.5 -translate-x-1/2',
                  posisi === 'lewat' ? 'bg-success-200' : 'bg-slate-200',
                )}
              />
            )}

            <span
              className={cn(
                'relative z-10 grid size-8 shrink-0 place-items-center rounded-full',
                gaya.titik,
              )}
            >
              {posisi === 'lewat' ? (
                <Check className="size-4" aria-hidden="true" />
              ) : (
                <Dot className="size-5" aria-hidden="true" />
              )}
            </span>

            <div className="min-w-0 flex-1 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className={cn('font-semibold', gaya.teks)}>{judul(tahap)}</p>
                {gaya.badge && (
                  <Badge size="sm" tone={gaya.badge.tone}>
                    {gaya.badge.label}
                  </Badge>
                )}
              </div>

              <p className="mt-0.5 text-sm text-slate-600">
                {formatRentangTanggal(tahap.tanggalMulai, tahap.tanggalSelesai)}
              </p>

              {posisi === 'akanDatang' && (
                <p className="mt-0.5 text-xs font-medium text-primary-700">
                  {jarakHari(tahap.tanggalMulai, acuan)}
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
