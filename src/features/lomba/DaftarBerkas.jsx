import { FileText, Image as ImageIcon, TriangleAlert } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { formatTanggal } from '@/lib/date'
import { formatUkuran } from '@/lib/format'
import { JENIS_BERKAS } from '@/config/domain'
import { BERKAS_WAJIB } from '@/services/competitionQuery'

function KartuBerkas({ berkas, pratinjau }) {
  const gambar = berkas.mimeType?.startsWith('image/')
  const Ikon = gambar ? ImageIcon : FileText

  return (
    <li className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3.5">
      {pratinjau ? (
        <img
          src={pratinjau}
          alt={`Pratinjau ${JENIS_BERKAS[berkas.tipe]?.label ?? berkas.tipe}`}
          className="size-20 shrink-0 rounded-md border border-slate-200 object-cover"
        />
      ) : (
        <span className="grid size-20 shrink-0 place-items-center rounded-md bg-slate-100 text-slate-500">
          <Ikon className="size-7" aria-hidden="true" />
        </span>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-slate-900">
            {JENIS_BERKAS[berkas.tipe]?.label ?? berkas.tipe}
          </p>
          {JENIS_BERKAS[berkas.tipe]?.wajib && (
            <Badge size="sm" tone="primary">
              Wajib
            </Badge>
          )}
        </div>
        <p className="mt-0.5 truncate text-sm text-slate-600">{berkas.namaFile}</p>
        <p className="mt-0.5 text-xs text-slate-500">
          {formatUkuran(berkas.size)}
          {berkas.diunggahPada ? ` - diunggah ${formatTanggal(berkas.diunggahPada)}` : ''}
        </p>
        {!pratinjau && (
          <p className="mt-1.5 text-xs text-slate-400">
            Isi berkas belum tersedia pada data tiruan.
          </p>
        )}
      </div>
    </li>
  )
}

/**
 * Daftar berkas pendukung beserta penanda berkas wajib yang belum ada.
 * Dipakai bersama oleh halaman detail mahasiswa dan halaman pemantauan dosen.
 */
export function DaftarBerkas({ lomba }) {
  const berkas = lomba.berkas ?? []
  const tersedia = new Set(berkas.map((item) => item.tipe))
  const kurang = BERKAS_WAJIB.filter((tipe) => !tersedia.has(tipe))

  return (
    <div className="space-y-4">
      {kurang.length > 0 && (
        <div className="flex items-start gap-2.5 rounded-md border border-warning-200 bg-warning-50 p-3.5 text-sm text-warning-800">
          <TriangleAlert className="mt-px size-4 shrink-0" aria-hidden="true" />
          <span>
            Belum diunggah: {kurang.map((tipe) => JENIS_BERKAS[tipe]?.label ?? tipe).join(' dan ')}.
          </span>
        </div>
      )}

      {berkas.length === 0 ? (
        <p className="text-sm text-slate-600">Belum ada berkas yang diunggah untuk lomba ini.</p>
      ) : (
        <ul aria-label="Berkas pendukung" className="grid gap-3 sm:grid-cols-2">
          {berkas.map((item) => (
            <KartuBerkas
              key={item.id ?? `${item.tipe}-${item.namaFile}`}
              berkas={item}
              // Hanya poster yang punya alamat gambar pada data tiruan.
              pratinjau={item.tipe === 'poster' ? lomba.posterUrl : null}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
