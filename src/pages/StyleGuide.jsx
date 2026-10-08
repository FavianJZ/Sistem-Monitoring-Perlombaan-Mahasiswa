import { useState } from 'react'
import { Download, Plus, Search, Trash2, Trophy } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'
import { CapaianBadge, KelengkapanBadge, StatusBadge } from '@/components/ui/StatusBadge'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton'
import { StatCard } from '@/components/ui/StatCard'
import { DataTable, urutanBerikutnya } from '@/components/ui/DataTable'
import { FileUpload } from '@/components/ui/FileUpload'
import { TabPanel, Tabs } from '@/components/ui/Tabs'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { TimelineVertical } from '@/components/ui/TimelineVertical'

const TAHAPAN_CONTOH = [
  { jenis: 'pendaftaran', tanggalMulai: '2026-08-01', tanggalSelesai: '2026-08-20' },
  { jenis: 'tm', tanggalMulai: '2026-09-20' },
  { jenis: 'penyisihan', tanggalMulai: '2026-09-22', tanggalSelesai: '2026-09-30' },
  { jenis: 'final', tanggalMulai: '2026-11-05' },
]
import { BIDANG_LOMBA, CAPAIAN_LOMBA, STATUS_LOMBA, TINGKAT_LOMBA } from '@/config/domain'

const BARIS_CONTOH = [
  { id: '1', nama: 'GEMASTIK XIX', bidang: 'Programming', status: 'berlangsung' },
  { id: '2', nama: 'COMPFEST 18', bidang: 'UI/UX', status: 'terdaftar' },
  { id: '3', nama: 'Hackathon BI', bidang: 'Programming', status: 'selesai' },
]

const COLOR_GROUPS = [
  {
    name: 'primary',
    swatches: [
      ['50', 'bg-primary-50'],
      ['100', 'bg-primary-100'],
      ['300', 'bg-primary-300'],
      ['500', 'bg-primary-500'],
      ['600', 'bg-primary-600'],
      ['700', 'bg-primary-700'],
      ['900', 'bg-primary-900'],
    ],
  },
  {
    name: 'success',
    swatches: [
      ['50', 'bg-success-50'],
      ['100', 'bg-success-100'],
      ['300', 'bg-success-300'],
      ['500', 'bg-success-500'],
      ['600', 'bg-success-600'],
      ['700', 'bg-success-700'],
      ['900', 'bg-success-900'],
    ],
  },
  {
    name: 'warning',
    swatches: [
      ['50', 'bg-warning-50'],
      ['100', 'bg-warning-100'],
      ['300', 'bg-warning-300'],
      ['500', 'bg-warning-500'],
      ['600', 'bg-warning-600'],
      ['700', 'bg-warning-700'],
      ['900', 'bg-warning-900'],
    ],
  },
  {
    name: 'danger',
    swatches: [
      ['50', 'bg-danger-50'],
      ['100', 'bg-danger-100'],
      ['300', 'bg-danger-300'],
      ['500', 'bg-danger-500'],
      ['600', 'bg-danger-600'],
      ['700', 'bg-danger-700'],
      ['900', 'bg-danger-900'],
    ],
  },
  {
    name: 'accent',
    swatches: [
      ['300', 'bg-accent-300'],
      ['400', 'bg-accent-400'],
      ['500', 'bg-accent-500'],
      ['600', 'bg-accent-600'],
    ],
  },
  {
    name: 'slate',
    swatches: [
      ['50', 'bg-slate-50'],
      ['100', 'bg-slate-100'],
      ['300', 'bg-slate-300'],
      ['500', 'bg-slate-500'],
      ['600', 'bg-slate-600'],
      ['700', 'bg-slate-700'],
      ['900', 'bg-slate-900'],
    ],
  },
]

const TEXT_SCALE = [
  { className: 'text-xs', label: 'text-xs - 12px' },
  { className: 'text-sm', label: 'text-sm - 14px' },
  { className: 'text-base', label: 'text-base - 16px' },
  { className: 'text-lg', label: 'text-lg - 18px' },
  { className: 'text-xl', label: 'text-xl - 20px' },
  { className: 'text-2xl', label: 'text-2xl - 24px' },
  { className: 'text-3xl', label: 'text-3xl - 30px' },
  { className: 'text-4xl', label: 'text-4xl - 36px' },
]

