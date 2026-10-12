import { useState } from 'react'
import { CircleAlert, CircleSlash } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import {
  ALASAN_TIDAK_LANJUT,
  CATATAN_TIDAK_LANJUT_MAKS,
  labelTahapan,
} from '@/config/domain'
import { tahapanTerurut } from '@/services/competitionQuery'
import { tandaiTidakLanjut } from '@/services/competitionService'

const OPSI_ALASAN = Object.entries(ALASAN_TIDAK_LANJUT).map(([value, label]) => ({ value, label }))

function opsiTahapan(lomba) {
  const jenis = [...new Set(tahapanTerurut(lomba).map((tahap) => tahap.jenis))]
  return jenis.map((value) => ({ value, label: labelTahapan(value) }))
}

export function ModalTidakLanjut({ open, onClose, lomba, onTersimpan }) {
  const [alasan, setAlasan] = useState('')
  const [tahapTerakhir, setTahapTerakhir] = useState('')
  const [catatan, setCatatan] = useState('')
  const [galatAlasan, setGalatAlasan] = useState(null)
  const [galatSimpan, setGalatSimpan] = useState(null)
  const [menyimpan, setMenyimpan] = useState(false)

  if (!lomba) return null

  const tahapan = opsiTahapan(lomba)

  async function handleSubmit(event) {
    event?.preventDefault()
    setGalatSimpan(null)

    if (!alasan) {
      setGalatAlasan('Pilih alasan lomba tidak dilanjutkan.')
      return
    }

    setMenyimpan(true)
    try {
      const hasil = await tandaiTidakLanjut(lomba.id, {
        alasan,
        tahapTerakhir: tahapTerakhir || null,
        catatan,
      })
      onTersimpan?.(hasil)
    } catch (kesalahan) {
      setGalatSimpan(kesalahan.message)
    } finally {
      setMenyimpan(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!menyimpan) onClose?.()
      }}
      title="Tandai lomba tidak lanjut"
      description={`"${lomba.nama}" akan dicatat sebagai keikutsertaan yang berhenti sebelum selesai.`}
      size="md"
      footer={
        <div className="flex w-full justify-end gap-2.5">
          <Button variant="ghost" onClick={onClose} disabled={menyimpan}>
            Batal
          </Button>
          <Button variant="danger" leadingIcon={CircleSlash} onClick={handleSubmit} loading={menyimpan}>
            Tandai tidak lanjut
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="flex items-start gap-2.5 rounded-md border border-warning-200 bg-warning-50 p-3.5 text-xs text-warning-900">
          <CircleAlert className="mt-0.5 size-4 shrink-0 text-warning-600" aria-hidden="true" />
          <span>
            Data lomba dan berkasnya tetap tersimpan sebagai riwayat. Setelah ditandai, hasil lomba
            tidak bisa dilaporkan dan status ini <strong>tidak bisa dikembalikan</strong> dari
            aplikasi.
          </span>
        </div>

        {galatSimpan && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-md border border-danger-200 bg-danger-50 p-3.5 text-sm text-danger-800"
          >
            <CircleAlert className="mt-px size-4 shrink-0" aria-hidden="true" />
            <span>{galatSimpan}</span>
          </div>
        )}

        <Select
          label="Alasan"
          placeholder="Pilih alasan"
          options={OPSI_ALASAN}
          value={alasan}
          onChange={(event) => {
            setAlasan(event.target.value)
            setGalatAlasan(null)
          }}
          error={galatAlasan}
          required
        />

        {tahapan.length > 0 && (
          <Select
            label="Tahap terakhir yang diikuti"
            placeholder="Tidak dicatat"
            options={tahapan}
            value={tahapTerakhir}
            onChange={(event) => setTahapTerakhir(event.target.value)}
            hint="Opsional. Membantu dosen melihat sampai mana tim bertahan."
          />
        )}

        <Textarea
          label="Catatan"
          name="catatanTidakLanjut"
          placeholder="Contoh: gugur di babak penyisihan dengan peringkat 24 dari 120 tim."
          rows={3}
          maxLength={CATATAN_TIDAK_LANJUT_MAKS}
          value={catatan}
          onChange={(event) => setCatatan(event.target.value)}
          hint={`Opsional, maksimal ${CATATAN_TIDAK_LANJUT_MAKS} karakter.`}
        />
      </form>
    </Modal>
  )
}
