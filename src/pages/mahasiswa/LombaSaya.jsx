import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CirclePlus, FilterX, Search, Trophy } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { CapaianBadge, KelengkapanBadge, StatusBadge } from '@/components/ui/StatusBadge'
import { DataTable, urutanBerikutnya } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { GalatMuat } from '@/components/ui/GalatMuat'
import { PengumumanLangsung } from '@/components/ui/PengumumanLangsung'
import { useAuth } from '@/auth/AuthContext'
import { useAsync } from '@/hooks/useAsync'
import { useDebounce } from '@/hooks/useDebounce'
import { daftarLomba } from '@/services/competitionService'
import { formatTanggal, jarakHari } from '@/lib/date'
import { STATUS_LOMBA, labelTahapan } from '@/config/domain'

const UKURAN_HALAMAN = 8

const OPSI_STATUS = Object.entries(STATUS_LOMBA).map(([value, meta]) => ({
  value,
  label: meta.label,
}))

export default function LombaSaya() {
  const { user } = useAuth()

  const [cari, setCari] = useState('')
  const [status, setStatus] = useState('')
  const [sort, setSort] = useState({ key: 'tahapanTerdekat', order: 'asc' })
  const [page, setPage] = useState(1)

  const kataKunci = useDebounce(cari)
  const adaFilter = Boolean(kataKunci || status)

  // Kembali ke halaman pertama setiap kriteria berubah.
  useEffect(() => {
    setPage(1)
  }, [kataKunci, status, sort.key, sort.order])

  const filter = useMemo(
    () => ({
      createdBy: user.id,
      search: kataKunci,
      status: status || undefined,
      sort: sort.key,
      order: sort.order,
      page,
      pageSize: UKURAN_HALAMAN,
    }),
    [user.id, kataKunci, status, sort.key, sort.order, page],
  )

  const { data, loading, error } = useAsync(() => daftarLomba(filter), [filter])

  const columns = [
    {
      key: 'nama',
      header: 'Perlombaan',
      sortable: true,
      render: (lomba) => (
        <div className="min-w-64">
          <Link
            to={`/lomba-saya/${lomba.id}`}
            className="font-semibold text-slate-900 hover:text-primary-700 hover:underline"
          >
            {lomba.nama}
          </Link>
          <p className="mt-0.5 text-xs text-slate-500">{lomba.penyelenggara}</p>
          <p className="mt-1.5 text-xs text-slate-600">
            {lomba.namaTim ? `Tim ${lomba.namaTim}` : 'Perorangan'}
            {lomba.jenis === 'tim' && ` - ${lomba.jumlahAnggota} anggota`}
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
        <Button as={Link} to={`/lomba-saya/${lomba.id}`} size="sm" variant="outline">
          Detail
        </Button>
      ),
    },
  ]

  function handleSort(key) {
    setSort((sebelum) => urutanBerikutnya(sebelum, key))
  }

  function bersihkanFilter() {
    setCari('')
    setStatus('')
  }

  return (
    <div className="mx-auto max-w-7xl">
      <PengumumanLangsung
        pesan={
          loading || !data
            ? ''
            : `${data.total} lomba ditemukan${adaFilter ? ' dengan filter yang aktif' : ''}.`
        }
      />

      <PageHeader
        title="Lomba Saya"
        description="Seluruh keikutsertaan lomba yang sudah kamu daftarkan beserta statusnya."
        actions={
          <Button as={Link} to="/lomba-saya/baru" leadingIcon={CirclePlus}>
            Daftarkan Lomba
          </Button>
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-end">
          <Input
            label="Cari lomba"
            placeholder="Nama lomba, penyelenggara, atau nama tim"
            leadingIcon={Search}
            value={cari}
            onChange={(event) => setCari(event.target.value)}
            wrapperClassName="sm:max-w-sm"
          />
          <Select
            label="Status"
            placeholder="Semua status"
            options={OPSI_STATUS}
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            wrapperClassName="sm:max-w-48"
          />
          {adaFilter && (
            <Button variant="ghost" leadingIcon={FilterX} onClick={bersihkanFilter}>
              Bersihkan
            </Button>
          )}
        </div>

        {error ? (
          <GalatMuat error={error} />
        ) : (
          <DataTable
            caption="Daftar lomba yang saya ikuti"
            columns={columns}
            rows={data?.items ?? []}
            loading={loading}
            sort={sort}
            onSortChange={handleSort}
            pagination={data}
            onPageChange={setPage}
            labelData="lomba"
            emptyState={
              adaFilter ? (
                <EmptyState
                  icon={Search}
                  title="Tidak ada lomba yang cocok"
                  description="Coba ubah kata kunci atau pilih status yang lain."
                  action={
                    <Button variant="outline" leadingIcon={FilterX} onClick={bersihkanFilter}>
                      Bersihkan filter
                    </Button>
                  }
                />
              ) : (
                <EmptyState
                  icon={Trophy}
                  title="Belum ada lomba terdaftar"
                  description="Catat keikutsertaanmu supaya terpantau program studi dan tersimpan sebagai arsip prestasi."
                  action={
                    <Button as={Link} to="/lomba-saya/baru" leadingIcon={CirclePlus}>
                      Daftarkan Lomba
                    </Button>
                  }
                />
              )
            }
          />
        )}
      </Card>
    </div>
  )
}
