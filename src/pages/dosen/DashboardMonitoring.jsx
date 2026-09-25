import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarClock,
  FileWarning,
  ListFilter,
  Medal,
  Trophy,
  Users,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { StatCard } from '@/components/ui/StatCard'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { CompetitionCard } from '@/features/lomba/CompetitionCard'
import { useAuth } from '@/auth/AuthContext'
import { useAsync } from '@/hooks/useAsync'
import { agendaLomba, daftarLomba, statistikLomba } from '@/services/competitionService'
import { formatTanggalDenganHari, jarakHari } from '@/lib/date'
import { labelTahapan } from '@/config/domain'

const JUMLAH_KARTU = 6

/** Daftar sebaran sederhana, misalnya jumlah lomba per tingkat atau per bidang. */
function Sebaran({ judul, data, total }) {
  const baris = Object.entries(data).sort((a, b) => b[1] - a[1])

  if (baris.length === 0) {
    return <p className="text-sm text-slate-500">Belum ada data.</p>
  }

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">{judul}</p>
      <ul className="space-y-2.5">
        {baris.map(([nama, jumlah]) => (
          <li key={nama}>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate text-slate-700">{nama}</span>
              <span className="shrink-0 font-semibold text-slate-900">{jumlah}</span>
            </div>
            <ProgressBar
              className="mt-1"
              tinggi="h-1.5"
              nilai={total === 0 ? 0 : (jumlah / total) * 100}
              label={`${judul} ${nama}: ${jumlah} lomba`}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}

function KartuMemuat() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index}>
          <CardContent>
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-4 h-8 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function DashboardMonitoring() {
  const { user } = useAuth()
  const [hanyaBimbingan, setHanyaBimbingan] = useState(false)

  const filter = useMemo(
    () => (hanyaBimbingan ? { dosenPembimbingId: user.id } : {}),
    [hanyaBimbingan, user.id],
  )

  const ambil = useCallback(
    () =>
      Promise.all([
        statistikLomba(filter),
        agendaLomba(filter, { limit: 6 }),
        daftarLomba({ ...filter, sort: 'tahapanTerdekat', pageSize: JUMLAH_KARTU }),
      ]).then(([statistik, agenda, halaman]) => ({ statistik, agenda, halaman })),
    [filter],
  )

  const { data, loading, error } = useAsync(ambil, [ambil])
  const statistik = data?.statistik

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Dashboard Monitoring"
        description="Rekapitulasi mahasiswa yang sedang berkompetisi, agenda tahapan terdekat, dan kelengkapan bukti."
        actions={
          <>
            {user.role === 'dosen' && (
              <Button
                variant={hanyaBimbingan ? 'primary' : 'outline'}
                leadingIcon={Users}
                aria-pressed={hanyaBimbingan}
                onClick={() => setHanyaBimbingan((nilai) => !nilai)}
              >
                Hanya bimbingan saya
              </Button>
            )}
            <Button as={Link} to="/monitoring/lomba" variant="outline" leadingIcon={ListFilter}>
              Monitoring lomba
            </Button>
          </>
        }
      />

      {error && (
        <Card className="mb-6 border-danger-200">
          <CardContent>
            <p className="text-sm font-semibold text-danger-700">Gagal memuat rekapitulasi</p>
            <p className="mt-1 text-sm text-slate-600">{error.message}</p>
          </CardContent>
        </Card>
      )}

      {loading && <KartuMemuat />}

      {statistik && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Mahasiswa aktif berlomba"
              nilai={statistik.mahasiswaAktif}
              satuan="orang"
              keterangan={`Dari ${statistik.mahasiswaTerlibat} mahasiswa yang pernah tercatat`}
              icon={Users}
              tone="primary"
            />
            <StatCard
              label="Lomba bulan ini"
              nilai={statistik.lombaBulanIni}
              keterangan="Punya tahapan yang jatuh pada bulan berjalan"
              icon={CalendarClock}
              to="/monitoring/lomba?mode=bulan-ini"
              aksiLabel="Tinjau agenda"
            />
            <StatCard
              label="Dokumen belum lengkap"
              nilai={statistik.dokumenBelumLengkap}
              keterangan="Bukti pendaftaran atau pembayaran belum diunggah"
              icon={FileWarning}
              tone={statistik.dokumenBelumLengkap > 0 ? 'warning' : 'success'}
            />
            <StatCard
              label="Prestasi tercatat"
              nilai={statistik.totalPrestasi}
              keterangan={`Dari ${statistik.perStatus.selesai} lomba yang sudah selesai`}
              icon={Medal}
              tone="success"
            />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Sebaran keikutsertaan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex flex-wrap gap-2">
                  <Badge tone="primary">Terdaftar: {statistik.perStatus.terdaftar}</Badge>
                  <Badge tone="accent">Berlangsung: {statistik.perStatus.berlangsung}</Badge>
                  <Badge tone="success">Selesai: {statistik.perStatus.selesai}</Badge>
                </div>
                <Sebaran judul="Tingkat" data={statistik.perTingkat} total={statistik.total} />
                <Sebaran judul="Bidang" data={statistik.perBidang} total={statistik.total} />
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              <CardHeader
                actions={
                  <Button as={Link} to="/monitoring/kalender" size="sm" variant="ghost">
                    Buka kalender
                  </Button>
                }
              >
                <CardTitle>Agenda tahapan terdekat</CardTitle>
              </CardHeader>

              {data.agenda.length === 0 ? (
                <EmptyState
                  icon={CalendarClock}
                  title="Tidak ada agenda mendatang"
                  description="Seluruh tahapan lomba pada data ini sudah terlewati."
                />
              ) : (
                <ul aria-label="Agenda tahapan terdekat" className="divide-y divide-slate-100">
                  {data.agenda.map((item) => (
                    <li key={`${item.lombaId}-${item.tahap.id}`}>
                      <Link
                        to={`/monitoring/lomba/${item.lombaId}`}
                        className="flex items-start gap-4 px-5 py-3.5 transition-colors hover:bg-slate-50"
                      >
                        <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-lg bg-primary-50 text-primary-600">
                          <CalendarClock className="size-5" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold text-slate-900">
                            {labelTahapan(item.tahap.jenis)}
                          </span>
                          <span className="block truncate text-sm text-slate-600">
                            {item.namaLomba}
                            {item.namaTim ? ` - Tim ${item.namaTim}` : ''}
                          </span>
                          <span className="mt-0.5 block text-xs text-slate-500">
                            {formatTanggalDenganHari(item.tahap.tanggalMulai)}
                          </span>
                        </span>
                        <Badge tone={item.sisaHari <= 3 ? 'warning' : 'neutral'} size="sm">
                          {jarakHari(item.tahap.tanggalMulai)}
                        </Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <div className="mt-8">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-slate-900">
                  Lomba yang sedang dipantau
                </h2>
                <p className="mt-0.5 text-sm text-slate-600">
                  Diurutkan dari tahapan yang paling dekat.
                </p>
              </div>
              <Button as={Link} to="/monitoring/lomba" variant="outline" size="sm">
                Lihat semua {data.halaman.total} lomba
              </Button>
            </div>

            {data.halaman.items.length === 0 ? (
              <Card>
                <EmptyState
                  icon={Trophy}
                  title="Belum ada lomba yang tercatat"
                  description={
                    hanyaBimbingan
                      ? 'Belum ada mahasiswa yang mencantumkan Anda sebagai dosen pembimbing.'
                      : 'Mahasiswa belum mendaftarkan keikutsertaan lomba.'
                  }
                />
              </Card>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {data.halaman.items.map((lomba) => (
                  <CompetitionCard key={lomba.id} lomba={lomba} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
