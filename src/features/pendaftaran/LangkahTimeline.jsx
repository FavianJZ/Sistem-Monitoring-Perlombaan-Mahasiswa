import { CalendarPlus, CircleAlert, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { JENIS_TAHAPAN, labelTahapan } from '@/config/domain'

/** Tahapan bawaan boleh berupa rentang tanggal; tahapan tambahan selalu boleh. */
function pakaiRentang(tahap) {
  if (tahap.jenis === 'kustom') return true
  return JENIS_TAHAPAN.find((item) => item.value === tahap.jenis)?.rentang ?? false
}

function judulTahapan(tahap, indeks) {
  if (tahap.jenis === 'kustom') return tahap.label?.trim() || `Tahapan tambahan ${indeks + 1}`
  return labelTahapan(tahap.jenis)
}

/**
 * Langkah 5: jadwal tiap tahapan perlombaan.
 *
 * Enam tahapan bawaan mengikuti urutan pada PRD dan boleh dikosongkan,
 * karena tidak semua lomba punya semifinal atau technical meeting.
 */
export function LangkahTimeline({
  draft,
  ubahTahapan,
  tambahTahapan,
  hapusTahapan,
  error = {},
  errorTahapan = [],
}) {
  function tambahKustom() {
    tambahTahapan({ jenis: 'kustom', label: '', tanggalMulai: '', tanggalSelesai: '' })
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-600">
        Isi tanggal tahapan yang sudah diketahui. Tahapan yang tidak ada pada lombamu boleh
        dibiarkan kosong, dan kamu bisa menambahkan tahapan lain bila perlu.
      </p>

      {error.umum && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-md border border-danger-200 bg-danger-50 p-3.5 text-sm text-danger-800"
        >
          <CircleAlert className="mt-px size-4 shrink-0" aria-hidden="true" />
          <span>{error.umum}</span>
        </div>
      )}

      <ul aria-label="Tahapan perlombaan" className="space-y-4">
        {draft.tahapan.map((tahap, indeks) => {
          const galat = errorTahapan[indeks] ?? {}
          const rentang = pakaiRentang(tahap)
          const kustom = tahap.jenis === 'kustom'

          return (
            <li
              key={`${tahap.jenis}-${indeks}`}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-card"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                    {indeks + 1}
                  </span>
                  <p className="truncate font-semibold text-slate-900">
                    {judulTahapan(tahap, indeks)}
                  </p>
                  {kustom && (
                    <Badge size="sm" tone="primary">
                      Tambahan
                    </Badge>
                  )}
                </div>

                {kustom && (
                  <Button
                    variant="ghost"
                    size="sm"
                    leadingIcon={Trash2}
                    onClick={() => hapusTahapan(indeks)}
                    aria-label={`Hapus ${judulTahapan(tahap, indeks)}`}
                  >
                    Hapus
                  </Button>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {kustom && (
                  <Input
                    label="Nama Tahapan"
                    placeholder="Contoh: Presentasi Karya"
                    value={tahap.label ?? ''}
                    onChange={(event) => ubahTahapan(indeks, { label: event.target.value })}
                    error={galat.label}
                  />
                )}

                <Input
                  label={rentang ? 'Tanggal Mulai' : 'Tanggal'}
                  type="date"
                  value={tahap.tanggalMulai ?? ''}
                  onChange={(event) => ubahTahapan(indeks, { tanggalMulai: event.target.value })}
                  error={galat.tanggalMulai}
                />

                {rentang && (
                  <Input
                    label="Tanggal Selesai"
                    type="date"
                    value={tahap.tanggalSelesai ?? ''}
                    onChange={(event) => ubahTahapan(indeks, { tanggalSelesai: event.target.value })}
                    error={galat.tanggalSelesai}
                  />
                )}
              </div>
            </li>
          )
        })}
      </ul>

      <Button variant="outline" leadingIcon={CalendarPlus} onClick={tambahKustom}>
        Tambah tahapan lain
      </Button>
    </div>
  )
}
