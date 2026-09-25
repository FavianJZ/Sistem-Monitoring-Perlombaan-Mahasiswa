import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarClock, CircleAlert, Eye, Hourglass } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { CapaianBadge, KelengkapanBadge, StatusBadge } from '@/components/ui/StatusBadge'
import { TabPanel, Tabs } from '@/components/ui/Tabs'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { TimelineVertical } from '@/components/ui/TimelineVertical'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonText } from '@/components/ui/Skeleton'
import { useAsync } from '@/hooks/useAsync'
import { detailLomba } from '@/services/competitionService'
import { tahapanTerurut } from '@/services/competitionQuery'
import { DaftarAnggota } from '@/features/lomba/DaftarAnggota'
import { DaftarBerkas } from '@/features/lomba/DaftarBerkas'
import { InfoLomba } from '@/features/lomba/InfoLomba'
import { RingkasanHasil } from '@/features/lomba/RingkasanHasil'
import { formatTanggal } from '@/lib/date'
import { labelTahapan } from '@/config/domain'

function judulTahapan(tahap) {
  if (tahap.jenis === 'kustom') return tahap.label?.trim() || 'Tahapan tambahan'
  return labelTahapan(tahap.jenis)
}

/**
 * Halaman pemantauan satu perlombaan untuk dosen dan admin program studi.
 *
 * Sepenuhnya baca saja. Revisi PRD menghapus seluruh alur verifikasi dan
 * persetujuan, jadi tidak ada tombol menyetujui, menolak, maupun mengubah
 * data milik mahasiswa di halaman ini.
 */
export default function DetailLombaDosen() {
  const { id } = useParams()
  const [tab, setTab] = useState('info')

  const ambil = useCallback(() => detailLomba(id), [id])
  const { data: lomba, loading, error } = useAsync(ambil, [ambil])

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl">
        <Card>
          <CardContent>
            <SkeletonText lines={6} />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl">
        <EmptyState
          tone="danger"
          icon={CircleAlert}
          title="Lomba tidak ditemukan"
          description={error.message}
          action={
            <Button as={Link} to="/monitoring/lomba" variant="outline" leadingIcon={ArrowLeft}>
              Kembali ke monitoring
            </Button>
          }
        />
      </div>
    )
  }

  const tahapan = tahapanTerurut(lomba)

  const tabs = [
    { id: 'info', label: 'Info' },
    { id: 'tim', label: 'Tim', badge: lomba.jumlahAnggota },
    { id: 'dokumen', label: 'Dokumen', badge: lomba.berkas.length },
    { id: 'timeline', label: 'Timeline', badge: tahapan.length },
    { id: 'hasil', label: 'Hasil' },
  ]

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title={lomba.nama}
        description={lomba.penyelenggara}
        actions={
          <Button as={Link} to="/monitoring/lomba" variant="ghost" leadingIcon={ArrowLeft}>
            Kembali ke monitoring
          </Button>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <StatusBadge status={lomba.status} />
        <Badge tone="primary" dot>
          {lomba.bidang}
        </Badge>
        <Badge>{lomba.tingkat}</Badge>
        {lomba.hasil && <CapaianBadge capaian={lomba.hasil.capaian} />}
        <KelengkapanBadge lengkap={lomba.kelengkapan.lengkap} />
      </div>

      <div className="mb-6 flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        <Eye className="mt-px size-4 shrink-0 text-slate-400" aria-hidden="true" />
        <p>
          Halaman ini bersifat pemantauan. Data diisi mahasiswa dan tidak memerlukan persetujuan,
          sehingga tidak ada tindakan menyetujui atau menolak di sini.
        </p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900">Kelengkapan bukti wajib</p>
              <p className="text-sm text-slate-600">
                {lomba.kelengkapan.terunggah} dari {lomba.kelengkapan.wajib} berkas
              </p>
            </div>
            <ProgressBar
              className="mt-2.5"
              nilai={lomba.kelengkapan.persen}
              tone={lomba.kelengkapan.lengkap ? 'success' : 'warning'}
              label={`Kelengkapan dokumen ${lomba.nama}`}
            />
            <p className="mt-2 text-xs text-slate-500">
              {lomba.kelengkapan.lengkap
                ? 'Bukti pendaftaran dan bukti pembayaran sudah diunggah.'
                : `Mahasiswa belum mengunggah ${lomba.kelengkapan.kurangLabel.join(' dan ')}.`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900">Progres tahapan</p>
              <p className="text-sm text-slate-600">
                {lomba.progres.lewat} dari {lomba.progres.total} tahapan
              </p>
            </div>
            <ProgressBar
              className="mt-2.5"
              nilai={lomba.progres.persen}
              tone={lomba.status === 'selesai' ? 'success' : 'primary'}
              label={`Progres tahapan ${lomba.nama}`}
            />
            <p className="mt-2 text-xs text-slate-500">
              {lomba.tahapanBerikutnya
                ? `Tahapan terdekat: ${judulTahapan(lomba.tahapanBerikutnya)} pada ${formatTanggal(lomba.tahapanBerikutnya.tanggalMulai)}.`
                : 'Seluruh tahapan sudah terlewati.'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <Tabs tabs={tabs} aktif={tab} onGanti={setTab} idPrefix="detail-monitoring" />

        <TabPanel id="info" aktif={tab} idPrefix="detail-monitoring" className="px-5 py-4">
          <InfoLomba lomba={lomba} />
        </TabPanel>

        <TabPanel id="tim" aktif={tab} idPrefix="detail-monitoring">
          <DaftarAnggota lomba={lomba} />
        </TabPanel>

        <TabPanel id="dokumen" aktif={tab} idPrefix="detail-monitoring" className="px-5 py-4">
          <DaftarBerkas lomba={lomba} />
        </TabPanel>

        <TabPanel id="timeline" aktif={tab} idPrefix="detail-monitoring" className="px-5 py-4">
          {tahapan.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="Belum ada tahapan"
              description="Mahasiswa belum mengisi timeline lomba ini."
            />
          ) : (
            <TimelineVertical tahapan={tahapan} />
          )}
        </TabPanel>

        <TabPanel id="hasil" aktif={tab} idPrefix="detail-monitoring" className="px-5 py-4">
          {lomba.hasil ? (
            <RingkasanHasil lomba={lomba} />
          ) : (
            <EmptyState
              icon={Hourglass}
              title="Hasil belum dilaporkan"
              description={
                lomba.pelaporan.kode === 'BELUM_WAKTUNYA'
                  ? 'Perlombaan masih berjalan. Mahasiswa dapat melaporkan capaian setelah pengumuman pemenang.'
                  : 'Perlombaan sudah selesai, tetapi mahasiswa belum mengisi laporan capaian.'
              }
            />
          )}
        </TabPanel>
      </Card>
    </div>
  )
}
