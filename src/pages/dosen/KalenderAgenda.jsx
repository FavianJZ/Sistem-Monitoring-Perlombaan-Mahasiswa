import { useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { CalendarClock, ChevronLeft, ChevronRight } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Select'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAsync } from '@/hooks/useAsync'
import { useFilterUrl } from '@/hooks/useFilterUrl'
import { kalenderLomba, opsiFilter } from '@/services/competitionService'
import {
  NAMA_HARI_SINGKAT,
  formatBulanTahun,
  formatTanggal,
  isSameDay,
  petakKalender,
  tambahBulan,
} from '@/lib/date'
import { labelTahapan } from '@/config/domain'
import { cn } from '@/lib/cn'

const FILTER_BAWAAN = {
  bulan: '',
  tanggal: '',
  bidang: '',
  tingkat: '',
}

function bulanDariParam(nilai) {
  const cocok = /^(\d{4})-(\d{2})$/.exec(nilai ?? '')
  if (!cocok) return new Date()
  return new Date(Number(cocok[1]), Number(cocok[2]) - 1, 1)
}

function paramDariBulan(tanggal) {
  const bulan = String(tanggal.getMonth() + 1).padStart(2, '0')
  return `${tanggal.getFullYear()}-${bulan}`
}

export default function KalenderAgenda() {
  const { filter, ubah, reset, adaFilter } = useFilterUrl(FILTER_BAWAAN)

  const bulan = useMemo(() => bulanDariParam(filter.bulan), [filter.bulan])
  const hariIni = new Date()

  const filterLomba = useMemo(
    () => ({
      bidang: filter.bidang || undefined,
      tingkat: filter.tingkat || undefined,
    }),
    [filter.bidang, filter.tingkat],
  )

  const ambil = useCallback(
    () => kalenderLomba({ bulan, filter: filterLomba }),
    [bulan, filterLomba],
  )
  const { data: peta, loading, error } = useAsync(ambil, [ambil])

  const ambilOpsi = useCallback(() => opsiFilter(), [])
  const { data: opsi } = useAsync(ambilOpsi, [ambilOpsi])

  const sel = useMemo(() => petakKalender(bulan), [bulan])
  const agendaTerpilih = filter.tanggal ? (peta?.[filter.tanggal] ?? []) : []

  function geserBulan(jumlah) {
    const tujuan = tambahBulan(bulan, jumlah)
    ubah({ bulan: paramDariBulan(tujuan), tanggal: '' })
  }

  function keBulanIni() {
    ubah({ bulan: paramDariBulan(new Date()), tanggal: '' })
  }

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Kalender Agenda"
        description="Tahapan lomba yang jatuh pada tiap tanggal: technical meeting, penyisihan, final, hingga pengumuman."
        actions={
          <>
            <Button variant="outline" onClick={keBulanIni}>
              Bulan ini
            </Button>
            {adaFilter && (
              <Button variant="ghost" onClick={reset}>
                Bersihkan filter
              </Button>
            )}
          </>
        }
      />

      <Card className="mb-6">
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            label="Bidang"
            placeholder="Semua bidang"
            options={opsi?.bidang ?? []}
            value={filter.bidang}
            onChange={(event) => ubah({ bidang: event.target.value })}
          />
          <Select
            label="Tingkat"
            placeholder="Semua tingkat"
            options={opsi?.tingkat ?? []}
            value={filter.tingkat}
            onChange={(event) => ubah({ tingkat: event.target.value })}
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            actions={
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="outline"
                  aria-label="Bulan sebelumnya"
                  onClick={() => geserBulan(-1)}
                >
                  <ChevronLeft className="size-4" aria-hidden="true" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  aria-label="Bulan berikutnya"
                  onClick={() => geserBulan(1)}
                >
                  <ChevronRight className="size-4" aria-hidden="true" />
                </Button>
              </div>
            }
          >
            <CardTitle>{formatBulanTahun(bulan)}</CardTitle>
          </CardHeader>

          <CardContent>
            {error && (
              <EmptyState tone="danger" title="Gagal memuat kalender" description={error.message} />
            )}

            {loading && <Skeleton className="h-96 w-full" rounded="lg" />}

            {peta && !error && (
              <table className="w-full table-fixed border-collapse">
                <caption className="sr-only">
                  Kalender tahapan lomba bulan {formatBulanTahun(bulan)}
                </caption>
                <thead>
                  <tr>
                    {NAMA_HARI_SINGKAT.map((hari) => (
                      <th
                        key={hari}
                        scope="col"
                        className="pb-2 text-center text-xs font-semibold uppercase tracking-wider text-slate-400"
                      >
                        {hari}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 6 }).map((_, baris) => (
                    <tr key={baris}>
                      {sel.slice(baris * 7, baris * 7 + 7).map((sehari) => {
                        const agenda = peta[sehari.iso] ?? []
                        const terpilih = filter.tanggal === sehari.iso
                        const ini = isSameDay(sehari.tanggal, hariIni)

                        return (
                          <td key={sehari.iso} className="p-0.5 align-top">
                            <button
                              type="button"
                              aria-pressed={terpilih}
                              aria-label={`${formatTanggal(sehari.tanggal, { panjang: true })}, ${
                                agenda.length === 0 ? 'tidak ada agenda' : `${agenda.length} agenda`
                              }`}
                              onClick={() => ubah({ tanggal: terpilih ? '' : sehari.iso })}
                              className={cn(
                                'flex h-24 w-full flex-col gap-1 rounded-md border p-1.5 text-left transition-colors',
                                terpilih
                                  ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500'
                                  : 'border-slate-200 hover:border-primary-300 hover:bg-slate-50',
                                !sehari.bulanIni && 'opacity-45',
                              )}
                            >

                              <span
                                className={cn(
                                  'inline-grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold',
                                  ini ? 'bg-slate-900 text-white' : 'text-slate-600',
                                )}
                              >
                                {sehari.tanggal.getDate()}
                                {ini && <span className="sr-only"> (hari ini)</span>}
                              </span>

                              <span className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden">
                                {agenda.slice(0, 2).map((item, indeks) => (
                                  <span
                                    key={`${item.lombaId}-${item.tahap.id}-${indeks}`}
                                    className="truncate rounded bg-primary-100 px-1 py-0.5 text-[11px] font-medium text-primary-800"
                                  >
                                    {labelTahapan(item.tahap.jenis)}
                                  </span>
                                ))}
                                {agenda.length > 2 && (
                                  <span className="px-1 text-[11px] font-semibold text-slate-500">
                                    +{agenda.length - 2} lagi
                                  </span>
                                )}
                              </span>
                            </button>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {filter.tanggal
                ? `Agenda ${formatTanggal(filter.tanggal, { panjang: true })}`
                : 'Pilih tanggal'}
            </CardTitle>
          </CardHeader>

          {!filter.tanggal ? (
            <EmptyState
              icon={CalendarClock}
              title="Belum ada tanggal dipilih"
              description="Klik salah satu tanggal pada kalender untuk melihat rincian agendanya."
            />
          ) : agendaTerpilih.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="Tidak ada agenda"
              description="Tidak ada tahapan lomba yang jatuh pada tanggal ini."
            />
          ) : (
            <ul aria-label="Agenda tanggal terpilih" className="divide-y divide-slate-100">
              {agendaTerpilih.map((item, indeks) => (
                <li key={`${item.lombaId}-${item.tahap.id}-${indeks}`}>
                  <Link
                    to={`/monitoring/lomba/${item.lombaId}`}
                    className="block px-5 py-3.5 transition-colors hover:bg-slate-50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-slate-900">
                        {labelTahapan(item.tahap.jenis)}
                      </p>
                      <Badge size="sm">{item.tingkat}</Badge>
                    </div>
                    <p className="mt-0.5 text-sm text-slate-600">{item.namaLomba}</p>
                    {item.namaTim && (
                      <p className="text-xs text-slate-500">Tim {item.namaTim}</p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
