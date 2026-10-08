import { useState } from 'react'
import { AlertCircle, RefreshCw, Upload } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FileUpload } from '@/components/ui/FileUpload'
import { JENIS_BERKAS, UNGGAH_EKSTENSI_LABEL } from '@/config/domain'

export function ModalUnggahUlangBerkas({
  open,
  onClose,
  berkas,
  onSimpan,
  memproses = false,
}) {
  const [berkasBaru, setBerkasBaru] = useState(null)
  const [galat, setGalat] = useState(null)

  if (!berkas) return null

  const namaJenis = JENIS_BERKAS[berkas.tipe]?.label ?? berkas.tipe

  function handleSimpan() {
    if (!berkasBaru) {
      setGalat('Silakan pilih berkas pengganti yang baru terlebih dahulu.')
      return
    }

    setGalat(null)
    onSimpan(berkasBaru)
  }

  function handleTutup() {
    setBerkasBaru(null)
    setGalat(null)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleTutup}
      title={`Unggah Ulang ${namaJenis}`}
      description="Unggah dokumen pengganti yang valid sesuai dengan catatan penolakan dari dosen atau admin prodi."
      size="md"
      footer={
        <div className="flex w-full justify-end gap-2.5">
          <Button variant="ghost" onClick={handleTutup} disabled={memproses}>
            Batal
          </Button>
          <Button
            variant="primary"
            leadingIcon={RefreshCw}
            onClick={handleSimpan}
            disabled={!berkasBaru}
            loading={memproses}
          >
            Simpan & Kirim Ulang
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {berkas.catatanPenolakan && (
          <div className="rounded-lg border border-danger-200 bg-danger-50/70 p-3.5">
            <div className="flex items-start gap-2 text-danger-800">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-danger-600" aria-hidden="true" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-danger-900">
                  Catatan Penolakan:
                </p>
                <p className="mt-1 text-sm text-danger-800">{berkas.catatanPenolakan}</p>
                {berkas.diverifikasiOleh && (
                  <p className="mt-1 text-xs text-danger-700/80">
                    Oleh: {berkas.diverifikasiOleh}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          <p className="font-semibold text-slate-700">Berkas saat ini:</p>
          <p className="truncate text-slate-600">{berkas.namaFile ?? 'Belum ada nama file'}</p>
        </div>

        <FileUpload
          label={`Pilih Berkas Pengganti (${UNGGAH_EKSTENSI_LABEL})`}
          hint="Pilih berkas baru berformat PDF, JPG, atau PNG maksimal 5MB."
          berkas={berkasBaru}
          onPilih={(meta) => {
            setBerkasBaru(meta)
            if (galat) setGalat(null)
          }}
          error={galat}
          required
        />
      </div>
    </Modal>
  )
}
