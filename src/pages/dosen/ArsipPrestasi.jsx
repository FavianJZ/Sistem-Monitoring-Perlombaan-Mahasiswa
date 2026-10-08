import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Archive,
  FileSpreadsheet,
  FileText,
  Medal,
  Search,
  Table,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { CapaianBadge } from '@/components/ui/StatusBadge'
import { StatCard } from '@/components/ui/StatCard'
import { DataTable, urutanBerikutnya } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toast'
import { FilterBar } from '@/features/monitoring/FilterBar'
import { unduhCsv, unduhPdf, unduhXlsx } from '@/features/arsip/eksporBerkas'
import { useAsync } from '@/hooks/useAsync'
import { useDebounce } from '@/hooks/useDebounce'
import { useFilterUrl } from '@/hooks/useFilterUrl'
import {
  opsiFilter,
  semuaLombaTersaring,
  statistikLomba,
} from '@/services/competitionService'
import { formatTanggal } from '@/lib/date'
import { namaPengguna } from '@/services/userService'
import { CAPAIAN_LOMBA } from '@/config/domain'

const UKURAN_HALAMAN = 10

const FILTER_BAWAAN = {
  search: '',
  mode: 'semua',
  tanggal: '',
  dari: '',
  sampai: '',
  bidang: '',
  tingkat: '',
  capaian: '',
  prodi: '',
  sort: 'capaian',
  order: 'asc',
  page: 1,
}

