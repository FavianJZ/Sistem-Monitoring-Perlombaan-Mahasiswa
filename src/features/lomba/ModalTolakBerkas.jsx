import { useState } from 'react'
import { AlertTriangle, Send } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { JENIS_BERKAS } from '@/config/domain'

const TEMPLATE_ALASAN = [
  'Berkas tidak terbaca / kualitas buram.',
  'Bukan dokumen resmi dari pihak penyelenggara.',
  'Nama peserta, tim, atau nama lomba tidak sesuai.',
  'Bukti transfer belum menunjukkan nominal/tanggal valid.',
  'Surat tugas belum ditandatangani pejabat berwenang.',
]

export function ModalTolakBerkas({ open, onClose, berkas, onKonfirmasi, memproses = false }) {
  const [alasan, setAlasan] = useState('')
  const [galat, setGalat] = useState(null)

  if (!berkas) return null

  const namaJenis = JENIS_BERKAS[berkas.tipe]?.label ?? berkas.tipe

  function handleSubmit(event) {
    event?.preventDefault()
    if (!alasan.trim()) {
      setGalat('Mohon cantumkan alasan penolakan agar mahasiswa tahu apa yang perlu diperbaiki.')
      return
    }

    setGalat(null)
    onKonfirmasi(alasan.trim())
  }

  function pilihTemplate(teks) {
    setAlasan((prev) => (prev ? `${prev} ${teks}` : teks))
    setGalat(null)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tolak Dokumen"
      description={`Berikan catatan penolakan untuk "${namaJenis}" (${berkas.namaFile ?? 'berkas'}). Mahasiswa akan diminta mengunggah ulang dokumen yang benar.`}
      size="md"
      footer={
        <div className="flex w-full justify-end gap-2.5">
          <Button variant="ghost" onClick={onClose} disabled={memproses}>
            Batal
          </Button>
          <Button
            variant="danger"
            leadingIcon={Send}
            onClick={handleSubmit}
            loading={memproses}
          >
            Konfirmasi Tolak
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-start gap-2.5 rounded-md border border-danger-200 bg-danger-50 p-3.5 text-xs text-danger-800">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger-600" aria-hidden="true" />
          <span>
            Dokumen ini akan ditandai <strong>Ditolak</strong> dan status kelengkapan lomba akan
            meminta mahasiswa untuk segera mengunggah berkas pengganti.
          </span>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-700">
            Pilihan Alasan Cepat
          </label>
          <div className="flex flex-wrap gap-1.5">
            {TEMPLATE_ALASAN.map((teks) => (
              <button
                key={teks}
                type="button"
                onClick={() => pilihTemplate(teks)}
                className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 transition hover:border-danger-300 hover:bg-danger-50 hover:text-danger-700"
              >
                + {teks}
              </button>
            ))}
          </div>
        </div>

        <Textarea
          label="Catatan Alasan Penolakan untuk Mahasiswa"
          name="alasanPenolakan"
          placeholder="Tuliskan alasan penolakan dan petunjuk perbaikan yang jelas..."
          rows={4}
          value={alasan}
          onChange={(e) => {
            setAlasan(e.target.value)
            if (galat) setGalat(null)
          }}
          error={galat}
          required
        />
      </form>
    </Modal>
  )
}
