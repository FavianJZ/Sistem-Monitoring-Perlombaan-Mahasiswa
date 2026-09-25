import { useCallback, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { StatusBadge, KelengkapanBadge, CapaianBadge } from '@/components/ui/StatusBadge'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toast'
import { useAsync } from '@/hooks/useAsync'
import {
  agendaLomba,
  daftarLomba,
  opsiFilter,
  resetDataMock,
  statistikLomba,
} from '@/services/competitionService'
import { namaPengguna } from '@/services/userService'
import { formatTanggal, jarakHari } from '@/lib/date'
import { labelTahapan } from '@/config/domain'

/**
 * Halaman pemeriksaan layer data.
 *
 * Tujuannya membuktikan bahwa seluruh akses data sudah lewat service dan
 * siap ditukar ke REST API. Bukan bagian dari alur pengguna akhir.
 */
export default function DataMock() {
  const [nonce, setNonce] = useState(0)
  const { toast } = useToast()

  const ambilData = useCallback(
    () =>
      Promise.all([
        daftarLomba({ pageSize: 50, sort: 'terbaru' }),
        statistikLomba({}),
        agendaLomba({}, { limit: 6 }),
        opsiFilter(),
      ]).then(([halaman, statistik, agenda, opsi]) => ({ halaman, statistik, agenda, opsi })),
    // nonce dipakai untuk memaksa pengambilan ulang setelah reset.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nonce],
  )

  const { data, loading, error } = useAsync(ambilData, [ambilData])

  function handleReset() {
    resetDataMock()
    setNonce((angka) => angka + 1)
    toast({ title: 'Data mock disetel ulang', variant: 'success' })
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Data Mock"
        description="Pemeriksaan layer data. Semua angka di halaman ini diambil lewat service, bukan langsung dari berkas data."
        actions={
          <Button variant="outline" leadingIcon={RotateCcw} onClick={handleReset}>
            Setel ulang data
          </Button>
        }
      />

      {error && (
        <Card className="mb-6 border-danger-200">
          <CardContent>
            <p className="text-sm font-semibold text-danger-700">Gagal memuat data</p>
            <p className="mt-1 text-sm text-slate-600">{error.message}</p>
          </CardContent>
        </Card>
      )}

      {loading && (
        <Card className="mb-6">
          <SkeletonTable rows={6} columns={5} />
        </Card>
      )}

      {data && (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Total lomba', data.statistik.total],
              ['Mahasiswa aktif berlomba', data.statistik.mahasiswaAktif],
              ['Lomba bulan ini', data.statistik.lombaBulanIni],
              ['Dokumen belum lengkap', data.statistik.dokumenBelumLengkap],
            ].map(([label, nilai]) => (
              <Card key={label}>
                <CardContent>
                  <p className="text-sm text-slate-600">{label}</p>
                  <p className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">
                    {nilai}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Sebaran data</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  ['Status', data.statistik.perStatus],
                  ['Tingkat', data.statistik.perTingkat],
                  ['Bidang', data.statistik.perBidang],
                  ['Capaian', data.statistik.perCapaian],
                ].map(([judul, peta]) => (
                  <div key={judul}>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {judul}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(peta).map(([kunci, nilai]) => (
                        <Badge key={kunci} tone="primary">
                          {kunci}: {nilai}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Agenda enam tahapan terdekat</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.agenda.map((item) => (
                  <div
                    key={`${item.lombaId}-${item.tahap.id}`}
                    className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {item.namaLomba}
                      </p>
                      <p className="text-xs text-slate-500">
                        {labelTahapan(item.tahap.jenis)} - {formatTanggal(item.tahap.tanggalMulai)}
                      </p>
                    </div>
                    <Badge tone={item.sisaHari <= 3 ? 'warning' : 'neutral'}>
                      {jarakHari(item.tahap.tanggalMulai)}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Seluruh lomba ({data.halaman.total})</CardTitle>
            </CardHeader>
            {data.halaman.items.length === 0 ? (
              <EmptyState title="Data mock kosong" description="Tekan setel ulang untuk memuat kembali." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-3xl text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Lomba</th>
                      <th className="px-5 py-3 font-semibold">Bidang</th>
                      <th className="px-5 py-3 font-semibold">Tingkat</th>
                      <th className="px-5 py-3 font-semibold">Pembimbing</th>
                      <th className="px-5 py-3 font-semibold">Status</th>
                      <th className="px-5 py-3 font-semibold">Tahapan terdekat</th>
                      <th className="px-5 py-3 font-semibold">Dokumen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.halaman.items.map((lomba) => (
                      <tr key={lomba.id} className="align-top">
                        <td className="px-5 py-3">
                          <p className="font-semibold text-slate-900">{lomba.nama}</p>
                          <p className="text-xs text-slate-500">
                            {lomba.namaTim ? `Tim ${lomba.namaTim}` : 'Perorangan'} -{' '}
                            {lomba.jumlahAnggota} orang
                          </p>
                          {lomba.hasil && (
                            <span className="mt-1.5 inline-flex">
                              <CapaianBadge capaian={lomba.hasil.capaian} size="sm" />
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-slate-600">{lomba.bidang}</td>
                        <td className="px-5 py-3 text-slate-600">{lomba.tingkat}</td>
                        <td className="px-5 py-3 text-slate-600">
                          {namaPengguna(lomba.dosenPembimbingId)}
                        </td>
                        <td className="px-5 py-3">
                          <StatusBadge status={lomba.status} size="sm" />
                        </td>
                        <td className="px-5 py-3 text-slate-600">
                          {lomba.tahapanBerikutnya ? (
                            <>
                              <p>{labelTahapan(lomba.tahapanBerikutnya.jenis)}</p>
                              <p className="text-xs text-slate-500">
                                {formatTanggal(lomba.tahapanBerikutnya.tanggalMulai)}
                              </p>
                            </>
                          ) : (
                            <span className="text-slate-400">Seluruh tahapan selesai</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <KelengkapanBadge lengkap={lomba.kelengkapan.lengkap} size="sm" />
                          {!lomba.kelengkapan.lengkap && (
                            <p className="mt-1 text-xs text-warning-700">
                              Kurang: {lomba.kelengkapan.kurangLabel.join(', ')}
                            </p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
