import { CalendarDays, CalendarRange, FilterX, Layers, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { cn } from '@/lib/cn'
import {
  CAPAIAN_LOMBA,
  JENIS_TAHAPAN,
  STATUS_LOMBA,
  TINGKAT_LOMBA,
} from '@/config/domain'

/**
 * Mode filter waktu sesuai PRD, disatukan sebagai pilihan tunggal.
 * Tiga kebutuhan di PRD (bulan ini, tanggal tertentu, rentang kustom)
 * lebih jelas sebagai satu kelompok pilihan ketimbang tiga kontrol terpisah.
 */
const MODE_WAKTU = [
  { value: 'semua', label: 'Semua waktu', icon: Layers },
  { value: 'bulan-ini', label: 'Bulan ini', icon: CalendarDays },
  { value: 'tanggal', label: 'Tanggal tertentu', icon: CalendarDays },
  { value: 'rentang', label: 'Rentang kustom', icon: CalendarRange },
]

const OPSI_STATUS = Object.entries(STATUS_LOMBA).map(([value, meta]) => ({
  value,
  label: meta.label,
}))

const OPSI_CAPAIAN = [
  { value: 'belum', label: 'Belum dilaporkan' },
  ...Object.entries(CAPAIAN_LOMBA).map(([value, meta]) => ({ value, label: meta.label })),
]

const OPSI_TAHAPAN = JENIS_TAHAPAN.map((tahap) => ({
  value: tahap.value,
  label: tahap.label,
}))

export function FilterBar({
  filter,
  onUbah,
  onReset,
  adaFilter,
  opsi = {},
  sembunyikan = [],
  className,
}) {
  const tampil = (nama) => !sembunyikan.includes(nama)

  return (
    <div className={cn('space-y-4 border-b border-slate-200 p-4', className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Input
          label="Cari lomba"
          placeholder="Nama lomba, penyelenggara, tim, nama atau NIM mahasiswa"
          leadingIcon={Search}
          value={filter.search}
          onChange={(event) => onUbah({ search: event.target.value })}
          wrapperClassName="sm:max-w-md"
        />

        {adaFilter && (
          <Button variant="ghost" leadingIcon={FilterX} onClick={onReset}>
            Bersihkan filter
          </Button>
        )}
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-slate-700">Rentang waktu tahapan</legend>
        <div
          role="group"
          aria-label="Mode filter waktu"
          className="flex flex-wrap gap-1 rounded-lg border border-slate-300 bg-white p-1"
        >
          {MODE_WAKTU.map((mode) => {
            const Icon = mode.icon
            const aktif = (filter.mode ?? 'semua') === mode.value

            return (
              <button
                key={mode.value}
                type="button"
                aria-pressed={aktif}
                onClick={() => onUbah({ mode: mode.value })}
                className={cn(
                  'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors',
                  aktif ? 'bg-primary-600 text-white' : 'text-slate-600 hover:bg-slate-100',
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                {mode.label}
              </button>
            )
          })}
        </div>

        {filter.mode === 'tanggal' && (
          <Input
            label="Tanggal"
            type="date"
            value={filter.tanggal}
            onChange={(event) => onUbah({ tanggal: event.target.value })}
            hint="Menampilkan lomba yang punya tahapan pada tanggal ini."
            wrapperClassName="mt-3 sm:max-w-56"
          />
        )}

        {filter.mode === 'rentang' && (
          <div className="mt-3 grid gap-3 sm:max-w-md sm:grid-cols-2">
            <Input
              label="Dari tanggal"
              type="date"
              value={filter.dari}
              onChange={(event) => onUbah({ dari: event.target.value })}
            />
            <Input
              label="Sampai tanggal"
              type="date"
              value={filter.sampai}
              onChange={(event) => onUbah({ sampai: event.target.value })}
            />
          </div>
        )}
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tampil('bidang') && (
          <Select
            label="Bidang"
            placeholder="Semua bidang"
            options={opsi.bidang ?? []}
            value={filter.bidang}
            onChange={(event) => onUbah({ bidang: event.target.value })}
          />
        )}

        {tampil('tingkat') && (
          <Select
            label="Tingkat"
            placeholder="Semua tingkat"
            options={opsi.tingkat ?? TINGKAT_LOMBA}
            value={filter.tingkat}
            onChange={(event) => onUbah({ tingkat: event.target.value })}
          />
        )}

        {tampil('status') && (
          <Select
            label="Status"
            placeholder="Semua status"
            options={OPSI_STATUS}
            value={filter.status}
            onChange={(event) => onUbah({ status: event.target.value })}
          />
        )}

        {tampil('capaian') && (
          <Select
            label="Hasil"
            placeholder="Semua hasil"
            options={OPSI_CAPAIAN}
            value={filter.capaian}
            onChange={(event) => onUbah({ capaian: event.target.value })}
          />
        )}

        {tampil('jenisTahapan') && (
          <Select
            label="Jenis tahapan"
            placeholder="Semua tahapan"
            options={OPSI_TAHAPAN}
            value={filter.jenisTahapan}
            onChange={(event) => onUbah({ jenisTahapan: event.target.value })}
          />
        )}

        {tampil('prodi') && (
          <Select
            label="Program studi"
            placeholder="Semua program studi"
            options={opsi.prodi ?? []}
            value={filter.prodi}
            onChange={(event) => onUbah({ prodi: event.target.value })}
          />
        )}
      </div>
    </div>
  )
}
