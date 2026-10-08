import { Info } from 'lucide-react'
import { FileUpload } from '@/components/ui/FileUpload'
import { UNGGAH_EKSTENSI_LABEL } from '@/config/domain'

export function LangkahBukti({ draft, setBerkas, error = {} }) {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-2.5 rounded-md border border-slate-200 bg-slate-50 p-3.5 text-sm text-slate-600">
        <Info className="mt-px size-4 shrink-0 text-slate-400" aria-hidden="true" />
        <span>
          Unggah berkas asli dari penyelenggara. Format yang diterima {UNGGAH_EKSTENSI_LABEL}.
          Kedua bukti ini yang dipakai program studi untuk memastikan keikutsertaanmu tercatat
          resmi.
        </span>
      </div>

      <FileUpload
        label="Bukti Pendaftaran Resmi"
        hint="Tangkapan layar konfirmasi pendaftaran, email penerimaan, atau surat resmi penyelenggara."
        berkas={draft.berkas?.bukti_daftar ?? null}
        onPilih={(berkas) => setBerkas('bukti_daftar', berkas)}
        error={error.bukti_daftar}
        required
      />

      <FileUpload
        label="Bukti Pembayaran"
        hint="Bukti transfer, invoice, kwitansi, atau konfirmasi keikutsertaan bila lomba tidak berbayar."
        berkas={draft.berkas?.bukti_bayar ?? null}
        onPilih={(berkas) => setBerkas('bukti_bayar', berkas)}
        error={error.bukti_bayar}
        required
      />
    </div>
  )
}