function Section({ title, description, children }) {
  return (
    <section className="mb-8">
      <div className="mb-3">
        <h2 className="text-lg font-bold tracking-tight text-slate-900">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-slate-600">{description}</p>}
      </div>
      <Card>
        <CardContent className="space-y-6">{children}</CardContent>
      </Card>
    </section>
  )
}

function Row({ label, children }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  )
}

export default function StyleGuide() {
  const [modalOpen, setModalOpen] = useState(false)
  const [sortContoh, setSortContoh] = useState({ key: 'nama', order: 'asc' })
  const [berkasContoh, setBerkasContoh] = useState(null)
  const [tabContoh, setTabContoh] = useState('info')
  const { toast } = useToast()

  const barisTerurut = [...BARIS_CONTOH].sort((a, b) => {
    const arah = sortContoh.order === 'asc' ? 1 : -1
    return String(a[sortContoh.key]).localeCompare(String(b[sortContoh.key])) * arah
  })

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Style Guide"
        description="Katalog token dan komponen yang dipakai di seluruh aplikasi. Halaman ini juga jadi bukti design system saat presentasi."
      />

      <Section title="Warna" description="Palet semantik: primary untuk aksi, success/warning/danger untuk status.">
        <div className="space-y-4">
          {COLOR_GROUPS.map((group) => (
            <div key={group.name}>
              <p className="mb-1.5 text-sm font-medium text-slate-700">{group.name}</p>
              <div className="flex flex-wrap gap-2">
                {group.swatches.map(([shade, colorClass]) => (
                  <div key={shade} className="w-16">
                    <div className={`h-12 rounded-md border border-slate-200 ${colorClass}`} />
                    <p className="mt-1 text-center text-xs text-slate-500">{shade}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Tipografi" description="Open Sans dengan skala 12 sampai 36 piksel.">
        <div className="space-y-2">
          {TEXT_SCALE.map((item) => (
            <p key={item.className} className={`${item.className} font-semibold text-slate-900`}>
              {item.label}
            </p>
          ))}
        </div>
      </Section>

      <Section title="Radius dan Shadow" description="Radius md 8px, lg 12px. Shadow dua tingkat: card dan pop.">
        <div className="flex flex-wrap gap-4">
          <div className="rounded-md border border-slate-200 bg-white p-5 shadow-card">
            <p className="text-sm font-semibold">rounded-md + shadow-card</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-pop">
            <p className="text-sm font-semibold">rounded-lg + shadow-pop</p>
          </div>
        </div>
      </Section>

      <Section title="Button" description="Varian, ukuran, ikon, dan state loading.">
        <Row label="Varian">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="success">Success</Button>
        </Row>
        <Row label="Ukuran">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
          <Button size="icon" variant="outline" aria-label="Hapus baris">
            <Trash2 className="size-4" aria-hidden="true" />
          </Button>
        </Row>
        <Row label="Dengan ikon dan state">
          <Button leadingIcon={Plus}>Daftarkan Lomba</Button>
          <Button variant="outline" leadingIcon={Download}>
            Ekspor
          </Button>
          <Button loading>Menyimpan</Button>
          <Button disabled>Nonaktif</Button>
        </Row>
      </Section>

      <Section title="Kontrol Form" description="Setiap kontrol punya label eksplisit, teks bantuan, dan state error.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Input label="Nama Perlombaan" placeholder="Contoh: GEMASTIK XVIII" required />
          <Input
            label="Instansi Penyelenggara"
            placeholder="Contoh: Kemdikbudristek"
            hint="Tulis nama resmi penyelenggara."
          />
          <Input label="Cari" placeholder="Cari lomba" leadingIcon={Search} />
          <Input
            label="NIM Ketua Tim"
            defaultValue="25020"
            error="NIM harus terdiri dari 10 angka."
          />
          <Select label="Bidang Lomba" placeholder="Pilih bidang" options={BIDANG_LOMBA} required />
          <Select label="Tingkat" placeholder="Pilih tingkat" options={TINGKAT_LOMBA} />
          <Select
            label="Tingkat dengan error"
            placeholder="Pilih tingkat"
            options={TINGKAT_LOMBA}
            error="Tingkat lomba wajib dipilih."
          />
          <Input label="Nonaktif" value="Tidak bisa diubah" disabled readOnly />
        </div>
        <Textarea
          label="Catatan"
          placeholder="Keterangan tambahan tentang lomba"
          hint="Opsional, maksimal beberapa kalimat."
        />
      </Section>

      <Section title="Badge" description="Label ringkas untuk status, capaian, kategori, dan kelengkapan dokumen.">
        <Row label="Tone dasar">
          <Badge>Neutral</Badge>
          <Badge tone="primary">Primary</Badge>
          <Badge tone="success">Success</Badge>
          <Badge tone="warning">Warning</Badge>
          <Badge tone="danger">Danger</Badge>
          <Badge tone="accent">Accent</Badge>
        </Row>
        <Row label="Status keikutsertaan">
          {Object.keys(STATUS_LOMBA).map((status) => (
            <StatusBadge key={status} status={status} />
          ))}
        </Row>
        <Row label="Capaian">
          {Object.keys(CAPAIAN_LOMBA).map((capaian) => (
            <CapaianBadge key={capaian} capaian={capaian} />
          ))}
        </Row>
        <Row label="Kelengkapan dokumen (bukan status persetujuan)">
          <KelengkapanBadge lengkap />
          <KelengkapanBadge lengkap={false} />
        </Row>
        <Row label="Kategori dan tingkat">
          {['Programming', 'UI/UX', 'Riset'].map((bidang) => (
            <Badge key={bidang} tone="primary" dot>
              {bidang}
            </Badge>
          ))}
          {TINGKAT_LOMBA.map((tingkat) => (
            <Badge key={tingkat}>{tingkat}</Badge>
          ))}
        </Row>
      </Section>

      <Section title="Card" description="Pembungkus konten dengan header, isi, dan footer.">
        <Card className="max-w-md">
          <CardHeader actions={<StatusBadge status="berlangsung" />}>
            <CardTitle as="h3">GEMASTIK XVIII - Pemrograman</CardTitle>
            <CardDescription>Kemdikbudristek - Tingkat Nasional</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              Tim Sanca Digital, tiga anggota, tahapan terdekat: babak penyisihan.
            </p>
          </CardContent>
          <CardFooter>
            <KelengkapanBadge lengkap={false} />
            <Button size="sm" variant="outline" className="ml-auto">
              Lihat detail
            </Button>
          </CardFooter>
        </Card>
      </Section>

      <Section title="Modal dan Toast" description="Dialog dengan focus trap dan notifikasi non-blocking.">
        <Row label="Pemicu">
          <Button variant="outline" onClick={() => setModalOpen(true)}>
            Buka Modal
          </Button>
          <Button
            variant="outline"
            onClick={() => toast({ title: 'Data tersimpan', variant: 'success' })}
          >
            Toast sukses
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              toast({
                title: 'Dokumen belum lengkap',
                description: 'Bukti pembayaran belum diunggah.',
                variant: 'warning',
              })
            }
          >
            Toast peringatan
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              toast({
                title: 'Gagal mengunggah',
                description: 'Ukuran berkas melebihi 5MB.',
                variant: 'danger',
              })
            }
          >
            Toast error
          </Button>
        </Row>

        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Hapus data lomba"
          description="Tindakan ini tidak bisa dibatalkan."
          footer={
            <>
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Batal
              </Button>
              <Button variant="danger" onClick={() => setModalOpen(false)}>
                Hapus
              </Button>
            </>
          }
        >
          <p className="text-sm text-slate-600">
            Seluruh berkas dan timeline yang terkait lomba ini akan ikut terhapus.
          </p>
        </Modal>
      </Section>

      <Section title="Stat Card" description="Kartu angka untuk dashboard, bisa berupa tautan.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Lomba aktif"
            nilai={7}
            keterangan="4 berlangsung, 3 terdaftar"
            icon={Trophy}
            tone="primary"
            to="/lomba-saya"
            aksiLabel="Lihat daftar"
          />
          <StatCard label="Agenda bulan ini" nilai={12} satuan="lomba" icon={Search} />
          <StatCard
            label="Dokumen belum lengkap"
            nilai={4}
            keterangan="Perlu bukti pembayaran"
            icon={Trash2}
            tone="warning"
          />
          <StatCard label="Prestasi tercatat" nilai={6} icon={Plus} tone="success" />
        </div>
      </Section>

      <Section title="Data Table" description="Tabel dengan pengurutan lewat header dan paginasi.">
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <DataTable
            caption="Contoh tabel style guide"
            columns={[
              { key: 'nama', header: 'Nama', sortable: true },
              { key: 'bidang', header: 'Bidang', sortable: true },
              {
                key: 'status',
                header: 'Status',
                render: (row) => <StatusBadge status={row.status} size="sm" />,
              },
            ]}
            rows={barisTerurut}
            sort={sortContoh}
            onSortChange={(key) => setSortContoh((sebelum) => urutanBerikutnya(sebelum, key))}
            pagination={{ page: 1, pageSize: 3, total: 3, totalPages: 1 }}
            onPageChange={() => {}}
            labelData="contoh"
            emptyState={<EmptyState title="Tidak ada data" />}
          />
        </div>
      </Section>

      <Section
        title="File Upload"
        description="Dropzone dengan pratinjau, validasi tipe, dan batas ukuran 5MB sesuai PRD."
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <FileUpload
            label="Bukti Pembayaran"
            hint="Bukti transfer, invoice, atau kwitansi."
            berkas={berkasContoh}
            onPilih={setBerkasContoh}
            required
          />
          <FileUpload
            label="Contoh state error"
            berkas={null}
            onPilih={() => {}}
            error="Ukuran berkas 9,5 MB melebihi batas 5 MB."
          />
        </div>
      </Section>

      <Section
        title="Tabs, Progress, dan Timeline"
        description="Navigasi bagian detail, bilah kelengkapan, dan penanda tahapan lomba."
      >
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <Tabs
            tabs={[
              { id: 'info', label: 'Info' },
              { id: 'tim', label: 'Tim', badge: 3 },
              { id: 'timeline', label: 'Timeline', badge: 4 },
            ]}
            aktif={tabContoh}
            onGanti={setTabContoh}
            idPrefix="styleguide"
          />
          <TabPanel id="info" aktif={tabContoh} idPrefix="styleguide" className="p-5">
            <p className="text-sm text-slate-600">Panel info.</p>
          </TabPanel>
          <TabPanel id="tim" aktif={tabContoh} idPrefix="styleguide" className="p-5">
            <p className="text-sm text-slate-600">Panel anggota tim.</p>
          </TabPanel>
          <TabPanel id="timeline" aktif={tabContoh} idPrefix="styleguide" className="p-5">
            <TimelineVertical tahapan={TAHAPAN_CONTOH} acuan={new Date(2026, 8, 24)} />
          </TabPanel>
        </div>

        <div className="space-y-3">
          <ProgressBar nilai={100} tone="success" label="Contoh kelengkapan penuh" />
          <ProgressBar nilai={50} tone="warning" label="Contoh kelengkapan separuh" />
          <ProgressBar nilai={20} tone="primary" label="Contoh progres awal" />
        </div>
      </Section>

      <Section title="Empty State dan Skeleton" description="Tampilan saat data kosong dan saat masih dimuat.">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-lg border border-slate-200">
            <EmptyState
              icon={Trophy}
              title="Belum ada lomba terdaftar"
              description="Mulai catat keikutsertaanmu supaya terpantau program studi."
              action={<Button leadingIcon={Plus}>Daftarkan Lomba</Button>}
            />
          </div>
          <div className="space-y-4 rounded-lg border border-slate-200 p-5">
            <div className="flex items-center gap-3">
              <Skeleton className="size-12" rounded="full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
            <SkeletonText lines={3} />
          </div>
        </div>
      </Section>
    </div>
  )
}
