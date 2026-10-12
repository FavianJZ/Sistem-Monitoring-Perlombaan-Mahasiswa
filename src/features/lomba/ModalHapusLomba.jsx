import { useState } from 'react'
import { CircleAlert, Trash2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { hapusLomba } from '@/services/competitionService'

export function ModalHapusLomba({ open, onClose, lomba, onTerhapus }) {
  const [galat, setGalat] = useState(null)
  const [menghapus, setMenghapus] = useState(false)

  if (!lomba) return null

  async function handleHapus() {
    setGalat(null)
    setMenghapus(true)
    try {
      await hapusLomba(lomba.id)
      onTerhapus?.(lomba)
    } catch (kesalahan) {
      setGalat(kesalahan.message)
      setMenghapus(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!menghapus) onClose?.()
      }}
      title="Hapus lomba?"
      description={`"${lomba.nama}" beserta seluruh berkasnya akan dihapus permanen.`}
      size="sm"
      footer={
        <div className="flex w-full justify-end gap-2.5">
          <Button variant="ghost" onClick={onClose} disabled={menghapus}>
            Batal
          </Button>
          <Button variant="danger" leadingIcon={Trash2} onClick={handleHapus} loading={menghapus}>
            Hapus permanen
          </Button>
        </div>
      }
    >
      <div className="space-y-3 text-sm text-slate-700">
        <p>
          Gunakan ini hanya untuk data yang salah input atau terdaftar ganda. Tindakan ini tidak bisa
          dibatalkan.
        </p>
        <p className="text-xs text-slate-500">
          Bila lomba benar diikuti tetapi tidak diteruskan, pakai <strong>Tandai tidak lanjut</strong>{' '}
          di tab Hasil agar tetap tercatat sebagai riwayat.
        </p>
        {galat && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-md border border-danger-200 bg-danger-50 p-3.5 text-danger-800"
          >
            <CircleAlert className="mt-px size-4 shrink-0" aria-hidden="true" />
            <span>{galat}</span>
          </div>
        )}
      </div>
    </Modal>
  )
}
