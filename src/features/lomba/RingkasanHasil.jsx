import { Medal, Newspaper } from 'lucide-react'
import { CapaianBadge } from '@/components/ui/StatusBadge'
import { DaftarBerkas } from './DaftarBerkas'
import { BarisInfo, TautanLuar } from './InfoLomba'
import { formatTanggal } from '@/lib/date'

/**
 * Ringkasan capaian akhir beserta bukti prestasinya.
 * Tampilannya sama untuk mahasiswa maupun dosen karena keduanya hanya membaca.
 */
export function RingkasanHasil({ lomba }) {
  const buktiPrestasi = (lomba.berkas ?? []).filter((berkas) =>
    ['sertifikat', 'foto'].includes(berkas.tipe),
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid size-12 place-items-center rounded-full bg-success-50 text-success-600">
          <Medal className="size-6" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm text-slate-600">Capaian akhir</p>
          <div className="mt-1">
            <CapaianBadge capaian={lomba.hasil.capaian} />
          </div>
        </div>
      </div>

      <dl>
        <BarisInfo
          label="Dilaporkan pada"
          nilai={formatTanggal(lomba.hasil.dilaporkanPada, { panjang: true })}
        />
        <BarisInfo
          label="Tautan berita"
          nilai={
            lomba.hasil.linkBerita ? (
              <span className="inline-flex items-center gap-1.5">
                <Newspaper className="size-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                <TautanLuar href={lomba.hasil.linkBerita} />
              </span>
            ) : null
          }
        />
      </dl>

      <div>
        <p className="mb-2 text-sm font-semibold text-slate-900">Bukti prestasi</p>
        <DaftarBerkas lomba={{ ...lomba, berkas: buktiPrestasi }} />
      </div>
    </div>
  )
}
