import { CircleSlash } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { labelAlasanTidakLanjut, labelTahapan } from '@/config/domain'
import { formatTanggal } from '@/lib/date'
import { BarisInfo } from './InfoLomba'

export function RingkasanTidakLanjut({ lomba }) {
  const info = lomba.tidakLanjut ?? {}

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid size-12 place-items-center rounded-full bg-slate-100 text-slate-500">
          <CircleSlash className="size-6" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm text-slate-600">Lomba tidak dilanjutkan</p>
          <div className="mt-1">
            <Badge>{labelAlasanTidakLanjut(info.alasan)}</Badge>
          </div>
        </div>
      </div>

      <dl>
        <BarisInfo
          label="Tahap terakhir"
          nilai={info.tahapTerakhir ? labelTahapan(info.tahapTerakhir) : null}
        />
        <BarisInfo label="Catatan" nilai={info.catatan} />
        <BarisInfo
          label="Dicatat pada"
          nilai={info.dicatatPada ? formatTanggal(info.dicatatPada, { panjang: true }) : null}
        />
      </dl>
    </div>
  )
}
