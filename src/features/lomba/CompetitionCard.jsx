import { Link } from 'react-router-dom'
import { CalendarClock, ExternalLink, GraduationCap, User, Users } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { CapaianBadge, KelengkapanBadge, StatusBadge } from '@/components/ui/StatusBadge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { cn } from '@/lib/cn'
import { formatTanggal, jarakHari } from '@/lib/date'
import { labelTahapan } from '@/config/domain'
import { namaPengguna } from '@/services/userService'

export function CompetitionCard({ lomba, to, acuan = new Date(), className }) {
  const tautan = to ?? `/monitoring/lomba/${lomba.id}`
  const IkonJenis = lomba.jenis === 'tim' ? Users : User

  return (
    <article
      className={cn(
        'flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-card transition-colors hover:border-primary-300',
        className,
      )}
    >
      <div className="flex gap-4 p-4">
        {lomba.posterUrl ? (
          <img
            src={lomba.posterUrl}
            alt={`Poster ${lomba.nama}`}
            className="hidden h-28 w-20 shrink-0 rounded-md border border-slate-200 object-cover sm:block"
          />
        ) : (
          <span
            aria-hidden="true"
            className="hidden h-28 w-20 shrink-0 place-items-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-slate-400 sm:grid"
          >
            <GraduationCap className="size-7" />
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="min-w-0 text-base font-bold tracking-tight text-slate-900">
              <Link to={tautan} className="hover:text-primary-700 hover:underline">
                {lomba.nama}
              </Link>
            </h3>
            <StatusBadge status={lomba.status} size="sm" withIcon={false} />
          </div>

          <p className="mt-0.5 truncate text-sm text-slate-600">{lomba.penyelenggara}</p>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge size="sm" tone="primary" dot>
              {lomba.bidang}
            </Badge>
            <Badge size="sm">{lomba.tingkat}</Badge>
            {lomba.hasil && <CapaianBadge capaian={lomba.hasil.capaian} size="sm" />}
          </div>

          <dl className="mt-3 space-y-1.5 text-sm">
            <div className="flex items-center gap-2">
              <dt className="sr-only">Peserta</dt>
              <IkonJenis className="size-4 shrink-0 text-slate-400" aria-hidden="true" />
              <dd className="min-w-0 truncate text-slate-700">
                {lomba.namaTim
                  ? `Tim ${lomba.namaTim} - ${lomba.jumlahAnggota} anggota`
                  : (lomba.anggota?.[0]?.nama ?? 'Perorangan')}
              </dd>
            </div>

            <div className="flex items-center gap-2">
              <dt className="sr-only">Dosen pembimbing</dt>
              <GraduationCap className="size-4 shrink-0 text-slate-400" aria-hidden="true" />
              <dd className="min-w-0 truncate text-slate-700">
                {lomba.dosenPembimbingId ? namaPengguna(lomba.dosenPembimbingId) : 'Belum ada pembimbing'}
              </dd>
            </div>

            <div className="flex items-center gap-2">
              <dt className="sr-only">Tahapan terdekat</dt>
              <CalendarClock className="size-4 shrink-0 text-slate-400" aria-hidden="true" />
              <dd className="min-w-0 text-slate-700">
                {lomba.tahapanBerikutnya ? (
                  <>
                    {labelTahapan(lomba.tahapanBerikutnya.jenis)}
                    <span className="text-slate-500">
                      {' '}
                      - {formatTanggal(lomba.tahapanBerikutnya.tanggalMulai)} (
                      {jarakHari(lomba.tahapanBerikutnya.tanggalMulai, acuan)})
                    </span>
                  </>
                ) : (
                  <span className="text-slate-500">Seluruh tahapan selesai</span>
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-auto space-y-3 border-t border-slate-200 bg-slate-50/60 px-4 py-3">
        <div>
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-medium text-slate-600">Progres tahapan</span>
            <span className="text-slate-500">
              {lomba.progres.lewat} dari {lomba.progres.total} tahapan
            </span>
          </div>
          <ProgressBar
            className="mt-1.5"
            tinggi="h-1.5"
            nilai={lomba.progres.persen}
            tone={lomba.status === 'selesai' ? 'success' : 'primary'}
            label={`Progres tahapan ${lomba.nama}`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <KelengkapanBadge lengkap={lomba.kelengkapan.lengkap} size="sm" />

          {lomba.linkPublikasi && (
            <a
              href={lomba.linkPublikasi}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary-700 hover:underline"
            >
              Sumber lomba
              <ExternalLink className="size-3.5" aria-hidden="true" />
            </a>
          )}

          <Link
            to={tautan}
            className="ml-auto text-xs font-semibold text-primary-700 hover:underline"
          >
            Lihat detail
          </Link>
        </div>
      </div>
    </article>
  )
}
