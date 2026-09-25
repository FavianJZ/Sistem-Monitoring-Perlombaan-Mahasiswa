import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarClock, CircleAlert } from 'lucide-react'
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
import { useToast } from '@/components/ui/Toast'
import { useAsync } from '@/hooks/useAsync'
import { detailLomba } from '@/services/competitionService'
import { tahapanTerurut } from '@/services/competitionQuery'
import { DaftarAnggota } from '@/features/lomba/DaftarAnggota'
import { DaftarBerkas } from '@/features/lomba/DaftarBerkas'
import { FormLaporHasil } from '@/features/lomba/FormLaporHasil'
import { InfoLomba } from '@/features/lomba/InfoLomba'
import { RingkasanHasil } from '@/features/lomba/RingkasanHasil'

export default function DetailLombaSaya() {
  const { id } = useParams()
  const { toast } = useToast()
  const [tab, setTab] = useState('info')

  const ambil = useCallback(() => detailLomba(id), [id])
  const { data: lomba, loading, error, jalankan } = useAsync(ambil, [ambil])

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
            <Button as={Link} to="/lomba-saya" variant="outline" leadingIcon={ArrowLeft}>
              Kembali ke daftar lomba
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

  async function handleTersimpan(hasil) {
    toast({
      title: 'Hasil lomba tersimpan',
      description: `Capaian ${hasil.nama} sudah tercatat.`,
      variant: 'success',
    })
    await jalankan()
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title={lomba.nama}
        description={lomba.penyelenggara}
        actions={
          <Button as={Link} to="/lomba-saya" variant="ghost" leadingIcon={ArrowLeft}>
            Kembali ke daftar
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

      <Card className="mb-6">
        <CardContent>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-900">Kelengkapan dokumen wajib</p>
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
              ? 'Bukti pendaftaran dan bukti pembayaran sudah lengkap.'
              : `Masih perlu ${lomba.kelengkapan.kurangLabel.join(' dan ')}.`}
          </p>
        </CardContent>
      </Card>

      <Card>
        <Tabs tabs={tabs} aktif={tab} onGanti={setTab} idPrefix="detail-lomba" />

        <TabPanel id="info" aktif={tab} idPrefix="detail-lomba" className="px-5 py-4">
          <InfoLomba lomba={lomba} />
        </TabPanel>

        <TabPanel id="tim" aktif={tab} idPrefix="detail-lomba">
          <DaftarAnggota lomba={lomba} />
        </TabPanel>

        <TabPanel id="dokumen" aktif={tab} idPrefix="detail-lomba" className="px-5 py-4">
          <DaftarBerkas lomba={lomba} />
        </TabPanel>

        <TabPanel id="timeline" aktif={tab} idPrefix="detail-lomba" className="px-5 py-4">
          {tahapan.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="Belum ada tahapan"
              description="Timeline lomba ini belum diisi."
            />
          ) : (
            <TimelineVertical tahapan={tahapan} />
          )}
        </TabPanel>

        <TabPanel id="hasil" aktif={tab} idPrefix="detail-lomba" className="px-5 py-4">
          {lomba.hasil ? (
            <RingkasanHasil lomba={lomba} />
          ) : lomba.pelaporan.boleh ? (
            <FormLaporHasil lomba={lomba} onTersimpan={handleTersimpan} />
          ) : (
            <EmptyState
              icon={CalendarClock}
              title="Belum bisa melaporkan hasil"
              description={lomba.pelaporan.alasan}
            />
          )}
        </TabPanel>
      </Card>
    </div>
  )
}