export default function ArsipPrestasi() {
  const { filter, ubah, reset, adaFilter } = useFilterUrl(FILTER_BAWAAN)
  const { toast } = useToast()
  const [mengekspor, setMengekspor] = useState(null)

  const pencarian = useDebounce(filter.search, 300)

  const filterService = useMemo(
    () => ({
      status: 'selesai',
      search: pencarian,
      mode: filter.mode,
      tanggal: filter.tanggal || undefined,
      dari: filter.dari || undefined,
      sampai: filter.sampai || undefined,
      bidang: filter.bidang || undefined,
      tingkat: filter.tingkat || undefined,
      capaian: filter.capaian || undefined,
      prodi: filter.prodi || undefined,
      sort: filter.sort,
      order: filter.order,
    }),
    [
      pencarian,
      filter.mode,
      filter.tanggal,
      filter.dari,
      filter.sampai,
      filter.bidang,
      filter.tingkat,
      filter.capaian,
      filter.prodi,
      filter.sort,
      filter.order,
    ],
  )

  const ambil = useCallback(
    () =>
      Promise.all([
        semuaLombaTersaring(filterService),
        statistikLomba({ status: 'selesai' }),
      ]).then(([items, statistik]) => ({ items, statistik })),
    [filterService],
  )

  const { data, loading, error } = useAsync(ambil, [ambil])

  const ambilOpsi = useCallback(() => opsiFilter(), [])
  const { data: opsi } = useAsync(ambilOpsi, [ambilOpsi])

  const semua = data?.items ?? []
  const totalHalaman = Math.max(1, Math.ceil(semua.length / UKURAN_HALAMAN))
  const halaman = Math.min(Math.max(1, filter.page), totalHalaman)
  const barisHalaman = semua.slice((halaman - 1) * UKURAN_HALAMAN, halaman * UKURAN_HALAMAN)

  async function ekspor(jenis) {
    if (semua.length === 0) {
      toast({
        title: 'Tidak ada data untuk diekspor',
        description: 'Longgarkan filter terlebih dahulu.',
        variant: 'warning',
      })
      return
    }

    setMengekspor(jenis)
    try {
      const nama =
        jenis === 'csv'
          ? unduhCsv(semua)
          : jenis === 'xlsx'
            ? await unduhXlsx(semua)
            : await unduhPdf(semua)

      toast({
        title: 'Laporan berhasil diunduh',
        description: `${nama} memuat ${semua.length} perlombaan.`,
        variant: 'success',
      })
    } catch (kesalahan) {
      toast({
        title: 'Gagal membuat laporan',
        description: kesalahan.message,
        variant: 'danger',
      })
    } finally {
      setMengekspor(null)
    }
  }

  const columns = [
    {
      key: 'nama',
      header: 'Perlombaan',
      sortable: true,
      render: (lomba) => (
        <div className="min-w-64">
          <Link
            to={`/monitoring/lomba/${lomba.id}`}
            className="font-semibold text-slate-900 hover:text-primary-700 hover:underline"
          >
            {lomba.nama}
          </Link>
          <p className="mt-0.5 text-xs text-slate-500">{lomba.penyelenggara}</p>
        </div>
      ),
    },
    {
      key: 'peserta',
      header: 'Peserta',
      render: (lomba) => (
        <div>
          <p className="font-medium text-slate-900">{lomba.anggota?.[0]?.nama ?? '-'}</p>
          <p className="text-xs text-slate-500">{lomba.anggota?.[0]?.nim ?? '-'}</p>
          <p className="text-xs text-slate-500">{lomba.anggota?.[0]?.prodi ?? '-'}</p>
          {lomba.namaTim && (
            <p className="mt-1 text-xs text-slate-600">
              Tim {lomba.namaTim} - {lomba.jumlahAnggota} anggota
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'bidang',
      header: 'Bidang',
      sortable: true,
      render: (lomba) => (
        <div className="space-y-1.5">
          <Badge tone="primary" size="sm">
            {lomba.bidang}
          </Badge>
          <p className="text-xs text-slate-500">{lomba.tingkat}</p>
        </div>
      ),
    },
    {
      key: 'pembimbing',
      header: 'Pembimbing',
      render: (lomba) => (
        <p className="text-slate-600">
          {lomba.dosenPembimbingId ? namaPengguna(lomba.dosenPembimbingId) : '-'}
        </p>
      ),
    },
    {
      key: 'capaian',
      header: 'Capaian',
      sortable: true,
      render: (lomba) => (
        <div className="space-y-1.5">
          <CapaianBadge capaian={lomba.hasil?.capaian} size="sm" />
          <p className="text-xs text-slate-500">
            Dilaporkan {formatTanggal(lomba.hasil?.dilaporkanPada)}
          </p>
        </div>
      ),
    },
    {
      key: 'sertifikat',
      header: 'Sertifikat',
      render: (lomba) => {
        const ada = (lomba.berkas ?? []).some((berkas) => berkas.tipe === 'sertifikat')
        return (
          <Badge tone={ada ? 'success' : 'warning'} size="sm">
            {ada ? 'Ada' : 'Belum ada'}
          </Badge>
        )
      },
    },
    {
      key: 'aksi',
      header: 'Aksi',
      align: 'right',
      render: (lomba) => (
        <Button as={Link} to={`/monitoring/lomba/${lomba.id}`} size="sm" variant="outline">
          Detail
        </Button>
      ),
    },
  ]

  const statistik = data?.statistik

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Arsip & Prestasi"
        description="Riwayat perlombaan yang telah selesai beserta capaian dan sertifikatnya, siap diekspor untuk laporan akreditasi."
        actions={
          <>
            <Button
              variant="outline"
              leadingIcon={Table}
              loading={mengekspor === 'csv'}
              onClick={() => ekspor('csv')}
            >
              CSV
            </Button>
            <Button
              variant="outline"
              leadingIcon={FileSpreadsheet}
              loading={mengekspor === 'xlsx'}
              onClick={() => ekspor('xlsx')}
            >
              Excel
            </Button>
            <Button
              variant="outline"
              leadingIcon={FileText}
              loading={mengekspor === 'pdf'}
              onClick={() => ekspor('pdf')}
            >
              PDF
            </Button>
          </>
        }
      />

      {statistik && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Lomba selesai"
            nilai={statistik.total}
            keterangan="Seluruh riwayat keikutsertaan yang sudah tuntas"
            icon={Archive}
          />
          <StatCard
            label="Prestasi tercatat"
            nilai={statistik.totalPrestasi}
            keterangan="Juara 1 sampai Finalis, tidak termasuk peserta"
            icon={Medal}
            tone="success"
          />
          <StatCard
            label="Tingkat internasional"
            nilai={statistik.perTingkat.Internasional ?? 0}
            icon={Medal}
            tone="primary"
          />
          <StatCard
            label="Hasil terfilter"
            nilai={semua.length}
            keterangan="Jumlah baris yang akan ikut terekspor"
            icon={Search}
          />
        </div>
      )}

      <Card className="mb-6">
        <CardContent className="space-y-3 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Sebaran capaian
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(CAPAIAN_LOMBA).map(([kunci, meta]) => (
              <Badge key={kunci} tone={meta.tone}>
                {meta.label}: {statistik?.perCapaian?.[kunci] ?? 0}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <FilterBar
          filter={filter}
          onUbah={ubah}
          onReset={reset}
          adaFilter={adaFilter}
          opsi={opsi ?? {}}
          sembunyikan={['status', 'jenisTahapan']}
        />

        {error ? (
          <EmptyState tone="danger" title="Gagal memuat arsip" description={error.message} />
        ) : (
          <DataTable
            caption="Arsip prestasi perlombaan"
            columns={columns}
            rows={barisHalaman}
            loading={loading}
            sort={{ key: filter.sort, order: filter.order }}
            onSortChange={(key) => {
              const berikutnya = urutanBerikutnya({ key: filter.sort, order: filter.order }, key)
              ubah({ sort: berikutnya.key, order: berikutnya.order })
            }}
            pagination={{
              page: halaman,
              pageSize: UKURAN_HALAMAN,
              total: semua.length,
              totalPages: totalHalaman,
            }}
            onPageChange={(tujuan) => ubah({ page: tujuan })}
            labelData="prestasi"
            emptyState={
              adaFilter ? (
                <EmptyState
                  icon={Search}
                  title="Tidak ada prestasi yang cocok"
                  description="Longgarkan kriteria filter atau ubah rentang waktunya."
                  action={
                    <Button variant="outline" onClick={reset}>
                      Atur ulang filter
                    </Button>
                  }
                />
              ) : (
                <EmptyState
                  icon={Archive}
                  title="Belum ada lomba yang selesai"
                  description="Arsip terisi setelah mahasiswa melaporkan hasil perlombaannya."
                />
              )
            }
          />
        )}
      </Card>
    </div>
  )
}
