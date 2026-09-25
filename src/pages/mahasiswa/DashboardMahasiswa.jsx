import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarClock,
  CirclePlus,
  FileWarning,
  Medal,
  Trophy,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { StatCard } from '@/components/ui/StatCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton'
import { useAuth } from '@/auth/AuthContext'
import { useAsync } from '@/hooks/useAsync'
import { agendaLomba, daftarLomba, statistikLomba } from '@/services/competitionService'
import { formatTanggalDenganHari, jarakHari } from '@/lib/date'
import { labelTahapan } from '@/config/domain'

function KartuMemuat() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index}>
          <CardContent>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-4 h-8 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function DashboardMahasiswa() {
  const { user } = useAuth()

  const ambil = useCallback(
    () =>
      Promise.all([
        statistikLomba({ createdBy: user.id }),
        agendaLomba({ createdBy: user.id }, { limit: 5 }),
        daftarLomba({
          createdBy: user.id,
          hanyaDokumenBelumLengkap: true,
          sort: 'tahapanTerdekat',
          pageSize: 3,
        }),
      ]).then(([statistik, agenda, perluDilengkapi]) => ({
        statistik,
        agenda,
        perluDilengkapi,
      })),
    [user.id],
  )

  const { data, loading, error } = useAsync(ambil, [ambil])

  const statistik = data?.statistik
  const lombaAktif = statistik
    ? statistik.perStatus.terdaftar + statistik.perStatus.berlangsung
    : 0

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Dashboard"
        description={`Ringkasan keikutsertaan lomba ${user.nama.split(' ')[0]}, tahapan terdekat, dan kelengkapan dokumen.`}
        actions={
          <Button as={Link} to="/lomba-saya/baru" leadingIcon={CirclePlus}>
            Daftarkan Lomba
          </Button>
        }
      />

      {error && (
        <Card className="mb-6 border-danger-200">
          <CardContent>
            <p className="text-sm font-semibold text-danger-700">Gagal memuat ringkasan</p>
            <p className="mt-1 text-sm text-slate-600">{error.message}</p>
          </CardContent>
        </Card>
      )}

      {loading && <KartuMemuat />}

      {statistik && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Lomba aktif"
              nilai={lombaAktif}
              keterangan={`${statistik.perStatus.berlangsung} sedang berlangsung, ${statistik.perStatus.terdaftar} baru terdaftar`}
              icon={Trophy}
              tone="primary"
              to="/lomba-saya"
              aksiLabel="Lihat daftar"
            />
            <StatCard
              label="Agenda bulan ini"
              nilai={statistik.lombaBulanIni}
              satuan="lomba"
              keterangan="Punya tahapan yang jatuh pada bulan berjalan"
              icon={CalendarClock}
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
            <Card className="lg:col-span-3">
              <CardHeader
                actions={
                  <Button as={Link} to="/lomba-saya" size="sm" variant="ghost">
                    Semua lomba
                  </Button>
                }
              >
                <CardTitle>Tahapan terdekat</CardTitle>
              </CardHeader>

              {data.agenda.length === 0 ? (
                <EmptyState
                  icon={CalendarClock}
                  title="Tidak ada tahapan yang akan datang"
                  description="Seluruh tahapan lomba yang kamu ikuti sudah terlewati."
                />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {data.agenda.map((item) => (
                    <li key={`${item.lombaId}-${item.tahap.id}`}>
                      <Link
                        to={`/lomba-saya/${item.lombaId}`}
                        className="flex items-start gap-4 px-5 py-4 transition-colors hover:bg-slate-50"
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

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Perlu dilengkapi</CardTitle>
              </CardHeader>

              {data.perluDilengkapi.items.length === 0 ? (
                <EmptyState
                  icon={Trophy}
                  title="Semua dokumen lengkap"
                  description="Bukti pendaftaran dan pembayaran sudah terunggah di seluruh lomba."
                />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {data.perluDilengkapi.items.map((lomba) => (
                    <li key={lomba.id} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <Link
                          to={`/lomba-saya/${lomba.id}`}
                          className="font-semibold text-slate-900 hover:text-primary-700 hover:underline"
                        >
                          {lomba.nama}
                        </Link>
                        <StatusBadge status={lomba.status} size="sm" withIcon={false} />
                      </div>
                      <p className="mt-1.5 text-sm text-warning-700">
                        Belum ada {lomba.kelengkapan.kurangLabel.join(' dan ')}
                      </p>
                      <ProgressBar
                        className="mt-2"
                        tinggi="h-1.5"
                        tone="warning"
                        nilai={lomba.kelengkapan.persen}
                        label={`Kelengkapan dokumen ${lomba.nama}`}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}

      {loading && (
        <Card className="mt-6">
          <CardContent>
            <SkeletonText lines={4} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
