import { useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { FileWarning, LayoutGrid, Rows3, Search, Trophy } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { CapaianBadge, KelengkapanBadge, StatusBadge } from '@/components/ui/StatusBadge'
import { DataTable, urutanBerikutnya } from '@/components/ui/DataTable'
import { Pagination } from '@/components/ui/Pagination'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { CompetitionCard } from '@/features/lomba/CompetitionCard'
import { FilterBar } from '@/features/monitoring/FilterBar'
import { useAsync } from '@/hooks/useAsync'
import { useDebounce } from '@/hooks/useDebounce'
import { useFilterUrl } from '@/hooks/useFilterUrl'
import { daftarLomba, opsiFilter } from '@/services/competitionService'
import { namaPengguna } from '@/services/userService'
import { formatTanggal, jarakHari } from '@/lib/date'
import { labelTahapan } from '@/config/domain'

const UKURAN_HALAMAN = 9

const FILTER_BAWAAN = {
  search: '',
  mode: 'semua',
  tanggal: '',
  dari: '',
  sampai: '',
  bidang: '',
  tingkat: '',
  status: '',
  capaian: '',
  jenisTahapan: '',
  prodi: '',
  hanyaDokumenBelumLengkap: false,
  sort: 'tahapanTerdekat',
  order: 'asc',
  page: 1,
  tampilan: 'kartu',
}

export default function MonitoringLomba() {
  const { filter, ubah, reset, adaFilter } = useFilterUrl(FILTER_BAWAAN)

  const pencarian = useDebounce(filter.search, 300)

  const filterService = useMemo(
    () => ({
      search: pencarian,
      mode: filter.mode,
      tanggal: filter.tanggal || undefined,
      dari: filter.dari || undefined,
      sampai: filter.sampai || undefined,
      bidang: filter.bidang || undefined,
      tingkat: filter.tingkat || undefined,
      status: filter.status || undefined,
      capaian: filter.capaian || undefined,
      jenisTahapan: filter.jenisTahapan || undefined,
      prodi: filter.prodi || undefined,
      hanyaDokumenBelumLengkap: filter.hanyaDokumenBelumLengkap || undefined,
      sort: filter.sort,
      order: filter.order,
      page: filter.page,
      pageSize: UKURAN_HALAMAN,
    }),
    [
      pencarian,
      filter.mode,
      filter.tanggal,
      filter.dari,
      filter.sampai,
      filter.bidang,
      filter.tingkat,
      filter.status,
      filter.capaian,
      filter.jenisTahapan,
      filter.prodi,
      filter.hanyaDokumenBelumLengkap,
      filter.sort,
      filter.order,
      filter.page,
    ],
  )

  const ambil = useCallback(() => daftarLomba(filterService), [filterService])
  const { data, loading, error } = useAsync(ambil, [ambil])

  const ambilOpsi = useCallback(() => opsiFilter(), [])
  const { data: opsi } = useAsync(ambilOpsi, [ambilOpsi])

  const kartu = filter.tampilan !== 'tabel'

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
          <p className="mt-1.5 text-xs text-slate-600">
            {lomba.namaTim
              ? `Tim ${lomba.namaTim} - ${lomba.jumlahAnggota} anggota`
              : (lomba.anggota?.[0]?.nama ?? 'Perorangan')}
          </p>
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
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (lomba) => (
        <div className="space-y-1.5">
          <StatusBadge status={lomba.status} size="sm" />
          {lomba.hasil && (
            <div>
              <CapaianBadge capaian={lomba.hasil.capaian} size="sm" />
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'tahapanTerdekat',
      header: 'Tahapan terdekat',
      sortable: true,
      render: (lomba) =>
        lomba.tahapanBerikutnya ? (
          <div>
            <p className="font-medium text-slate-900">
              {labelTahapan(lomba.tahapanBerikutnya.jenis)}
            </p>
            <p className="text-xs text-slate-500">
              {formatTanggal(lomba.tahapanBerikutnya.tanggalMulai)}
            </p>
            <p className="mt-1 text-xs font-medium text-primary-700">
              {jarakHari(lomba.tahapanBerikutnya.tanggalMulai)}
            </p>
          </div>
        ) : (
          <span className="text-xs text-slate-400">Seluruh tahapan selesai</span>
        ),
    },
    {
      key: 'dokumen',
      header: 'Dokumen',
      render: (lomba) => (
        <div>
          <KelengkapanBadge lengkap={lomba.kelengkapan.lengkap} size="sm" />
          {!lomba.kelengkapan.lengkap && (
            <p className="mt-1 text-xs text-warning-700">
              Kurang {lomba.kelengkapan.kurangLabel.join(' dan ')}
            </p>
          )}
        </div>
      ),
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

  const emptyState = adaFilter ? (
    <EmptyState
      icon={Search}
      title="Tidak ada lomba yang cocok"
      description="Coba longgarkan kriteria filter atau ubah rentang waktunya."
      action={
        <Button variant="outline" onClick={reset}>
          Atur ulang filter
        </Button>
      }
    />
  ) : (
    <EmptyState
      icon={Trophy}
      title="Belum ada lomba yang tercatat"
      description="Data akan muncul setelah mahasiswa mendaftarkan keikutsertaan lombanya."
    />
  )

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Monitoring Lomba"
        description="Saring keikutsertaan berdasarkan waktu tahapan, bidang, tingkat, dan status hasilnya."
        actions={
          <>
            <Button
              variant={filter.hanyaDokumenBelumLengkap ? 'primary' : 'outline'}
              leadingIcon={FileWarning}
              aria-pressed={filter.hanyaDokumenBelumLengkap}
              onClick={() =>
                ubah({ hanyaDokumenBelumLengkap: !filter.hanyaDokumenBelumLengkap })
              }
            >
              Dokumen belum lengkap
            </Button>

            <div
              role="group"
              aria-label="Bentuk tampilan"
              className="flex rounded-lg border border-slate-300 bg-white p-1"
            >
              <button
                type="button"
                aria-pressed={kartu}
                onClick={() => ubah({ tampilan: 'kartu' })}
                className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
                  kartu ? 'bg-primary-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <LayoutGrid className="size-4" aria-hidden="true" />
                Kartu
              </button>
              <button
                type="button"
                aria-pressed={!kartu}
                onClick={() => ubah({ tampilan: 'tabel' })}
                className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
                  !kartu ? 'bg-primary-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Rows3 className="size-4" aria-hidden="true" />
                Tabel
              </button>
            </div>
          </>
        }
      />

      <Card className="mb-6">
        <FilterBar
          filter={filter}
          onUbah={ubah}
          onReset={reset}
          adaFilter={adaFilter}
          opsi={opsi ?? {}}
        />

        {!kartu &&
          (error ? (
            <GalatMuat error={error} />
          ) : (
            <DataTable
              caption="Daftar lomba yang dipantau"
              columns={columns}
              rows={data?.items ?? []}
              loading={loading}
              sort={{ key: filter.sort, order: filter.order }}
              onSortChange={(key) => {
                const berikutnya = urutanBerikutnya({ key: filter.sort, order: filter.order }, key)
                ubah({ sort: berikutnya.key, order: berikutnya.order })
              }}
              pagination={data}
              onPageChange={(halaman) => ubah({ page: halaman })}
              labelData="lomba"
              emptyState={emptyState}
            />
          ))}
      </Card>

      {kartu && (
        <>
          {loading && (
            <Card>
              <SkeletonTable rows={6} columns={3} />
            </Card>
          )}

          {error && (
            <Card>
              <EmptyState tone="danger" title="Gagal memuat data" description={error.message} />
            </Card>
          )}

          {data && data.items.length === 0 && <Card>{emptyState}</Card>}

          {data && data.items.length > 0 && (
            <>
              <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {data.items.map((lomba) => (
                  <CompetitionCard key={lomba.id} lomba={lomba} />
                ))}
              </div>

              <Card className="mt-4">
                <Pagination
                  page={data.page}
                  pageSize={data.pageSize}
                  total={data.total}
                  totalPages={data.totalPages}
                  onPageChange={(halaman) => ubah({ page: halaman })}
                  label="lomba"
                />
              </Card>
            </>
          )}
        </>
      )}
    </div>
  )
}
